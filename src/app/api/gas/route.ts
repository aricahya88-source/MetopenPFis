import { NextRequest, NextResponse } from 'next/server';
import { SERVER_CONFIG } from '@/lib/server-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizeAppsScriptUrl(raw: string) {
  const value = String(raw || '').trim();
  if (!value) return '';
  let u: URL;
  try { u = new URL(value); }
  catch { return ''; }

  // Terima URL Apps Script Web App saja. /dev otomatis diarahkan ke /exec.
  if (u.hostname !== 'script.google.com') return '';
  if (!u.pathname.startsWith('/macros/s/')) return '';
  if (u.pathname.endsWith('/dev')) u.pathname = u.pathname.slice(0, -4) + '/exec';
  if (!u.pathname.endsWith('/exec')) return '';
  u.search = '';
  u.hash = '';
  return u.toString();
}

function maskedDeployment(url: string) {
  try {
    const m = new URL(url).pathname.match(/\/macros\/s\/([^/]+)\/exec$/);
    const id = m?.[1] || '';
    if (!id) return 'tidak dikenali';
    return id.length > 12 ? `${id.slice(0, 6)}…${id.slice(-6)}` : id;
  } catch { return 'tidak dikenali'; }
}

function configurationError() {
  return NextResponse.json({
    ok: false,
    error: {
      code: 'APPS_SCRIPT_URL_INVALID',
      message: 'APPS_SCRIPT_URL belum diisi atau bukan URL Web App Apps Script /exec yang valid. Isi Environment Variable APPS_SCRIPT_URL di Vercel dengan URL deployment Web App aktif, lalu Redeploy.'
    }
  }, { status: 500 });
}

function upstreamError(status: number, text: string, url: string) {
  const lower = String(text || '').toLowerCase();
  const deployment = maskedDeployment(url);

  if (status === 404) {
    return `Deployment Apps Script tidak ditemukan (HTTP 404). URL memang berakhir /exec, tetapi deployment ID ${deployment} sudah tidak aktif/tidak valid. Ambil URL Web App aktif dari Apps Script lalu ganti APPS_SCRIPT_URL di Vercel dan Redeploy.`;
  }
  if (lower.includes('accounts.google.com') || lower.includes('servicelogin') || lower.includes('sign in')) {
    return 'Apps Script meminta login Google. Deploy sebagai Web App, Execute as: Me, dan beri akses yang memungkinkan frontend Vercel memanggilnya.';
  }
  if (lower.includes('<html') || lower.includes('<!doctype html')) {
    return `Apps Script mengembalikan HTML (HTTP ${status}), bukan JSON. Deployment yang dipakai: ${deployment}. Pastikan deployment Web App aktif dan bukan URL project/editor.`;
  }
  return `Respons Apps Script bukan JSON (HTTP ${status}). Deployment: ${deployment}.`;
}

async function fetchAppsScript(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SERVER_CONFIG.REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      redirect: 'follow',
      cache: 'no-store',
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

// Diagnosis ringan: /api/gas?health=1
export async function GET() {
  const url = normalizeAppsScriptUrl(SERVER_CONFIG.APPS_SCRIPT_URL);
  if (!url) return configurationError();

  try {
    const upstream = await fetchAppsScript(`${url}?health=1`, { method: 'GET' });
    const text = await upstream.text();

    if (upstream.status === 404) {
      return NextResponse.json({ ok: false, error: { message: upstreamError(404, text, url) } }, { status: 502 });
    }

    try {
      const json = JSON.parse(text);
      return NextResponse.json(json, { status: upstream.ok ? 200 : 502 });
    } catch {
      return NextResponse.json({ ok: false, error: { message: upstreamError(upstream.status, text, url) } }, { status: 502 });
    }
  } catch (err) {
    const aborted = err instanceof Error && (err.name === 'AbortError' || /aborted/i.test(err.message));
    return NextResponse.json({
      ok: false,
      error: { message: aborted ? 'Pemeriksaan Apps Script melewati batas waktu 30 detik.' : (err instanceof Error ? err.message : String(err)) }
    }, { status: aborted ? 504 : 500 });
  }
}

export async function POST(req: NextRequest) {
  const url = normalizeAppsScriptUrl(SERVER_CONFIG.APPS_SCRIPT_URL);
  if (!url) return configurationError();

  try {
    const body = await req.text();
    if (Buffer.byteLength(body, 'utf8') > 4 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: { message: 'Payload terlalu besar. Maksimum 4 MB.' } }, { status: 413 });
    }

    const upstream = await fetchAppsScript(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body
    });
    const text = await upstream.text();

    // 404 ditangani lebih dulu agar tidak dibungkus sebagai error JSON generik.
    if (upstream.status === 404) {
      return NextResponse.json({ ok: false, error: { message: upstreamError(404, text, url) } }, { status: 502 });
    }

    try {
      const json = JSON.parse(text);
      return NextResponse.json(json, { status: upstream.ok ? 200 : 502 });
    } catch {
      return NextResponse.json({ ok: false, error: { message: upstreamError(upstream.status, text, url) } }, { status: 502 });
    }
  } catch (err) {
    const aborted = err instanceof Error && (err.name === 'AbortError' || /aborted/i.test(err.message));
    const message = aborted
      ? 'Apps Script melewati batas waktu 30 detik. Draft lokal tetap aman; coba lagi beberapa saat.'
      : (err instanceof Error ? err.message : String(err));
    return NextResponse.json({ ok: false, error: { message } }, { status: aborted ? 504 : 500 });
  }
}
