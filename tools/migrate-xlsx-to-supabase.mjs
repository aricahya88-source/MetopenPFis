import fs from 'node:fs';
import process from 'node:process';
import * as XLSX from 'xlsx';

const file=process.argv[2];
const url=String(process.env.SUPABASE_URL||'').replace(/\/$/,'');
const key=String(process.env.SUPABASE_SERVICE_ROLE_KEY||'');
if(!file||!fs.existsSync(file)){console.error('Usage: npm run migrate:supabase -- /path/database.xlsx');process.exit(1)}
if(!url||!key){console.error('Isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY.');process.exit(1)}

const map={SETTINGS:'settings',USERS:'users',WEEKS:'weeks',MATERIALS:'materials',ACTIVITIES:'activities',DISCUSSIONS:'discussions',POSTS:'posts',COMMENTS:'comments',SUBMISSIONS:'submissions',GRADES:'grades',RUBRICS:'rubrics',RUBRIC_SCORES:'rubric_scores',QUIZZES:'quizzes',QUIZ_QUESTIONS:'quiz_questions',QUIZ_ATTEMPTS:'quiz_attempts',GROUPS:'groups',GROUP_MEMBERS:'group_members',PROJECT_PLANS:'project_plans',ANNOUNCEMENTS:'announcements',ACTIVITY_LOG:'activity_log',SUBMISSION_ARTICLES:'submission_articles'};
const pk={settings:'key',users:'user_id',weeks:'week_id',materials:'material_id',activities:'activity_id',discussions:'discussion_id',posts:'post_id',comments:'comment_id',submissions:'submission_id',submission_articles:'article_id',grades:'grade_id',rubrics:'rubric_id',rubric_scores:'rubric_score_id',quizzes:'quiz_id',quiz_questions:'question_id',quiz_attempts:'attempt_id',groups:'group_id',group_members:'membership_id',project_plans:'plan_id',announcements:'announcement_id',activity_log:'log_id'};
const order=['SETTINGS','USERS','WEEKS','MATERIALS','ACTIVITIES','DISCUSSIONS','POSTS','COMMENTS','GROUPS','GROUP_MEMBERS','SUBMISSIONS','SUBMISSION_ARTICLES','GRADES','RUBRICS','RUBRIC_SCORES','QUIZZES','QUIZ_QUESTIONS','QUIZ_ATTEMPTS','PROJECT_PLANS','ANNOUNCEMENTS','ACTIVITY_LOG'];
const boolCols=new Set(['active','visible','allow_comments','published','show_feedback','shuffle_questions']);
const intCols=new Set(['week_no','material_no','order_no','min_posts','version','attempt_limit','attempt_no','meeting_no','revision_no','slot_no']);
const numCols=new Set(['max_score','score','percentage','points','total_score']);
const jsonCols=new Set(['criteria_json','scores_json','answers_json','maharah_json','detail_json','metadata_json']);
const timeCols=new Set(['updated_at','created_at','open_at','close_at','due_at','submitted_at','graded_at','published_at','approved_at']);

function cleanRow(raw){
  const out={};
  for(const [k,v0] of Object.entries(raw)){
    if(k==='__rowNum__'||k==='initial_pin')continue;
    let v=v0;
    if(v===undefined||v===null||String(v).trim()===''){out[k]=timeCols.has(k)?null:(boolCols.has(k)?null:'');continue}
    if(boolCols.has(k)){const s=String(v).toLowerCase();v=!['false','0','no','off'].includes(s)}
    else if(intCols.has(k))v=Number.parseInt(String(v),10)||0;
    else if(numCols.has(k))v=Number(v)||0;
    else if(jsonCols.has(k)){try{v=typeof v==='string'?JSON.parse(v):v}catch{v={}}}
    else if(timeCols.has(k)){const d=new Date(v);v=Number.isNaN(d.getTime())?null:d.toISOString()}
    else v=String(v);
    out[k]=v;
  }
  return out;
}
async function upsert(table,rows){
  if(!rows.length)return;
  const endpoint=new URL(`${url}/rest/v1/${table}`);endpoint.searchParams.set('on_conflict',pk[table]);
  for(let i=0;i<rows.length;i+=200){
    const batch=rows.slice(i,i+200);
    const res=await fetch(endpoint,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(batch)});
    if(!res.ok)throw new Error(`${table}: ${res.status} ${await res.text()}`);
    process.stdout.write(`  ${table}: ${Math.min(i+batch.length,rows.length)}/${rows.length}\r`);
  }
  process.stdout.write(`  ${table}: ${rows.length}/${rows.length}\n`);
}

const wb=XLSX.readFile(file,{cellDates:true});
for(const sheetName of order){
  const table=map[sheetName],sh=wb.Sheets[sheetName];if(!table||!sh)continue;
  const rows=XLSX.utils.sheet_to_json(sh,{defval:'',raw:true}).map(cleanRow).filter(r=>r[pk[table]]);
  if(table==='users'){
    const missing=rows.filter(r=>!r.pin_salt||!r.pin_hash);
    if(missing.length)console.warn(`PERINGATAN: ${missing.length} user tidak memiliki pin_salt/pin_hash. Gunakan XLSX yang diunduh langsung dari Spreadsheet lama, bukan export LMS yang mengosongkan hash PIN.`);
  }
  await upsert(table,rows);
}
console.log('Migrasi selesai. Jangan lupa isi PIN_PEPPER lama di Vercel agar PIN lama tetap valid.');
