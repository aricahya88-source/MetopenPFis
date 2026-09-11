import { NextRequest, NextResponse } from 'next/server';
import { SERVER_CONFIG } from '@/lib/server-config';
import { requireUser } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const UPLOAD_ACTIONS=new Set(['uploadAsset','uploadChunk','finalizeUpload','cancelUpload']);

function normalizeAppsScriptUrl(raw:string){
  const value=String(raw||'').trim();if(!value)return '';
  try{const u=new URL(value);if(u.hostname!=='script.google.com'||!u.pathname.startsWith('/macros/s/'))return '';if(u.pathname.endsWith('/dev'))u.pathname=u.pathname.slice(0,-4)+'/exec';if(!u.pathname.endsWith('/exec'))return '';u.search='';u.hash='';return u.toString();}catch{return ''}
}
function fail(message:string,status=500){return NextResponse.json({ok:false,error:{message}},{status})}
async function upstream(url:string,body:string){const c=new AbortController();const t=setTimeout(()=>c.abort(),SERVER_CONFIG.REQUEST_TIMEOUT_MS);try{return await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body,redirect:'follow',cache:'no-store',signal:c.signal})}finally{clearTimeout(t)}}

export async function GET(){
  const url=normalizeAppsScriptUrl(SERVER_CONFIG.APPS_SCRIPT_URL);if(!url)return fail('APPS_SCRIPT_URL belum diisi dengan Web App /exec.',500);
  try{const res=await fetch(`${url}?health=1`,{cache:'no-store'});const text=await res.text();try{return NextResponse.json(JSON.parse(text),{status:res.ok?200:502})}catch{return fail(`Apps Script upload mengembalikan respons non-JSON (HTTP ${res.status}).`,502)}}catch(e){return fail(e instanceof Error?e.message:String(e),500)}
}

export async function POST(req:NextRequest){
  const url=normalizeAppsScriptUrl(SERVER_CONFIG.APPS_SCRIPT_URL);if(!url)return fail('APPS_SCRIPT_URL belum diisi dengan Web App /exec.',500);
  if(!SERVER_CONFIG.APPS_SCRIPT_UPLOAD_SECRET)return fail('APPS_SCRIPT_UPLOAD_SECRET belum diisi.',500);
  let body:any;try{body=await req.json()}catch{return fail('Payload upload tidak valid.',400)}
  const action=String(body?.action||'');if(!UPLOAD_ACTIONS.has(action))return fail('Apps Script hanya diizinkan untuk operasi upload file.',403);
  try{await requireUser(String(body?.token||''))}catch(e){return fail(e instanceof Error?e.message:String(e),401)}
  const base64=String(body?.payload?.base64||'');const approx=Math.floor(base64.length*3/4);
  // uploadAsset kecil atau satu chunk. Ukuran final diverifikasi lagi oleh Apps Script saat finalize.
  if(approx>SERVER_CONFIG.MAX_UPLOAD_REQUEST_BYTES)return fail('Potongan upload terlalu besar.',413);
  const forward=JSON.stringify({action,bridge_secret:SERVER_CONFIG.APPS_SCRIPT_UPLOAD_SECRET,payload:body.payload||{}});
  try{const res=await upstream(url,forward);const text=await res.text();try{return NextResponse.json(JSON.parse(text),{status:res.ok?200:502})}catch{return fail(`Apps Script upload mengembalikan respons non-JSON (HTTP ${res.status}).`,502)}}catch(e){const aborted=e instanceof Error&&e.name==='AbortError';return fail(aborted?'Upload ke Google Drive melewati batas waktu.':(e instanceof Error?e.message:String(e)),aborted?504:500)}
}
