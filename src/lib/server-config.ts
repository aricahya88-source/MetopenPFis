/** Server-only configuration. Database utama menggunakan Supabase. Apps Script hanya menjadi jembatan upload ke Google Drive. */
const rawAppsScriptUrl = String(process.env.APPS_SCRIPT_URL || '').trim();

export const SERVER_CONFIG = Object.freeze({
  APPS_SCRIPT_URL: rawAppsScriptUrl,
  APPS_SCRIPT_UPLOAD_SECRET: String(process.env.APPS_SCRIPT_UPLOAD_SECRET || '').trim(),
  REQUEST_TIMEOUT_MS: 45000,
  MAX_UPLOAD_REQUEST_BYTES: 2 * 1024 * 1024
});
