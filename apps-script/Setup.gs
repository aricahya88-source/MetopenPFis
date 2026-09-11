function setupUploadBridge(){
  var root=String(UPLOAD_CONFIG.ROOT_FOLDER_ID||'').trim();if(!root||root.indexOf('PASTE_')===0)throw new Error('Isi ROOT_FOLDER_ID pada Config.gs.');
  DriveApp.getFolderById(root).getName();
  var secret=Utilities.getUuid()+Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperty('UPLOAD_BRIDGE_SECRET',secret);
  Logger.log('UPLOAD_BRIDGE_SECRET='+secret);
  Logger.log('Salin nilai yang sama ke APPS_SCRIPT_UPLOAD_SECRET di Vercel.');
  return {success:true,upload_bridge_secret:secret};
}
function resetUploadBridgeSecret(){return setupUploadBridge();}
