import type { ApiResponse } from './types';

const TOKEN_KEY = 'mpf_lms_token';
const USER_KEY = 'mpf_lms_user';
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
// 1.25 MiB -> base64 sekitar 1.67 MiB per request, aman di bawah batas payload function hosting.
const UPLOAD_CHUNK_BYTES = 1280 * 1024;

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
  const response = await fetch('/api/lms', {
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

export async function blobToBase64(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const v = String(r.result || '');
      resolve(v.includes(',') ? v.split(',')[1] : v);
    };
    r.onerror = () => reject(new Error('File gagal dibaca.'));
    r.readAsDataURL(blob);
  });
}
export async function fileToBase64(file: File): Promise<string> { return blobToBase64(file); }

export type UploadedAsset = {
  file_id?: string;
  url: string;
  name: string;
  mime_type?: string;
  size?: number;
};

async function uploadBridge<T=UploadedAsset>(action:string,payload:Record<string,unknown>):Promise<T>{
  const response=await fetch('/api/gas',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({action,payload,token:getToken()}),cache:'no-store'
  });
  const json=await response.json() as ApiResponse<T>;
  if(!response.ok||!json.ok)throw new Error(json.error?.message||`Upload gagal (${response.status})`);
  return json.data as T;
}

/**
 * File tetap disimpan melalui Google Apps Script/Drive.
 * Upload besar dipecah menjadi request kecil agar tidak melewati batas payload serverless.
 * Data akademik, tugas, nilai, dan metadata submission tetap berada di Supabase.
 */
export async function uploadFile(file: File, category = 'submissions'): Promise<UploadedAsset> {
  if(file.size>MAX_UPLOAD_BYTES)throw new Error('Ukuran file maksimal 5 MB.');
  const meta={file_name:file.name,file_mime:file.type||'application/octet-stream',category};
  if(file.size<=UPLOAD_CHUNK_BYTES){
    return uploadBridge('uploadAsset',{...meta,base64:await blobToBase64(file)});
  }

  const upload_id=(typeof crypto!=='undefined'&&'randomUUID' in crypto)
    ? crypto.randomUUID()
    : `up_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const total=Math.ceil(file.size/UPLOAD_CHUNK_BYTES);
  try{
    for(let index=0;index<total;index++){
      const start=index*UPLOAD_CHUNK_BYTES,end=Math.min(file.size,start+UPLOAD_CHUNK_BYTES);
      const base64=await blobToBase64(file.slice(start,end));
      await uploadBridge('uploadChunk',{upload_id,index,total,base64});
    }
    return await uploadBridge('finalizeUpload',{...meta,upload_id,total});
  }catch(e){
    try{await uploadBridge('cancelUpload',{upload_id})}catch{}
    throw e;
  }
}
