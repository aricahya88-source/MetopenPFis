/**
 * METOPEN PFIS - Web App entry point.
 * File ini WAJIB ada pada project Google Apps Script yang dideploy sebagai Web App.
 */
function jsonOutput_(obj){
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e){
  var p = e && e.parameter ? e.parameter : {};
  if (String(p.health || '') === '1') {
    var ready = false;
    var detail = '';
    try {
      db_().getName();
      rootFolder_().getName();
      ready = true;
      detail = 'Spreadsheet dan Drive dapat diakses.';
    } catch (err) {
      detail = String(err && err.message ? err.message : err);
    }
    return jsonOutput_({
      ok: true,
      data: {
        app: LMS.APP_NAME,
        version: LMS.VERSION,
        mode: 'BACKEND_ONLY',
        storageReady: ready,
        detail: detail
      }
    });
  }

  return jsonOutput_({
    ok: true,
    data: {
      app: LMS.APP_NAME,
      version: LMS.VERSION,
      mode: 'BACKEND_ONLY',
      message: 'Backend METOPEN PFIS aktif. Gunakan frontend Next.js/Vercel.'
    }
  });
}

function doPost(e){
  try {
    var raw = e && e.postData ? e.postData.contents : '{}';
    return jsonOutput_(api(JSON.parse(raw || '{}')));
  } catch (err) {
    return jsonOutput_(fail_(err));
  }
}

/**
 * Jalankan dari editor Apps Script sebelum deployment untuk memastikan
 * entry point Web App benar-benar terpasang pada project yang aktif.
 */
function verifyWebAppEntrypoints(){
  var result = {
    doGet: typeof doGet === 'function',
    doPost: typeof doPost === 'function',
    api: typeof api === 'function',
    setupLms: typeof setupLms === 'function',
    app: (typeof LMS !== 'undefined' && LMS.APP_NAME) ? LMS.APP_NAME : 'UNKNOWN',
    version: (typeof LMS !== 'undefined' && LMS.VERSION) ? LMS.VERSION : 'UNKNOWN'
  };
  result.ok = result.doGet && result.doPost && result.api && result.setupLms;
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}
