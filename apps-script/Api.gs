function ok_(data){return {ok:true,data:data};}
function fail_(err){return {ok:false,error:{message:String(err&&err.message?err.message:err)}};}
function api(request){
  try{
    requireUploadBridge_(request||{});
    var action=String(request.action||''),payload=request.payload||{};
    if(action==='uploadAsset')return ok_(uploadBase64_(payload));
    if(action==='uploadChunk')return ok_(uploadChunk_(payload));
    if(action==='finalizeUpload')return ok_(finalizeUpload_(payload));
    if(action==='cancelUpload')return ok_(cancelUpload_(payload));
    throw new Error('Action tidak diizinkan. Apps Script hanya untuk operasi upload dokumen/file.');
  }catch(err){return fail_(err);}
}
