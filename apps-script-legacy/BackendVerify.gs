function verifyBackend(){
  var result={app:LMS.APP_NAME,version:LMS.VERSION,checks:[],counts:{}};
  function add(name,ok,detail){result.checks.push({name:name,ok:!!ok,detail:String(detail||'')});}
  Object.keys(SCHEMA).forEach(function(k){var sh=db_().getSheetByName(LMS.SHEETS[k]);add('sheet '+LMS.SHEETS[k],!!sh,sh?'tersedia':'tidak ada');});
  var weeks=rows_(LMS.SHEETS.WEEKS),materials=rows_(LMS.SHEETS.MATERIALS),activities=rows_(LMS.SHEETS.ACTIVITIES),rubrics=rows_(LMS.SHEETS.RUBRICS);
  result.counts={weeks:weeks.length,materials:materials.length,activities:activities.length,rubrics:rubrics.length};
  add('16 pertemuan',weeks.length===16,weeks.length);add('16 materi inti',materials.length===16,materials.length);
  ['TASK1_ISSUE','TASK2_GAP','TASK3_DESIGN','TASK4_INSTRUMENT','TASK5_PROPOSAL'].forEach(function(id){add('activity '+id,!!findOne_(LMS.SHEETS.ACTIVITIES,'activity_id',id),id);add('rubric '+id,!!rubricByActivity_(id),id);});
  var failures=result.checks.filter(function(x){return !x.ok;});result.ok=failures.length===0;Logger.log(JSON.stringify(result,null,2));return result;
}
