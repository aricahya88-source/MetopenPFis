function jsonOutput_(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Health endpoint dibuat sengaja sangat ringan.
 * /exec?health=1 hanya membuktikan deployment hidup dan doGet terbaca.
 * /exec?health=full baru memeriksa Spreadsheet + Drive.
 */
function doGet(e){
  var p=e&&e.parameter?e.parameter:{};
  var health=String(p.health||'');

  if(health==='1'){
    return jsonOutput_({
      ok:true,
      data:{
        app:LMS.APP_NAME,
        version:LMS.VERSION,
        mode:'BACKEND_ONLY',
        alive:true
      }
    });
  }

  if(health==='full'){
    var storageReady=false;
    var detail='';
    try{
      db_().getName();
      rootFolder_().getName();
      storageReady=true;
    }catch(err){
      detail=String(err&&err.message?err.message:err);
    }
    return jsonOutput_({
      ok:true,
      data:{
        app:LMS.APP_NAME,
        version:LMS.VERSION,
        mode:'BACKEND_ONLY',
        alive:true,
        storageReady:storageReady,
        storageError:detail
      }
    });
  }

  return jsonOutput_({
    ok:true,
    data:{
      app:LMS.APP_NAME,
      version:LMS.VERSION,
      mode:'BACKEND_ONLY',
      message:'Gunakan frontend Next.js/Vercel.'
    }
  });
}

function doPost(e){
  try{
    var raw=e&&e.postData?e.postData.contents:'{}';
    return jsonOutput_(api(JSON.parse(raw||'{}')));
  }catch(err){
    return jsonOutput_(fail_(err));
  }
}

/**
 * Jalankan manual dari editor Apps Script untuk mendapatkan URL Web App aktif.
 * Copy hasil Return value / Execution log ke Vercel Environment Variable:
 * APPS_SCRIPT_URL
 */
function showWebAppUrl(){
  var url=ScriptApp.getService().getUrl()||'';
  Logger.log('WEB APP URL: '+url);
  return url;
}
