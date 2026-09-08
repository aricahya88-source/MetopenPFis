/**
 * URL Apps Script dibaca hanya pada server Next.js.
 * Set APPS_SCRIPT_URL di Vercel atau .env.local.
 * Spreadsheet ID dan Folder ID hanya berada di Apps Script.
 */
export const SERVER_CONFIG = Object.freeze({
  APPS_SCRIPT_URL: process.env.APPS_SCRIPT_URL || '',
  REQUEST_TIMEOUT_MS: 60000,
  MAX_UPLOAD_BYTES: 3 * 1024 * 1024
});
