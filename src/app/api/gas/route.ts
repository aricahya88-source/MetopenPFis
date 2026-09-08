import { NextRequest, NextResponse } from 'next/server';
import { SERVER_CONFIG } from '@/lib/server-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizeAppsScriptUrl(raw:string){
  const u=new URL(String(raw||'').trim());
  if(u.pathname.endsWith('/dev'))u.pathname=u.pathname.slice(0,-4)+'/exec';
  return u.toString();
}
function nonJsonMessage(text:string,status:number,url:string){
  const lower=String(text||'').toLowerCase();
  if(lower.includes('accounts.google.com')||lower.includes('servicelogin')||lower.includes('sign in')){
    return 'Apps Script mengembalikan halaman login Google, bukan JSON. Deploy sebagai Web App, gunakan Execute as: Me, atur akses deployment agar frontend dapat mengaksesnya, lalu pakai URL /exec.';
  }
  if(lower.includes('<html')||lower.includes('<!doctype html')){
    return `Apps Script mengembalikan halaman HTML (HTTP ${status}), bukan JSON. Pastikan deployment aktif dan URL APPS_SCRIPT_URL adalah Web App /exec. Endpoint: ${url.includes('/exec')?'sudah /exec':'belum /exec'}.`;
  }
  return `Respons Apps Script bukan JSON (HTTP ${status}). Pastikan deployment adalah backend Web App /exec dan deployment versi terbaru sudah diterapkan.`;
}

export async function POST(req: NextRequest) {
  let timer:ReturnType<typeof setTimeout>|null=null;
  try {
    const rawUrl=String(SERVER_CONFIG.APPS_SCRIPT_URL||'').trim();
    if(!rawUrl||rawUrl.includes('PASTE_APPS_SCRIPT')){
      return NextResponse.json({ok:false,error:{message:'APPS_SCRIPT_URL belum dikonfigurasi pada environment Vercel/.env.local'}},{status:500});
    }
    const url=normalizeAppsScriptUrl(rawUrl);
    const body=await req.text();
    if(Buffer.byteLength(body,'utf8')>4*1024*1024){
      return NextResponse.json({ok:false,error:{message:'Payload terlalu besar. Maksimum 4 MB.'}},{status:413});
    }
    const controller=new AbortController();
    timer=setTimeout(()=>controller.abort(),SERVER_CONFIG.REQUEST_TIMEOUT_MS);
    const upstream=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body,redirect:'follow',cache:'no-store',signal:controller.signal});
    const text=await upstream.text();
    let json:unknown;
    try{json=JSON.parse(text);}catch{
      return NextResponse.json({ok:false,error:{message:nonJsonMessage(text,upstream.status,url)}},{status:502});
    }
    return NextResponse.json(json,{status:upstream.ok?200:502});
  } catch (err) {
    const aborted=err instanceof Error&&(err.name==='AbortError'||/aborted/i.test(err.message));
    const message=aborted?'Apps Script melewati batas waktu. Form tugas tetap dapat dikerjakan dan disimpan sebagai Draft; coba muat data server kembali beberapa saat lagi.':(err instanceof Error?err.message:String(err));
    return NextResponse.json({ok:false,error:{message}},{status:aborted?504:500});
  } finally {if(timer)clearTimeout(timer);}
}
