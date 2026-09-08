'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';
import GlassCard from '@/components/GlassCard';
import RichHtml from '@/components/RichHtml';
import { api, fileToBase64, getStoredUser } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { rubricFor, type RubricCriterion } from '@/lib/taskRubrics';
import { FORMAL_TASKS } from '@/lib/courseConfig';
import { ArrowLeft, Upload, ExternalLink, ClipboardCheck, Scale, RefreshCw, Download, FileText, CheckCircle2, Save, CloudOff, Clock3, Pencil, Check } from 'lucide-react';


const RichTextEditor=dynamic(()=>import('@/components/RichTextEditor'),{
  ssr:false,
  loading:()=> <div className="editor-loading">Menyiapkan editor...</div>
});

type TaskActivity={activity_id?:string;type?:string;title?:string;description_html?:string;max_score?:number;due_at?:string};
type TaskSubmission={submission_id?:string;version?:number;content_html?:string;link_url?:string;file_url?:string;file_name?:string;submitted_at?:string};
type TaskGrade={score?:number;max_score?:number;feedback_html?:string};
type TaskData={activity?:TaskActivity|null;latest?:TaskSubmission|null;grade?:TaskGrade|null};
type FormState=Record<string,string>;
type LocalDraft={taskId:string;form:FormState;link:string;savedAt:string};

const TASK_IDS=['TASK1_ISSUE','TASK2_GAP','TASK3_DESIGN','TASK4_INSTRUMENT','TASK5_PROPOSAL'] as const;

const TASK_GUIDANCE:Record<string,Record<string,string[]>>={
  TASK1_ISSUE:{
    T1C1:['Tema/konteks pembelajaran fisika','Fenomena atau masalah yang spesifik','Bukti/fakta pendukung','Alasan masalah aktual dan relevan'],
    T1C2:['Faktor penyebab','Akar masalah','Hubungan antarfaktor','Dukungan teori dan penelitian terdahulu'],
    T1C3:['Topik penelitian','Variabel/fokus penelitian','Calon judul','Alasan kesesuaian judul dengan masalah'],
    T1C4:['Argumentasi akademik mengapa masalah layak diteliti','Kajian minimal 5 artikel dengan tema yang sama','Sintesis referensi','Daftar/tautan referensi ilmiah']
  },
  TASK2_GAP:{
    T2C1:['Identitas artikel utama','Masalah penelitian','Research gap','Tujuan penelitian','Keterkaitan masalah–gap–tujuan'],
    T2C2:['Pendekatan dan desain','Subjek/populasi/sampel','Instrumen','Teknik analisis data','Analisis kesesuaian metodologi'],
    T2C3:['Kelebihan penelitian','Keterbatasan penelitian','Kritik akademik berbasis teori/metodologi','Saran perbaikan'],
    T2C4:['State of the art/posisi penelitian','Kontribusi atau novelty yang mungkin','Sintesis akademik yang runtut','Referensi ilmiah yang digunakan','Usulan judul penelitian setelah analisis']
  },
  TASK3_DESIGN:{
    T3C1:['Rumusan masalah','Tujuan penelitian','Konsistensi rumusan masalah dan tujuan'],
    T3C2:['Variabel bebas/terikat atau fokus penelitian','Definisi konseptual','Definisi operasional','Indikator/konstruk yang relevan'],
    T3C3:['Pendekatan penelitian','Jenis/desain penelitian','Alasan pemilihan desain','Kesesuaian desain dengan masalah dan tujuan'],
    T3C4:['Populasi/subjek','Sampel','Ukuran sampel','Teknik sampling','Argumentasi pemilihan sampling'],
    T3C5:['Hipotesis bila relevan','Teknik analisis data','Tahapan/uji yang direncanakan','Alasan kesesuaian analisis dengan desain dan hipotesis']
  },
  TASK4_INSTRUMENT:{
    T4C1:['Nama variabel/konstruk','Definisi konseptual dan operasional','Dimensi','Indikator','Landasan teori'],
    T4C2:['Kisi-kisi yang menghubungkan variabel/aspek–indikator–item','Nomor item','Bentuk item','Skala/respons'],
    T4C3:['Butir instrumen sesuai indikator','Kejelasan bahasa','Potensi bias','Skala/pilihan respons','Sumber teori bila relevan'],
    T4C4:['Validasi ahli','Rencana validitas empiris','Rencana reliabilitas','Teknik/koefisien yang digunakan','Kriteria keputusan']
  },
  TASK5_PROPOSAL:{
    T5C1:['Tuliskan judul final proposal dan alasan singkat ketepatannya. Proposal resmi wajib diunggah sebagai PDF.'],
    T5C2:['Ringkas latar belakang','Fenomena/data empiris','Identifikasi masalah','Urgensi penelitian','Research gap'],
    T5C3:['Rumusan masalah','Tujuan penelitian','Manfaat teoritis','Manfaat praktis'],
    T5C4:['Teori utama','Penelitian relevan','Posisi penelitian/state of the art','Referensi ilmiah mutakhir'],
    T5C5:['Pendekatan/desain','Subjek/populasi/sampel','Sampling','Prosedur/tahapan penelitian','Kesesuaian metode dengan tujuan'],
    T5C6:['Variabel/fokus dan indikator','Instrumen','Teknik pengumpulan data','Rencana validitas/reliabilitas bila relevan'],
    T5C7:['Teknik analisis data','Tahapan analisis/uji','Alasan kesesuaian dengan desain'],
    T5C8:['Sistematika BAB I–III','Konsistensi bahasa akademik','Sitasi dan daftar pustaka','Kelengkapan lampiran. Dokumen PDF menjadi sumber utama penilaian aspek ini.']
  }
};

const ARTICLE_TEMPLATE=`<p><strong>Argumentasi akademik</strong></p><p><br></p><p><strong>Matriks kajian minimal 5 artikel dengan tema yang sama</strong></p><table><thead><tr><th>No.</th><th>Penulis &amp; Tahun</th><th>Judul Artikel</th><th>Jurnal</th><th>DOI/URL</th><th>Temuan/Relevansi</th></tr></thead><tbody>${[1,2,3,4,5].map(n=>`<tr><td>${n}</td><td><br></td><td><br></td><td><br></td><td><br></td><td><br></td></tr>`).join('')}</tbody></table><p><strong>Sintesis referensi</strong></p><p><br></p>`;
const BLUEPRINT_TEMPLATE=`<p><strong>Kisi-kisi instrumen</strong></p><table><thead><tr><th>Variabel/Aspek</th><th>Indikator</th><th>Subindikator</th><th>No. Item</th><th>Bentuk Item</th><th>Skala/Respons</th></tr></thead><tbody><tr><td><br></td><td><br></td><td><br></td><td><br></td><td><br></td><td><br></td></tr><tr><td><br></td><td><br></td><td><br></td><td><br></td><td><br></td><td><br></td></tr></tbody></table><p><br></p>`;
const ITEM_TEMPLATE=`<p><strong>Butir instrumen</strong></p><table><thead><tr><th>No.</th><th>Indikator</th><th>Butir/Pertanyaan/Pernyataan</th><th>Skala/Respons</th><th>Catatan Kualitas/Sumber</th></tr></thead><tbody><tr><td>1</td><td><br></td><td><br></td><td><br></td><td><br></td></tr><tr><td>2</td><td><br></td><td><br></td><td><br></td><td><br></td></tr></tbody></table><p><br></p>`;

function emptyForm(taskId:string):FormState{
  const rubric=rubricFor(taskId); const out:FormState={};
  rubric?.criteria.forEach(c=>{out[c.id]='';});
  if(taskId==='TASK1_ISSUE') out.T1C4=ARTICLE_TEMPLATE;
  if(taskId==='TASK4_INSTRUMENT'){out.T4C2=BLUEPRINT_TEMPLATE;out.T4C3=ITEM_TEMPLATE;}
  return out;
}
function stripHtml(html:string){return String(html||'').replace(/<br\s*\/?>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/\s+/g,' ').trim();}
function safeHtml(html:string){return String(html||'').replace(/<script[\s\S]*?<\/script>/gi,'').replace(/\son\w+\s*=\s*(['"]).*?\1/gi,'').replace(/javascript:/gi,'');}
function wrapLegacy(label:string,value:string){const v=String(value||'').trim();return v?`<p><strong>${label}</strong></p><div>${v}</div>`:'';}
function readLegacyField(root:Element,key:string){const el=root.querySelector(`[data-field="${key}"]`);if(!el)return '';const html=(el as HTMLElement).innerHTML||'';const text=(el.textContent||'').trim();return html&&html!=='-'?html:(text==='-'?'':text);}
function readLegacyArray(root:Element,key:string){return Array.from(root.querySelectorAll(`[data-array-row="${key}"]`)).map(row=>Array.from(row.querySelectorAll('[data-key]')).reduce<Record<string,string>>((acc,cell)=>{const k=cell.getAttribute('data-key');if(k)acc[k]=(cell.textContent||'').trim()==='-'?'':(cell.textContent||'').trim();return acc;},{}));}
function legacyTable(rows:Record<string,string>[],cols:Array<[string,string]>){if(!rows.length)return '';return `<table><thead><tr>${cols.map(c=>`<th>${c[1]}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${r[c[0]]||''}</td>`).join('')}</tr>`).join('')}</tbody></table>`;}

function migrateLegacy(root:Element,taskId:string):FormState{
  const f=(k:string)=>readLegacyField(root,k), out=emptyForm(taskId);
  if(taskId==='TASK1_ISSUE'){
    out.T1C1=[wrapLegacy('Tema/isu',f('theme')),wrapLegacy('Jenjang/konteks',f('level')),wrapLegacy('Fenomena/permasalahan',f('phenomenon')),wrapLegacy('Deskripsi masalah',f('problem_description'))].join('');
    out.T1C2=[wrapLegacy('Sintesis temuan',f('synthesis')),wrapLegacy('Penyebab/akar masalah',f('root_cause')),wrapLegacy('Hal yang belum terselesaikan',f('unresolved')),wrapLegacy('Urgensi penelitian',f('importance'))].join('');
    out.T1C3=[wrapLegacy('Calon topik',f('proposed_topic')),wrapLegacy('Calon judul',f('proposed_title'))].join('');
    const art=readLegacyArray(root,'articles');
    out.T1C4=[wrapLegacy('Argumentasi akademik',f('academic_argument')),legacyTable(art,[['authors','Penulis'],['year','Tahun'],['title','Judul'],['journal','Jurnal'],['url','DOI/URL'],['findings','Temuan'],['relevance','Relevansi']])].join('')||ARTICLE_TEMPLATE;
  }else if(taskId==='TASK2_GAP'){
    out.T2C1=[wrapLegacy('Artikel utama',f('primary_article_title')),wrapLegacy('Masalah',f('problem')),wrapLegacy('Research gap',f('research_gap')),wrapLegacy('Tujuan',f('objective'))].join('');
    out.T2C2=[wrapLegacy('Pendekatan',f('approach')),wrapLegacy('Desain/metode',f('design')),wrapLegacy('Subjek',f('subject')),wrapLegacy('Instrumen',f('instrument')),wrapLegacy('Analisis data',f('data_analysis')),wrapLegacy('Temuan',f('findings'))].join('');
    out.T2C3=[wrapLegacy('Kelebihan',f('strengths')),wrapLegacy('Keterbatasan',f('limitations')),wrapLegacy('Yang belum terselesaikan',f('unresolved_problem'))].join('');
    out.T2C4=[wrapLegacy('State of the art',f('state_of_art')),wrapLegacy('Kontribusi/novelty',f('novelty')),wrapLegacy('Peluang penelitian',f('opportunity')),wrapLegacy('Usulan judul',f('proposed_title')),wrapLegacy('Kontribusi artikel',f('contribution'))].join('');
  }else if(taskId==='TASK3_DESIGN'){
    out.T3C1=[wrapLegacy('Rumusan masalah',f('research_questions')),wrapLegacy('Tujuan',f('objectives'))].join('');
    out.T3C2=[wrapLegacy('Variabel/fokus',f('variables_or_focus')),wrapLegacy('Definisi operasional',f('operational_definition')),wrapLegacy('Hipotesis',f('hypothesis'))].join('');
    out.T3C3=[wrapLegacy('Pendekatan',f('approach')),wrapLegacy('Desain',f('design')),wrapLegacy('Alasan desain',f('design_reason')),wrapLegacy('Prosedur',f('procedure'))].join('');
    out.T3C4=[wrapLegacy('Populasi',f('population')),wrapLegacy('Sampel',f('sample')),wrapLegacy('Ukuran sampel',f('sample_size')),wrapLegacy('Teknik sampling',f('sampling')),wrapLegacy('Alasan sampling',f('sampling_reason'))].join('');
    out.T3C5=[wrapLegacy('Rencana analisis',f('analysis_plan')),wrapLegacy('Alasan analisis',f('analysis_reason')),wrapLegacy('Software',f('software')),wrapLegacy('Hipotesis',f('hypothesis'))].join('');
  }else if(taskId==='TASK4_INSTRUMENT'){
    out.T4C1=legacyTable(readLegacyArray(root,'constructs'),[['name','Variabel/Konstruk'],['conceptual','Definisi Konseptual'],['operational','Definisi Operasional'],['dimensions','Dimensi'],['indicators','Indikator']]);
    out.T4C2=legacyTable(readLegacyArray(root,'blueprint'),[['variable','Variabel/Aspek'],['indicator','Indikator'],['subindicator','Subindikator'],['item_no','No Item'],['item_type','Bentuk'],['scale','Skala']])||BLUEPRINT_TEMPLATE;
    out.T4C3=legacyTable(readLegacyArray(root,'items'),[['item_no','No'],['indicator','Indikator'],['item_text','Butir'],['response_scale','Skala/Respons'],['theory_source','Sumber']])||ITEM_TEMPLATE;
    out.T4C4=[wrapLegacy('Jenis validitas',f('validity_type')),wrapLegacy('Validator ahli',f('expert_validator')),wrapLegacy('Prosedur validasi',f('validity_procedure')),wrapLegacy('Kriteria validitas',f('validity_criteria')),wrapLegacy('Teknik reliabilitas',f('reliability_method')),wrapLegacy('Rencana reliabilitas',f('reliability_plan')),wrapLegacy('Kriteria reliabel',f('reliability_criteria'))].join('');
  }else if(taskId==='TASK5_PROPOSAL'){
    out.T5C1=wrapLegacy('Judul penelitian',f('title'));
    out.T5C2=[wrapLegacy('Latar belakang',f('ch1_background')),wrapLegacy('Identifikasi masalah',f('ch1_identification')),wrapLegacy('Batasan masalah',f('ch1_limitation'))].join('');
    out.T5C3=[wrapLegacy('Rumusan masalah',f('ch1_problem')),wrapLegacy('Tujuan',f('ch1_objectives')),wrapLegacy('Manfaat',f('ch1_benefits'))].join('');
    out.T5C4=[wrapLegacy('Kajian teori',f('ch2_theory')),wrapLegacy('Penelitian relevan',f('ch2_relevant_research')),wrapLegacy('Research gap',f('ch2_research_gap')),wrapLegacy('State of the art',f('ch2_state_of_art')),wrapLegacy('Kerangka berpikir',f('ch2_framework'))].join('');
    out.T5C5=[wrapLegacy('Pendekatan',f('ch3_approach')),wrapLegacy('Desain',f('ch3_design')),wrapLegacy('Tempat/waktu',f('ch3_place_time')),wrapLegacy('Populasi/subjek',f('ch3_population_subject')),wrapLegacy('Sampel',f('ch3_sample')),wrapLegacy('Sampling',f('ch3_sampling')),wrapLegacy('Prosedur',f('ch3_procedure'))].join('');
    out.T5C6=[wrapLegacy('Variabel/fokus',f('ch3_variables_focus')),wrapLegacy('Definisi operasional',f('ch3_operational_definition')),wrapLegacy('Pengumpulan data',f('ch3_collection')),wrapLegacy('Instrumen',f('ch3_instrument')),wrapLegacy('Validitas',f('ch3_validity')),wrapLegacy('Reliabilitas',f('ch3_reliability'))].join('');
    out.T5C7=wrapLegacy('Teknik analisis data',f('ch3_analysis'));
    out.T5C8=[wrapLegacy('Referensi',f('references')),wrapLegacy('Catatan lampiran',f('attachments_notes'))].join('');
  }
  return out;
}

function parseForm(html:string|undefined,taskId:string):FormState|null{
  if(!html||typeof window==='undefined')return null;
  try{
    const doc=new DOMParser().parseFromString(html,'text/html');
    const v2=doc.querySelector(`[data-metopen-form="2"][data-task-id="${taskId}"]`);
    if(v2){const out=emptyForm(taskId);v2.querySelectorAll('[data-rubric-field]').forEach(el=>{const k=el.getAttribute('data-rubric-field');if(k)out[k]=(el as HTMLElement).innerHTML||'';});return out;}
    const legacy=doc.querySelector(`[data-metopen-form="1"][data-task-id="${taskId}"]`);
    return legacy?migrateLegacy(legacy,taskId):null;
  }catch{return null;}
}

function buildSubmissionHtml(taskId:string,form:FormState){
  const rubric=rubricFor(taskId); if(!rubric)return '';
  return `<section data-metopen-form="2" data-task-id="${taskId}"><p><strong>Lembar kerja berbasis rubrik METOPEN PFIS.</strong> Setiap bagian di bawah berpasangan langsung dengan satu kriteria penilaian.</p>${rubric.criteria.map(c=>`<article data-rubric-criterion="${c.id}"><h3>${c.name} — ${c.weight}%</h3><div data-rubric-field="${c.id}">${safeHtml(form[c.id]||'')}</div></article>`).join('')}</section>`;
}

function countArticleRows(html:string){
  if(typeof window==='undefined')return 0;
  const doc=new DOMParser().parseFromString(html,'text/html');
  return Array.from(doc.querySelectorAll('tbody tr')).filter(row=>{
    const cells=Array.from(row.querySelectorAll('td')).slice(1).map(c=>(c.textContent||'').trim()).filter(Boolean);
    return cells.length>=2;
  }).length;
}
function validate(taskId:string,form:FormState,file:File|null){
  const rubric=rubricFor(taskId); if(!rubric)return 'Rubrik tugas tidak ditemukan.';
  const missing=rubric.criteria.filter(c=>stripHtml(form[c.id]||'').length<8).map(c=>c.name);
  if(missing.length)return `Lengkapi bagian rubrik berikut: ${missing.join('; ')}.`;
  if(taskId==='TASK1_ISSUE'&&countArticleRows(form.T1C4||'')<5)return 'Tugas 1 wajib memuat minimal 5 artikel yang terisi pada bagian Argumentasi akademik dan referensi.';
  if(taskId==='TASK5_PROPOSAL'){
    if(!file)return 'Tugas 5 wajib dikumpulkan sebagai file PDF proposal.';
    const pdf=file.type==='application/pdf'||file.name.toLowerCase().endsWith('.pdf');
    if(!pdf)return 'File Tugas 5 harus berformat PDF.';
  }
  return '';
}

function draftKey_(taskId:string){
  const user=getStoredUser<{user_id?:string;nim?:string;email?:string}>();
  const owner=String(user?.user_id||user?.nim||user?.email||'guest').replace(/[^a-zA-Z0-9_.@-]/g,'_');
  return `metopen_task_draft_v3:${owner}:${taskId}`;
}
function readDraft_(taskId:string):LocalDraft|null{
  if(typeof window==='undefined')return null;
  try{
    const raw=localStorage.getItem(draftKey_(taskId));if(!raw)return null;
    const parsed=JSON.parse(raw) as LocalDraft;
    if(parsed?.taskId!==taskId||!parsed?.form)return null;
    return parsed;
  }catch{return null;}
}
function writeDraft_(taskId:string,form:FormState,link:string){
  if(typeof window==='undefined')return '';
  const savedAt=new Date().toISOString();
  const draft:LocalDraft={taskId,form,link,savedAt};
  localStorage.setItem(draftKey_(taskId),JSON.stringify(draft));
  return savedAt;
}
function clearDraft_(taskId:string){if(typeof window!=='undefined')localStorage.removeItem(draftKey_(taskId));}
function fallbackActivity_(taskId:string):TaskActivity{
  const task=FORMAL_TASKS.find(t=>t.code===taskId);
  if(task)return {activity_id:task.code,type:'assignment',title:task.title,description_html:`<p>${task.short}</p>`,max_score:100};
  return {activity_id:taskId,type:'assignment',title:taskId||'Tugas',description_html:'<p>Instruksi detail akan dimuat dari backend Apps Script.</p>',max_score:100};
}
function draftTime_(iso:string){
  if(!iso)return '';
  try{return new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short'}).format(new Date(iso));}catch{return iso;}
}

function RubricFormCard({criterion,value,onChange,taskId,active,onActivate,onFinish}:{criterion:RubricCriterion;value:string;onChange:(v:string)=>void;taskId:string;active:boolean;onActivate:()=>void;onFinish:()=>void}){
  const guides=TASK_GUIDANCE[taskId]?.[criterion.id]||[];
  const top=criterion.levels.find(l=>l.score===4)?.description||'';
  const filled=stripHtml(value).length>=8;
  return <GlassCard>
    <div className="row between wrap gap"><div><span className="eyebrow">ASPEK PENILAIAN • {criterion.weight}%</span><h3>{criterion.name}</h3></div><div className="row wrap gap"><span className={filled?'badge success':'badge'}>{filled?<><Check/>Terisi</>:<>Belum lengkap</>}</span><span className="badge">Skor maks. 4</span></div></div>
    <div className="source-note"><strong>Target skor 4:</strong> {top}</div>
    <div style={{margin:'12px 0'}}><strong>Isi minimal:</strong><ul style={{margin:'6px 0 0',paddingLeft:20}}>{guides.map(x=><li key={x}>{x}</li>)}</ul></div>
    {active?<>
      <RichTextEditor value={value} onChange={onChange} minHeight={criterion.id==='T1C4'||criterion.id==='T4C2'||criterion.id==='T4C3'?260:170} placeholder="Susun jawaban secara akademik, sistematis, dan sertakan bukti/referensi bila relevan."/>
      <div className="right-actions" style={{marginTop:10}}><button type="button" className="button soft compact" onClick={onFinish}><Check/>Selesai Edit</button></div>
    </>:<>
      <div className="research-evidence" style={{marginTop:12}}>
        {filled?<RichHtml html={value}/>:<p className="muted">Belum ada jawaban pada aspek ini.</p>}
      </div>
      <div className="right-actions" style={{marginTop:10}}><button type="button" className="button soft compact" onClick={onActivate}><Pencil/>{filled?'Edit Jawaban':'Mulai Mengisi'}</button></div>
    </>}
  </GlassCard>;
}

export default function TaskPage(){
  const params=useParams<{id:string|string[]}>();
  const id=useMemo(()=>Array.isArray(params?.id)?String(params.id[0]||''):String(params?.id||''),[params]);
  const rubric=useMemo(()=>id?rubricFor(id):undefined,[id]);
  const fallbackActivity=useMemo(()=>fallbackActivity_(id),[id]);
  const[data,setData]=useState<TaskData|null>(null),[form,setForm]=useState<FormState>({}),[loading,setLoading]=useState(false),[error,setError]=useState(''),[backendWarning,setBackendWarning]=useState(''),[busy,setBusy]=useState(false),[pulling,setPulling]=useState(false),[link,setLink]=useState(''),[file,setFile]=useState<File|null>(null),[draftReady,setDraftReady]=useState(false),[draftSavedAt,setDraftSavedAt]=useState(''),[dirty,setDirty]=useState(false),[activeCriterion,setActiveCriterion]=useState('');
  const hasLocalDraftRef=useRef(false);

  const load=useCallback(async(preserveLocalDraft=true)=>{
    if(!id)return;
    setLoading(true);setBackendWarning('');
    try{
      const result=await api<TaskData>('getTask',{activity_id:id});
      if(!result?.activity)throw new Error('Data tugas dari Apps Script tidak lengkap.');
      setData(result);
      if(!(preserveLocalDraft&&hasLocalDraftRef.current)){
        setForm(parseForm(result.latest?.content_html,id)||emptyForm(id));
        setLink(result.latest?.link_url||'');
      }
    }catch(e){
      const msg=e instanceof Error?e.message:String(e);
      setBackendWarning(msg);
      setData(null);
    }finally{setLoading(false);}
  },[id]);

  useEffect(()=>{
    if(!id)return;
    const local=readDraft_(id);
    hasLocalDraftRef.current=!!local;
    setForm(local?.form||emptyForm(id));
    setLink(local?.link||'');
    setDraftSavedAt(local?.savedAt||'');
    setFile(null);setError('');setBackendWarning('');setDirty(false);setActiveCriterion('');setDraftReady(true);
    void load(true);
  },[id,load]);

  const saveDraft=useCallback((silent=false)=>{
    if(!id||!draftReady)return;
    try{
      const saved=writeDraft_(id,form,link);
      hasLocalDraftRef.current=true;setDraftSavedAt(saved);setDirty(false);
      if(!silent)setError('');
    }catch{
      if(!silent)setError('Draft tidak dapat disimpan di browser. Coba kurangi isi/gambar atau kosongkan penyimpanan browser.');
    }
  },[id,draftReady,form,link]);

  useEffect(()=>{
    if(!draftReady||!dirty)return;
    const timer=window.setTimeout(()=>saveDraft(true),1500);
    return()=>window.clearTimeout(timer);
  },[draftReady,dirty,form,link,saveDraft]);

  const updateField=(key:string,value:string)=>{setForm(prev=>({...prev,[key]:value}));setDirty(true);};

  const pullPrior=async()=>{
    const idx=TASK_IDS.indexOf(id as typeof TASK_IDS[number]);if(idx<=0)return;
    setPulling(true);setError('');
    try{
      const pid=TASK_IDS[idx-1];
      const d=await api<TaskData>('getTask',{activity_id:pid});
      const priorForm=parseForm(d?.latest?.content_html,pid);
      if(!priorForm)throw new Error('Belum ada tugas sebelumnya yang dapat ditarik dari server.');
      const html=Object.entries(priorForm).filter(([,v])=>stripHtml(v).length).map(([k,v])=>`<h4>${k}</h4>${v}`).join('');
      if(!stripHtml(html))throw new Error('Tugas sebelumnya belum memiliki isi yang dapat ditarik.');
      setForm(prev=>{const next={...prev};const first=rubric?.criteria[0]?.id;if(first&&!stripHtml(next[first]||''))next[first]=`<p><strong>Ringkasan dari tugas sebelumnya</strong></p>${html}`;return next;});
      setDirty(true);
    }catch(e){setError(e instanceof Error?e.message:String(e));}finally{setPulling(false);}
  };

  const submit=async()=>{
    if(!id)return;setBusy(true);setError('');
    try{
      const message=validate(id,form,file);if(message)throw new Error(message);
      const content_html=buildSubmissionHtml(id,form);if(content_html.length>48000)throw new Error('Ringkasan form terlalu panjang. Ringkas isian; untuk Tugas 5, naskah lengkap tetap berada pada PDF.');
      let file_base64='',file_name='',file_mime='';
      if(file){if(file.size>5*1024*1024)throw new Error('Ukuran file maksimal 5 MB.');file_base64=await fileToBase64(file);file_name=file.name;file_mime=file.type||'application/octet-stream';}
      await api('submitWork',{activity_id:id,content_html,link_url:id==='TASK5_PROPOSAL'?'':link.trim(),file_base64,file_name,file_mime});
      clearDraft_(id);hasLocalDraftRef.current=false;setDraftSavedAt('');setDirty(false);setFile(null);
      await load(false);
    }catch(e){
      setError(e instanceof Error?e.message:String(e));
      try{saveDraft(true);}catch{}
    }finally{setBusy(false);}
  };

  const activity=data?.activity||fallbackActivity,latest=data?.latest,grade=data?.grade;
  return <AuthGate><AppShell title="Tugas Penelitian">
    <div className="row wrap gap" style={{marginBottom:14}}>
      <Link href="/tasks" className="button soft compact"><ArrowLeft/>Kembali</Link>
      <button type="button" className="button soft compact" onClick={()=>void load(true)} disabled={loading}><RefreshCw/>{loading?'Menghubungkan...':'Muat data server'}</button>
      <button type="button" className="button soft compact" onClick={()=>saveDraft(false)} disabled={!draftReady}><Save/>Simpan Draft</button>
      {id!=='TASK1_ISSUE'&&<button type="button" className="button soft compact" onClick={()=>void pullPrior()} disabled={pulling}><Download/>{pulling?'Menarik...':'Tarik ringkasan tugas sebelumnya'}</button>}
    </div>
    {draftSavedAt&&<div className="notice"><Clock3/><span><strong>Draft tersimpan:</strong> {draftTime_(draftSavedAt)}. Draft disimpan di browser/perangkat ini dan <strong>belum dikirim ke dosen</strong>.</span></div>}
    {loading&&<div className="notice"><RefreshCw/><span>Menghubungkan Apps Script di latar belakang. Form tetap dapat diisi dan disimpan sebagai draft.</span></div>}
    {backendWarning&&<div className="error-box"><div className="row gap"><CloudOff/><div><strong>Backend belum dapat dibaca.</strong><div>{backendWarning}</div><small>Form tetap aktif. Simpan sebagai Draft terlebih dahulu. Jika pesan menyebut respons bukan JSON, cek deployment Apps Script: Web App, Execute as Me, akses sesuai kebutuhan, dan gunakan URL yang berakhir <b>/exec</b>.</small></div></div></div>}
    {error&&<div className="error-box">{error}</div>}
    <div className="stack">
      <GlassCard><div className="row gap"><div className="icon-bubble teal"><ClipboardCheck/></div><div className="grow"><span className="eyebrow">{String(activity.type||'assignment').toUpperCase()}</span><h2>{activity.title||id}</h2></div></div><RichHtml html={activity.description_html||'<p>Instruksi belum diisi.</p>'}/><div className="row wrap gap"><span className="badge"><CheckCircle2/>Form 1:1 dengan rubrik</span><span className="badge">Total bobot 100%</span>{activity.due_at&&<span className="badge">{formatDate(activity.due_at)}</span>}</div></GlassCard>
      {rubric&&<GlassCard><div className="row gap"><div className="icon-bubble amber"><Scale/></div><div><span className="eyebrow">RUBRIK RESMI</span><h3>{rubric.name}</h3></div></div>{rubric.note&&<p className="source-note">{rubric.note}</p>}<p className="muted">Setiap aspek rubrik memiliki form WYSIWYG yang sama dengan LMS Multimedia. Untuk menjaga aplikasi tetap ringan, hanya <strong>satu editor</strong> yang dibuka pada satu waktu.</p></GlassCard>}
      {grade&&<GlassCard className="grade-highlight"><span className="eyebrow">NILAI TERBIT</span><h2>{Number(grade.score||0)} / {Number(grade.max_score||100)}</h2><RichHtml html={grade.feedback_html||'<p>Belum ada feedback tertulis.</p>'}/></GlassCard>}
      {latest&&<GlassCard><span className="eyebrow">SUBMISSION TERAKHIR • VERSI {Number(latest.version||1)}</span><RichHtml html={latest.content_html||''}/><div className="row wrap gap">{latest.link_url&&<a className="button soft compact" target="_blank" rel="noreferrer" href={latest.link_url}><ExternalLink/>Buka tautan</a>}{latest.file_url&&<a className="button soft compact" target="_blank" rel="noreferrer" href={latest.file_url}><ExternalLink/>{latest.file_name||'Buka file'}</a>}</div>{latest.submitted_at&&<small>{formatDate(latest.submitted_at)}</small>}</GlassCard>}
      <div className="section-title"><div><span className="eyebrow">FORM WYSIWYG BERBASIS RUBRIK</span><h2>{latest?'Perbaiki & Kirim Revisi':'Lengkapi Tugas'}</h2><p className="muted">Klik <b>Mulai Mengisi/Edit Jawaban</b> pada satu aspek. Editor WYSIWYG hanya dimuat saat diperlukan sehingga halaman lebih ringan. Perubahan otomatis dicadangkan sebagai draft lokal.</p></div></div>
      {rubric?.criteria.map(c=><RubricFormCard key={c.id} criterion={c} taskId={id} value={form[c.id]||''} onChange={v=>updateField(c.id,v)} active={activeCriterion===c.id} onActivate={()=>setActiveCriterion(c.id)} onFinish={()=>setActiveCriterion('')}/>)}
      <GlassCard><span className="eyebrow">PENGUMPULAN</span><h3>{id==='TASK5_PROPOSAL'?'Upload Proposal PDF':'Lampiran Pendukung'}</h3>{id==='TASK5_PROPOSAL'?<><div className="notice"><FileText/> <strong>Tugas 5 wajib dikumpulkan sebagai PDF.</strong> Form WYSIWYG di atas berfungsi sebagai ringkasan evidence per aspek rubrik; naskah proposal BAB I–BAB III yang dinilai secara penuh berasal dari PDF.</div><label className="field"><span>File proposal PDF — wajib, maks. 5 MB</span><input type="file" accept="application/pdf,.pdf" onChange={e=>setFile(e.target.files?.[0]||null)}/></label><small className="muted">File tidak disimpan di draft browser. Pilih kembali PDF ketika akan mengirim tugas.</small></>:<div className="form-grid two"><label className="field"><span>URL dokumen / Google Drive (opsional)</span><input value={link} onChange={e=>{setLink(e.target.value);setDirty(true);}} placeholder="https://..."/></label><label className="field"><span>File pendukung (opsional, maks. 5 MB)</span><input type="file" onChange={e=>setFile(e.target.files?.[0]||null)}/></label></div>}<div className="right-actions"><button type="button" className="button soft" onClick={()=>saveDraft(false)}><Save/>Simpan Draft</button><button className="button primary" disabled={busy} onClick={()=>void submit()}><Upload/>{busy?'Mengirim...':latest?'Kirim Revisi':'Kirim Tugas'}</button></div></GlassCard>
    </div>
  </AppShell></AuthGate>;
}
