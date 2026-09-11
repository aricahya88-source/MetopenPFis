function sanitizeHtml_(value) {
  var s=String(value||'');
  s=s.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'');
  s=s.replace(/\son\w+\s*=\s*(['"]).*?\1/gi,'').replace(/javascript:/gi,'');
  return s;
}

function stripHtmlText_(value) {
  return String(value||'').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/p>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/[ \t]+/g,' ').replace(/\n\s+/g,'\n').trim();
}
function feedbackTextToHtml_(value) {
  var s=String(value||'').trim();
  if(!s)return '';
  s=s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/\r?\n/g,'<br>');
  return '<p>'+s+'</p>';
}
function normalizedGrade100_(grade) {
  if(!grade)return null;
  var c=cleanObj_(grade),max=num_(c.max_score,100),score=num_(c.score,0);
  if(max>0&&max!==100)score=Math.round((score/max*100)*100)/100;
  c.score=Math.max(0,Math.min(100,score));c.max_score=100;
  return c;
}
function normalizedActivity100_(activity) {
  if(!activity)return activity;var c=cleanObj_(activity);c.max_score=100;return c;
}
function visible_(v){return v===''||v===null||v===undefined||asBool_(v);}
function legacyStaticActivity_(a){var id=String((a&&a.activity_id)||'');return /^(QUIZ|DISC)_M\d{2}$/.test(id);}
function enrichUser_(u){return u?safeUser_(u):null;}
function userMap_() {
  var map={};rows_(LMS.SHEETS.USERS).forEach(function(u){map[u.user_id]=safeUser_(u);});return map;
}
function activityById_(id){return findOne_(LMS.SHEETS.ACTIVITIES,'activity_id',id);}
function quizByActivity_(id){return findOne_(LMS.SHEETS.QUIZZES,'activity_id',id);}
function discussionByActivity_(id){return findOne_(LMS.SHEETS.DISCUSSIONS,'activity_id',id);}

function resolveCurrentWeek_(weeks){
  var mode=String(setting_('WEEK_MODE','AUTO')).toUpperCase();
  if(mode!=='AUTO'){
    var manual=num_(setting_('CURRENT_WEEK','1'),1);
    return weeks.filter(function(w){return num_(w.week_no)===manual;})[0]||weeks[0];
  }
  var sorted=weeks.slice().sort(function(a,b){return num_(a.week_no)-num_(b.week_no);}),now=Date.now(),chosen=sorted[0]||null;
  for(var i=0;i<sorted.length;i++){
    var open=sorted[i].open_at?new Date(sorted[i].open_at).getTime():NaN;
    if(!isNaN(open)&&open<=now)chosen=sorted[i];
  }
  return chosen;
}
function dashboardService_(request) {
  var user=requireUser_(request),weeks=rows_(LMS.SHEETS.WEEKS),week=resolveCurrentWeek_(weeks);
  var activities=rows_(LMS.SHEETS.ACTIVITIES).filter(function(a){return visible_(a.visible);});
  var memberships=findMany_(LMS.SHEETS.GROUP_MEMBERS,'user_id',user.user_id),groupIds={},groups={};rows_(LMS.SHEETS.GROUPS).forEach(function(g){groups[g.group_id]=g;});memberships.forEach(function(m){groupIds[m.group_id]=true;});
  var submissions=findMany_(LMS.SHEETS.SUBMISSIONS,'user_id',user.user_id);if(Object.keys(groupIds).length){rows_(LMS.SHEETS.SUBMISSIONS).forEach(function(x){if(groupIds[x.group_id])submissions.push(x);});}
  var grades=findMany_(LMS.SHEETS.GRADES,'user_id',user.user_id).filter(function(g){return asBool_(g.published);}),completedMap={};submissions.forEach(function(x){completedMap[x.activity_id]=true;});
  var upcoming=activities.filter(function(a){return a.due_at&&new Date(a.due_at).getTime()>=Date.now();}).sort(function(a,b){return new Date(a.due_at)-new Date(b.due_at);}).slice(0,6).map(normalizedActivity100_);
  var announcements=rows_(LMS.SHEETS.ANNOUNCEMENTS).filter(function(a){return visible_(a.visible);}).sort(function(a,b){return new Date(b.published_at||b.updated_at)-new Date(a.published_at||a.updated_at);}).slice(0,4).map(cleanObj_);
  var projectActs=activities.filter(function(a){return a.type==='project';}),pmap={};findMany_(LMS.SHEETS.PROJECT_PLANS,'user_id',user.user_id).forEach(function(p){pmap[p.project_code]=p.status;});if(Object.keys(groupIds).length){rows_(LMS.SHEETS.PROJECT_PLANS).forEach(function(p){if(groupIds[p.group_id])pmap[p.project_code]=p.status||'DRAFT';});}
  var projects=projectActs.map(function(a){return {activity_id:a.activity_id,title:a.title,project_code:a.project_code,status:pmap[a.project_code]||'Belum direncanakan'};});
  var teams=memberships.map(function(m){var g=groups[m.group_id];if(!g)return null;var count=findMany_(LMS.SHEETS.GROUP_MEMBERS,'group_id',g.group_id).length;return {group_id:g.group_id,project_code:g.project_code,name:g.name,meeting_no:num_(g.meeting_no,0)||undefined,topic:String(g.topic||''),role:String(m.role||'member'),member_count:count};}).filter(Boolean);
  var assessed=activities.filter(function(a){return ['project','assignment'].indexOf(String(a.type))>=0;}),done=assessed.filter(function(a){return completedMap[a.activity_id];}).length;
  return {stats:{progress:assessed.length?Math.min(100,Math.round(done/assessed.length*100)):0,activities:assessed.length,completed:done,graded:grades.length},currentWeek:week?cleanObj_(week):null,upcoming:upcoming,announcements:announcements,projects:projects,teams:teams};
}

function listWeeksService_(request) {
  requireUser_(request);
  var mats=rows_(LMS.SHEETS.MATERIALS),acts=rows_(LMS.SHEETS.ACTIVITIES);
  return rows_(LMS.SHEETS.WEEKS).filter(function(w){return visible_(w.visible);}).sort(function(a,b){return num_(a.week_no)-num_(b.week_no);}).map(function(w){
    return {week_id:w.week_id,week_no:num_(w.week_no),title:w.title,material_count:mats.filter(function(m){return m.week_id===w.week_id&&visible_(m.visible);}).length,activity_count:acts.filter(function(a){return a.week_id===w.week_id&&visible_(a.visible)&&!legacyStaticActivity_(a);}).length};
  });
}
function getWeekService_(request,payload) {
  requireUser_(request);
  var week=null;
  if(payload.week_id)week=findOne_(LMS.SHEETS.WEEKS,'week_id',payload.week_id);
  else {
    var n=num_(payload.week_no);
    week=rows_(LMS.SHEETS.WEEKS).filter(function(w){return num_(w.week_no)===n;})[0];
  }
  if(!week)throw new Error('Pertemuan tidak ditemukan.');
  var materials=findMany_(LMS.SHEETS.MATERIALS,'week_id',week.week_id).filter(function(m){return visible_(m.visible);}).sort(function(a,b){return num_(a.order_no)-num_(b.order_no);}).map(cleanObj_);
  var activities=findMany_(LMS.SHEETS.ACTIVITIES,'week_id',week.week_id).filter(function(a){return visible_(a.visible);}).sort(function(a,b){return String(a.type).localeCompare(String(b.type));}).map(normalizedActivity100_);
  return {week:cleanObj_(week),materials:materials,activities:activities};
}
function listDiscussionsService_(request) {
  requireUser_(request);
  var acts=rows_(LMS.SHEETS.ACTIVITIES).filter(function(a){return a.type==='discussion'&&visible_(a.visible)&&!legacyStaticActivity_(a);});
  var out=[];
  acts.forEach(function(a){
    var d=discussionByActivity_(a.activity_id);if(!d)return;
    out.push({discussion_id:d.discussion_id,activity_id:a.activity_id,week_id:a.week_id,title:a.title,prompt_html:d.prompt_html,max_score:100,post_count:findMany_(LMS.SHEETS.POSTS,'discussion_id',d.discussion_id).filter(function(p){return String(p.status||'active')!=='deleted';}).length});
  });
  return out;
}
function getDiscussionService_(request,payload) {
  requireUser_(request);
  var activity=activityById_(payload.activity_id);if(!activity||activity.type!=='discussion')throw new Error('Diskusi tidak ditemukan.');
  var d=discussionByActivity_(activity.activity_id);if(!d)throw new Error('Konfigurasi diskusi tidak ditemukan.');
  var umap=userMap_();
  var posts=findMany_(LMS.SHEETS.POSTS,'discussion_id',d.discussion_id).filter(function(p){return String(p.status||'active')!=='deleted';})
    .sort(function(a,b){return new Date(a.created_at)-new Date(b.created_at);})
    .map(function(p){var c=cleanObj_(p);c.author=umap[p.user_id]||null;return c;});
  return {discussion:cleanObj_(d),activity:normalizedActivity100_(activity),posts:posts};
}
function createPostService_(request,payload) {
  var user=requireUser_(request);
  var d=findOne_(LMS.SHEETS.DISCUSSIONS,'discussion_id',payload.discussion_id);if(!d)throw new Error('Diskusi tidak ditemukan.');
  var content=sanitizeHtml_(payload.content_html);if(!content.replace(/<[^>]+>/g,'').trim())throw new Error('Isi respons kosong.');
  var row={post_id:makeId_('POST'),discussion_id:d.discussion_id,user_id:user.user_id,parent_post_id:String(payload.parent_post_id||''),content_html:content,created_at:nowIso_(),updated_at:nowIso_(),status:'active'};
  appendObj_(LMS.SHEETS.POSTS,row);log_(user.user_id,'CREATE_POST','discussion',d.discussion_id,{});
  return cleanObj_(row);
}
function listTasksService_(request) {
  var user=requireUser_(request),memberships=findMany_(LMS.SHEETS.GROUP_MEMBERS,'user_id',user.user_id),gids={};memberships.forEach(function(m){gids[m.group_id]=true;});
  var subs=findMany_(LMS.SHEETS.SUBMISSIONS,'user_id',user.user_id);if(Object.keys(gids).length){rows_(LMS.SHEETS.SUBMISSIONS).forEach(function(x){if(gids[x.group_id])subs.push(x);});}var smap={};subs.forEach(function(x){smap[x.activity_id]=true;});
  var pstatus={};findMany_(LMS.SHEETS.PROJECT_PLANS,'user_id',user.user_id).forEach(function(p){pstatus[p.project_code]=p.status||'DRAFT';});if(Object.keys(gids).length){rows_(LMS.SHEETS.PROJECT_PLANS).forEach(function(p){if(gids[p.group_id])pstatus[p.project_code]=p.status||'DRAFT';});}
  return rows_(LMS.SHEETS.ACTIVITIES).filter(function(a){return visible_(a.visible)&&['assignment','project'].indexOf(String(a.type))>=0;}).sort(function(a,b){return String(a.week_id).localeCompare(String(b.week_id));}).map(function(a){return {activity_id:a.activity_id,week_id:a.week_id,type:a.type,title:a.title,max_score:100,due_at:a.due_at,project_code:a.project_code,submitted:!!smap[a.activity_id],status:a.type==='project'?(pstatus[a.project_code]||'Belum direncanakan'):''};});
}

function taskDataService_(request,payload) {
  var user=requireUser_(request),activityId=String(payload.activity_id||''),a=activityById_(activityId);
  if(!a)throw new Error('Aktivitas tidak ditemukan.');
  if(a.type==='quiz')return {activity:normalizedActivity100_(a),latest:null,grade:null};

  // Jalur ringan: satu bulk-read SUBMISSIONS dan satu bulk-read GRADES.
  // Komentar tidak lagi dibaca karena workflow tugas memakai feedback penilaian dosen.
  var latest=null,latestVersion=-1;
  rows_(LMS.SHEETS.SUBMISSIONS).forEach(function(s){
    if(String(s.activity_id)!==activityId||String(s.user_id)!==String(user.user_id))return;
    var v=num_(s.version,0);
    if(!latest||v>latestVersion){latest=s;latestVersion=v;}
  });

  var publishedGrade=null,publishedAt=0;
  rows_(LMS.SHEETS.GRADES).forEach(function(g){
    if(String(g.activity_id)!==activityId||String(g.user_id)!==String(user.user_id)||!asBool_(g.published))return;
    var t=new Date(g.graded_at||g.updated_at||0).getTime();if(isNaN(t))t=0;
    if(!publishedGrade||t>=publishedAt){publishedGrade=g;publishedAt=t;}
  });

  return {activity:normalizedActivity100_(a),latest:latest?cleanObj_(latest):null,grade:publishedGrade?normalizedGrade100_(publishedGrade):null};
}
function submitWorkService_(request,payload) {
  var user=requireUser_(request),a=activityById_(payload.activity_id);if(!a)throw new Error('Aktivitas tidak ditemukan.');
  if(['quiz','discussion','project'].indexOf(String(a.type))>=0)throw new Error('Gunakan alur aktivitas yang sesuai.');
  var existing=findMany_(LMS.SHEETS.SUBMISSIONS,'activity_id',a.activity_id).filter(function(s){return s.user_id===user.user_id;});
  var version=existing.reduce(function(m,s){return Math.max(m,num_(s.version));},0)+1;
  var fileUrl='',fileName='';
  if(payload.file_base64){
    var up=uploadBase64_({base64:payload.file_base64,file_name:payload.file_name,file_mime:payload.file_mime,category:'submissions'});
    fileUrl=up.url;fileName=up.name;
  }
  var row={submission_id:makeId_('SUB'),activity_id:a.activity_id,user_id:user.user_id,group_id:'',version:version,content_html:sanitizeHtml_(payload.content_html),link_url:String(payload.link_url||''),file_name:fileName,file_url:fileUrl,status:'submitted',submitted_at:nowIso_(),updated_at:nowIso_()};
  appendObj_(LMS.SHEETS.SUBMISSIONS,row);log_(user.user_id,'SUBMIT_WORK','activity',a.activity_id,{version:version});
  return cleanObj_(row);
}
function listGradesService_(request) {
  var user=requireUser_(request),acts={};rows_(LMS.SHEETS.ACTIVITIES).forEach(function(a){acts[a.activity_id]=a;});
  return findMany_(LMS.SHEETS.GRADES,'user_id',user.user_id).filter(function(g){return asBool_(g.published);})
    .sort(function(a,b){return new Date(b.graded_at)-new Date(a.graded_at);}).map(function(g){var c=normalizedGrade100_(g);c.activity_title=acts[g.activity_id]?acts[g.activity_id].title:g.activity_id;return c;});
}

function getQuizService_(request,payload) {
  var user=requireUser_(request),a=activityById_(payload.activity_id);if(!a||a.type!=='quiz')throw new Error('Kuis tidak ditemukan.');
  var q=quizByActivity_(a.activity_id);if(!q)throw new Error('Konfigurasi kuis tidak ditemukan.');
  var questions=findMany_(LMS.SHEETS.QUIZ_QUESTIONS,'quiz_id',q.quiz_id).sort(function(x,y){return num_(x.order_no)-num_(y.order_no);});
  if(asBool_(q.shuffle_questions))questions=questions.sort(function(){return Math.random()-.5;});
  var publicQ=questions.map(function(x){return {question_id:x.question_id,order_no:num_(x.order_no),question_html:x.question_html,options:[
    {key:'A',html:x.option_a_html},{key:'B',html:x.option_b_html},{key:'C',html:x.option_c_html},{key:'D',html:x.option_d_html}
  ],points:num_(x.points,1)};});
  var attempts=findMany_(LMS.SHEETS.QUIZ_ATTEMPTS,'quiz_id',q.quiz_id).filter(function(x){return x.user_id===user.user_id;});
  var best=null;attempts.forEach(function(x){if(!best||num_(x.percentage)>num_(best.percentage))best=x;});
  return {activity:normalizedActivity100_(a),quiz:cleanObj_(q),questions:publicQ,attempts:attempts.length,best:best?{score:Math.round(num_(best.percentage)*100)/100,max_score:100,percentage:num_(best.percentage)}:null};
}
function submitQuizService_(request,payload) {
  var user=requireUser_(request),a=activityById_(payload.activity_id);if(!a||a.type!=='quiz')throw new Error('Kuis tidak ditemukan.');
  var q=quizByActivity_(a.activity_id);if(!q)throw new Error('Konfigurasi kuis tidak ditemukan.');
  var prior=findMany_(LMS.SHEETS.QUIZ_ATTEMPTS,'quiz_id',q.quiz_id).filter(function(x){return x.user_id===user.user_id;});
  if(prior.length>=num_(q.attempt_limit,1))throw new Error('Kesempatan kuis sudah habis.');
  var answers=payload.answers||{},questions=findMany_(LMS.SHEETS.QUIZ_QUESTIONS,'quiz_id',q.quiz_id);
  var raw=0,rawMax=0,feedback=[];
  questions.forEach(function(x){var pts=num_(x.points,1),correct=String(answers[x.question_id]||'').toUpperCase()===String(x.correct_option||'').toUpperCase();rawMax+=pts;if(correct)raw+=pts;feedback.push({question_id:x.question_id,correct:correct,correct_option:asBool_(q.show_feedback)?x.correct_option:'',explanation_html:asBool_(q.show_feedback)?x.explanation_html:''});});
  var pct=rawMax?raw/rawMax*100:0,score100=Math.round(pct*100)/100,attemptNo=prior.length+1,now=nowIso_();
  appendObj_(LMS.SHEETS.QUIZ_ATTEMPTS,{attempt_id:makeId_('ATT'),quiz_id:q.quiz_id,user_id:user.user_id,attempt_no:attemptNo,answers_json:JSON.stringify(answers),score:score100,max_score:100,percentage:pct,submitted_at:now});
  var bestScore=score100;prior.forEach(function(x){bestScore=Math.max(bestScore,num_(x.percentage,(num_(x.max_score)>0?num_(x.score)/num_(x.max_score)*100:0)));});
  var existing=findMany_(LMS.SHEETS.GRADES,'activity_id',a.activity_id).filter(function(g){return g.user_id===user.user_id;})[0];
  var grade={grade_id:existing?existing.grade_id:makeId_('GRD'),activity_id:a.activity_id,user_id:user.user_id,submission_id:'',score:bestScore,max_score:100,feedback_html:'<p>Nilai terbaik kuis formatif pada skala 0–100.</p>',published:true,graded_by:'AUTO',graded_at:now,updated_at:now};
  upsertObj_(LMS.SHEETS.GRADES,'grade_id',grade);
  log_(user.user_id,'SUBMIT_QUIZ','quiz',q.quiz_id,{score:score100,max:100,attempt:attemptNo});
  return {score:score100,max_score:100,percentage:pct,attempt_no:attemptNo,feedback:asBool_(q.show_feedback)?feedback:[]};
}
function projectActivityByCode_(projectCode){
  var code=String(projectCode||'').toUpperCase();
  return rows_(LMS.SHEETS.ACTIVITIES).filter(function(a){return a.type==='project'&&String(a.project_code||'').toUpperCase()===code;})[0]||null;
}
function groupContextForUser_(userId,projectCode){
  var code=String(projectCode||'').toUpperCase(),memberships=findMany_(LMS.SHEETS.GROUP_MEMBERS,'user_id',userId),groups={};
  rows_(LMS.SHEETS.GROUPS).forEach(function(g){groups[g.group_id]=g;});
  for(var i=0;i<memberships.length;i++){
    var membership=memberships[i],g=groups[membership.group_id];
    if(!g||String(g.project_code||'').toUpperCase()!==code)continue;
    var memberRows=findMany_(LMS.SHEETS.GROUP_MEMBERS,'group_id',g.group_id),leaderId='',hasLeader=false;
    memberRows.forEach(function(m){if(String(m.role||'').toLowerCase()==='leader'&&!hasLeader){leaderId=String(m.user_id);hasLeader=true;}});
    if(!leaderId&&memberRows.length)leaderId=String(memberRows[0].user_id||'');
    return {group:g,membership:membership,member_rows:memberRows,leader_id:leaderId,is_leader:String(userId)===leaderId,leader_missing:!hasLeader};
  }
  return null;
}
function groupForUser_(userId,projectCode){var ctx=groupContextForUser_(userId,projectCode);return ctx?ctx.group:null;}
function projectGroupMembersPublic_(ctx){
  if(!ctx)return [];
  var umap=userMap_();
  return (ctx.member_rows||[]).map(function(m){var u=umap[m.user_id]||{};return {user_id:m.user_id,nim:u.nim||'',name:u.name||'',role:String(m.role||'member').toLowerCase()};});
}
function projectOwnerContext_(user,code){
  var act=projectActivityByCode_(code),isGroup=!!(act&&String(act.mode||'').toLowerCase()==='group'),ctx=isGroup?groupContextForUser_(user.user_id,code):null;
  if(isGroup&&!ctx)throw new Error('Anda belum ditempatkan pada kelompok untuk proyek ini.');
  return {activity:act,group_ctx:ctx,group:ctx?ctx.group:null,is_group:isGroup,can_edit:!ctx||ctx.is_leader};
}
function getProjectPlanService_(request,payload) {
  var user=requireUser_(request),code=String(payload.project_code||'').toUpperCase(),owner=projectOwnerContext_(user,code),group=owner.group;
  var plans=findMany_(LMS.SHEETS.PROJECT_PLANS,'project_code',code).filter(function(p){return group?p.group_id===group.group_id:p.user_id===user.user_id&&!p.group_id;});
  return {plan:plans[0]?cleanObj_(plans[0]):null,group:group?cleanObj_(group):null,group_members:projectGroupMembersPublic_(owner.group_ctx),membership_role:owner.group_ctx?String(owner.group_ctx.membership.role||'member').toLowerCase():'individual',can_edit:owner.can_edit,is_group:owner.is_group,leader_id:owner.group_ctx?owner.group_ctx.leader_id:''};
}
function saveProjectPlanService_(request,payload) {
  var user=requireUser_(request),incoming=payload.plan||{},code=String(incoming.project_code||'').toUpperCase();
  if(!code)throw new Error('Project code wajib.');
  var owner=projectOwnerContext_(user,code),group=owner.group;
  if(group&&!owner.can_edit)throw new Error('Perencanaan kelompok hanya dapat dibuat atau diubah oleh ketua kelompok. Semua anggota tetap dapat melihatnya.');
  var existing=incoming.plan_id?findOne_(LMS.SHEETS.PROJECT_PLANS,'plan_id',incoming.plan_id):findMany_(LMS.SHEETS.PROJECT_PLANS,'project_code',code).filter(function(p){return group?p.group_id===group.group_id:p.user_id===user.user_id&&!p.group_id;})[0];
  if(existing&&group&&String(existing.group_id||'')!==String(group.group_id))throw new Error('Perencanaan tidak sesuai dengan kelompok Anda.');
  var status=existing?String(existing.status||'DRAFT'):'DRAFT';
  if(['APPROVED','IN_PRODUCTION','DONE'].indexOf(status)>=0)throw new Error('Perencanaan sudah dikunci oleh dosen.');
  var submit=asBool_(payload.submit);
  var row={
    plan_id:existing?existing.plan_id:makeId_('PLAN'),project_code:code,user_id:user.user_id,group_id:group?group.group_id:'',
    title:String(incoming.title||''),theme_code:String(incoming.theme_code||''),topic:String(incoming.topic||''),maharah_json:String(incoming.maharah_json||'[]'),
    target_users_html:sanitizeHtml_(incoming.target_users_html),problem_html:sanitizeHtml_(incoming.problem_html),objectives_html:sanitizeHtml_(incoming.objectives_html),
    features_html:sanitizeHtml_(incoming.features_html),flow_html:sanitizeHtml_(incoming.flow_html),technology_html:sanitizeHtml_(incoming.technology_html),
    test_plan_html:sanitizeHtml_(incoming.test_plan_html),team_html:sanitizeHtml_(incoming.team_html),detail_json:String(incoming.detail_json||'{}'),
    status:submit?'UNDER_REVIEW':'DRAFT',revision_no:existing?num_(existing.revision_no,1):1,
    lecturer_feedback_html:existing?existing.lecturer_feedback_html:'',submitted_at:submit?nowIso_():(existing?existing.submitted_at:''),approved_at:existing?existing.approved_at:'',updated_at:nowIso_()
  };
  upsertObj_(LMS.SHEETS.PROJECT_PLANS,'plan_id',row);log_(user.user_id,submit?'SUBMIT_PROJECT_PLAN':'SAVE_PROJECT_PLAN','project_plan',row.plan_id,{project_code:code,group_id:row.group_id});
  return {plan:cleanObj_(row),group:group?cleanObj_(group):null,can_edit:owner.can_edit};
}
function getProjectFinalReportService_(request,payload){
  var user=requireUser_(request),code=String(payload.project_code||'').toUpperCase(),owner=projectOwnerContext_(user,code),a=owner.activity;if(!a)throw new Error('Aktivitas proyek tidak ditemukan.');
  var plan=findMany_(LMS.SHEETS.PROJECT_PLANS,'project_code',code).filter(function(p){return owner.group?String(p.group_id||'')===String(owner.group.group_id):String(p.user_id||'')===String(user.user_id)&&!p.group_id;})[0]||null;
  var planStatus=plan?String(plan.status||'DRAFT'):'DRAFT',planReady=['APPROVED','DONE'].indexOf(planStatus)>=0;
  var subs=findMany_(LMS.SHEETS.SUBMISSIONS,'activity_id',a.activity_id).filter(function(s){return owner.group?String(s.group_id||'')===String(owner.group.group_id):String(s.user_id||'')===String(user.user_id)&&!s.group_id;}).sort(function(x,y){return num_(y.version)-num_(x.version);});
  var latest=subs[0]||null,comments=latest?findMany_(LMS.SHEETS.COMMENTS,'entity_id',latest.submission_id).filter(function(c){return c.entity_type==='submission';}):[],umap=userMap_();comments=comments.map(function(c){var x=cleanObj_(c);x.author=umap[c.user_id]||null;return x;});
  var grades=findMany_(LMS.SHEETS.GRADES,'activity_id',a.activity_id).filter(function(g){return g.user_id===user.user_id&&asBool_(g.published);}).sort(function(x,y){return new Date(y.graded_at)-new Date(x.graded_at);});
  return {activity:normalizedActivity100_(a),report:latest?cleanObj_(latest):null,comments:comments,grade:grades[0]?normalizedGrade100_(grades[0]):null,group:owner.group?cleanObj_(owner.group):null,group_members:projectGroupMembersPublic_(owner.group_ctx),can_edit:owner.can_edit&&planReady,is_group:owner.is_group,membership_role:owner.group_ctx?String(owner.group_ctx.membership.role||'member').toLowerCase():'individual',plan_status:planStatus,plan_ready:planReady};
}
function saveProjectFinalReportService_(request,payload){
  var user=requireUser_(request),code=String(payload.project_code||'').toUpperCase(),owner=projectOwnerContext_(user,code),a=owner.activity;if(!a)throw new Error('Aktivitas proyek tidak ditemukan.');if(owner.group&&!owner.can_edit)throw new Error('Submission final kelompok hanya dapat dikirim oleh ketua kelompok.');
  var plan=findMany_(LMS.SHEETS.PROJECT_PLANS,'project_code',code).filter(function(p){return owner.group?String(p.group_id||'')===String(owner.group.group_id):String(p.user_id||'')===String(user.user_id)&&!p.group_id;})[0]||null;if(!plan||['APPROVED','DONE'].indexOf(String(plan.status||''))<0)throw new Error('Rencana harus disetujui dosen sebelum submission final dikirim.');
  var existing=findMany_(LMS.SHEETS.SUBMISSIONS,'activity_id',a.activity_id).filter(function(s){return owner.group?String(s.group_id||'')===String(owner.group.group_id):String(s.user_id||'')===String(user.user_id)&&!s.group_id;});var version=existing.reduce(function(m,s){return Math.max(m,num_(s.version));},0)+1,fileUrl='',fileName='';
  if(payload.file_base64){var up=uploadBase64_({base64:payload.file_base64,file_name:payload.file_name,file_mime:payload.file_mime,category:'submissions'});fileUrl=up.url;fileName=up.name;}
  var content=sanitizeHtml_(payload.content_html),link=String(payload.link_url||'').trim();if(!content.replace(/<[^>]+>/g,'').trim()&&!link&&!fileUrl)throw new Error('Isi laporan, tautan produk, atau file wajib diisi.');
  var row={submission_id:makeId_('SUB'),activity_id:a.activity_id,user_id:user.user_id,group_id:owner.group?owner.group.group_id:'',version:version,content_html:content,link_url:link,file_name:fileName,file_url:fileUrl,status:'submitted',submitted_at:nowIso_(),updated_at:nowIso_()};appendObj_(LMS.SHEETS.SUBMISSIONS,row);log_(user.user_id,'SUBMIT_PROJECT_FINAL','project',code,{version:version,group_id:row.group_id});return cleanObj_(row);
}
function uploadAssetService_(request,payload) {
  requireUser_(request);return uploadBase64_(payload);
}

/* ================= ADMIN ================= */
function adminListMaterials_(request){requireAdmin_(request);return rows_(LMS.SHEETS.MATERIALS).sort(function(a,b){return num_(a.material_no)-num_(b.material_no);}).map(cleanObj_);}
function adminSaveMaterial_(request,payload){
  var admin=requireAdmin_(request),m=payload.material||{};if(!m.material_id)throw new Error('material_id wajib.');
  m.content_html=sanitizeHtml_(m.content_html);m.updated_at=nowIso_();var r=upsertObj_(LMS.SHEETS.MATERIALS,'material_id',m);log_(admin.user_id,'SAVE_MATERIAL','material',m.material_id,{});return {material:cleanObj_(r)};
}
function adminListActivities_(request){requireAdmin_(request);return rows_(LMS.SHEETS.ACTIVITIES).filter(function(a){return ['discussion','quiz'].indexOf(String(a.type))<0;}).sort(function(a,b){return String(a.week_id).localeCompare(String(b.week_id));}).map(function(a){return normalizedActivity100_(a);});}
function adminSaveActivity_(request,payload){
  var admin=requireAdmin_(request),a=payload.activity||{},id=String(a.activity_id||makeId_('ACT'));
  var now=nowIso_(),row={activity_id:id,week_id:String(a.week_id||'W01'),type:String(a.type||'assignment'),title:String(a.title||''),description_html:sanitizeHtml_(a.description_html),mode:String(a.mode||'individual'),max_score:100,due_at:String(a.due_at||''),visible:a.visible!==false,allow_comments:a.allow_comments!==false,project_code:String(a.project_code||''),created_at:a.created_at||now,updated_at:now};
  upsertObj_(LMS.SHEETS.ACTIVITIES,'activity_id',row);log_(admin.user_id,'SAVE_ACTIVITY','activity',id,{});return {activity:cleanObj_(row)};
}
function adminListDiscussions_(request){
  requireAdmin_(request);var acts={};rows_(LMS.SHEETS.ACTIVITIES).forEach(function(a){acts[a.activity_id]=a;});
  return rows_(LMS.SHEETS.DISCUSSIONS).filter(function(d){var a=acts[d.activity_id];return !!a&&!legacyStaticActivity_(a);}).map(function(d){var a=acts[d.activity_id]||{};return {discussion_id:d.discussion_id,activity_id:d.activity_id,week_id:a.week_id||'',title:a.title||'',prompt_html:d.prompt_html,max_score:100,min_posts:num_(d.min_posts,1),due_at:a.due_at||'',visible:visible_(a.visible)};}).sort(function(a,b){return String(a.week_id).localeCompare(String(b.week_id));});
}
function adminSaveDiscussion_(request,payload){
  var admin=requireAdmin_(request),d=payload.discussion||{},aid=String(d.activity_id||makeId_('DISC_ACT')),did=String(d.discussion_id||makeId_('DISC')),now=nowIso_();
  upsertObj_(LMS.SHEETS.ACTIVITIES,'activity_id',{activity_id:aid,week_id:String(d.week_id||'W01'),type:'discussion',title:String(d.title||'Diskusi'),description_html:'',mode:'individual',max_score:100,due_at:String(d.due_at||''),visible:d.visible!==false,allow_comments:true,project_code:'',created_at:now,updated_at:now});
  upsertObj_(LMS.SHEETS.DISCUSSIONS,'discussion_id',{discussion_id:did,activity_id:aid,prompt_html:sanitizeHtml_(d.prompt_html),min_posts:num_(d.min_posts,1),grading_mode:'manual',updated_at:now});
  log_(admin.user_id,'SAVE_DISCUSSION','discussion',did,{});return {discussion:{discussion_id:did,activity_id:aid,week_id:d.week_id,title:d.title,prompt_html:d.prompt_html,max_score:100,min_posts:num_(d.min_posts,1),due_at:d.due_at||'',visible:d.visible!==false}};
}
function adminListQuizzes_(request){
  requireAdmin_(request);var acts={};rows_(LMS.SHEETS.ACTIVITIES).forEach(function(a){acts[a.activity_id]=a;});
  return rows_(LMS.SHEETS.QUIZZES).filter(function(q){var a=acts[q.activity_id];return !!a&&!legacyStaticActivity_(a);}).map(function(q){var a=acts[q.activity_id]||{};return {quiz_id:q.quiz_id,activity_id:q.activity_id,week_id:a.week_id||'',title:a.title||'',attempt_limit:num_(q.attempt_limit,1),max_score:100};}).sort(function(a,b){return String(a.week_id).localeCompare(String(b.week_id));});
}
function adminGetQuiz_(request,payload){
  requireAdmin_(request);var a=activityById_(payload.activity_id);if(!a)throw new Error('Kuis tidak ditemukan.');var q=quizByActivity_(a.activity_id);if(!q)throw new Error('Quiz row tidak ditemukan.');
  return {quiz_id:q.quiz_id,activity_id:a.activity_id,week_id:a.week_id,title:a.title,instructions_html:q.instructions_html,attempt_limit:num_(q.attempt_limit,3),show_feedback:asBool_(q.show_feedback),shuffle_questions:asBool_(q.shuffle_questions),visible:visible_(a.visible),due_at:a.due_at||'',questions:findMany_(LMS.SHEETS.QUIZ_QUESTIONS,'quiz_id',q.quiz_id).sort(function(x,y){return num_(x.order_no)-num_(y.order_no);}).map(cleanObj_)};
}
function adminSaveQuiz_(request,payload){
  var admin=requireAdmin_(request),q=payload.quiz||{},aid=String(q.activity_id||makeId_('QUIZ_ACT')),qid=String(q.quiz_id||makeId_('QUIZ')),now=nowIso_();
  upsertObj_(LMS.SHEETS.ACTIVITIES,'activity_id',{activity_id:aid,week_id:String(q.week_id||'W01'),type:'quiz',title:String(q.title||'Kuis'),description_html:'',mode:'individual',max_score:100,due_at:String(q.due_at||''),visible:q.visible!==false,allow_comments:false,project_code:'',created_at:now,updated_at:now});
  upsertObj_(LMS.SHEETS.QUIZZES,'quiz_id',{quiz_id:qid,activity_id:aid,instructions_html:sanitizeHtml_(q.instructions_html),attempt_limit:num_(q.attempt_limit,3),show_feedback:q.show_feedback!==false,shuffle_questions:asBool_(q.shuffle_questions),updated_at:now});
  log_(admin.user_id,'SAVE_QUIZ','quiz',qid,{});return adminGetQuiz_(request,{activity_id:aid});
}
function adminSaveQuizQuestion_(request,payload){
  var admin=requireAdmin_(request),a=activityById_(payload.activity_id);if(!a)throw new Error('Kuis tidak ditemukan.');var q=quizByActivity_(a.activity_id);if(!q)throw new Error('Quiz row tidak ditemukan.');
  var x=payload.question||{},id=String(x.question_id||makeId_('QQ')),row={question_id:id,quiz_id:q.quiz_id,order_no:num_(x.order_no,1),question_html:sanitizeHtml_(x.question_html),option_a_html:sanitizeHtml_(x.option_a_html),option_b_html:sanitizeHtml_(x.option_b_html),option_c_html:sanitizeHtml_(x.option_c_html),option_d_html:sanitizeHtml_(x.option_d_html),correct_option:String(x.correct_option||'A').toUpperCase(),points:num_(x.points,1),explanation_html:sanitizeHtml_(x.explanation_html),updated_at:nowIso_()};
  upsertObj_(LMS.SHEETS.QUIZ_QUESTIONS,'question_id',row);recalcQuizMax_(a.activity_id,q.quiz_id);log_(admin.user_id,'SAVE_QUIZ_QUESTION','quiz_question',id,{});return cleanObj_(row);
}
function adminDeleteQuizQuestion_(request,payload){var admin=requireAdmin_(request),x=findOne_(LMS.SHEETS.QUIZ_QUESTIONS,'question_id',payload.question_id);if(!x)return true;deleteById_(LMS.SHEETS.QUIZ_QUESTIONS,'question_id',payload.question_id);var q=findOne_(LMS.SHEETS.QUIZZES,'quiz_id',x.quiz_id);if(q)recalcQuizMax_(q.activity_id,q.quiz_id);log_(admin.user_id,'DELETE_QUIZ_QUESTION','quiz_question',payload.question_id,{});return true;}
function recalcQuizMax_(activityId,quizId){var a=activityById_(activityId);if(a)updateRowObj_(LMS.SHEETS.ACTIVITIES,a.__row,{max_score:100,updated_at:nowIso_()});}

function adminListUsers_(request){requireAdmin_(request);return rows_(LMS.SHEETS.USERS).map(function(u){var s=safeUser_(u);s.active=asBool_(u.active);return s;}).sort(function(a,b){return String(a.name).localeCompare(String(b.name));});}
function adminSaveUser_(request,payload){
  var admin=requireAdmin_(request),u=payload.user||{},id=String(u.user_id||makeId_('USR')),existing=u.user_id?findOne_(LMS.SHEETS.USERS,'user_id',u.user_id):null,temporary='';
  var salt=existing?existing.pin_salt:'',hash=existing?existing.pin_hash:'';
  if(!existing){
    temporary=String(u.initial_pin||'').trim();if(!temporary)temporary=String(Math.floor(100000+Math.random()*900000));
    if(temporary.length<6)throw new Error('PIN awal minimal 6 karakter.');
    var hp=makeUserPin_(temporary);salt=hp.salt;hash=hp.hash;
  }
  var now=nowIso_(),row={user_id:id,nim:String(u.nim||''),name:String(u.name||''),email:String(u.email||''),role:String(u.role||'mahasiswa'),class_name:String(u.class_name||''),pin_salt:salt,pin_hash:hash,active:u.active!==false,created_at:existing?existing.created_at:now,updated_at:now};
  if(!row.nim||!row.name)throw new Error('NIM/ID dan nama wajib.');
  upsertObj_(LMS.SHEETS.USERS,'user_id',row);log_(admin.user_id,'SAVE_USER','user',id,{});return {user:safeUser_(row),temporary_pin:temporary};
}
function adminResetPin_(request,payload){
  var admin=requireAdmin_(request),u=findOne_(LMS.SHEETS.USERS,'user_id',payload.user_id);if(!u)throw new Error('Pengguna tidak ditemukan.');
  var pin=String(payload.pin||'').trim();if(!pin)pin=String(Math.floor(100000+Math.random()*900000));if(pin.length<6)throw new Error('PIN minimal 6 karakter.');
  var hp=makeUserPin_(pin);updateRowObj_(LMS.SHEETS.USERS,u.__row,{pin_salt:hp.salt,pin_hash:hp.hash,updated_at:nowIso_()});log_(admin.user_id,'RESET_PIN','user',u.user_id,{});return {pin:pin};
}

function adminImportUsers_(request,payload){
  var admin=requireAdmin_(request),incoming=payload.rows||[],mode=String(payload.duplicate_mode||'skip').toLowerCase();
  if(!Array.isArray(incoming))throw new Error('Data import user tidak valid.');
  if(incoming.length>150)throw new Error('Maksimal 150 user per batch. Frontend akan membagi file besar secara otomatis.');
  if(['skip','update'].indexOf(mode)<0)mode='skip';
  var sh=sheet_(LMS.SHEETS.USERS),headers=sheetHeaders_(LMS.SHEETS.USERS),last=sh.getLastRow(),values=last>=2?sh.getRange(2,1,last-1,headers.length).getValues():[];
  var col={};headers.forEach(function(h,i){col[h]=i;});
  var byNim={},byEmail={};
  values.forEach(function(row,i){var n=String(row[col.nim]||'').trim().toLowerCase(),e=String(row[col.email]||'').trim().toLowerCase();if(n)byNim[n]=i;if(e)byEmail[e]=i;});
  var seen={},report={inserted:0,updated:0,skipped:0,errors:[],generatedPins:[]},now=nowIso_();
  incoming.forEach(function(raw,idx){
    try{
      raw=raw||{};var nim=String(raw.nim||'').trim(),name=String(raw.name||'').trim(),email=String(raw.email||'').trim(),className=String(raw.class_name||'').trim(),pin=String(raw.initial_pin||'').trim();
      if(!nim)throw new Error('NIM wajib diisi.');if(!name)throw new Error('Nama wajib diisi.');
      var key=nim.toLowerCase();if(seen[key]){report.skipped++;report.errors.push('Baris '+(idx+2)+': NIM '+nim+' duplikat di batch.');return;}seen[key]=true;
      if(pin&&pin.length<6)throw new Error('initial_pin minimal 6 karakter.');
      var foundIndex=byNim[key];if(foundIndex===undefined&&email)foundIndex=byEmail[email.toLowerCase()];
      var active=(raw.active===''||raw.active===undefined||raw.active===null)?true:asBool_(raw.active);
      if(foundIndex!==undefined){
        var existing=rowObject_(headers,values[foundIndex]);
        if(['admin','dosen'].indexOf(String(existing.role||'').toLowerCase())>=0)throw new Error('NIM/email milik akun '+existing.role+' dan tidak boleh ditimpa lewat import mahasiswa.');
        if(mode==='skip'){report.skipped++;return;}
        values[foundIndex][col.nim]=nim;values[foundIndex][col.name]=name;values[foundIndex][col.email]=email;values[foundIndex][col.class_name]=className;values[foundIndex][col.role]='mahasiswa';values[foundIndex][col.active]=active;values[foundIndex][col.updated_at]=now;
        if(pin){var hp=makeUserPin_(pin);values[foundIndex][col.pin_salt]=hp.salt;values[foundIndex][col.pin_hash]=hp.hash;}
        byNim[key]=foundIndex;if(email)byEmail[email.toLowerCase()]=foundIndex;report.updated++;
      }else{
        var generated=false;if(!pin){pin=String(Math.floor(100000+Math.random()*900000));generated=true;}
        var hp2=makeUserPin_(pin),rowObj={user_id:makeId_('USR'),nim:nim,name:name,email:email,role:'mahasiswa',class_name:className,pin_salt:hp2.salt,pin_hash:hp2.hash,active:active,created_at:now,updated_at:now};
        var row=headers.map(function(h){return rowObj[h]===undefined?'':rowObj[h];}),newIndex=values.length;values.push(row);byNim[key]=newIndex;if(email)byEmail[email.toLowerCase()]=newIndex;report.inserted++;if(generated)report.generatedPins.push({nim:nim,name:name,pin:pin});
      }
    }catch(err){report.errors.push('Baris '+(idx+2)+': '+(err&&err.message?err.message:err));}
  });
  if(values.length)sh.getRange(2,1,values.length,headers.length).setValues(values);SpreadsheetApp.flush();
  log_(admin.user_id,'IMPORT_USERS_XLSX','system','',{inserted:report.inserted,updated:report.updated,skipped:report.skipped,errors:report.errors.length});return report;
}

function adminListAnnouncements_(request){requireAdmin_(request);return rows_(LMS.SHEETS.ANNOUNCEMENTS).sort(function(a,b){return new Date(b.published_at||b.updated_at)-new Date(a.published_at||a.updated_at);}).map(cleanObj_);}
function adminSaveAnnouncement_(request,payload){
  var admin=requireAdmin_(request),a=payload.announcement||{},id=String(a.announcement_id||makeId_('ANN')),now=nowIso_();
  var row={announcement_id:id,title:String(a.title||''),content_html:sanitizeHtml_(a.content_html),published_at:String(a.published_at||now),visible:a.visible!==false,created_by:admin.user_id,updated_at:now};
  upsertObj_(LMS.SHEETS.ANNOUNCEMENTS,'announcement_id',row);log_(admin.user_id,'SAVE_ANNOUNCEMENT','announcement',id,{});return {announcement:cleanObj_(row)};
}
function adminListGroups_(request){
  requireAdmin_(request);var members=rows_(LMS.SHEETS.GROUP_MEMBERS),umap=userMap_();
  return rows_(LMS.SHEETS.GROUPS).map(function(g){var c=cleanObj_(g),gm=members.filter(function(m){return m.group_id===g.group_id;});c.member_ids=gm.map(function(m){return m.user_id;});c.leader_id='';c.members=gm.map(function(m){var u=umap[m.user_id]||{};if(String(m.role||'').toLowerCase()==='leader')c.leader_id=m.user_id;return {user_id:m.user_id,nim:u.nim||'',name:u.name||'',role:String(m.role||'member').toLowerCase()};});if(!c.leader_id&&c.member_ids.length)c.leader_id=c.member_ids[0];c.meeting_no=num_(c.meeting_no,0)||undefined;return c;}).sort(function(a,b){var pc=String(a.project_code).localeCompare(String(b.project_code));return pc||num_(a.meeting_no,99)-num_(b.meeting_no,99)||String(a.name).localeCompare(String(b.name));});
}
function adminSaveGroup_(request,payload){
  var admin=requireAdmin_(request),g=payload.group||{},code=String(g.project_code||'').toUpperCase(),valid=['STUDENT_LED','UTS_BLUEPRINT','UAS_CURRICULUM'];if(valid.indexOf(code)<0)throw new Error('Group set tidak valid.');
  var id=String(g.group_id||makeId_('GRP')),name=String(g.name||'').trim();if(!name)throw new Error('Nama kelompok wajib.');
  var memberIds=(g.member_ids||[]).map(String).filter(Boolean),seen={};memberIds=memberIds.filter(function(uid){if(seen[uid])return false;seen[uid]=true;return true;});if(code==='STUDENT_LED'&&memberIds.length!==2)throw new Error('Kelompok '+code+' harus berisi tepat 2 mahasiswa.');if(code!=='STUDENT_LED'&&(memberIds.length<4||memberIds.length>5))throw new Error('Kelompok '+code+' harus berisi 4–5 mahasiswa.');
  var leaderId=String(g.leader_id||'');if(!leaderId||memberIds.indexOf(leaderId)<0)throw new Error('Ketua harus dipilih dari anggota kelompok.');var users=userMap_();memberIds.forEach(function(uid){if(!users[uid]||String(users[uid].role)!=='mahasiswa')throw new Error('Anggota tidak valid: '+uid);});
  var allGroups=rows_(LMS.SHEETS.GROUPS),groupMap={};allGroups.forEach(function(x){groupMap[x.group_id]=x;});var allMembers=rows_(LMS.SHEETS.GROUP_MEMBERS);memberIds.forEach(function(uid){allMembers.forEach(function(m){var other=groupMap[m.group_id];if(other&&String(other.project_code||'').toUpperCase()===code&&String(m.user_id)===uid&&String(m.group_id)!==id)throw new Error((users[uid]?users[uid].name:uid)+' sudah berada di '+other.name+' pada group set '+code+'.');});});
  if(code==='STUDENT_LED'){var meeting=num_(g.meeting_no,0),allowed=[3,4,9,10,11,12,13];if(allowed.indexOf(meeting)<0)throw new Error('Pertemuan Student-Led harus salah satu dari 3, 4, 9, 10, 11, 12, atau 13.');allGroups.forEach(function(other){if(String(other.group_id)!==id&&String(other.project_code)==='STUDENT_LED'&&num_(other.meeting_no,0)===meeting)throw new Error('Pertemuan '+meeting+' sudah digunakan oleh '+other.name+'.');});}
  var now=nowIso_(),existing=groupMap[id];upsertObj_(LMS.SHEETS.GROUPS,'group_id',{group_id:id,project_code:code,name:name,meeting_no:code==='STUDENT_LED'?num_(g.meeting_no,0):'',topic:String(g.topic||''),created_at:existing?existing.created_at:now,updated_at:now});
  var kept=allMembers.filter(function(m){return String(m.group_id)!==id;}).map(cleanObj_);memberIds.forEach(function(uid){kept.push({membership_id:makeId_('MEM'),group_id:id,user_id:uid,role:uid===leaderId?'leader':'member',created_at:now});});rewriteRows_(LMS.SHEETS.GROUP_MEMBERS,kept);SpreadsheetApp.flush();log_(admin.user_id,'SAVE_GROUP','group',id,{project_code:code,leader_id:leaderId,members:memberIds.length});return {group:{group_id:id,project_code:code,name:name,meeting_no:code==='STUDENT_LED'?num_(g.meeting_no,0):undefined,topic:String(g.topic||''),member_ids:memberIds,leader_id:leaderId}};
}
function adminImportGroups_(request,payload){
  var admin=requireAdmin_(request),code=String(payload.project_code||'').toUpperCase(),incoming=payload.rows||[],valid=['STUDENT_LED','UTS_BLUEPRINT','UAS_CURRICULUM'];if(valid.indexOf(code)<0)throw new Error('Group set tidak valid.');if(!Array.isArray(incoming)||!incoming.length)throw new Error('Data kelompok kosong.');
  var users=rows_(LMS.SHEETS.USERS).filter(function(u){return String(u.role)==='mahasiswa'&&asBool_(u.active);}),byNim={};users.forEach(function(u){byNim[String(u.nim||'').trim().toLowerCase()]=u;});var fileGroups={},seen={},errors=[];
  incoming.forEach(function(raw,idx){var name=String(raw.group_name||raw.name||'').trim(),nim=String(raw.nim||'').trim(),role=String(raw.role||'MEMBER').toUpperCase(),u=byNim[nim.toLowerCase()];if(!name||!nim||!u)errors.push('Baris '+(idx+2)+': group_name dan NIM mahasiswa aktif wajib.');if(seen[nim.toLowerCase()])errors.push('NIM '+nim+' muncul lebih dari sekali.');seen[nim.toLowerCase()]=true;if(['LEADER','MEMBER'].indexOf(role)<0)errors.push('Role harus LEADER/MEMBER.');if(name&&u){var k=name.toLowerCase();if(!fileGroups[k])fileGroups[k]={name:name,members:[],leaders:0};fileGroups[k].members.push({user_id:u.user_id,role:role.toLowerCase()});if(role==='LEADER')fileGroups[k].leaders++;}});
  Object.keys(fileGroups).forEach(function(k){var g=fileGroups[k];if(code==='STUDENT_LED'&&g.members.length!==2)errors.push(g.name+' harus berisi 2 mahasiswa.');if(code!=='STUDENT_LED'&&(g.members.length<4||g.members.length>5))errors.push(g.name+' harus berisi 4–5 mahasiswa.');if(g.leaders!==1)errors.push(g.name+' harus memiliki tepat satu LEADER.');});if(errors.length)throw new Error(errors.slice(0,12).join(' | '));
  // Kosongkan group set yang belum direferensikan, lalu buat ulang dari file.
  var existing=rows_(LMS.SHEETS.GROUPS),members=rows_(LMS.SHEETS.GROUP_MEMBERS),referenced={};rows_(LMS.SHEETS.PROJECT_PLANS).forEach(function(p){if(p.group_id)referenced[p.group_id]=true;});rows_(LMS.SHEETS.SUBMISSIONS).forEach(function(x){if(x.group_id)referenced[x.group_id]=true;});var keepGroups=[],removeIds={};existing.forEach(function(g){if(String(g.project_code)!==code){keepGroups.push(cleanObj_(g));return;}if(referenced[g.group_id])keepGroups.push(cleanObj_(g));else removeIds[g.group_id]=true;});var keepMembers=members.filter(function(m){return !removeIds[m.group_id];}).map(cleanObj_),now=nowIso_(),created=0,memberCount=0;
  Object.keys(fileGroups).forEach(function(k){var fg=fileGroups[k],id=makeId_('GRP');keepGroups.push({group_id:id,project_code:code,name:fg.name,meeting_no:'',topic:'',created_at:now,updated_at:now});fg.members.forEach(function(m){keepMembers.push({membership_id:makeId_('MEM'),group_id:id,user_id:m.user_id,role:m.role,created_at:now});memberCount++;});created++;});rewriteRows_(LMS.SHEETS.GROUPS,keepGroups);rewriteRows_(LMS.SHEETS.GROUP_MEMBERS,keepMembers);SpreadsheetApp.flush();var report={project_code:code,groups:created,members:memberCount,created_groups:created,reused_groups:0,warnings:code==='STUDENT_LED'?['Atur pertemuan 3, 4, 9–13 dan topik setiap kelompok secara manual setelah import.']:[]};log_(admin.user_id,'IMPORT_GROUPS_XLSX','system',code,report);return report;
}

function adminListProjectPlans_(request){
  requireAdmin_(request);var umap=userMap_(),groups={},membersByGroup={};
  rows_(LMS.SHEETS.GROUPS).forEach(function(g){groups[g.group_id]=g.name;});
  rows_(LMS.SHEETS.GROUP_MEMBERS).forEach(function(m){if(!membersByGroup[m.group_id])membersByGroup[m.group_id]=[];membersByGroup[m.group_id].push(m);});
  return rows_(LMS.SHEETS.PROJECT_PLANS).sort(function(a,b){return new Date(b.updated_at)-new Date(a.updated_at);}).map(function(p){
    var c=cleanObj_(p),owner=umap[p.user_id],gm=membersByGroup[p.group_id]||[],leader=null;
    if(p.group_id){leader=gm.filter(function(m){return String(m.role||'').toLowerCase()==='leader';})[0]||gm[0]||null;if(leader&&umap[leader.user_id])owner=umap[leader.user_id];}
    c.owner_name=owner?owner.name:'';c.owner_nim=owner?owner.nim:'';c.group_name=groups[p.group_id]||'';return c;
  });
}

function adminReviewProjectPlan_(request,payload){
  var admin=requireAdmin_(request),p=findOne_(LMS.SHEETS.PROJECT_PLANS,'plan_id',payload.plan_id);if(!p)throw new Error('Perencanaan tidak ditemukan.');
  var status=String(payload.status||'UNDER_REVIEW'),update={status:status,lecturer_feedback_html:sanitizeHtml_(payload.feedback_html),updated_at:nowIso_()};
  if(status==='APPROVED')update.approved_at=nowIso_();
  if(status==='NEEDS_REVISION')update.revision_no=num_(p.revision_no,1)+1;
  updateRowObj_(LMS.SHEETS.PROJECT_PLANS,p.__row,update);log_(admin.user_id,'REVIEW_PROJECT_PLAN','project_plan',p.plan_id,{status:status});return true;
}
function adminGradebookActivities_(request){
  requireAdmin_(request);return rows_(LMS.SHEETS.ACTIVITIES).filter(function(a){return visible_(a.visible)&&!legacyStaticActivity_(a);}).sort(function(a,b){return String(a.week_id).localeCompare(String(b.week_id));}).map(function(a){return {activity_id:a.activity_id,title:a.title,type:a.type,max_score:100,week_id:a.week_id};});
}
function latestByDateOrVersion_(current,candidate,dateField){
  if(!current)return candidate;
  var cv=num_(current.version,0),nv=num_(candidate.version,0);
  if(nv!==cv)return nv>cv?candidate:current;
  var ct=new Date(current[dateField]||current.updated_at||current.created_at||0).getTime();
  var nt=new Date(candidate[dateField]||candidate.updated_at||candidate.created_at||0).getTime();
  return nt>=ct?candidate:current;
}
function submissionSummary_(sub){
  if(!sub)return null;
  return {submission_id:String(sub.submission_id||''),user_id:String(sub.user_id||''),group_id:String(sub.group_id||''),link_url:String(sub.link_url||''),file_url:String(sub.file_url||''),file_name:String(sub.file_name||''),submitted_at:String(sub.submitted_at||''),version:num_(sub.version,0),status:String(sub.status||'')};
}
function adminActivityRoster_(request,payload){
  requireAdmin_(request);
  var a=activityById_(payload.activity_id);if(!a)throw new Error('Aktivitas tidak ditemukan.');

  // LIGHT MODE: satu bulk-read per sheet, tanpa content_html submission dan tanpa COMMENTS.
  // Halaman gradebook hanya memuat metadata roster; isi tugas penuh diambil saat dosen memilih satu mahasiswa.
  var allUsers=rows_(LMS.SHEETS.USERS),users=allUsers.filter(function(u){return String(u.role)==='mahasiswa'&&asBool_(u.active);});
  var gradeRows=rows_(LMS.SHEETS.GRADES).filter(function(g){return String(g.activity_id)===String(a.activity_id);}),gradeByUser={};
  gradeRows.forEach(function(g){var uid=String(g.user_id||''),old=gradeByUser[uid];if(!old||new Date(g.graded_at||g.updated_at||0).getTime()>=new Date(old.graded_at||old.updated_at||0).getTime())gradeByUser[uid]=g;});

  var subRows=rows_(LMS.SHEETS.SUBMISSIONS).filter(function(s){return String(s.activity_id)===String(a.activity_id);});
  var subByUser={},subByGroup={};
  subRows.forEach(function(s){
    var gid=String(s.group_id||''),uid=String(s.user_id||'');
    if(gid)subByGroup[gid]=latestByDateOrVersion_(subByGroup[gid],s,'submitted_at');
    else if(uid)subByUser[uid]=latestByDateOrVersion_(subByUser[uid],s,'submitted_at');
  });

  var projectUserGroup={},groupNames={};
  if(a.type==='project'){
    var validGroups={};rows_(LMS.SHEETS.GROUPS).forEach(function(g){if(String(g.project_code||'').toUpperCase()===String(a.project_code||'').toUpperCase()){validGroups[g.group_id]=true;groupNames[g.group_id]=g.name||g.group_id;}});
    rows_(LMS.SHEETS.GROUP_MEMBERS).forEach(function(m){if(validGroups[m.group_id])projectUserGroup[m.user_id]=m.group_id;});
  }

  var postCount={};
  if(a.type==='discussion'){
    var d=discussionByActivity_(a.activity_id);
    if(d)rows_(LMS.SHEETS.POSTS).forEach(function(p){if(String(p.discussion_id)===String(d.discussion_id)&&String(p.status||'active')!=='deleted'){var uid=String(p.user_id||'');postCount[uid]=(postCount[uid]||0)+1;}});
  }

  return users.map(function(u){
    var uid=String(u.user_id||''),gid=projectUserGroup[uid]||'',sub=gid?subByGroup[gid]:subByUser[uid],grade=gradeByUser[uid]||null;
    return {user:safeUser_(u),grade:grade?normalizedGrade100_(grade):null,submission:submissionSummary_(sub),post_count:a.type==='discussion'?(postCount[uid]||0):undefined,group_id:gid,group_name:gid?(groupNames[gid]||gid):''};
  });
}

/**
 * Detail penilaian satu mahasiswa. Dibuat terpisah dari roster agar Apps Script tidak
 * mengirim content_html seluruh kelas pada setiap pembukaan Gradebook.
 */
function adminStudentAssessment_(request,payload){
  requireAdmin_(request);
  var activityId=String(payload.activity_id||''),uid=String(payload.user_id||'');
  if(!activityId||!uid)throw new Error('activity_id dan user_id wajib.');
  var a=activityById_(activityId);if(!a)throw new Error('Aktivitas tidak ditemukan.');
  var u=findOne_(LMS.SHEETS.USERS,'user_id',uid);if(!u||String(u.role)!=='mahasiswa')throw new Error('Mahasiswa tidak ditemukan.');

  // Cari hanya baris milik mahasiswa yang dipilih, bukan membaca seluruh submission kelas.
  var grades=findMany_(LMS.SHEETS.GRADES,'user_id',uid).filter(function(g){return String(g.activity_id)===activityId;});
  var grade=null;grades.forEach(function(g){if(!grade||new Date(g.graded_at||g.updated_at||0).getTime()>=new Date(grade.graded_at||grade.updated_at||0).getTime())grade=g;});

  var gid='',groupName='',subs=[];
  if(a.type==='project'){
    var memberships=findMany_(LMS.SHEETS.GROUP_MEMBERS,'user_id',uid),groups=rows_(LMS.SHEETS.GROUPS),groupMap={};
    groups.forEach(function(g){groupMap[g.group_id]=g;});
    for(var i=0;i<memberships.length;i++){
      var g=groupMap[memberships[i].group_id];
      if(g&&String(g.project_code||'').toUpperCase()===String(a.project_code||'').toUpperCase()){gid=String(g.group_id);groupName=String(g.name||g.group_id);break;}
    }
    if(gid)subs=findMany_(LMS.SHEETS.SUBMISSIONS,'group_id',gid).filter(function(s){return String(s.activity_id)===activityId;});
  }else{
    subs=findMany_(LMS.SHEETS.SUBMISSIONS,'user_id',uid).filter(function(s){return String(s.activity_id)===activityId&&!String(s.group_id||'');});
  }
  var sub=null;subs.forEach(function(s){sub=latestByDateOrVersion_(sub,s,'submitted_at');});

  var postCount=0,discussionExcerpt='';
  if(a.type==='discussion'){
    var d=discussionByActivity_(activityId);
    if(d){
      var posts=findMany_(LMS.SHEETS.POSTS,'user_id',uid).filter(function(p){return String(p.discussion_id)===String(d.discussion_id)&&String(p.status||'active')!=='deleted';});
      postCount=posts.length;discussionExcerpt=posts.map(function(p){return stripHtmlText_(p.content_html);}).join(' | ').slice(0,2500);
    }
  }

  var rubric=findMany_(LMS.SHEETS.RUBRICS,'activity_id',activityId)[0]||null,parsed=rubric?parseRubricCriteria_(rubric):null,evaluation=null;
  if(rubric){
    var evs=findMany_(LMS.SHEETS.RUBRIC_SCORES,'user_id',uid).filter(function(x){return String(x.rubric_id)===String(rubric.rubric_id);}),ev=null;
    evs.forEach(function(x){if(!ev||new Date(x.graded_at||0).getTime()>=new Date(ev.graded_at||0).getTime())ev=x;});
    if(ev){var scores={};try{scores=JSON.parse(String(ev.scores_json||'{}'));}catch(e){scores={};}evaluation={rubric_score_id:ev.rubric_score_id,scores:scores,total_score:num_(ev.total_score,0),graded_at:ev.graded_at};}
  }

  return {
    row:{user:safeUser_(u),grade:grade?normalizedGrade100_(grade):null,submission:sub?cleanObj_(sub):null,post_count:a.type==='discussion'?postCount:undefined,discussion_excerpt:discussionExcerpt,group_id:gid,group_name:groupName},
    rubric:rubric?{rubric_id:rubric.rubric_id,activity_id:rubric.activity_id,name:rubric.name,criteria:parsed.criteria||[],note:String(parsed.note||''),source_weight_total:num_(parsed.source_weight_total,0)}:null,
    evaluation:evaluation
  };
}

function adminAddSubmissionComment_(request,payload){
  var admin=requireAdmin_(request),submissionId=String(payload.submission_id||'');
  if(!submissionId)throw new Error('Submission tidak tersedia untuk dikomentari.');
  var sub=findOne_(LMS.SHEETS.SUBMISSIONS,'submission_id',submissionId);if(!sub)throw new Error('Submission tidak ditemukan.');
  var content=sanitizeHtml_(payload.content_html);if(!content.replace(/<[^>]+>/g,'').trim())throw new Error('Komentar kosong.');
  var row={comment_id:makeId_('CMT'),entity_type:'submission',entity_id:submissionId,user_id:admin.user_id,parent_comment_id:'',content_html:content,created_at:nowIso_(),updated_at:nowIso_()};
  appendObj_(LMS.SHEETS.COMMENTS,row);log_(admin.user_id,'COMMENT_SUBMISSION','submission',submissionId,{user_id:sub.user_id});return cleanObj_(row);
}
function adminSaveGrade_(request,payload){
  var admin=requireAdmin_(request),a=activityById_(payload.activity_id);if(!a)throw new Error('Aktivitas tidak ditemukan.');
  var score=num_(payload.score,-1);if(score<0||score>100)throw new Error('Nilai harus berada pada rentang 0–100.');
  var now=nowIso_(),targets=[String(payload.user_id)],submission=null;
  if(payload.submission_id){submission=findOne_(LMS.SHEETS.SUBMISSIONS,'submission_id',payload.submission_id);if(submission&&submission.group_id){targets=findMany_(LMS.SHEETS.GROUP_MEMBERS,'group_id',submission.group_id).map(function(m){return String(m.user_id);});if(!targets.length)targets=[String(payload.user_id)];}}
  var feedback=sanitizeHtml_(payload.feedback_html),saved=[],existingByUser={};
  rows_(LMS.SHEETS.GRADES).forEach(function(g){if(String(g.activity_id)===String(a.activity_id)){var uid=String(g.user_id||''),old=existingByUser[uid];if(!old||new Date(g.graded_at||g.updated_at||0).getTime()>=new Date(old.graded_at||old.updated_at||0).getTime())existingByUser[uid]=g;}});
  targets.forEach(function(uid){var existing=existingByUser[String(uid)]||null,id=existing?existing.grade_id:makeId_('GRD');var row={grade_id:id,activity_id:a.activity_id,user_id:uid,submission_id:String(payload.submission_id||''),score:score,max_score:100,feedback_html:feedback,published:payload.published!==false,graded_by:admin.user_id,graded_at:now,updated_at:now};upsertObj_(LMS.SHEETS.GRADES,'grade_id',row);saved.push(cleanObj_(row));});
  // v1.0.5: feedback penilaian disimpan hanya di GRADES.feedback_html.
  // Tidak lagi diduplikasi sebagai komentar submission karena halaman tugas memakai workflow feedback penilaian, bukan komentar.
  log_(admin.user_id,'SAVE_GRADE','activity',a.activity_id,{user_ids:targets,score:score,max_score:100,group_applied:targets.length>1});return saved[0];
}

function rubricByActivity_(activityId){
  var rows=rows_(LMS.SHEETS.RUBRICS).filter(function(r){return String(r.activity_id)===String(activityId);});
  return rows[0]||null;
}
function parseRubricCriteria_(rubric){
  if(!rubric)return {criteria:[],note:'',source_weight_total:0};
  try{return JSON.parse(String(rubric.criteria_json||'{}'));}catch(e){return {criteria:[],note:'',source_weight_total:0};}
}
function adminGetRubricEvaluation_(request,payload){
  requireAdmin_(request);var rubric=rubricByActivity_(payload.activity_id);if(!rubric)return {rubric:null,evaluation:null};
  var parsed=parseRubricCriteria_(rubric),uid=String(payload.user_id||''),rows=findMany_(LMS.SHEETS.RUBRIC_SCORES,'rubric_id',rubric.rubric_id).filter(function(x){return String(x.user_id)===uid;}).sort(function(a,b){return new Date(b.graded_at)-new Date(a.graded_at);});
  var ev=rows[0]||null,scores={};if(ev){try{scores=JSON.parse(String(ev.scores_json||'{}'));}catch(e){scores={};}}
  return {rubric:{rubric_id:rubric.rubric_id,activity_id:rubric.activity_id,name:rubric.name,criteria:parsed.criteria||[],note:String(parsed.note||''),source_weight_total:num_(parsed.source_weight_total,0)},evaluation:ev?{rubric_score_id:ev.rubric_score_id,scores:scores,total_score:num_(ev.total_score,0),graded_at:ev.graded_at}:null};
}
function adminSaveRubricEvaluation_(request,payload){
  var admin=requireAdmin_(request),a=activityById_(payload.activity_id);if(!a)throw new Error('Aktivitas tidak ditemukan.');
  var rubric=rubricByActivity_(a.activity_id);if(!rubric)throw new Error('Rubrik tidak tersedia untuk aktivitas ini.');
  var parsed=parseRubricCriteria_(rubric),criteria=parsed.criteria||[],scores=payload.scores||{},totalWeight=0,weighted=0;
  criteria.forEach(function(c){var w=num_(c.weight,0),s=num_(scores[c.id],0);if(s<1||s>4)throw new Error('Semua kriteria rubrik harus diberi skor 1–4.');totalWeight+=w;weighted+=(s/4)*w;});
  if(!criteria.length||totalWeight<=0)throw new Error('Rubrik tidak valid.');
  var total=Math.round((weighted/totalWeight*100)*100)/100,uid=String(payload.user_id||''),subId=String(payload.submission_id||''),now=nowIso_();if(!uid)throw new Error('Mahasiswa tidak dipilih.');
  var existing=findMany_(LMS.SHEETS.RUBRIC_SCORES,'rubric_id',rubric.rubric_id).filter(function(x){return String(x.user_id)===uid;})[0];
  var rs={rubric_score_id:existing?existing.rubric_score_id:makeId_('RSC'),rubric_id:rubric.rubric_id,user_id:uid,submission_id:subId,scores_json:JSON.stringify(scores),total_score:total,graded_by:admin.user_id,graded_at:now};
  upsertObj_(LMS.SHEETS.RUBRIC_SCORES,'rubric_score_id',rs);
  var saved=adminSaveGrade_(request,{activity_id:a.activity_id,user_id:uid,submission_id:subId,score:total,feedback_html:payload.feedback_html||'',published:payload.published!==false});
  log_(admin.user_id,'SAVE_RUBRIC_SCORE','rubric',rubric.rubric_id,{user_id:uid,total_score:total});
  return {rubric_score:cleanObj_(rs),grade:saved,total_score:total};
}

function adminImportGrades_(request,payload){
  var admin=requireAdmin_(request),input=payload.rows||[];if(!Array.isArray(input)||!input.length)throw new Error('Tidak ada baris penilaian untuk diimport.');if(input.length>25)throw new Error('Maksimal 25 baris per batch.');
  var activities={},users={},submissions={},groupMembers={},gradeIndex={},now=nowIso_();
  rows_(LMS.SHEETS.ACTIVITIES).forEach(function(a){activities[a.activity_id]=a;});rows_(LMS.SHEETS.USERS).forEach(function(u){users[u.user_id]=u;});rows_(LMS.SHEETS.SUBMISSIONS).forEach(function(x){submissions[x.submission_id]=x;});rows_(LMS.SHEETS.GROUP_MEMBERS).forEach(function(m){if(!groupMembers[m.group_id])groupMembers[m.group_id]=[];groupMembers[m.group_id].push(String(m.user_id));});rows_(LMS.SHEETS.GRADES).forEach(function(g){gradeIndex[String(g.activity_id)+'|'+String(g.user_id)]=g;});
  var gradeRows=[],errors=[],processed=0,groupApplied=0,feedbackRecords=0;
  input.forEach(function(r,i){
    try{
      var activityId=String(r.activity_id||''),userId=String(r.user_id||''),submissionId=String(r.submission_id||''),a=activities[activityId];
      if(!a)throw new Error('aktivitas tidak ditemukan');if(String(a.type)==='quiz')throw new Error('kuis dinilai otomatis');if(!users[userId])throw new Error('user tidak ditemukan');
      var hasScore=!(r.score===null||r.score===undefined||String(r.score).trim()===''),score=hasScore?Number(r.score):null;if(hasScore&&(isNaN(score)||score<0||score>100))throw new Error('nilai harus kosong atau 0–100');
      var feedbackText=String(r.feedback!==undefined?r.feedback:(r.feedback_html!==undefined?r.feedback_html:(r.comment||''))).trim();
      if(!hasScore&&!feedbackText)throw new Error('nilai dan feedback sama-sama kosong');
      var feedback=feedbackText?feedbackTextToHtml_(feedbackText):'',sub=submissionId?submissions[submissionId]:null,targets=[userId];
      if(sub&&sub.group_id&&groupMembers[sub.group_id]&&groupMembers[sub.group_id].length){targets=groupMembers[sub.group_id];groupApplied++;}
      targets.forEach(function(uid){
        var key=activityId+'|'+uid,existing=gradeIndex[key];
        if(!hasScore&&!existing)throw new Error('feedback tanpa nilai hanya dapat diimport jika nilai sebelumnya sudah tersedia');
        var finalScore=hasScore?score:Number(existing.score||0),row={grade_id:existing?existing.grade_id:makeId_('GRD'),activity_id:activityId,user_id:uid,submission_id:submissionId||(existing?String(existing.submission_id||''):''),score:finalScore,max_score:100,feedback_html:feedbackText?feedback:String(existing&&existing.feedback_html||''),published:true,graded_by:admin.user_id,graded_at:now,updated_at:now};
        gradeRows.push(row);gradeIndex[key]=row;if(feedbackText)feedbackRecords++;
      });
      processed++;
    }catch(e){errors.push('Baris '+(i+2)+': '+String(e&&e.message?e.message:e));}
  });
  if(gradeRows.length)bulkUpsert_(LMS.SHEETS.GRADES,'grade_id',gradeRows);SpreadsheetApp.flush();
  log_(admin.user_id,'IMPORT_GRADES','gradebook','BATCH',{rows:processed,grade_records:gradeRows.length,feedback_records:feedbackRecords,group_rows:groupApplied,errors:errors.length});
  return {processed:processed,grade_records:gradeRows.length,feedback_records:feedbackRecords,comments:0,group_rows:groupApplied,errors:errors};
}

function adminSeedBundledContent_(request,payload){
  var admin=requireAdmin_(request),counts={materials:0,quizzes:0,discussions:0},now=nowIso_();
  var materials=[],activities=[],quizzes=[],questions=[],discussions=[];

  (payload.materials||[]).forEach(function(m){
    materials.push({material_id:String(m.material_id),week_id:String(m.week_id),material_no:num_(m.material_no),order_no:num_(m.order_no),title:String(m.title),content_html:sanitizeHtml_(m.content_html),resource_url:String(m.resource_url||''),visible:m.visible!==false,updated_at:now});
    counts.materials++;
  });

  (payload.quizzes||[]).forEach(function(q){
    var aId=String(q.activity_id),quizId=String(q.quiz_id),maxScore=0;
    (q.questions||[]).forEach(function(x){
      var qid='QQ_M'+('0'+q.material_no).slice(-2)+'_'+('0'+x.n).slice(-2),opts={};
      (x.options||[]).forEach(function(o){opts[o.key]=o.text;});
      var pts=num_(x.points,1);maxScore+=pts;
      questions.push({question_id:qid,quiz_id:quizId,order_no:num_(x.n),question_html:'<p>'+String(x.question||'')+'</p>',option_a_html:'<p>'+String(opts.A||'')+'</p>',option_b_html:'<p>'+String(opts.B||'')+'</p>',option_c_html:'<p>'+String(opts.C||'')+'</p>',option_d_html:'<p>'+String(opts.D||'')+'</p>',correct_option:String(x.answer||'A'),points:pts,explanation_html:sanitizeHtml_(x.explanation_html||''),updated_at:now});
    });
    activities.push({activity_id:aId,week_id:String(q.week_id),type:'quiz',title:String(q.title),description_html:'',mode:'individual',max_score:100,due_at:'',visible:true,allow_comments:false,project_code:'',created_at:now,updated_at:now});
    quizzes.push({quiz_id:quizId,activity_id:aId,instructions_html:sanitizeHtml_(q.instructions_html),attempt_limit:num_(q.attempt_limit,3),show_feedback:q.show_feedback!==false,shuffle_questions:false,updated_at:now});
    counts.quizzes++;
  });

  (payload.discussions||[]).forEach(function(d){
    activities.push({activity_id:String(d.activity_id),week_id:String(d.week_id),type:'discussion',title:String(d.title),description_html:'',mode:'individual',max_score:100,due_at:'',visible:true,allow_comments:true,project_code:'',created_at:now,updated_at:now});
    discussions.push({discussion_id:String(d.discussion_id),activity_id:String(d.activity_id),prompt_html:sanitizeHtml_(d.prompt_html),min_posts:num_(d.min_posts,1),grading_mode:'manual',updated_at:now});
    counts.discussions++;
  });

  // Batch per sheet: jauh lebih cepat daripada ratusan append/update individual.
  bulkUpsert_(LMS.SHEETS.MATERIALS,'material_id',materials);
  bulkUpsert_(LMS.SHEETS.ACTIVITIES,'activity_id',activities);
  bulkUpsert_(LMS.SHEETS.QUIZZES,'quiz_id',quizzes);
  bulkUpsert_(LMS.SHEETS.QUIZ_QUESTIONS,'question_id',questions);
  bulkUpsert_(LMS.SHEETS.DISCUSSIONS,'discussion_id',discussions);
  SpreadsheetApp.flush();
  log_(admin.user_id,'SEED_BUNDLED_CONTENT','system','',{counts:counts});return counts;
}

function adminExportWorkbook_(request){
  var admin=requireAdmin_(request),source=db_(),temp=SpreadsheetApp.create('LMS_EXPORT_'+Utilities.formatDate(new Date(),LMS.TIMEZONE,'yyyyMMdd_HHmmss')),tempId=temp.getId();
  try{
    var first=temp.getSheets()[0];first.setName('README');first.getRange('A1').setValue('Export METOPEN PFIS');first.getRange('A2').setValue('Dibuat '+nowIso_());first.getRange('A4').setValue('USERS tidak mengekspor pin_hash/pin_salt. Untuk import user baru gunakan kolom initial_pin.');
    Object.keys(SCHEMA).forEach(function(key){
      var name=LMS.SHEETS[key],src=source.getSheetByName(name);if(!src)return;
      var vals=src.getDataRange().getValues();if(!vals.length)return;
      if(name===LMS.SHEETS.USERS){
        var h=vals[0].slice(),si=h.indexOf('pin_salt'),hi=h.indexOf('pin_hash');h.push('initial_pin');
        var nv=[h];for(var r=1;r<vals.length;r++){var row=vals[r].slice();if(si>=0)row[si]='';if(hi>=0)row[hi]='';row.push('');nv.push(row);}vals=nv;
      }
      var sh=temp.insertSheet(name);sh.getRange(1,1,vals.length,vals[0].length).setValues(vals);sh.setFrozenRows(1);sh.getRange(1,1,1,vals[0].length).setFontWeight('bold').setBackground('#E7F4F1');
    });
    var url='https://docs.google.com/spreadsheets/d/'+tempId+'/export?format=xlsx';
    var res=UrlFetchApp.fetch(url,{headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()}});
    var blob=res.getBlob().setName('METOPEN_PFIS_Export_'+Utilities.formatDate(new Date(),LMS.TIMEZONE,'yyyyMMdd_HHmmss')+'.xlsx');
    log_(admin.user_id,'EXPORT_XLSX','system','',{});
    return {file_name:blob.getName(),mime_type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',base64:Utilities.base64Encode(blob.getBytes())};
  }finally{try{DriveApp.getFileById(tempId).setTrashed(true);}catch(e){}}
}
function adminImportWorkbook_(request,payload){
  var admin=requireAdmin_(request),sheets=payload.sheets||{},report={inserted:0,updated:0,skipped:0,errors:[],generatedPins:[]};
  Object.keys(SCHEMA).forEach(function(key){
    var name=LMS.SHEETS[key],incoming=sheets[name];if(!incoming||!incoming.length)return;
    var schema=SCHEMA[key],idField=schema[0];
    incoming.forEach(function(raw,idx){
      try{
        if(!raw||typeof raw!=='object'){report.skipped++;return;}
        var obj={};schema.forEach(function(field){if(raw[field]!==undefined)obj[field]=raw[field];});
        if(!obj[idField]){report.skipped++;return;}
        Object.keys(obj).forEach(function(k){if(/_html$/.test(k))obj[k]=sanitizeHtml_(obj[k]);});
        var found=findOne_(name,idField,obj[idField]);
        if(name===LMS.SHEETS.USERS){
          var pin=String(raw.initial_pin||'').trim();
          delete obj.pin_hash;delete obj.pin_salt;
          if(!found){
            if(!pin)pin=String(Math.floor(100000+Math.random()*900000));
            if(pin.length<6)throw new Error('initial_pin minimal 6 karakter.');
            var hp=makeUserPin_(pin);obj.pin_salt=hp.salt;obj.pin_hash=hp.hash;report.generatedPins.push({nim:String(obj.nim||''),name:String(obj.name||''),pin:pin});
            obj.created_at=obj.created_at||nowIso_();
          }else{
            obj.pin_salt=found.pin_salt;obj.pin_hash=found.pin_hash;
            if(pin){var hp2=makeUserPin_(pin);obj.pin_salt=hp2.salt;obj.pin_hash=hp2.hash;}
          }
        }
        obj.updated_at=obj.updated_at||nowIso_();
        upsertObj_(name,idField,obj);if(found)report.updated++;else report.inserted++;
      }catch(err){report.errors.push(name+' baris '+(idx+2)+': '+err.message);}
    });
  });
  log_(admin.user_id,'IMPORT_XLSX','system','',{inserted:report.inserted,updated:report.updated,errors:report.errors.length});return report;
}


/* ================= STATIC COURSE v1.3 =================
   Curriculum content is served by Vercel/CDN. Only mutable learner data hits Sheets. */
function staticQuizMeta_(quizId){var q=STATIC_QUIZ_BANK[String(quizId||'')];if(!q)throw new Error('Kuis statis tidak ditemukan.');return q;}
function staticDiscussionMeta_(discussionId){var d=STATIC_DISCUSSION_BANK[String(discussionId||'')];if(!d)throw new Error('Diskusi statis tidak ditemukan.');return d;}
function staticClosed_(meta){var due=String(meta&&meta.due_at||'');if(!due)return false;var t=new Date(due).getTime();return !isNaN(t)&&Date.now()>t;}
function assertStaticOpen_(meta,label){if(staticClosed_(meta))throw new Error((label||'Aktivitas')+' sudah melewati batas akhir pengumpulan.');}
function staticQuizByActivity_(activityId){var id=String(activityId||'');var keys=Object.keys(STATIC_QUIZ_BANK);for(var i=0;i<keys.length;i++){var q=STATIC_QUIZ_BANK[keys[i]];if(q.activity_id===id)return {quiz_id:keys[i],meta:q};}throw new Error('Kuis statis tidak ditemukan.');}

function getStaticQuizStatusService_(request,payload){
  var user=requireUser_(request),pair=staticQuizByActivity_(payload.activity_id),quizId=pair.quiz_id,q=pair.meta,attempts=findMany_(LMS.SHEETS.QUIZ_ATTEMPTS,'quiz_id',quizId).filter(function(x){return x.user_id===user.user_id;}),best=null;
  attempts.forEach(function(x){if(!best||num_(x.percentage)>num_(best.percentage))best=x;});
  return {attempts:attempts.length,attempt_limit:num_(q.attempt_limit,3),best:best?{score:Math.round(num_(best.percentage)*100)/100,max_score:100,percentage:num_(best.percentage)}:null,closed:staticClosed_(q),due_at:String(q.due_at||'')};
}
function submitStaticQuizService_(request,payload){
  var user=requireUser_(request),quizId=String(payload.quiz_id||''),q=staticQuizMeta_(quizId);if(String(payload.activity_id||q.activity_id)!==String(q.activity_id))throw new Error('Aktivitas kuis tidak sesuai.');assertStaticOpen_(q,'Kuis');
  var prior=findMany_(LMS.SHEETS.QUIZ_ATTEMPTS,'quiz_id',quizId).filter(function(x){return x.user_id===user.user_id;});if(prior.length>=num_(q.attempt_limit,3))throw new Error('Kesempatan kuis sudah habis.');
  var answers=payload.answers||{},raw=0,rawMax=0,feedback=[];(q.questions||[]).forEach(function(x){var pts=num_(x.points,1),correct=String(answers[x.question_id]||'').toUpperCase()===String(x.correct_option||'').toUpperCase();rawMax+=pts;if(correct)raw+=pts;feedback.push({question_id:x.question_id,correct:correct,correct_option:q.show_feedback?x.correct_option:'',explanation_html:q.show_feedback?String(x.explanation_html||''):''});});
  var pct=rawMax?raw/rawMax*100:0,score100=Math.round(pct*100)/100,attemptNo=prior.length+1,now=nowIso_();
  appendObj_(LMS.SHEETS.QUIZ_ATTEMPTS,{attempt_id:makeId_('ATT'),quiz_id:quizId,user_id:user.user_id,attempt_no:attemptNo,answers_json:JSON.stringify(answers),score:score100,max_score:100,percentage:pct,submitted_at:now});
  var bestScore=score100;prior.forEach(function(x){bestScore=Math.max(bestScore,num_(x.percentage,(num_(x.max_score)>0?num_(x.score)/num_(x.max_score)*100:0)));});
  var existing=findMany_(LMS.SHEETS.GRADES,'activity_id',q.activity_id).filter(function(g){return g.user_id===user.user_id;})[0];
  upsertObj_(LMS.SHEETS.GRADES,'grade_id',{grade_id:existing?existing.grade_id:makeId_('GRD'),activity_id:q.activity_id,user_id:user.user_id,submission_id:'',score:bestScore,max_score:100,feedback_html:'<p>Nilai terbaik kuis formatif pada skala 0–100.</p>',published:true,graded_by:'AUTO',graded_at:now,updated_at:now});
  log_(user.user_id,'SUBMIT_STATIC_QUIZ','quiz',quizId,{score:score100,max:100,attempt:attemptNo});
  return {score:score100,max_score:100,percentage:pct,attempt_no:attemptNo,feedback:q.show_feedback?feedback:[]};
}
function getStaticDiscussionPostsService_(request,payload){
  requireUser_(request);var id=String(payload.discussion_id||''),meta=staticDiscussionMeta_(id),umap=userMap_();
  var posts=findMany_(LMS.SHEETS.POSTS,'discussion_id',id).filter(function(p){return String(p.status||'active')!=='deleted';}).sort(function(a,b){return new Date(a.created_at)-new Date(b.created_at);}).map(function(p){var c=cleanObj_(p);c.author=umap[p.user_id]||null;return c;});
  return {posts:posts,closed:staticClosed_(meta),due_at:String(meta.due_at||'')};
}
function createStaticPostService_(request,payload){
  var user=requireUser_(request),id=String(payload.discussion_id||''),meta=staticDiscussionMeta_(id),content=sanitizeHtml_(payload.content_html);
  assertStaticOpen_(meta,'Diskusi');
  if(!content.replace(/<[^>]+>/g,'').trim())throw new Error('Respons diskusi kosong.');
  var row={post_id:makeId_('POST'),discussion_id:id,user_id:user.user_id,parent_post_id:String(payload.parent_post_id||''),content_html:content,created_at:nowIso_(),updated_at:nowIso_(),status:'active'};
  appendObj_(LMS.SHEETS.POSTS,row);log_(user.user_id,'CREATE_STATIC_POST','discussion',id,{activity_id:meta.activity_id});return cleanObj_(row);
}
function getStaticActivityProgressService_(request){
  var user=requireUser_(request),attempts=findMany_(LMS.SHEETS.QUIZ_ATTEMPTS,'user_id',user.user_id),quizAttempts={},projectStatus={};
  attempts.forEach(function(a){quizAttempts[a.quiz_id]=(quizAttempts[a.quiz_id]||0)+1;});
  findMany_(LMS.SHEETS.PROJECT_PLANS,'user_id',user.user_id).forEach(function(p){projectStatus[p.project_code]=p.status||'DRAFT';});
  var memberships=findMany_(LMS.SHEETS.GROUP_MEMBERS,'user_id',user.user_id);if(memberships.length){var gids={};memberships.forEach(function(m){gids[m.group_id]=true;});rows_(LMS.SHEETS.PROJECT_PLANS).forEach(function(p){if(gids[p.group_id])projectStatus[p.project_code]=p.status||'DRAFT';});}
  return {quizAttempts:quizAttempts,projectStatus:projectStatus};
}
function seedStaticActivityMeta_(){
  var now=nowIso_(),acts=[],discs=[];
  (STATIC_ACTIVITY_META||[]).forEach(function(a){acts.push({activity_id:a.activity_id,week_id:a.week_id,type:a.type,title:a.title,description_html:'',mode:a.mode||'individual',max_score:100,due_at:String(a.due_at||''),visible:true,allow_comments:a.type==='discussion'||a.type==='project',project_code:a.project_code||'',created_at:now,updated_at:now});});
  Object.keys(STATIC_DISCUSSION_BANK||{}).forEach(function(id){var d=STATIC_DISCUSSION_BANK[id];discs.push({discussion_id:id,activity_id:d.activity_id,prompt_html:'',min_posts:num_(d.min_posts,1),grading_mode:'manual',updated_at:now});});
  bulkUpsert_(LMS.SHEETS.ACTIVITIES,'activity_id',acts);bulkUpsert_(LMS.SHEETS.DISCUSSIONS,'discussion_id',discs);SpreadsheetApp.flush();
  return {activities:acts.length,discussions:discs.length};
}
