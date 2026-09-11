import crypto from 'node:crypto';

const url=(process.env.SUPABASE_URL||'').replace(/\/$/,'');
const key=process.env.SUPABASE_SERVICE_ROLE_KEY||'';
const pepper=process.env.PIN_PEPPER||'';
if(!url||!key||!pepper){
  console.error('Wajib set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, dan PIN_PEPPER.');
  process.exit(1);
}

const arg=(name,def='')=>{
  const i=process.argv.indexOf(`--${name}`);
  return i>=0 && process.argv[i+1] ? process.argv[i+1] : def;
};
const nim=arg('nim','ADMIN');
const name=arg('name','Administrator METOPEN PFIS');
const email=arg('email','admin@metopen.local');
const suppliedPin=arg('pin','');
const pin=suppliedPin || String(crypto.randomInt(100000,1000000));
if(pin.length<6){console.error('PIN minimal 6 karakter.');process.exit(1)}
const salt=crypto.randomBytes(18).toString('base64url');
const hash=crypto.createHash('sha256').update(`${salt}:${pin}:${pepper}`).digest('base64url');
const now=new Date().toISOString();
const row={user_id:'USR_ADMIN',nim,name,email,role:'admin',class_name:'',active:true,pin_salt:salt,pin_hash:hash,created_at:now,updated_at:now};

const res=await fetch(`${url}/rest/v1/users?on_conflict=user_id`,{
  method:'POST',
  headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=representation'},
  body:JSON.stringify(row)
});
if(!res.ok){console.error(`Supabase ${res.status}: ${await res.text()}`);process.exit(1)}
console.log('Admin siap.');
console.log(`NIM/Login : ${nim}`);
console.log(`Nama      : ${name}`);
console.log(`PIN       : ${pin}`);
console.log('Simpan PIN ini dengan aman; PIN plaintext tidak disimpan di database.');
