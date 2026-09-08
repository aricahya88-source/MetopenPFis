function ensureSecrets_() {
  var p=props_();
  if(!p.getProperty('PIN_PEPPER')) p.setProperty('PIN_PEPPER',Utilities.getUuid()+Utilities.getUuid());
  if(!p.getProperty('AUTH_SECRET')) p.setProperty('AUTH_SECRET',Utilities.getUuid()+Utilities.getUuid()+Utilities.getUuid());
}
function b64url_(bytes) {
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/,'');
}
function hashPin_(pin,salt) {
  var pepper=String(props_().getProperty('PIN_PEPPER')||'');
  var bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(salt)+':'+String(pin)+':'+pepper,Utilities.Charset.UTF_8);
  return b64url_(bytes);
}
function makeUserPin_(pin) {
  var salt=Utilities.getUuid().replace(/-/g,'');
  return {salt:salt,hash:hashPin_(pin,salt)};
}
function safeUser_(u) {
  return {user_id:String(u.user_id||''),nim:String(u.nim||''),name:String(u.name||''),email:String(u.email||''),role:String(u.role||'mahasiswa'),class_name:String(u.class_name||'')};
}
function tokenSign_(payload) {
  var secret=String(props_().getProperty('AUTH_SECRET')||'');
  var sig=Utilities.computeHmacSha256Signature(payload,secret,Utilities.Charset.UTF_8);
  return b64url_(sig);
}
function issueToken_(user) {
  var payloadObj={uid:String(user.user_id),role:String(user.role),exp:Date.now()+12*60*60*1000,nonce:Utilities.getUuid().slice(0,8)};
  var payload=b64url_(Utilities.newBlob(JSON.stringify(payloadObj)).getBytes());
  return payload+'.'+tokenSign_(payload);
}
function verifyToken_(token) {
  token=String(token||'');
  var parts=token.split('.');
  if(parts.length!==2)throw new Error('Sesi tidak valid. Silakan login kembali.');
  if(tokenSign_(parts[0])!==parts[1])throw new Error('Sesi tidak valid.');
  var decoded=Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString();
  var p=JSON.parse(decoded);
  if(Number(p.exp||0)<Date.now())throw new Error('Sesi berakhir. Silakan login kembali.');
  var user=findOne_(LMS.SHEETS.USERS,'user_id',p.uid);
  if(!user||!asBool_(user.active))throw new Error('Akun tidak aktif.');
  return user;
}
function requireUser_(request) {
  return verifyToken_(request&&request.token);
}
function requireAdmin_(request) {
  var u=requireUser_(request);
  var role=String(u.role||'').toLowerCase();
  if(role!=='admin'&&role!=='dosen')throw new Error('Akses khusus admin/dosen.');
  return u;
}
function findUserByIdentity_(identity) {
  var target=String(identity||'').trim().toLowerCase();
  if(!target)return null;
  var users=rows_(LMS.SHEETS.USERS);
  for(var i=0;i<users.length;i++){
    if(String(users[i].nim||'').trim().toLowerCase()===target||String(users[i].email||'').trim().toLowerCase()===target)return users[i];
  }
  return null;
}
function loginService_(payload) {
  var identity=String(payload.identity||'').trim(), pin=String(payload.pin||'');
  if(!identity||!pin)throw new Error('Email/NIM dan PIN wajib diisi.');
  var user=findUserByIdentity_(identity);
  if(!user||!asBool_(user.active))throw new Error('Email/NIM atau PIN tidak sesuai.');
  if(hashPin_(pin,String(user.pin_salt||''))!==String(user.pin_hash||''))throw new Error('Email/NIM atau PIN tidak sesuai.');
  var token=issueToken_(user);
  log_(user.user_id,'LOGIN','user',user.user_id,{});
  return {token:token,user:safeUser_(user)};
}
