const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');

function assertConfig() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Konfigurasi Supabase belum lengkap. Isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di Environment Variables.');
  }
}

function headers(extra: Record<string,string> = {}) {
  assertConfig();
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function parseResponse(res: Response) {
  const text = await res.text();
  if (!res.ok) {
    let detail = text;
    try {
      const parsed = JSON.parse(text) as {message?:string;details?:string;hint?:string};
      detail = [parsed.message, parsed.details, parsed.hint].filter(Boolean).join(' — ') || text;
    } catch {}
    throw new Error(`Supabase ${res.status}: ${detail}`);
  }
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

function endpoint(table: string, params: Record<string,string|number|boolean|undefined> = {}) {
  assertConfig();
  const u = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  Object.entries(params).forEach(([k,v]) => {
    if (v !== undefined && v !== '') u.searchParams.set(k, String(v));
  });
  return u.toString();
}

export async function dbSelect<T = Record<string,unknown>>(table: string, params: Record<string,string|number|boolean|undefined> = {}, range?: [number,number]): Promise<T[]> {
  const h: Record<string,string> = {};
  if (range) h.Range = `${range[0]}-${range[1]}`;
  const res = await fetch(endpoint(table, params), { headers: headers(h), cache: 'no-store' });
  const data = await parseResponse(res);
  return Array.isArray(data) ? data as T[] : [];
}

export async function dbAll<T = Record<string,unknown>>(table: string, params: Record<string,string|number|boolean|undefined> = {}): Promise<T[]> {
  const out: T[] = [];
  const page = 1000;
  for (let start = 0; start < 20000; start += page) {
    const rows = await dbSelect<T>(table, params, [start, start + page - 1]);
    out.push(...rows);
    if (rows.length < page) break;
  }
  return out;
}

export async function dbInsert<T = Record<string,unknown>>(table: string, rows: Record<string,unknown> | Record<string,unknown>[]): Promise<T[]> {
  const res = await fetch(endpoint(table), {
    method: 'POST',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(rows),
    cache: 'no-store',
  });
  const data = await parseResponse(res);
  return Array.isArray(data) ? data as T[] : [];
}

export async function dbUpsert<T = Record<string,unknown>>(table: string, rows: Record<string,unknown> | Record<string,unknown>[], onConflict: string): Promise<T[]> {
  const res = await fetch(endpoint(table, { on_conflict: onConflict }), {
    method: 'POST',
    headers: headers({ Prefer: 'resolution=merge-duplicates,return=representation' }),
    body: JSON.stringify(rows),
    cache: 'no-store',
  });
  const data = await parseResponse(res);
  return Array.isArray(data) ? data as T[] : [];
}

export async function dbUpdate<T = Record<string,unknown>>(table: string, patch: Record<string,unknown>, filters: Record<string,string>): Promise<T[]> {
  const res = await fetch(endpoint(table, filters), {
    method: 'PATCH',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(patch),
    cache: 'no-store',
  });
  const data = await parseResponse(res);
  return Array.isArray(data) ? data as T[] : [];
}

export async function dbDelete(table: string, filters: Record<string,string>): Promise<void> {
  const res = await fetch(endpoint(table, filters), {
    method: 'DELETE',
    headers: headers(),
    cache: 'no-store',
  });
  await parseResponse(res);
}
