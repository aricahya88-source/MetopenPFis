function uploadSecret_(){
  return String(PropertiesService.getScriptProperties().getProperty('UPLOAD_BRIDGE_SECRET')||'');
}
function requireUploadBridge_(request){
  var expected=uploadSecret_();
  if(!expected)throw new Error('UPLOAD_BRIDGE_SECRET belum diset pada Script Properties.');
  if(String(request&&request.bridge_secret||'')!==expected)throw new Error('Upload bridge tidak valid.');
}
