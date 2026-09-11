import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { dbAll, dbDelete, dbInsert, dbSelect, dbUpdate, dbUpsert } from '@/lib/server/supabase';
import { hashPin, issueToken, makePinHash, requireAdmin, requireUser, safeUser, type DbUser } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ReqBody = { action?: string; payload?: Record<string, any>; token?: string };
const PUBLIC_TASK_IDS = ['TASK1_ISSUE','TASK2_GAP','TASK3_DESIGN','TASK4_INSTRUMENT','TASK5_PROPOSAL'];
const TABLES = ['settings','users','weeks','materials','activities','discussions','posts','comments','submissions','submission_articles','grades','rubrics','rubric_scores','quizzes','quiz_questions','quiz_attempts','groups','group_members','project_plans','announcements','activity_log'] as const;
const PK: Record<string,string> = {
  settings:'key', users:'user_id', weeks:'week_id', materials:'material_id', activities:'activity_id', discussions:'discussion_id', posts:'post_id', comments:'comment_id', submissions:'submission_id', submission_articles:'article_id', grades:'grade_id', rubrics:'rubric_id', rubric_scores:'rubric_score_id', quizzes:'quiz_id', quiz_questions:'question_id', quiz_attempts:'attempt_id', groups:'group_id', group_members:'membership_id', project_plans:'plan_id', announcements:'announcement_id', activity_log:'log_id'
};
const JSON_COLUMNS = new Set(['criteria_json','scores_json','metadata_json','maharah_json','stages_json','data_collection_json','analysis_json']);
const SHEET_TO_TABLE: Record<string,string> = {
  SETTINGS:'settings', USERS:'users', WEEKS:'weeks', MATERIALS:'materials', ACTIVITIES:'activities', DISCUSSIONS:'discussions', POSTS:'posts', COMMENTS:'comments', SUBMISSIONS:'submissions', SUBMISSION_ARTICLES:'submission_articles', GRADES:'grades', RUBRICS:'rubrics', RUBRIC_SCORES:'rubric_scores', QUIZZES:'quizzes', QUIZ_QUESTIONS:'quiz_questions', QUIZ_ATTEMPTS:'quiz_attempts', GROUPS:'groups', GROUP_MEMBERS:'group_members', PROJECT_PLANS:'project_plans', ANNOUNCEMENTS:'announcements', ACTIVITY_LOG:'activity_log'
};

function ok(data: unknown) { return NextResponse.json({ok:true,data}); }
function fail(err: unknown, status = 400) { return NextResponse.json({ok:false,error:{message:err instanceof Error?err.message:String(err)}},{status}); }
function now() { return new Date().toISOString(); }
function id(prefix: string) { return `${prefix}_${randomBytes(10).toString('hex')}`; }
function num(v: unknown, d=0) { const n=Number(v); return Number.isFinite(n)?n:d; }
function bool(v: unknown, d=true) { if(v===null||v===undefined||v==='')return d; if(typeof v==='boolean')return v; return !['false','0','no','off'].includes(String(v).toLowerCase()); }
function sanitizeHtml(value: unknown) { return String(value||'').replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/\son\w+\s*=\s*(['"]).*?\1/gi,'').replace(/javascript:/gi,''); }
function stripHtml(value: unknown) { return String(value||'').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/p>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim(); }
function normalizeActivity(a:any){ return a?{...a,max_score:100}:a; }
function normalizeGrade(g:any){ if(!g)return g; const max=num(g.max_score,100)||100; return {...g,score:Math.max(0,Math.min(100,max===100?num(g.score):num(g.score)/max*100)),max_score:100}; }
function latest<T extends Record<string,any>>(rows:T[], dateField='updated_at'){return rows.slice().sort((a,b)=>{const av=num(a.version,0),bv=num(b.version,0);if(av!==bv)return bv-av;return new Date(b[dateField]||b.updated_at||0).getTime()-new Date(a[dateField]||a.updated_at||0).getTime()})[0]||null;}
function visible(x:any){return x?.visible===undefined||x?.visible===null||x?.visible===''||bool(x.visible,true);}
function publicUser(u:any){return u?safeUser(u):null;}
function projectAuthor(u:any){return u?{name:String(u.name||''),class_name:String(u.class_name||'')}:null;}
function isHttpUrl(v:string){try{const u=new URL(v);return ['http:','https:'].includes(u.protocol)}catch{return false}}

async function one(table:string, params:Record<string,string|number|boolean|undefined>){ return (await dbSelect<any>(table,{select:'*',limit:1,...params}))[0]||null; }
async function activityById(activityId:string){ return one('activities',{activity_id:`eq.${activityId}`}); }
async function logAction(userId:string,action:string,entityType:string,entityId:string,metadata:any={}){try{await dbInsert('activity_log',{log_id:id('LOG'),user_id:userId,action,entity_type:entityType,entity_id:entityId,metadata_json:JSON.stringify(metadata),created_at:now()})}catch{}}
async function allUsersMap(){const users=await dbAll<any>('users',{select:'user_id,nim,name,email,role,class_name,active'});return Object.fromEntries(users.map(u=>[u.user_id,u]));}
async function getArticles(submissionId:string){return dbSelect<any>('submission_articles',{select:'article_id,submission_id,slot_no,url,file_name,file_url,mime_type,created_at',submission_id:`eq.${submissionId}`,order:'slot_no.asc'});}
async function latestSubmission(activityId:string,userId:string){return latest(await dbSelect<any>('submissions',{select:'*',activity_id:`eq.${activityId}`,user_id:`eq.${userId}`,order:'version.desc,submitted_at.desc'}),'submitted_at');}
async function latestGrade(activityId:string,userId:string,publishedOnly=false){const p:any={select:'*',activity_id:`eq.${activityId}`,user_id:`eq.${userId}`,order:'graded_at.desc,updated_at.desc'};if(publishedOnly)p.published='eq.true';return latest(await dbSelect<any>('grades',p),'graded_at');}

async function resolveWeek(){
  const weeks=await dbSelect<any>('weeks',{select:'*',visible:'eq.true',order:'week_no.asc'});
  if(!weeks.length)return null;
  const settings=await dbSelect<any>('settings',{select:'key,value',key:'in.(WEEK_MODE,CURRENT_WEEK)'});
  const map=Object.fromEntries(settings.map(x=>[String(x.key),String(x.value)]));
  if(String(map.WEEK_MODE||'MANUAL').toUpperCase()!=='AUTO'){
    const n=num(map.CURRENT_WEEK,1);return weeks.find(w=>num(w.week_no)===n)||weeks[0];
  }
  let chosen=weeks[0];const ts=Date.now();for(const w of weeks){const t=w.open_at?new Date(w.open_at).getTime():NaN;if(!Number.isNaN(t)&&t<=ts)chosen=w;}return chosen;
}

async function doLogin(payload:any){
  const identity=String(payload.identity||'').trim();const pin=String(payload.pin||'');if(!identity||!pin)throw new Error('Email/NIM dan PIN wajib diisi.');
  let user=(await dbSelect<DbUser>('users',{select:'*',nim:`eq.${identity}`,limit:1}))[0];
  if(!user)user=(await dbSelect<DbUser>('users',{select:'*',email:`eq.${identity}`,limit:1}))[0];
  if(!user||user.active===false||!user.pin_salt||!user.pin_hash||hashPin(pin,user.pin_salt)!==user.pin_hash)throw new Error('Email/NIM atau PIN tidak sesuai.');
  const token=issueToken(user);await logAction(user.user_id,'LOGIN','user',user.user_id,{});return {token,user:safeUser(user)};
}

async function getDashboard(user:DbUser){
  const [activities,submissions,grades,announcements,currentWeek]=await Promise.all([
    dbSelect<any>('activities',{select:'*',visible:'eq.true'}),
    dbSelect<any>('submissions',{select:'activity_id,user_id,version,submitted_at',user_id:`eq.${user.user_id}`}),
    dbSelect<any>('grades',{select:'grade_id,activity_id,user_id,published',user_id:`eq.${user.user_id}`,published:'eq.true'}),
    dbSelect<any>('announcements',{select:'*',visible:'eq.true',order:'published_at.desc',limit:4}),
    resolveWeek()
  ]);
  const doneMap=new Set(submissions.map(s=>s.activity_id));
  const assessed=activities.filter(a=>['assignment','project'].includes(String(a.type)));
  const completed=assessed.filter(a=>doneMap.has(a.activity_id)).length;
  const upcoming=activities.filter(a=>a.due_at&&new Date(a.due_at).getTime()>=Date.now()).sort((a,b)=>new Date(a.due_at).getTime()-new Date(b.due_at).getTime()).slice(0,6).map(normalizeActivity);
  return {stats:{progress:assessed.length?Math.round(completed/assessed.length*100):0,activities:assessed.length,completed,graded:grades.length},currentWeek,upcoming,announcements};
}

async function listWeeks(){
  const [weeks,mats,acts]=await Promise.all([dbSelect<any>('weeks',{select:'*',visible:'eq.true',order:'week_no.asc'}),dbAll<any>('materials',{select:'week_id,visible'}),dbAll<any>('activities',{select:'week_id,visible,activity_id,type'})]);
  return weeks.map(w=>({week_id:w.week_id,week_no:num(w.week_no),title:w.title,material_count:mats.filter(m=>m.week_id===w.week_id&&visible(m)).length,activity_count:acts.filter(a=>a.week_id===w.week_id&&visible(a)).length}));
}

async function getWeek(payload:any){
  let week:any=null;if(payload.week_id)week=await one('weeks',{week_id:`eq.${payload.week_id}`});else week=await one('weeks',{week_no:`eq.${num(payload.week_no)}`});if(!week)throw new Error('Pertemuan tidak ditemukan.');
  const [materials,activities]=await Promise.all([dbSelect<any>('materials',{select:'*',week_id:`eq.${week.week_id}`,visible:'eq.true',order:'order_no.asc'}),dbSelect<any>('activities',{select:'*',week_id:`eq.${week.week_id}`,visible:'eq.true',order:'type.asc'})]);
  return {week,materials,activities:activities.map(normalizeActivity)};
}

async function listDiscussions(){
  const acts=await dbSelect<any>('activities',{select:'*',type:'eq.discussion',visible:'eq.true',order:'week_id.asc'});const discs=await dbAll<any>('discussions',{select:'*'});const posts=await dbAll<any>('posts',{select:'discussion_id,status'});
  const dm=Object.fromEntries(discs.map(d=>[d.activity_id,d]));return acts.map(a=>{const d=dm[a.activity_id];if(!d)return null;return {discussion_id:d.discussion_id,activity_id:a.activity_id,week_id:a.week_id,title:a.title,prompt_html:d.prompt_html,max_score:100,post_count:posts.filter(p=>p.discussion_id===d.discussion_id&&String(p.status||'active')!=='deleted').length}}).filter(Boolean);
}

async function getDiscussion(payload:any){
  const activity=await activityById(String(payload.activity_id||''));if(!activity||activity.type!=='discussion')throw new Error('Diskusi tidak ditemukan.');const discussion=await one('discussions',{activity_id:`eq.${activity.activity_id}`});if(!discussion)throw new Error('Konfigurasi diskusi tidak ditemukan.');
  const posts=await dbSelect<any>('posts',{select:'*',discussion_id:`eq.${discussion.discussion_id}`,order:'created_at.asc'});const umap=await allUsersMap();return {discussion,activity:normalizeActivity(activity),posts:posts.filter(p=>String(p.status||'active')!=='deleted').map(p=>({...p,author:publicUser(umap[p.user_id])}))};
}

async function createPost(user:DbUser,payload:any){const d=await one('discussions',{discussion_id:`eq.${String(payload.discussion_id||'')}`});if(!d)throw new Error('Diskusi tidak ditemukan.');const content=sanitizeHtml(payload.content_html);if(!stripHtml(content))throw new Error('Isi respons kosong.');const row={post_id:id('POST'),discussion_id:d.discussion_id,user_id:user.user_id,parent_post_id:String(payload.parent_post_id||''),content_html:content,created_at:now(),updated_at:now(),status:'active'};await dbInsert('posts',row);await logAction(user.user_id,'CREATE_POST','discussion',d.discussion_id,{});return row;}

async function listTasks(user:DbUser){const [acts,subs]=await Promise.all([dbSelect<any>('activities',{select:'*',visible:'eq.true',order:'week_id.asc'}),dbSelect<any>('submissions',{select:'activity_id',user_id:`eq.${user.user_id}`})]);const smap=new Set(subs.map(s=>s.activity_id));return acts.filter(a=>['assignment','project'].includes(String(a.type))).map(a=>({activity_id:a.activity_id,week_id:a.week_id,type:a.type,title:a.title,max_score:100,due_at:a.due_at,project_code:a.project_code,submitted:smap.has(a.activity_id),status:''}));}

async function getTask(user:DbUser,payload:any){
  const activityId=String(payload.activity_id||'');const activity=await activityById(activityId);if(!activity)throw new Error('Aktivitas tidak ditemukan.');const [sub,grade]=await Promise.all([latestSubmission(activityId,user.user_id),latestGrade(activityId,user.user_id,true)]);if(sub)sub.articles=await getArticles(sub.submission_id);return {activity:normalizeActivity(activity),latest:sub,grade:normalizeGrade(grade)};
}

function normalizeArticlePayload(rows:any[]){
  return (Array.isArray(rows)?rows:[]).map((x,i)=>({slot_no:num(x.slot_no,i+1),url:String(x.url||'').trim(),file_name:String(x.file_name||'').trim(),file_url:String(x.file_url||'').trim(),mime_type:String(x.mime_type||'')})).sort((a,b)=>a.slot_no-b.slot_no);
}

async function submitWork(user:DbUser,payload:any){
  const activityId=String(payload.activity_id||'');const a=await activityById(activityId);if(!a)throw new Error('Aktivitas tidak ditemukan.');if(['quiz','discussion','project'].includes(String(a.type)))throw new Error('Gunakan alur aktivitas yang sesuai.');
  const existing=await dbSelect<any>('submissions',{select:'version',activity_id:`eq.${activityId}`,user_id:`eq.${user.user_id}`});const version=existing.reduce((m,s)=>Math.max(m,num(s.version)),0)+1;const articles=normalizeArticlePayload(payload.articles||[]);
  if(activityId==='TASK1_ISSUE'){
    if(articles.length!==5||articles.some(x=>!isHttpUrl(x.url)&&!isHttpUrl(x.file_url)))throw new Error('Tugas 1 wajib memiliki 5 sumber artikel. Setiap artikel harus memiliki link atau dokumen PDF yang berhasil diunggah.');
  }
  const row={submission_id:id('SUB'),activity_id:activityId,user_id:user.user_id,group_id:'',version,content_html:sanitizeHtml(payload.content_html),link_url:String(payload.link_url||'').trim(),file_name:String(payload.file_name||''),file_url:String(payload.file_url||''),status:'submitted',submitted_at:now(),updated_at:now()};
  if(!stripHtml(row.content_html)&&!row.link_url&&!row.file_url)throw new Error('Isi tugas kosong.');await dbInsert('submissions',row);
  if(articles.length){await dbInsert('submission_articles',articles.map(x=>({article_id:id('ART'),submission_id:row.submission_id,slot_no:x.slot_no,url:x.url,file_name:x.file_name,file_url:x.file_url,mime_type:x.mime_type,created_at:now()})));}
  await logAction(user.user_id,'SUBMIT_WORK','activity',activityId,{version,article_count:articles.length});return {...row,articles};
}

async function listGrades(user:DbUser){const acts=Object.fromEntries((await dbAll<any>('activities',{select:'activity_id,title'})).map(a=>[a.activity_id,a]));const rows=await dbSelect<any>('grades',{select:'*',user_id:`eq.${user.user_id}`,published:'eq.true',order:'graded_at.desc'});return rows.map(g=>({...normalizeGrade(g),activity_title:acts[g.activity_id]?.title||g.activity_id}));}

async function listPublicProjects(){
  const acts=await dbSelect<any>('activities',{select:'activity_id,title,week_id',activity_id:`in.(${PUBLIC_TASK_IDS.join(',')})`});const amap=Object.fromEntries(acts.map(a=>[a.activity_id,a]));const subs=await dbSelect<any>('submissions',{select:'submission_id,activity_id,user_id,version,submitted_at,status',activity_id:`in.(${PUBLIC_TASK_IDS.join(',')})`,status:'eq.submitted',order:'submitted_at.desc'});const latestMap=new Map<string,any>();for(const s of subs){const k=`${s.activity_id}|${s.user_id}`;const old=latestMap.get(k);if(!old||num(s.version)>num(old.version))latestMap.set(k,s)}const umap=await allUsersMap();const articleRows=await dbAll<any>('submission_articles',{select:'submission_id'});const count:Record<string,number>={};articleRows.forEach(a=>count[a.submission_id]=(count[a.submission_id]||0)+1);return Array.from(latestMap.values()).map(s=>({...s,activity_title:amap[s.activity_id]?.title||s.activity_id,week_id:amap[s.activity_id]?.week_id||'',author:projectAuthor(umap[s.user_id]),article_count:count[s.submission_id]||0})).sort((a,b)=>new Date(b.submitted_at).getTime()-new Date(a.submitted_at).getTime());
}

async function getPublicProject(payload:any){const submissionId=String(payload.submission_id||'');const sub=await one('submissions',{submission_id:`eq.${submissionId}`});if(!sub||!PUBLIC_TASK_IDS.includes(String(sub.activity_id))||String(sub.status)!=='submitted')throw new Error('Proyek tidak ditemukan.');const [activity,user,articles]=await Promise.all([activityById(sub.activity_id),one('users',{user_id:`eq.${sub.user_id}`}),getArticles(submissionId)]);return {submission:{...sub,articles},activity:activity?normalizeActivity(activity):null,author:projectAuthor(user)};}

async function adminListMaterials(){return dbSelect<any>('materials',{select:'*',order:'material_no.asc,order_no.asc'});}
async function adminSaveMaterial(admin:DbUser,payload:any){const m={...(payload.material||{})};if(!m.material_id)throw new Error('material_id wajib.');m.content_html=sanitizeHtml(m.content_html);m.updated_at=now();const saved=(await dbUpsert<any>('materials',m,'material_id'))[0]||m;await logAction(admin.user_id,'SAVE_MATERIAL','material',m.material_id,{});return {material:saved};}
async function adminListActivities(){return (await dbSelect<any>('activities',{select:'*',order:'week_id.asc'})).filter(a=>!['discussion','quiz'].includes(String(a.type))).map(normalizeActivity);}
async function adminSaveActivity(admin:DbUser,payload:any){const a=payload.activity||{};const aid=String(a.activity_id||id('ACT'));const old=await one('activities',{activity_id:`eq.${aid}`});const row={activity_id:aid,week_id:String(a.week_id||'W01'),type:String(a.type||'assignment'),title:String(a.title||''),description_html:sanitizeHtml(a.description_html),mode:String(a.mode||'individual'),max_score:100,due_at:a.due_at||null,visible:a.visible!==false,allow_comments:a.allow_comments!==false,project_code:String(a.project_code||''),created_at:old?.created_at||now(),updated_at:now()};const saved=(await dbUpsert<any>('activities',row,'activity_id'))[0]||row;await logAction(admin.user_id,'SAVE_ACTIVITY','activity',aid,{});return {activity:saved};}

async function adminListDiscussions(){const [acts,discs]=await Promise.all([dbAll<any>('activities',{select:'*'}),dbAll<any>('discussions',{select:'*'})]);const amap=Object.fromEntries(acts.map(a=>[a.activity_id,a]));return discs.map(d=>{const a=amap[d.activity_id];if(!a)return null;return {discussion_id:d.discussion_id,activity_id:d.activity_id,week_id:a.week_id,title:a.title,prompt_html:d.prompt_html,max_score:100,min_posts:num(d.min_posts,1),due_at:a.due_at||'',visible:visible(a)}}).filter(Boolean).sort((a:any,b:any)=>String(a.week_id).localeCompare(String(b.week_id)));}
async function adminSaveDiscussion(admin:DbUser,payload:any){const d=payload.discussion||{};const aid=String(d.activity_id||id('DISC_ACT')),did=String(d.discussion_id||id('DISC')),ts=now();const old=await one('activities',{activity_id:`eq.${aid}`});await dbUpsert('activities',{activity_id:aid,week_id:String(d.week_id||'W01'),type:'discussion',title:String(d.title||'Diskusi'),description_html:'',mode:'individual',max_score:100,due_at:d.due_at||null,visible:d.visible!==false,allow_comments:true,project_code:'',created_at:old?.created_at||ts,updated_at:ts},'activity_id');await dbUpsert('discussions',{discussion_id:did,activity_id:aid,prompt_html:sanitizeHtml(d.prompt_html),min_posts:num(d.min_posts,1),grading_mode:'manual',updated_at:ts},'discussion_id');await logAction(admin.user_id,'SAVE_DISCUSSION','discussion',did,{});return {discussion:{discussion_id:did,activity_id:aid,week_id:d.week_id,title:d.title,prompt_html:d.prompt_html,max_score:100,min_posts:num(d.min_posts,1),due_at:d.due_at||'',visible:d.visible!==false}};}

async function adminListUsers(){return (await dbSelect<any>('users',{select:'user_id,nim,name,email,role,class_name,active,created_at,updated_at',order:'name.asc'})).map(u=>({...safeUser(u),active:u.active!==false}));}
async function adminSaveUser(admin:DbUser,payload:any){const u=payload.user||{};const uid=String(u.user_id||id('USR')),existing=u.user_id?await one('users',{user_id:`eq.${u.user_id}`}):null;let temporary='';let pin_salt=existing?.pin_salt||'',pin_hash=existing?.pin_hash||'';if(!existing){temporary=String(u.initial_pin||'').trim()||String(Math.floor(100000+Math.random()*900000));if(temporary.length<6)throw new Error('PIN awal minimal 6 karakter.');const h=makePinHash(temporary);pin_salt=h.salt;pin_hash=h.hash;}const ts=now();const row={user_id:uid,nim:String(u.nim||'').trim(),name:String(u.name||'').trim(),email:String(u.email||'').trim(),role:String(u.role||'mahasiswa'),class_name:String(u.class_name||''),pin_salt,pin_hash,active:u.active!==false,created_at:existing?.created_at||ts,updated_at:ts};if(!row.nim||!row.name)throw new Error('NIM/ID dan nama wajib.');const saved=(await dbUpsert<any>('users',row,'user_id'))[0]||row;await logAction(admin.user_id,'SAVE_USER','user',uid,{});return {user:safeUser(saved),temporary_pin:temporary};}
async function adminResetPin(admin:DbUser,payload:any){const u=await one('users',{user_id:`eq.${String(payload.user_id||'')}`});if(!u)throw new Error('Pengguna tidak ditemukan.');let pin=String(payload.pin||'').trim()||String(Math.floor(100000+Math.random()*900000));if(pin.length<6)throw new Error('PIN minimal 6 karakter.');const h=makePinHash(pin);await dbUpdate('users',{pin_salt:h.salt,pin_hash:h.hash,updated_at:now()},{user_id:`eq.${u.user_id}`});await logAction(admin.user_id,'RESET_PIN','user',u.user_id,{});return {pin};}
async function adminImportUsers(admin:DbUser,payload:any){const input=Array.isArray(payload.rows)?payload.rows:[];if(input.length>150)throw new Error('Maksimal 150 user per batch.');const mode=String(payload.duplicate_mode||'skip').toLowerCase();const existing=await dbAll<any>('users',{select:'*'});const byNim=new Map(existing.map(u=>[String(u.nim||'').trim().toLowerCase(),u]));const byEmail=new Map(existing.filter(u=>u.email).map(u=>[String(u.email).trim().toLowerCase(),u]));const report={inserted:0,updated:0,skipped:0,errors:[] as string[],generatedPins:[] as any[]};for(let i=0;i<input.length;i++){try{const r=input[i]||{},nim=String(r.nim||'').trim(),name=String(r.name||'').trim(),email=String(r.email||'').trim();if(!nim||!name)throw new Error('NIM dan nama wajib.');const old=byNim.get(nim.toLowerCase())||(email?byEmail.get(email.toLowerCase()):null);if(old&&mode!=='update'){report.skipped++;continue}let pin_salt=old?.pin_salt||'',pin_hash=old?.pin_hash||'',pin=String(r.initial_pin||'').trim();if(!old){if(!pin)pin=String(Math.floor(100000+Math.random()*900000));if(pin.length<6)throw new Error('initial_pin minimal 6 karakter.');const h=makePinHash(pin);pin_salt=h.salt;pin_hash=h.hash;report.generatedPins.push({nim,name,pin});}else if(pin){if(pin.length<6)throw new Error('initial_pin minimal 6 karakter.');const h=makePinHash(pin);pin_salt=h.salt;pin_hash=h.hash;}const row={user_id:old?.user_id||id('USR'),nim,name,email,role:'mahasiswa',class_name:String(r.class_name||''),pin_salt,pin_hash,active:bool(r.active,true),created_at:old?.created_at||now(),updated_at:now()};await dbUpsert('users',row,'user_id');if(old)report.updated++;else report.inserted++;}catch(e){report.errors.push(`Baris ${i+2}: ${e instanceof Error?e.message:String(e)}`)}}await logAction(admin.user_id,'IMPORT_USERS_XLSX','system','',report);return report;}

async function adminListAnnouncements(){return dbSelect<any>('announcements',{select:'*',order:'published_at.desc,updated_at.desc'});}
async function adminSaveAnnouncement(admin:DbUser,payload:any){const a=payload.announcement||{},aid=String(a.announcement_id||id('ANN')),row={announcement_id:aid,title:String(a.title||''),content_html:sanitizeHtml(a.content_html),published_at:a.published_at||now(),visible:a.visible!==false,created_by:admin.user_id,updated_at:now()};const saved=(await dbUpsert<any>('announcements',row,'announcement_id'))[0]||row;await logAction(admin.user_id,'SAVE_ANNOUNCEMENT','announcement',aid,{});return {announcement:saved};}

async function adminGradebookActivities(){return (await dbSelect<any>('activities',{select:'activity_id,title,type,max_score,week_id,visible',visible:'eq.true',order:'week_id.asc'})).map(a=>({...a,max_score:100}));}
async function adminActivityRoster(payload:any){const aid=String(payload.activity_id||''),a=await activityById(aid);if(!a)throw new Error('Aktivitas tidak ditemukan.');const [users,grades,subs]=await Promise.all([dbSelect<any>('users',{select:'user_id,nim,name,email,role,class_name,active',role:'eq.mahasiswa',active:'eq.true',order:'name.asc'}),dbSelect<any>('grades',{select:'*',activity_id:`eq.${aid}`}),dbSelect<any>('submissions',{select:'submission_id,activity_id,user_id,group_id,version,link_url,file_name,file_url,status,submitted_at,updated_at',activity_id:`eq.${aid}`})]);const gmap:Record<string,any>={},smap:Record<string,any>={};grades.forEach(g=>{const old=gmap[g.user_id];if(!old||new Date(g.graded_at||g.updated_at||0).getTime()>=new Date(old.graded_at||old.updated_at||0).getTime())gmap[g.user_id]=g});subs.forEach(s=>{if(s.group_id)return;const old=smap[s.user_id];if(!old||num(s.version)>num(old.version))smap[s.user_id]=s});let postCount:Record<string,number>={};if(a.type==='discussion'){const d=await one('discussions',{activity_id:`eq.${aid}`});if(d){const posts=await dbSelect<any>('posts',{select:'user_id,status',discussion_id:`eq.${d.discussion_id}`});posts.filter(p=>String(p.status||'active')!=='deleted').forEach(p=>postCount[p.user_id]=(postCount[p.user_id]||0)+1)}}return users.map(u=>({user:safeUser(u),grade:gmap[u.user_id]?normalizeGrade(gmap[u.user_id]):null,submission:smap[u.user_id]||null,post_count:a.type==='discussion'?(postCount[u.user_id]||0):undefined}));}
async function adminStudentAssessment(payload:any){const aid=String(payload.activity_id||''),uid=String(payload.user_id||'');if(!aid||!uid)throw new Error('activity_id dan user_id wajib.');const [a,u]=await Promise.all([activityById(aid),one('users',{user_id:`eq.${uid}`})]);if(!a||!u)throw new Error('Aktivitas/mahasiswa tidak ditemukan.');const [sub,grade,rubric]=await Promise.all([latestSubmission(aid,uid),latestGrade(aid,uid,false),one('rubrics',{activity_id:`eq.${aid}`})]);if(sub)sub.articles=await getArticles(sub.submission_id);let rubricData:any=null,evaluation:any=null;if(rubric){let parsed:any={criteria:[],note:'',source_weight_total:0};try{parsed=typeof rubric.criteria_json==='string'?JSON.parse(rubric.criteria_json):rubric.criteria_json}catch{}rubricData={rubric_id:rubric.rubric_id,activity_id:rubric.activity_id,name:rubric.name,criteria:parsed.criteria||[],note:parsed.note||'',source_weight_total:num(parsed.source_weight_total)};const ev=latest(await dbSelect<any>('rubric_scores',{select:'*',rubric_id:`eq.${rubric.rubric_id}`,user_id:`eq.${uid}`,order:'graded_at.desc'}),'graded_at');if(ev){let scores={};try{scores=typeof ev.scores_json==='string'?JSON.parse(ev.scores_json):ev.scores_json||{}}catch{}evaluation={rubric_score_id:ev.rubric_score_id,scores,total_score:num(ev.total_score),graded_at:ev.graded_at}}}return {row:{user:safeUser(u),grade:normalizeGrade(grade),submission:sub},rubric:rubricData,evaluation};}
async function adminSaveGrade(admin:DbUser,payload:any){const aid=String(payload.activity_id||''),uid=String(payload.user_id||''),a=await activityById(aid);if(!a)throw new Error('Aktivitas tidak ditemukan.');const score=num(payload.score,-1);if(score<0||score>100)throw new Error('Nilai harus berada pada rentang 0–100.');const old=await latestGrade(aid,uid,false),gid=old?.grade_id||id('GRD'),row={grade_id:gid,activity_id:aid,user_id:uid,submission_id:String(payload.submission_id||''),score,max_score:100,feedback_html:sanitizeHtml(payload.feedback_html),published:payload.published!==false,graded_by:admin.user_id,graded_at:now(),updated_at:now()};const saved=(await dbUpsert<any>('grades',row,'grade_id'))[0]||row;await logAction(admin.user_id,'SAVE_GRADE','activity',aid,{user_id:uid,score});return normalizeGrade(saved);}
async function adminSaveRubricEvaluation(admin:DbUser,payload:any){const aid=String(payload.activity_id||''),uid=String(payload.user_id||''),rubric=await one('rubrics',{activity_id:`eq.${aid}`});if(!rubric)throw new Error('Rubrik tidak tersedia untuk aktivitas ini.');let parsed:any={criteria:[]};try{parsed=typeof rubric.criteria_json==='string'?JSON.parse(rubric.criteria_json):rubric.criteria_json}catch{}const criteria=parsed.criteria||[],scores=payload.scores||{};let totalWeight=0,weighted=0;for(const c of criteria){const w=num(c.weight),s=num(scores[c.id]);if(s<1||s>4)throw new Error('Semua kriteria rubrik harus diberi skor 1–4.');totalWeight+=w;weighted+=(s/4)*w}if(!criteria.length||!totalWeight)throw new Error('Rubrik tidak valid.');const total=Math.round(weighted/totalWeight*10000)/100;const old=latest(await dbSelect<any>('rubric_scores',{select:'*',rubric_id:`eq.${rubric.rubric_id}`,user_id:`eq.${uid}`}), 'graded_at');const rs={rubric_score_id:old?.rubric_score_id||id('RSC'),rubric_id:rubric.rubric_id,user_id:uid,submission_id:String(payload.submission_id||''),scores_json:JSON.stringify(scores),total_score:total,graded_by:admin.user_id,graded_at:now()};await dbUpsert('rubric_scores',rs,'rubric_score_id');const grade=await adminSaveGrade(admin,{activity_id:aid,user_id:uid,submission_id:payload.submission_id,score:total,feedback_html:payload.feedback_html,published:payload.published});return {rubric_score:rs,grade,total_score:total};}
async function adminImportGrades(admin:DbUser,payload:any){const rows=Array.isArray(payload.rows)?payload.rows:[];if(!rows.length)throw new Error('Tidak ada baris penilaian untuk diimport.');if(rows.length>25)throw new Error('Maksimal 25 baris per batch.');const report={processed:0,grade_records:0,feedback_records:0,group_rows:0,errors:[] as string[]};for(let i=0;i<rows.length;i++){try{const r=rows[i],hasScore=!(r.score===null||r.score===undefined||String(r.score).trim()===''),old=await latestGrade(String(r.activity_id||''),String(r.user_id||''),false);if(!hasScore&&!String(r.feedback||'').trim())throw new Error('nilai dan feedback sama-sama kosong');if(!hasScore&&!old)throw new Error('feedback tanpa nilai memerlukan nilai sebelumnya');const score=hasScore?num(r.score,-1):num(old.score);if(score<0||score>100)throw new Error('nilai harus 0–100');await adminSaveGrade(admin,{activity_id:r.activity_id,user_id:r.user_id,submission_id:r.submission_id||old?.submission_id||'',score,feedback_html:String(r.feedback||old?.feedback_html||''),published:true});report.processed++;report.grade_records++;if(String(r.feedback||'').trim())report.feedback_records++;}catch(e){report.errors.push(`Baris ${i+2}: ${e instanceof Error?e.message:String(e)}`)}}return report;}

async function adminExportWorkbook(){
  const XLSX=await import('xlsx');const wb=XLSX.utils.book_new();
  for(const table of TABLES){
    let rows=await dbAll<any>(table,{select:'*'});
    if(table==='users')rows=rows.map(r=>({...r,pin_salt:'',pin_hash:'',initial_pin:''}));
    rows=rows.map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,v!==null&&typeof v==='object'?JSON.stringify(v):v])));
    const ws=XLSX.utils.json_to_sheet(rows.length?rows:[{}]);XLSX.utils.book_append_sheet(wb,ws,table.toUpperCase().slice(0,31));
  }
  const readme=XLSX.utils.aoa_to_sheet([['METOPEN PFIS — Backup Supabase'],['Ekspor ini dibuat dari database Supabase.'],['Kolom JSON diekspor sebagai teks JSON agar dapat direstore.'],['Untuk USERS, hash/salt PIN sengaja dikosongkan; isi initial_pin jika melakukan restore ke instalasi baru.']]);XLSX.utils.book_append_sheet(wb,readme,'README');
  const bytes=XLSX.write(wb,{type:'array',bookType:'xlsx'}) as ArrayBuffer;const buf=Buffer.from(bytes);
  return {file_name:`METOPEN_PFIS_Supabase_${new Date().toISOString().slice(0,10)}.xlsx`,mime_type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',base64:buf.toString('base64')};
}
async function adminImportWorkbook(admin:DbUser,payload:any){
  const sheets=payload.sheets||{},report={inserted:0,updated:0,skipped:0,errors:[] as string[],generatedPins:[] as any[]};
  for(const [sheetName,incoming] of Object.entries(sheets) as [string,any[]][]){
    const table=SHEET_TO_TABLE[String(sheetName).toUpperCase()];if(!table||!Array.isArray(incoming))continue;const pk=PK[table];
    for(let i=0;i<incoming.length;i++){
      try{
        const raw={...(incoming[i]||{})};if(!raw[pk]){report.skipped++;continue}const old=await one(table,{[pk]:`eq.${raw[pk]}`});
        Object.keys(raw).forEach(k=>{
          if(/_html$/.test(k))raw[k]=sanitizeHtml(raw[k]);
          if(raw[k]==='')raw[k]=null;
          if(JSON_COLUMNS.has(k)&&typeof raw[k]==='string'&&String(raw[k]).trim()){try{raw[k]=JSON.parse(String(raw[k]))}catch{throw new Error(`kolom ${k} bukan JSON valid`)}}
        });
        if(table==='users'){
          const pin=String(incoming[i]?.initial_pin||'').trim();delete raw.initial_pin;delete raw.pin_hash;delete raw.pin_salt;
          if(!old){const actual=pin||String(Math.floor(100000+Math.random()*900000));if(actual.length<6)throw new Error('initial_pin minimal 6 karakter.');const h=makePinHash(actual);raw.pin_salt=h.salt;raw.pin_hash=h.hash;raw.created_at=raw.created_at||now();report.generatedPins.push({nim:String(raw.nim||''),name:String(raw.name||''),pin:actual})}
          else{raw.pin_salt=old.pin_salt;raw.pin_hash=old.pin_hash;if(pin){const h=makePinHash(pin);raw.pin_salt=h.salt;raw.pin_hash=h.hash}}
        }
        raw.updated_at=raw.updated_at||now();await dbUpsert(table,raw,pk);if(old)report.updated++;else report.inserted++;
      }catch(e){report.errors.push(`${sheetName} baris ${i+2}: ${e instanceof Error?e.message:String(e)}`)}
    }
  }
  await logAction(admin.user_id,'IMPORT_XLSX','system','',report);return report;
}

export async function GET(){try{await dbSelect('settings',{select:'key',limit:1});return NextResponse.json({ok:true,data:{status:'ok',backend:'supabase'}})}catch(e){return fail(e,500)}}

export async function POST(req:NextRequest){
  let body:ReqBody;try{body=await req.json()}catch{return fail(new Error('Payload JSON tidak valid.'),400)}
  const action=String(body.action||''),payload=body.payload||{},token=String(body.token||'');
  if(action==='login'){
    try{return ok(await doLogin(payload))}catch(e){return fail(e,401)}
  }

  let user:DbUser;
  try{user=await requireUser(token)}catch(e){return fail(e,401)}
  try{
    switch(action){
      case 'me': return ok({user:safeUser(user)});
      case 'getDashboard': return ok(await getDashboard(user));
      case 'listWeeks': return ok(await listWeeks());
      case 'getWeek': return ok(await getWeek(payload));
      case 'listDiscussions': return ok(await listDiscussions());
      case 'getDiscussion': return ok(await getDiscussion(payload));
      case 'createPost': return ok(await createPost(user,payload));
      case 'listTasks': return ok(await listTasks(user));
      case 'getTask': return ok(await getTask(user,payload));
      case 'submitWork': return ok(await submitWork(user,payload));
      case 'listGrades': return ok(await listGrades(user));
      case 'listPublicProjects': return ok(await listPublicProjects());
      case 'getPublicProject': return ok(await getPublicProject(payload));
    }
  }catch(e){return fail(e,400)}

  let admin:DbUser;
  try{admin=await requireAdmin(token)}catch(e){return fail(e,403)}
  try{
    switch(action){
      case 'adminListMaterials': return ok(await adminListMaterials());
      case 'adminSaveMaterial': return ok(await adminSaveMaterial(admin,payload));
      case 'adminListActivities': return ok(await adminListActivities());
      case 'adminSaveActivity': return ok(await adminSaveActivity(admin,payload));
      case 'adminListDiscussions': return ok(await adminListDiscussions());
      case 'adminSaveDiscussion': return ok(await adminSaveDiscussion(admin,payload));
      case 'adminListUsers': return ok(await adminListUsers());
      case 'adminSaveUser': return ok(await adminSaveUser(admin,payload));
      case 'adminResetPin': return ok(await adminResetPin(admin,payload));
      case 'adminImportUsers': return ok(await adminImportUsers(admin,payload));
      case 'adminListAnnouncements': return ok(await adminListAnnouncements());
      case 'adminSaveAnnouncement': return ok(await adminSaveAnnouncement(admin,payload));
      case 'adminGradebookActivities': return ok(await adminGradebookActivities());
      case 'adminActivityRoster': return ok(await adminActivityRoster(payload));
      case 'adminStudentAssessment': return ok(await adminStudentAssessment(payload));
      case 'adminSaveGrade': return ok(await adminSaveGrade(admin,payload));
      case 'adminSaveRubricEvaluation': return ok(await adminSaveRubricEvaluation(admin,payload));
      case 'adminImportGrades': return ok(await adminImportGrades(admin,payload));
      case 'adminExportWorkbook': return ok(await adminExportWorkbook());
      case 'adminImportWorkbook': return ok(await adminImportWorkbook(admin,payload));
      default: return fail(new Error(`Action tidak dikenal: ${action}`),404);
    }
  }catch(e){return fail(e,400)}
}
