'use client';

import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';
import GlassCard from '@/components/GlassCard';
import RichTextEditor from '@/components/RichTextEditor';
import RichHtml from '@/components/RichHtml';
import { api } from '@/lib/api';
import { rubricFor, rubricScore100, type TaskRubric } from '@/lib/taskRubrics';
import { Save, ExternalLink, Download, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle } from 'lucide-react';

type Activity = { activity_id:string; title:string; type:string; max_score:number; week_id:string };
type Roster = {
  user:{user_id:string; nim:string; name:string; class_name?:string};
  grade?:{score:number; max_score:number; feedback_html:string; published:boolean}|null;
  submission?:{submission_id:string; link_url:string; file_url:string; file_name?:string; content_html:string; submitted_at?:string; version?:number}|null;
  post_count?:number;
  discussion_excerpt?:string;
};
type EvalResponse = {
  rubric:{rubric_id:string; activity_id:string; name:string; criteria:Array<{id:string; name:string; weight:number; levels:Array<{score:number;description:string}>}>; note?:string; source_weight_total?:number}|null;
  evaluation:{scores:Record<string,number>; total_score:number}|null;
};
type ImportRow = {activity_id:string; user_id:string; submission_id:string; score:string; feedback:string; name:string; nim:string};
type ImportReport = {processed:number; grade_records:number; feedback_records?:number; comments?:number; group_rows:number; errors:string[]};
type EvidenceRow = Record<string,string>;
type StructuredEvidence = {taskId:string; fields:Record<string,string>; arrays:Record<string,EvidenceRow[]>};

type EvidenceConfig = {
  fields?: string[];
  arrays?: Array<{key:string; label:string; columns:string[]}>;
};

const FIELD_LABELS:Record<string,string> = {
  theme:'Tema/isu', level:'Jenjang/konteks', phenomenon:'Fenomena/permasalahan', problem_description:'Deskripsi masalah', root_cause:'Akar masalah', synthesis:'Sintesis pola temuan', unresolved:'Hal yang belum terselesaikan', importance:'Urgensi penelitian', proposed_topic:'Calon topik', proposed_title:'Calon judul', academic_argument:'Argumentasi akademik',
  primary_article_title:'Artikel utama', problem:'Masalah penelitian', objective:'Tujuan penelitian', approach:'Pendekatan', design:'Desain/metode', subject:'Subjek/populasi/sampel', instrument:'Instrumen', data_analysis:'Analisis data', findings:'Temuan utama', contribution:'Kontribusi', strengths:'Kelebihan', limitations:'Keterbatasan', existing_knowledge:'Yang sudah diketahui', unresolved_problem:'Yang belum terselesaikan', research_gap:'Research gap', opportunity:'Peluang penelitian', state_of_art:'State of the art', novelty:'Kebaruan/kontribusi',
  title:'Judul penelitian', research_questions:'Rumusan/pertanyaan penelitian', objectives:'Tujuan penelitian', design_reason:'Alasan desain', variables_or_focus:'Variabel/fokus', operational_definition:'Definisi operasional/fokus', hypothesis:'Hipotesis', population:'Populasi', sample:'Sampel/subjek', sample_size:'Ukuran sampel', sampling:'Teknik sampling', sampling_reason:'Alasan sampling', setting:'Setting penelitian', data_types:'Jenis data', collection_methods:'Teknik pengumpulan data', instruments_needed:'Instrumen yang diperlukan', procedure:'Prosedur/tahapan', analysis_plan:'Rencana analisis data', analysis_reason:'Alasan analisis', software:'Software',
  instrument_types:'Jenis instrumen', validity_type:'Jenis validitas', expert_validator:'Validator ahli', validity_procedure:'Prosedur validasi', validity_criteria:'Kriteria validitas', reliability_method:'Teknik reliabilitas', reliability_plan:'Rencana uji reliabilitas', reliability_criteria:'Kriteria reliabel', notes:'Catatan',
  ch1_background:'Latar belakang', ch1_identification:'Identifikasi masalah', ch1_limitation:'Batasan masalah', ch1_problem:'Rumusan masalah', ch1_objectives:'Tujuan penelitian', ch1_benefits:'Manfaat penelitian',
  ch2_theory:'Kajian teori', ch2_relevant_research:'Penelitian relevan', ch2_research_gap:'Research gap', ch2_state_of_art:'State of the art', ch2_framework:'Kerangka berpikir', ch2_hypothesis:'Hipotesis',
  ch3_approach:'Pendekatan', ch3_design:'Desain penelitian', ch3_place_time:'Tempat dan waktu', ch3_population_subject:'Populasi/subjek', ch3_sample:'Sampel', ch3_sampling:'Teknik sampling', ch3_variables_focus:'Variabel/fokus', ch3_operational_definition:'Definisi operasional', ch3_collection:'Teknik pengumpulan data', ch3_instrument:'Instrumen', ch3_validity:'Validitas', ch3_reliability:'Reliabilitas', ch3_analysis:'Teknik analisis data', ch3_procedure:'Prosedur penelitian', references:'Referensi', attachments_notes:'Catatan lampiran'
};

const CRITERION_EVIDENCE:Record<string,EvidenceConfig> = {
  T1C1:{fields:['theme','level','phenomenon','problem_description']},
  T1C2:{fields:['synthesis','root_cause','unresolved','importance']},
  T1C3:{fields:['proposed_topic','proposed_title']},
  T1C4:{fields:['academic_argument'],arrays:[{key:'articles',label:'Kajian artikel',columns:['title','year','journal','findings','relevance']}]},
  T2C1:{fields:['problem','objective','existing_knowledge','research_gap']},
  T2C2:{fields:['approach','design','subject','instrument','data_analysis','findings']},
  T2C3:{fields:['strengths','limitations','unresolved_problem']},
  T2C4:{fields:['state_of_art','novelty','opportunity','proposed_title']},
  T3C1:{fields:['research_questions','objectives']},
  T3C2:{fields:['variables_or_focus','operational_definition','hypothesis']},
  T3C3:{fields:['approach','design','design_reason','procedure']},
  T3C4:{fields:['population','sample','sample_size','sampling','sampling_reason']},
  T3C5:{fields:['analysis_plan','analysis_reason','software']},
  T4C1:{arrays:[{key:'constructs',label:'Variabel/konstruk',columns:['name','conceptual','operational','dimensions','indicators']}]},
  T4C2:{arrays:[{key:'blueprint',label:'Kisi-kisi instrumen',columns:['variable','indicator','subindicator','item_no','item_type','scale']}]},
  T4C3:{arrays:[{key:'items',label:'Butir instrumen',columns:['item_no','indicator','item_text','response_scale','theory_source']}]},
  T4C4:{fields:['validity_type','expert_validator','validity_procedure','validity_criteria','reliability_method','reliability_plan','reliability_criteria']},
  T5C1:{fields:['title']},
  T5C2:{fields:['ch1_background','ch1_identification']},
  T5C3:{fields:['ch1_problem','ch1_objectives','ch1_benefits']},
  T5C4:{fields:['ch2_theory','ch2_relevant_research','ch2_research_gap','ch2_state_of_art','ch2_framework']},
  T5C5:{fields:['ch3_approach','ch3_design','ch3_place_time','ch3_population_subject','ch3_sample','ch3_sampling','ch3_procedure']},
  T5C6:{fields:['ch3_variables_focus','ch3_operational_definition','ch3_collection','ch3_instrument','ch3_validity','ch3_reliability']},
  T5C7:{fields:['ch3_analysis']},
  T5C8:{fields:['references','attachments_notes']}
};

function strip(v:string){ return String(v||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(); }
function compact(v:string,max=900){ const s=String(v||'').trim(); return s.length>max?`${s.slice(0,max)}…`:s; }
function parseStructuredEvidence(html:string|undefined):StructuredEvidence|null{
  if(!html||typeof window==='undefined') return null;
  try{
    const doc=new DOMParser().parseFromString(html,'text/html');
    const root=doc.querySelector('[data-metopen-form="1"]');
    if(!root) return null;
    const fields:Record<string,string>={};
    root.querySelectorAll('[data-field]').forEach(el=>{const key=el.getAttribute('data-field');if(key){const value=(el.textContent||'').trim();fields[key]=value==='-'?'':value;}});
    const arrays:Record<string,EvidenceRow[]>={};
    root.querySelectorAll('[data-array-row]').forEach(rowEl=>{
      const key=rowEl.getAttribute('data-array-row');if(!key)return;
      const row:EvidenceRow={};
      rowEl.querySelectorAll('[data-key]').forEach(cell=>{const k=cell.getAttribute('data-key');if(k){const value=(cell.textContent||'').trim();row[k]=value==='-'?'':value;}});
      if(!arrays[key]) arrays[key]=[];
      arrays[key].push(row);
    });
    return {taskId:root.getAttribute('data-task-id')||'',fields,arrays};
  }catch{return null;}
}

function EvidenceForCriterion({criterionId,evidence}:{criterionId:string;evidence:StructuredEvidence|null}){
  if(!evidence) return null;
  const cfg=CRITERION_EVIDENCE[criterionId];if(!cfg)return null;
  const fields=(cfg.fields||[]).map(key=>({key,label:FIELD_LABELS[key]||key,value:evidence.fields[key]||''})).filter(x=>x.value.trim());
  const arrays=(cfg.arrays||[]).map(a=>({
    ...a,
    rows:(evidence.arrays[a.key]||[]).filter(r=>Object.values(r).some(v=>String(v||'').trim())).slice(0,8)
  })).filter(a=>a.rows.length);
  if(!fields.length&&!arrays.length)return <div className="criterion-evidence empty">Belum ada isian terstruktur yang langsung terkait dengan kriteria ini.</div>;
  return <div className="criterion-evidence"><strong className="criterion-evidence-title">Evidence mahasiswa</strong>
    {fields.map(f=><div key={f.key} className="criterion-evidence-field"><span>{f.label}</span><p>{compact(f.value)}</p></div>)}
    {arrays.map(a=><div key={a.key} className="criterion-evidence-array"><span>{a.label}</span>{a.rows.map((r,i)=><p key={i}><b>{i+1}.</b> {compact(a.columns.map(c=>r[c]).filter(Boolean).join(' • '),520)}</p>)}</div>)}
  </div>;
}

export default function Gradebook(){
  const[activities,setActivities]=useState<Activity[]>([]),[activity,setActivity]=useState(''),[rows,setRows]=useState<Roster[]>([]),[selected,setSelected]=useState<Roster|null>(null),[score,setScore]=useState(0),[feedback,setFeedback]=useState(''),[published,setPublished]=useState(true),[rubricScores,setRubricScores]=useState<Record<string,number>>({}),[msg,setMsg]=useState('');
  const[importRows,setImportRows]=useState<ImportRow[]>([]),[importName,setImportName]=useState(''),[busy,setBusy]=useState(false);
  const current=activities.find(x=>x.activity_id===activity),localRubric:TaskRubric|undefined=rubricFor(activity);
  const structuredEvidence=useMemo(()=>parseStructuredEvidence(selected?.submission?.content_html),[selected?.submission?.content_html]);
  const loadActivities=()=>api<Activity[]>('adminGradebookActivities').then(a=>{setActivities(a);setActivity(v=>v||a[0]?.activity_id||'')});
  const loadRows=()=>activity?api<Roster[]>('adminActivityRoster',{activity_id:activity}).then(setRows):Promise.resolve();
  useEffect(()=>{loadActivities().catch(e=>setMsg(e.message))},[]);
  useEffect(()=>{if(activity){setSelected(null);setImportRows([]);loadRows().catch(e=>setMsg(e.message))}},[activity]);
  const open=async(r:Roster)=>{setSelected(r);setScore(Number(r.grade?.score||0));setFeedback(r.grade?.feedback_html||'');setPublished(r.grade?.published!==false);setRubricScores({});if(rubricFor(activity)){try{const x=await api<EvalResponse>('adminGetRubricEvaluation',{activity_id:activity,user_id:r.user.user_id});setRubricScores(x.evaluation?.scores||{})}catch(e){setMsg(e instanceof Error?e.message:String(e))}}};
  const rubricTotal=useMemo(()=>localRubric?rubricScore100(localRubric,rubricScores):score,[localRubric,rubricScores,score]);
  const rubricComplete=!!localRubric&&localRubric.criteria.every(c=>Number(rubricScores[c.id])>=1&&Number(rubricScores[c.id])<=4);
  const save=async()=>{if(!selected)return;try{if(localRubric){if(!rubricComplete){setMsg('Lengkapi skor 1–4 pada seluruh kriteria rubrik.');return;}await api('adminSaveRubricEvaluation',{activity_id:activity,user_id:selected.user.user_id,submission_id:selected.submission?.submission_id||'',scores:rubricScores,feedback_html:feedback,published});setMsg(`Rubrik tersimpan. Nilai akhir ${rubricTotal}/100.`)}else{if(score<0||score>100){setMsg('Nilai harus 0–100.');return;}await api('adminSaveGrade',{activity_id:activity,user_id:selected.user.user_id,submission_id:selected.submission?.submission_id||'',score,feedback_html:feedback,published});setMsg('Nilai tersimpan.')}await loadRows()}catch(e){setMsg(e instanceof Error?e.message:String(e))}};
  const evidence=useMemo(()=>rows.filter(r=>current?.type==='discussion'?(Number(r.post_count)||0)>0:!!r.submission),[rows,current?.type]);
  const exportRows=async()=>{if(!current)return;const XLSX=await import('xlsx');const data=evidence.map(r=>({activity_id:activity,user_id:r.user.user_id,submission_id:r.submission?.submission_id||'',NIM:r.user.nim,Nama:r.user.name,Kelas:r.user.class_name||'',Aktivitas:current.title,Bukti:current.type==='discussion'?(r.discussion_excerpt||''):[strip(r.submission?.content_html||''),r.submission?.link_url||'',r.submission?.file_url||''].filter(Boolean).join(' | '),Nilai:r.grade?.score??'',Feedback:strip(r.grade?.feedback_html||'')}));const ws=XLSX.utils.json_to_sheet(data);ws['!cols']=[{hidden:true},{hidden:true},{hidden:true},{wch:15},{wch:28},{wch:14},{wch:40},{wch:70},{wch:12},{wch:70}];const guide=XLSX.utils.aoa_to_sheet([['PETUNJUK'],['Isi kolom Nilai dan/atau Feedback. Feedback tersimpan sebagai feedback penilaian, bukan komentar tugas.'],['Jangan mengubah activity_id, user_id, submission_id.'],['Untuk lima tugas utama, penilaian rubrik lebih disarankan langsung melalui Gradebook LMS.']]);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'PENILAIAN');XLSX.utils.book_append_sheet(wb,guide,'PETUNJUK');XLSX.writeFile(wb,`METOPEN_${activity}_${new Date().toISOString().slice(0,10)}.xlsx`)};
  const readImport=async(file:File|null)=>{if(!file)return;setImportName(file.name);try{const XLSX=await import('xlsx');const wb=XLSX.read(await file.arrayBuffer(),{type:'array'}),sh=wb.Sheets['PENILAIAN']||wb.Sheets[wb.SheetNames[0]],raw=XLSX.utils.sheet_to_json<Record<string,unknown>>(sh,{defval:'',raw:false});setImportRows(raw.map(r=>{const low:Record<string,unknown>={};Object.keys(r).forEach(k=>low[k.toLowerCase().trim()]=r[k]);return{activity_id:String(low.activity_id||''),user_id:String(low.user_id||''),submission_id:String(low.submission_id||''),score:String(low.nilai??low.score??''),feedback:String(low.feedback??low.feedback_dosen??low.komentar??''),name:String(low.nama??''),nim:String(low.nim??'')}}).filter(x=>x.user_id))}catch(e){setMsg(e instanceof Error?e.message:String(e))}};
  const importErrors=useMemo(()=>importRows.map((r,i)=>{const a=[] as string[];const n=r.score===''?null:Number(r.score);if(r.activity_id!==activity)a.push('activity_id tidak sesuai');if(!r.user_id)a.push('user_id kosong');if(n!==null&&(isNaN(n)||n<0||n>100))a.push('nilai harus kosong/0–100');if(n===null&&!r.feedback.trim())a.push('nilai dan feedback sama-sama kosong');return a.length?`Baris ${i+2}: ${a.join(', ')}`:''}).filter(Boolean),[importRows,activity]);
  const runImport=async()=>{if(!importRows.length||importErrors.length)return;setBusy(true);try{let report:ImportReport={processed:0,grade_records:0,feedback_records:0,group_rows:0,errors:[]};for(let i=0;i<importRows.length;i+=50){const x=await api<ImportReport>('adminImportGrades',{rows:importRows.slice(i,i+50).map(r=>({activity_id:r.activity_id,user_id:r.user_id,submission_id:r.submission_id,score:r.score===''?null:Number(r.score),feedback:r.feedback}))});report={processed:report.processed+x.processed,grade_records:report.grade_records+x.grade_records,feedback_records:(report.feedback_records||0)+(x.feedback_records||0),group_rows:report.group_rows+x.group_rows,errors:[...report.errors,...x.errors]}}setMsg(`Import selesai: ${report.processed} baris, ${report.grade_records} rekaman nilai, ${report.feedback_records||0} feedback.`);setImportRows([]);setImportName('');await loadRows()}catch(e){setMsg(e instanceof Error?e.message:String(e))}finally{setBusy(false)}};

  return <AuthGate adminOnly><AppShell title="Gradebook & Rubrik"><div className="stack">
    <GlassCard><div className="row between wrap gap"><label className="field grow"><span>Pilih aktivitas</span><select value={activity} onChange={e=>setActivity(e.target.value)}>{activities.map(a=><option key={a.activity_id} value={a.activity_id}>{a.week_id} • {a.title}</option>)}</select></label><div className="row wrap gap"><button className="button soft" onClick={exportRows}><Download/>Export Excel</button><label className="button primary"><Upload/>Import Feedback/Nilai<input className="hidden" type="file" accept=".xlsx,.xls" onChange={e=>readImport(e.target.files?.[0]||null)}/></label></div></div><p className="muted">Lima tugas utama memakai rubrik terstruktur. Jawaban mahasiswa ditampilkan bersama evidence yang relevan untuk setiap kriteria. Feedback dosen melekat pada nilai, bukan sebagai komentar tugas.</p></GlassCard>

    {importRows.length>0&&<GlassCard><div className="row between"><div><span className="eyebrow">PREVIEW IMPORT</span><h3>{importName}</h3></div><span className={importErrors.length?'badge danger':'badge success'}>{importErrors.length?<><AlertTriangle/> {importErrors.length} masalah</>:<><CheckCircle2/> Siap import</>}</span></div>{importErrors.length>0&&<div className="error-box">{importErrors.slice(0,10).map((x,i)=><div key={i}>{x}</div>)}</div>}<div className="right-actions"><button className="button primary" disabled={busy||!!importErrors.length} onClick={runImport}><FileSpreadsheet/>{busy?'Mengimpor...':`Import ${importRows.length} baris`}</button></div></GlassCard>}

    <div className="admin-split">
      <GlassCard className="admin-list"><span className="eyebrow">MAHASISWA</span><h3>{rows.length} peserta</h3><div className="scroll-list">{rows.map(r=><button key={r.user.user_id} onClick={()=>open(r)} className={selected?.user.user_id===r.user.user_id?'select-row active':'select-row'}><strong>{r.user.name}</strong><small>{r.user.nim} • {r.grade?`${r.grade.score}/100`:'Belum dinilai'}{typeof r.post_count==='number'?` • ${r.post_count} post`:''}</small></button>)}</div></GlassCard>

      <div className="stack">{selected&&<>
        {localRubric?<div className="lecturer-assessment-grid">
          <GlassCard className="assessment-evidence-panel"><div className="row between wrap gap"><div><span className="eyebrow">HASIL KERJA MAHASISWA</span><h3>{selected.user.name}</h3><p className="muted">{selected.user.nim}{selected.submission?.version?` • Submission v${selected.submission.version}`:''}{selected.submission?.submitted_at?` • ${new Date(selected.submission.submitted_at).toLocaleString('id-ID')}`:''}</p></div>{structuredEvidence&&<span className="badge success"><CheckCircle2/>Form terstruktur</span>}</div>
            {selected.submission?<><div className="assessment-full-evidence"><RichHtml html={selected.submission.content_html||''}/></div><div className="row wrap gap">{selected.submission.link_url&&<a target="_blank" rel="noreferrer" className="button soft compact" href={selected.submission.link_url}><ExternalLink/>Buka URL</a>}{selected.submission.file_url&&<a target="_blank" rel="noreferrer" className="button soft compact" href={selected.submission.file_url}><ExternalLink/>Buka File</a>}</div></>:<p className="muted">Belum ada submission.</p>}
          </GlassCard>

          <GlassCard><span className="eyebrow">RUBRIK PENILAIAN</span><h3>{localRubric.name}</h3>{localRubric.note&&<div className="source-note">{localRubric.note}</div>}<div className="rubric-table lecturer-rubric">{localRubric.criteria.map(c=><div className="rubric-score-card" key={c.id}><div className="rubric-score-head"><div><strong>{c.name}</strong><small>Bobot {c.weight}%</small></div><select value={rubricScores[c.id]||''} onChange={e=>setRubricScores({...rubricScores,[c.id]:Number(e.target.value)})}><option value="">Pilih skor</option>{[4,3,2,1].map(n=><option key={n} value={n}>{n} — {c.levels.find(l=>l.score===n)?.description}</option>)}</select></div><EvidenceForCriterion criterionId={c.id} evidence={structuredEvidence}/></div>)}</div><div className="rubric-total"><span>Nilai rubrik</span><strong>{rubricComplete?rubricTotal.toFixed(2):'—'} / 100</strong></div><label className="field"><span>Feedback dosen</span><small>Feedback ini tampil bersama nilai mahasiswa. Gunakan untuk arahan revisi atau catatan akademik utama.</small><RichTextEditor value={feedback} onChange={setFeedback} minHeight={180}/></label><label className="switch-row"><input type="checkbox" checked={published} onChange={e=>setPublished(e.target.checked)}/>Publikasikan nilai & feedback ke mahasiswa</label><div className="right-actions"><button className="button primary" onClick={save}><Save/>Simpan Rubrik & Nilai</button></div></GlassCard>
        </div>:
        <div className="stack"><GlassCard><span className="eyebrow">BUKTI BELAJAR</span><h3>{selected.user.name}</h3>{selected.submission?<><RichHtml html={selected.submission.content_html||''}/><div className="row wrap gap">{selected.submission.link_url&&<a target="_blank" rel="noreferrer" className="button soft compact" href={selected.submission.link_url}><ExternalLink/>Buka URL</a>}{selected.submission.file_url&&<a target="_blank" rel="noreferrer" className="button soft compact" href={selected.submission.file_url}><ExternalLink/>Buka File</a>}</div></>:<p className="muted">{typeof selected.post_count==='number'?`Jumlah post diskusi: ${selected.post_count}`:'Belum ada submission.'}</p>}</GlassCard><GlassCard><div className="form-grid two"><label className="field"><span>Nilai 0–100</span><input type="number" min="0" max="100" value={score} onChange={e=>setScore(Number(e.target.value))}/></label><label className="switch-row"><input type="checkbox" checked={published} onChange={e=>setPublished(e.target.checked)}/>Publikasikan</label></div><label className="field"><span>Feedback dosen</span><RichTextEditor value={feedback} onChange={setFeedback} minHeight={180}/></label><div className="right-actions"><button className="button primary" onClick={save}><Save/>Simpan Nilai</button></div></GlassCard></div>}
      </>}</div>
    </div>
    {msg&&<div className="notice selectable">{msg}</div>}
  </div></AppShell></AuthGate>;
}
