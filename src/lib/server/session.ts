import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { dbSelect } from './supabase';

export type DbUser = {
  user_id: string;
  nim: string;
  name: string;
  email: string;
  role: 'admin'|'dosen'|'mahasiswa'|string;
  class_name?: string;
  pin_salt?: string;
  pin_hash?: string;
  active?: boolean;
};

const APP_SESSION_SECRET = String(process.env.APP_SESSION_SECRET || '');
const PIN_PEPPER = String(process.env.PIN_PEPPER || '');

function assertSecrets() {
  if (APP_SESSION_SECRET.length < 24) throw new Error('APP_SESSION_SECRET belum diisi atau terlalu pendek (minimal 24 karakter).');
  if (!PIN_PEPPER) throw new Error('PIN_PEPPER belum diisi. Gunakan PIN_PEPPER lama dari Apps Script agar PIN pengguna tetap berlaku.');
}

function b64url(input: Buffer | string) {
  return typeof input === 'string'
    ? Buffer.from(input, 'utf8').toString('base64url')
    : input.toString('base64url');
}

export function hashPin(pin: string, salt: string) {
  assertSecrets();
  return createHash('sha256').update(`${salt}:${pin}:${PIN_PEPPER}`, 'utf8').digest('base64url');
}

export function makePinHash(pin: string) {
  const salt = randomBytes(16).toString('hex');
  return { salt, hash: hashPin(pin, salt) };
}

export function safeUser(u: DbUser) {
  return {
    user_id: String(u.user_id || ''),
    nim: String(u.nim || ''),
    name: String(u.name || ''),
    email: String(u.email || ''),
    role: String(u.role || 'mahasiswa'),
    class_name: String(u.class_name || ''),
  };
}

export function issueToken(user: DbUser) {
  assertSecrets();
  const payload = {
    uid: String(user.user_id),
    role: String(user.role),
    exp: Date.now() + 12 * 60 * 60 * 1000,
    nonce: randomBytes(6).toString('hex'),
  };
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac('sha256', APP_SESSION_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifySignature(body: string, sig: string) {
  assertSecrets();
  const expected = createHmac('sha256', APP_SESSION_SECRET).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a,b);
}

export async function requireUser(token: string): Promise<DbUser> {
  const parts = String(token || '').split('.');
  if (parts.length !== 2 || !verifySignature(parts[0], parts[1])) throw new Error('Sesi tidak valid. Silakan login kembali.');
  let payload: {uid?:string;exp?:number};
  try { payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8')); }
  catch { throw new Error('Sesi tidak valid.'); }
  if (!payload.uid || Number(payload.exp || 0) < Date.now()) throw new Error('Sesi berakhir. Silakan login kembali.');
  const rows = await dbSelect<DbUser>('users', { select:'*', user_id:`eq.${payload.uid}`, limit:1 });
  const user = rows[0];
  if (!user || user.active === false) throw new Error('Akun tidak aktif.');
  return user;
}

export async function requireAdmin(token: string): Promise<DbUser> {
  const u = await requireUser(token);
  if (!['admin','dosen'].includes(String(u.role).toLowerCase())) throw new Error('Akses khusus admin/dosen.');
  return u;
}
