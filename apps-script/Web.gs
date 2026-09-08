function jsonOutput_(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function doGet(e){
  var p=e&&e.parameter?e.parameter:{};
  if(String(p.health||'')==='1'){
    var ready=false;
    try{db_().getName();rootFolder_().getName();ready=true;}catch(err){}
    return jsonOutput_({ok:true,data:{app:LMS.APP_NAME,version:LMS.VERSION,mode:'BACKEND_ONLY',storageReady:ready}});
  }
  return jsonOutput_({ok:true,data:{app:LMS.APP_NAME,version:LMS.VERSION,mode:'BACKEND_ONLY',message:'Gunakan frontend Next.js/Vercel.'}});
}
function doPost(e){
  try{
    var raw=e&&e.postData?e.postData.contents:'{}';
    return jsonOutput_(api(JSON.parse(raw||'{}')));
  }catch(err){return jsonOutput_(fail_(err));}
}
