import { NextRequest, NextResponse } from 'next/server';
import { SERVER_CONFIG } from '@/lib/server-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let timer:ReturnType<typeof setTimeout>|null=null;
  try {
    const url = String(SERVER_CONFIG.APPS_SCRIPT_URL || '').trim();
    if (!url || url.includes('PASTE_APPS_SCRIPT')) {
      return NextResponse.json({ ok:false, error:{message:'APPS_SCRIPT_URL belum dikonfigurasi pada environment Vercel/.env.local'} }, { status:500 });
    }
    const body = await req.text();
    if (Buffer.byteLength(body, 'utf8') > 4 * 1024 * 1024) {
      return NextResponse.json({ ok:false, error:{message:'Payload terlalu besar. Maksimum 4 MB.'} }, { status:413 });
    }
    const controller = new AbortController();
    timer=setTimeout(() => controller.abort(), SERVER_CONFIG.REQUEST_TIMEOUT_MS);
    const upstream = await fetch(url, {
      method:'POST',headers:{'content-type':'application/json'},body,redirect:'follow',cache:'no-store',signal:controller.signal
    });
    const text = await upstream.text();
    let json: unknown;
    try { json = JSON.parse(text); }
    catch { return NextResponse.json({ok:false,error:{message:'Respons Apps Script bukan JSON. Pastikan deployment adalah backend Web App /exec.'}}, {status:502}); }
    return NextResponse.json(json, { status: upstream.ok ? 200 : 502 });
  } catch (err) {
    const aborted=err instanceof Error&&(err.name==='AbortError'||/aborted/i.test(err.message));
    const message=aborted?'Proses Apps Script melewati batas waktu. Import besar sebaiknya diproses per batch; silakan coba lagi.':(err instanceof Error?err.message:String(err));
    return NextResponse.json({ok:false,error:{message}}, {status:aborted?504:500});
  } finally { if(timer)clearTimeout(timer); }
}
