function rootFolder_(){
  var id=String(UPLOAD_CONFIG.ROOT_FOLDER_ID||'').trim();
  if(!id||id.indexOf('PASTE_')===0)throw new Error('Isi ROOT_FOLDER_ID pada Config.gs.');
  return DriveApp.getFolderById(id);
}
function childFolder_(parent,name){
  var it=parent.getFoldersByName(name);return it.hasNext()?it.next():parent.createFolder(name);
}
function folderByCategory_(category){
  var root=rootFolder_(),name=String(category||'submissions')==='assets'?'02_Assets':'01_Submissions';
  return childFolder_(root,name);
}
function sanitizeUploadId_(value){
  var id=String(value||'').replace(/[^A-Za-z0-9_-]/g,'').slice(0,100);
  if(!id)throw new Error('upload_id tidak valid.');return id;
}
function chunkSessionFolder_(uploadId,create){
  var base=childFolder_(rootFolder_(),UPLOAD_CONFIG.CHUNK_ROOT_FOLDER),id=sanitizeUploadId_(uploadId),it=base.getFoldersByName(id);
  if(it.hasNext())return it.next();
  if(create)return base.createFolder(id);
  throw new Error('Sesi upload tidak ditemukan.');
}
function decodeBase64_(base64,maxBytes){
  var raw=String(base64||'');if(!raw)throw new Error('File/potongan kosong.');
  var bytes=Utilities.base64Decode(raw);if(bytes.length>maxBytes)throw new Error('Ukuran payload upload terlalu besar.');return bytes;
}
function makeFinalFile_(bytes,data){
  if(bytes.length>UPLOAD_CONFIG.MAX_UPLOAD_BYTES)throw new Error('File maksimal 5 MB.');
  var name=String(data.file_name||'file').replace(/[^\w.\-() ]+/g,'_').slice(0,140);
  var mime=String(data.file_mime||'application/octet-stream'),folder=folderByCategory_(data.category||'submissions');
  var file=folder.createFile(Utilities.newBlob(bytes,mime,name));
  if(String(UPLOAD_CONFIG.FILE_SHARING_MODE).toUpperCase()==='LINK_VIEWER'){
    try{file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);}catch(e){}
  }
  return {file_id:file.getId(),url:file.getUrl(),name:file.getName(),mime_type:mime,size:bytes.length};
}
function uploadBase64_(data){return makeFinalFile_(decodeBase64_(data.base64,UPLOAD_CONFIG.MAX_UPLOAD_BYTES),data);}
function uploadChunk_(data){
  var id=sanitizeUploadId_(data.upload_id),index=Number(data.index),total=Number(data.total);
  if(index<0||total<1||index>=total||total>20)throw new Error('Metadata potongan upload tidak valid.');
  var bytes=decodeBase64_(data.base64,UPLOAD_CONFIG.MAX_CHUNK_BYTES),folder=chunkSessionFolder_(id,true);
  var name=('000'+index).slice(-4)+'.part',old=folder.getFilesByName(name);while(old.hasNext())old.next().setTrashed(true);
  folder.createFile(Utilities.newBlob(bytes,'application/octet-stream',name));
  return {upload_id:id,index:index,total:total,received:bytes.length};
}
function finalizeUpload_(data){
  var id=sanitizeUploadId_(data.upload_id),total=Number(data.total);if(total<1||total>20)throw new Error('Jumlah potongan tidak valid.');
  var folder=chunkSessionFolder_(id,false),all=[];
  for(var i=0;i<total;i++){
    var name=('000'+i).slice(-4)+'.part',it=folder.getFilesByName(name);if(!it.hasNext())throw new Error('Potongan '+(i+1)+' belum lengkap.');
    var part=it.next().getBlob().getBytes();for(var j=0;j<part.length;j++){all.push(part[j]);if(all.length>UPLOAD_CONFIG.MAX_UPLOAD_BYTES)throw new Error('File maksimal 5 MB.');}
  }
  var result=makeFinalFile_(all,data);try{folder.setTrashed(true);}catch(e){}return result;
}
function cancelUpload_(data){
  try{chunkSessionFolder_(data.upload_id,false).setTrashed(true);}catch(e){}
  return {cancelled:true};
}
