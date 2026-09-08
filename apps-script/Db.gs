var LMS_DB_CACHE_ = null;
var LMS_DB_CACHE_ID_ = '';
var LMS_SHEET_CACHE_ = {};

function props_() { return PropertiesService.getScriptProperties(); }

function db_() {
  var id = String(props_().getProperty('SPREADSHEET_ID') || '').trim();
  if (!id) throw new Error('SPREADSHEET_ID belum dikonfigurasi. Jalankan setupLms().');
  if (!LMS_DB_CACHE_ || LMS_DB_CACHE_ID_ !== id) {
    LMS_DB_CACHE_ = SpreadsheetApp.openById(id);
    LMS_DB_CACHE_ID_ = id;
    LMS_SHEET_CACHE_ = {};
  }
  return LMS_DB_CACHE_;
}
function rootFolder_() {
  var id = String(props_().getProperty('ROOT_FOLDER_ID') || '').trim();
  if (!id) throw new Error('ROOT_FOLDER_ID belum dikonfigurasi. Jalankan setupLms().');
  return DriveApp.getFolderById(id);
}
function sheet_(name) {
  if (LMS_SHEET_CACHE_[name]) return LMS_SHEET_CACHE_[name];
  var sh = db_().getSheetByName(name);
  if (!sh) throw new Error('Sheet tidak ditemukan: ' + name);
  LMS_SHEET_CACHE_[name] = sh;
  return sh;
}
function headers_(name) {
  return SCHEMA[name] || SCHEMA[Object.keys(LMS.SHEETS).filter(function(k){return LMS.SHEETS[k]===name;})[0]] || [];
}
function sheetHeaders_(name) {
  var sh = sheet_(name);
  if (sh.getLastColumn() < 1) return [];
  return sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
}
function rowObject_(headers,row) {
  var o={}; headers.forEach(function(h,i){o[h]=row[i]===undefined?'':row[i];}); return o;
}
function rows_(name) {
  var sh=sheet_(name), last=sh.getLastRow(), headers=sheetHeaders_(name);
  if (last<2) return [];
  return sh.getRange(2,1,last-1,headers.length).getValues().map(function(r,i){
    var o=rowObject_(headers,r); o.__row=i+2; return o;
  });
}
function findOne_(name, field, value) {
  var sh=sheet_(name), headers=sheetHeaders_(name), idx=headers.indexOf(field);
  if(idx<0) throw new Error('Kolom tidak ada: '+field);
  if(sh.getLastRow()<2) return null;
  var finder=sh.getRange(2,idx+1,sh.getLastRow()-1,1).createTextFinder(String(value)).matchEntireCell(true);
  var cell=finder.findNext();
  if(!cell)return null;
  var row=cell.getRow();
  var vals=sh.getRange(row,1,1,headers.length).getValues()[0];
  var o=rowObject_(headers,vals);o.__row=row;return o;
}
function findMany_(name, field, value) {
  var sh=sheet_(name), headers=sheetHeaders_(name), idx=headers.indexOf(field);
  if(idx<0||sh.getLastRow()<2)return [];
  var cells=sh.getRange(2,idx+1,sh.getLastRow()-1,1).createTextFinder(String(value)).matchEntireCell(true).findAll();
  if(!cells.length)return [];
  return cells.map(function(cell){
    var row=cell.getRow(),vals=sh.getRange(row,1,1,headers.length).getValues()[0];
    var o=rowObject_(headers,vals);o.__row=row;return o;
  });
}
function appendObj_(name,obj) {
  var sh=sheet_(name), headers=sheetHeaders_(name);
  sh.appendRow(headers.map(function(h){return obj[h]===undefined?'':obj[h];}));
  return obj;
}
function updateRowObj_(name,rowNum,obj) {
  var sh=sheet_(name),headers=sheetHeaders_(name);
  var existing=sh.getRange(rowNum,1,1,headers.length).getValues()[0];
  headers.forEach(function(h,i){if(obj[h]!==undefined)existing[i]=obj[h];});
  sh.getRange(rowNum,1,1,headers.length).setValues([existing]);
  return rowObject_(headers,existing);
}
function upsertObj_(name,idField,obj) {
  var id=String(obj[idField]||'').trim();
  if(!id)throw new Error('ID wajib: '+idField);
  var found=findOne_(name,idField,id);
  return found?updateRowObj_(name,found.__row,obj):appendObj_(name,obj);
}
function deleteById_(name,idField,id) {
  var f=findOne_(name,idField,id);
  if(f) sheet_(name).deleteRow(f.__row);
}
function stripInternal_(o) {
  if(!o)return o; var c={};Object.keys(o).forEach(function(k){if(k!=='__row')c[k]=o[k];});return c;
}
function nowIso_(){return new Date().toISOString();}
function makeId_(prefix){return prefix+'_'+Utilities.getUuid().replace(/-/g,'').slice(0,18);}
function asBool_(v){return v===true||String(v).toLowerCase()==='true'||String(v)==='1';}
function num_(v,d){var n=Number(v);return isNaN(n)?(d||0):n;}
function json_(v,fallback){try{return JSON.parse(String(v||''));}catch(e){return fallback;}}
function cleanObj_(o){var c={};Object.keys(o||{}).forEach(function(k){if(k!=='__row')c[k]=o[k];});return c;}
function setting_(key,fallback) {
  var r=findOne_(LMS.SHEETS.SETTINGS,'key',key);
  return r?String(r.value):String(fallback===undefined?'':fallback);
}
function setSetting_(key,value) {
  upsertObj_(LMS.SHEETS.SETTINGS,'key',{key:key,value:String(value),updated_at:nowIso_()});
}
function log_(userId,action,entityType,entityId,metadata) {
  try{appendObj_(LMS.SHEETS.ACTIVITY_LOG,{
    log_id:makeId_('LOG'),user_id:userId||'',action:action||'',entity_type:entityType||'',entity_id:entityId||'',
    metadata_json:JSON.stringify(metadata||{}),created_at:nowIso_()
  });}catch(e){}
}

/**
 * Upsert banyak object dalam satu read + satu write.
 * Dipakai terutama untuk seed konten bawaan agar instalasi cepat dan hemat quota.
 */
function bulkUpsert_(name,idField,objects) {
  objects=objects||[];if(!objects.length)return {inserted:0,updated:0};
  var sh=sheet_(name),headers=sheetHeaders_(name),idIdx=headers.indexOf(idField);
  if(idIdx<0)throw new Error('Kolom ID tidak ada: '+idField);
  var last=sh.getLastRow(),values=last>=2?sh.getRange(2,1,last-1,headers.length).getValues():[];
  var index={};values.forEach(function(row,i){index[String(row[idIdx]||'')]=i;});
  var inserted=0,updated=0;
  objects.forEach(function(obj){
    var id=String(obj[idField]||'').trim();if(!id)throw new Error('ID wajib: '+idField);
    var i=index[id];
    if(i===undefined){
      var row=headers.map(function(h){return obj[h]===undefined?'':obj[h];});
      index[id]=values.length;values.push(row);inserted++;
    }else{
      headers.forEach(function(h,col){if(obj[h]!==undefined)values[i][col]=obj[h];});updated++;
    }
  });
  if(values.length)sh.getRange(2,1,values.length,headers.length).setValues(values);
  return {inserted:inserted,updated:updated};
}

/** Menulis ulang seluruh baris data sebuah sheet dalam satu operasi batch. Header tidak diubah. */
function rewriteRows_(name,objects) {
  objects=objects||[];
  var sh=sheet_(name),headers=sheetHeaders_(name),last=sh.getLastRow();
  if(last>1)sh.getRange(2,1,last-1,Math.max(headers.length,1)).clearContent();
  if(objects.length){
    var values=objects.map(function(obj){return headers.map(function(h){return obj[h]===undefined?'':obj[h];});});
    sh.getRange(2,1,values.length,headers.length).setValues(values);
  }
  return objects.length;
}
