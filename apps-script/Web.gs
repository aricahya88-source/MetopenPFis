function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
function doGet(e){if(e&&e.parameter&&e.parameter.health==='1')return json_({ok:true,data:{status:'ok',service:'METOPEN upload-only'}});return json_({ok:true,data:{service:'METOPEN upload-only'}});}
function doPost(e){try{var body=JSON.parse(e.postData&&e.postData.contents||'{}');return json_(api(body));}catch(err){return json_({ok:false,error:{message:String(err&&err.message?err.message:err)}});}}
