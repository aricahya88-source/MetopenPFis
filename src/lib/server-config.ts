/**
 * Konfigurasi server-only.
 *
 * PENTING:
 * URL Apps Script TIDAK memiliki fallback hard-coded.
 * Dengan demikian Vercel tidak akan diam-diam memakai deployment lama yang
 * sudah dihapus/expired dan menghasilkan HTML 404.
 */
const rawAppsScriptUrl = String(process.env.APPS_SCRIPT_URL || '').trim();

export const SERVER_CONFIG = Object.freeze({
  APPS_SCRIPT_URL: rawAppsScriptUrl,
  REQUEST_TIMEOUT_MS: 30000,
  MAX_UPLOAD_BYTES: 3 * 1024 * 1024
});
