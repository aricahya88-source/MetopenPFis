import type { ApiResponse } from './types';

const TOKEN_KEY = 'mpf_lms_token';
const USER_KEY = 'mpf_lms_user';

export function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(TOKEN_KEY) || '';
}
export function saveSession(token: string, user: unknown) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
export function getStoredUser<T = unknown>(): T | null {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
  catch { return null; }
}

export async function api<T = unknown>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch('/api/gas', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action, payload, token: getToken() }),
    cache: 'no-store'
  });
  const json = await response.json() as ApiResponse<T>;
  if (!response.ok || !json.ok) {
    throw new Error(json.error?.message || `Permintaan gagal (${response.status})`);
  }
  return json.data as T;
}

export async function fileToBase64(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const v = String(r.result || '');
      resolve(v.includes(',') ? v.split(',')[1] : v);
    };
    r.onerror = () => reject(new Error('File gagal dibaca.'));
    r.readAsDataURL(file);
  });
}
