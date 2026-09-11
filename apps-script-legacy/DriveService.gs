function ensureFolders_() {
  var root=rootFolder_(),p=props_();
  Object.keys(LMS.FOLDERS).forEach(function(k){
    var prop='FOLDER_'+k;
    var current=String(p.getProperty(prop)||'').trim();
    if(current){try{DriveApp.getFolderById(current).getName();return;}catch(e){}}
    var name=LMS.FOLDERS[k],it=root.getFoldersByName(name),folder=it.hasNext()?it.next():root.createFolder(name);
    p.setProperty(prop,folder.getId());
  });
}
function folderByCategory_(category) {
  ensureFolders_();
  var key=String(category||'assets').toUpperCase();
  var prop=key==='SUBMISSIONS'?'FOLDER_SUBMISSIONS':key==='EXPORTS'?'FOLDER_EXPORTS':key==='TEMP'?'FOLDER_TEMP':'FOLDER_ASSETS';
  return DriveApp.getFolderById(props_().getProperty(prop));
}
function uploadBase64_(data) {
  var base64=String(data.base64||'');
  if(!base64)throw new Error('File kosong.');
  var bytes=Utilities.base64Decode(base64);
  if(bytes.length>LMS.MAX_UPLOAD_BYTES)throw new Error('File maksimal 3 MB. Untuk audio/video besar gunakan URL Google Drive/YouTube.');
  var name=String(data.file_name||'file').replace(/[^\w.\-() ]+/g,'_').slice(0,120);
  var mime=String(data.file_mime||'application/octet-stream');
  var folder=folderByCategory_(data.category||'assets');
  var file=folder.createFile(Utilities.newBlob(bytes,mime,name));
  if(String(setting_('FILE_SHARING_MODE','LINK_VIEWER')).toUpperCase()==='LINK_VIEWER'){
    try{file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);}catch(e){}
  }
  return {file_id:file.getId(),url:file.getUrl(),name:file.getName(),mime_type:mime,size:bytes.length};
}
