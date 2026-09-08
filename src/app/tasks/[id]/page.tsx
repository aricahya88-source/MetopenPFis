'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';
import GlassCard from '@/components/GlassCard';
import RichHtml from '@/components/RichHtml';
import { api, fileToBase64 } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { rubricFor } from '@/lib/taskRubrics';
import { ArrowLeft, Upload, ExternalLink, ClipboardCheck, Scale, RefreshCw, Plus, Trash2, Download } from 'lucide-react';

type TaskActivity = {
  activity_id?: string;
  type?: string;
  title?: string;
  description_html?: string;
  max_score?: number;
  due_at?: string;
  allow_comments?: boolean;
};

type TaskSubmission = {
  submission_id?: string;
  version?: number;
  content_html?: string;
  link_url?: string;
  file_url?: string;
  file_name?: string;
  submitted_at?: string;
};

type TaskGrade = {
  score?: number;
  max_score?: number;
  feedback_html?: string;
};

type TaskData = {
  activity?: TaskActivity | null;
  latest?: TaskSubmission | null;
  grade?: TaskGrade | null;
};

type FormRow = Record<string, string>;
type FormState = Record<string, string | FormRow[]>;
type PriorForms = Record<string, FormState | null>;

const TASK_IDS = ['TASK1_ISSUE', 'TASK2_GAP', 'TASK3_DESIGN', 'TASK4_INSTRUMENT', 'TASK5_PROPOSAL'] as const;

const blankArticle = (): FormRow => ({
  title: '', authors: '', year: '', journal: '', url: '', focus: '', method: '', findings: '', relevance: ''
});
const blankConstruct = (): FormRow => ({ name: '', conceptual: '', operational: '', dimensions: '', indicators: '' });
const blankBlueprint = (): FormRow => ({ variable: '', indicator: '', subindicator: '', item_no: '', item_type: '', scale: '' });
const blankItem = (): FormRow => ({ item_no: '', indicator: '', item_text: '', response_scale: '', theory_source: '' });

function emptyForm(activityId: string): FormState {
  if (activityId === 'TASK1_ISSUE') {
    return {
      theme: '', level: '', phenomenon: '', problem_description: '', root_cause: '', synthesis: '', unresolved: '', importance: '',
      proposed_topic: '', proposed_title: '', academic_argument: '',
      articles: [blankArticle(), blankArticle(), blankArticle(), blankArticle(), blankArticle()]
    };
  }
  if (activityId === 'TASK2_GAP') {
    return {
      primary_article_title: '', authors: '', year: '', journal: '', url: '', problem: '', objective: '', approach: '', design: '', subject: '', instrument: '',
      data_analysis: '', findings: '', contribution: '', strengths: '', limitations: '', existing_knowledge: '', unresolved_problem: '', research_gap: '', opportunity: '',
      state_of_art: '', novelty: '', proposed_title: ''
    };
  }
  if (activityId === 'TASK3_DESIGN') {
    return {
      title: '', research_gap: '', state_of_art: '', research_questions: '', objectives: '', approach: '', design: '', design_reason: '', variables_or_focus: '',
      operational_definition: '', hypothesis: '', population: '', sample: '', sample_size: '', sampling: '', sampling_reason: '', setting: '', data_types: '',
      collection_methods: '', instruments_needed: '', procedure: '', analysis_plan: '', analysis_reason: '', software: ''
    };
  }
  if (activityId === 'TASK4_INSTRUMENT') {
    return {
      title: '', approach: '', design: '', instrument_types: '', validity_type: '', expert_validator: '', validity_procedure: '', validity_criteria: '',
      reliability_method: '', reliability_plan: '', reliability_criteria: '', notes: '',
      constructs: [blankConstruct()], blueprint: [blankBlueprint()], items: [blankItem()]
    };
  }
  return {
    title: '',
    ch1_background: '', ch1_identification: '', ch1_limitation: '', ch1_problem: '', ch1_objectives: '', ch1_benefits: '',
    ch2_theory: '', ch2_relevant_research: '', ch2_research_gap: '', ch2_state_of_art: '', ch2_framework: '', ch2_hypothesis: '',
    ch3_approach: '', ch3_design: '', ch3_place_time: '', ch3_population_subject: '', ch3_sample: '', ch3_sampling: '', ch3_variables_focus: '',
    ch3_operational_definition: '', ch3_collection: '', ch3_instrument: '', ch3_validity: '', ch3_reliability: '', ch3_analysis: '', ch3_procedure: '',
    references: '', attachments_notes: ''
  };
}

function scalar(form: FormState, key: string): string {
  const value = form[key];
  return typeof value === 'string' ? value : '';
}
function rows(form: FormState, key: string): FormRow[] {
  const value = form[key];
  return Array.isArray(value) ? value : [];
}
function escapeHtml(value: string) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function h(value: string) {
  return escapeHtml(value || '-');
}
function block(label: string, key: string, value: string) {
  return `<div style="margin:0 0 14px"><strong>${escapeHtml(label)}</strong><pre data-field="${escapeHtml(key)}" style="white-space:pre-wrap;font-family:inherit;margin:5px 0 0">${h(value)}</pre></div>`;
}
function tableHtml(title: string, arrayName: string, columns: Array<{ key: string; label: string }>, data: FormRow[]) {
  const head = columns.map(c => `<th>${escapeHtml(c.label)}</th>`).join('');
  const body = data.map(row => `<tr data-array-row="${escapeHtml(arrayName)}">${columns.map(c => `<td data-key="${escapeHtml(c.key)}">${h(row[c.key] || '')}</td>`).join('')}</tr>`).join('');
  return `<h4>${escapeHtml(title)}</h4><div style="overflow-x:auto"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function structuredHtml(activityId: string, form: FormState) {
  let body = '';
  if (activityId === 'TASK1_ISSUE') {
    body += '<h3>A. Identitas Isu Penelitian</h3>';
    body += block('Tema/isu penelitian', 'theme', scalar(form, 'theme'));
    body += block('Jenjang/konteks pendidikan', 'level', scalar(form, 'level'));
    body += block('Fenomena/permasalahan', 'phenomenon', scalar(form, 'phenomenon'));
    body += block('Deskripsi masalah', 'problem_description', scalar(form, 'problem_description'));
    body += tableHtml('B. Kajian minimal 5 artikel', 'articles', [
      { key: 'title', label: 'Judul' }, { key: 'authors', label: 'Penulis' }, { key: 'year', label: 'Tahun' }, { key: 'journal', label: 'Jurnal' },
      { key: 'url', label: 'DOI/URL' }, { key: 'focus', label: 'Fokus' }, { key: 'method', label: 'Metode' }, { key: 'findings', label: 'Temuan' }, { key: 'relevance', label: 'Relevansi' }
    ], rows(form, 'articles'));
    body += '<h3>C. Sintesis dan Calon Penelitian</h3>';
    body += block('Sintesis pola temuan', 'synthesis', scalar(form, 'synthesis'));
    body += block('Akar masalah', 'root_cause', scalar(form, 'root_cause'));
    body += block('Hal yang belum terselesaikan', 'unresolved', scalar(form, 'unresolved'));
    body += block('Urgensi penelitian', 'importance', scalar(form, 'importance'));
    body += block('Calon topik', 'proposed_topic', scalar(form, 'proposed_topic'));
    body += block('Calon judul', 'proposed_title', scalar(form, 'proposed_title'));
    body += block('Argumentasi akademik', 'academic_argument', scalar(form, 'academic_argument'));
  } else if (activityId === 'TASK2_GAP') {
    body += '<h3>A. Artikel Utama</h3>';
    ['primary_article_title','authors','year','journal','url'].forEach(key => {
      const labels: Record<string,string> = {primary_article_title:'Judul artikel',authors:'Penulis',year:'Tahun',journal:'Jurnal',url:'DOI/URL'};
      body += block(labels[key], key, scalar(form, key));
    });
    body += '<h3>B. Analisis Artikel</h3>';
    [['problem','Masalah penelitian'],['objective','Tujuan penelitian'],['approach','Pendekatan'],['design','Desain/metode'],['subject','Subjek/populasi/sampel'],['instrument','Instrumen'],['data_analysis','Analisis data'],['findings','Temuan utama'],['contribution','Kontribusi']].forEach(([key,label]) => { body += block(label, key, scalar(form,key)); });
    body += '<h3>C. Critical Review</h3>';
    body += block('Kelebihan', 'strengths', scalar(form,'strengths'));
    body += block('Keterbatasan', 'limitations', scalar(form,'limitations'));
    body += '<h3>D. GAP, State of the Art, dan Kontribusi</h3>';
    [['existing_knowledge','Apa yang sudah diketahui?'],['unresolved_problem','Apa yang belum terselesaikan?'],['research_gap','Research gap'],['opportunity','Peluang penelitian'],['state_of_art','State of the art/posisi penelitian'],['novelty','Kebaruan/kontribusi yang ditawarkan'],['proposed_title','Judul penelitian setelah analisis gap']].forEach(([key,label]) => { body += block(label,key,scalar(form,key)); });
  } else if (activityId === 'TASK3_DESIGN') {
    body += '<h3>A. Identitas dan Rumusan Penelitian</h3>';
    [['title','Judul penelitian'],['research_gap','Research gap'],['state_of_art','State of the art'],['research_questions','Rumusan/pertanyaan penelitian'],['objectives','Tujuan penelitian']].forEach(([key,label]) => { body += block(label,key,scalar(form,key)); });
    body += '<h3>B. Desain Penelitian</h3>';
    [['approach','Pendekatan'],['design','Jenis/desain penelitian'],['design_reason','Alasan pemilihan desain'],['variables_or_focus','Variabel/fokus penelitian'],['operational_definition','Definisi operasional/fokus'],['hypothesis','Hipotesis (jika relevan)']].forEach(([key,label]) => { body += block(label,key,scalar(form,key)); });
    body += '<h3>C. Subjek, Pengumpulan, dan Analisis Data</h3>';
    [['population','Populasi'],['sample','Sampel/subjek'],['sample_size','Ukuran sampel'],['sampling','Teknik sampling'],['sampling_reason','Alasan teknik sampling'],['setting','Setting penelitian'],['data_types','Jenis data'],['collection_methods','Teknik pengumpulan data'],['instruments_needed','Instrumen yang diperlukan'],['procedure','Prosedur/tahapan penelitian'],['analysis_plan','Rencana analisis data'],['analysis_reason','Alasan pemilihan analisis'],['software','Software (jika digunakan)']].forEach(([key,label]) => { body += block(label,key,scalar(form,key)); });
  } else if (activityId === 'TASK4_INSTRUMENT') {
    body += '<h3>A. Acuan Desain Penelitian</h3>';
    [['title','Judul penelitian'],['approach','Pendekatan'],['design','Desain penelitian'],['instrument_types','Jenis instrumen']].forEach(([key,label]) => { body += block(label,key,scalar(form,key)); });
    body += tableHtml('B. Konstruk/Variabel dan Indikator', 'constructs', [
      {key:'name',label:'Variabel/Fokus'}, {key:'conceptual',label:'Definisi Konseptual'}, {key:'operational',label:'Definisi Operasional'}, {key:'dimensions',label:'Dimensi'}, {key:'indicators',label:'Indikator'}
    ], rows(form,'constructs'));
    body += tableHtml('C. Kisi-kisi Instrumen', 'blueprint', [
      {key:'variable',label:'Variabel/Aspek'}, {key:'indicator',label:'Indikator'}, {key:'subindicator',label:'Subindikator'}, {key:'item_no',label:'No. Item'}, {key:'item_type',label:'Bentuk Item'}, {key:'scale',label:'Skala'}
    ], rows(form,'blueprint'));
    body += tableHtml('D. Butir Instrumen', 'items', [
      {key:'item_no',label:'No.'}, {key:'indicator',label:'Indikator'}, {key:'item_text',label:'Butir/Pertanyaan'}, {key:'response_scale',label:'Pilihan/Skala'}, {key:'theory_source',label:'Sumber Teori'}
    ], rows(form,'items'));
    body += '<h3>E. Validitas dan Reliabilitas</h3>';
    [['validity_type','Jenis validitas'],['expert_validator','Validator ahli'],['validity_procedure','Prosedur validasi'],['validity_criteria','Kriteria keputusan validitas'],['reliability_method','Teknik reliabilitas'],['reliability_plan','Rencana uji reliabilitas'],['reliability_criteria','Kriteria reliabel'],['notes','Catatan tambahan']].forEach(([key,label]) => { body += block(label,key,scalar(form,key)); });
  } else {
    body += '<h3>Identitas Proposal</h3>' + block('Judul penelitian','title',scalar(form,'title'));
    body += '<h3>BAB I — Pendahuluan</h3>';
    [['ch1_background','Latar belakang'],['ch1_identification','Identifikasi masalah'],['ch1_limitation','Batasan masalah'],['ch1_problem','Rumusan masalah'],['ch1_objectives','Tujuan penelitian'],['ch1_benefits','Manfaat penelitian']].forEach(([key,label]) => { body += block(label,key,scalar(form,key)); });
    body += '<h3>BAB II — Kajian Pustaka</h3>';
    [['ch2_theory','Kajian teori'],['ch2_relevant_research','Penelitian relevan'],['ch2_research_gap','Research gap'],['ch2_state_of_art','State of the art'],['ch2_framework','Kerangka berpikir'],['ch2_hypothesis','Hipotesis (jika relevan)']].forEach(([key,label]) => { body += block(label,key,scalar(form,key)); });
    body += '<h3>BAB III — Metode Penelitian</h3>';
    [['ch3_approach','Pendekatan'],['ch3_design','Jenis/desain penelitian'],['ch3_place_time','Tempat dan waktu'],['ch3_population_subject','Populasi/subjek'],['ch3_sample','Sampel'],['ch3_sampling','Teknik sampling'],['ch3_variables_focus','Variabel/fokus'],['ch3_operational_definition','Definisi operasional'],['ch3_collection','Teknik pengumpulan data'],['ch3_instrument','Instrumen'],['ch3_validity','Validitas'],['ch3_reliability','Reliabilitas'],['ch3_analysis','Teknik analisis data'],['ch3_procedure','Prosedur penelitian']].forEach(([key,label]) => { body += block(label,key,scalar(form,key)); });
    body += '<h3>Referensi dan Lampiran</h3>';
    body += block('Daftar referensi','references',scalar(form,'references'));
    body += block('Catatan lampiran','attachments_notes',scalar(form,'attachments_notes'));
  }
  return `<section data-metopen-form="1" data-task-id="${escapeHtml(activityId)}"><p><strong>Lembar kerja terstruktur METOPEN PFIS.</strong> Isian ini tersimpan sebagai evidence proses penelitian dan dapat direvisi pada submission berikutnya.</p>${body}</section>`;
}

function parseStructuredForm(html: string | undefined, activityId: string): FormState | null {
  if (!html || typeof window === 'undefined') return null;
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const root = Array.from(doc.querySelectorAll('[data-metopen-form="1"]')).find(el => el.getAttribute('data-task-id') === activityId);
    if (!root) return null;
    const form = emptyForm(activityId);
    root.querySelectorAll('[data-field]').forEach(el => {
      const key = el.getAttribute('data-field');
      if (key) form[key] = (el.textContent || '').trim() === '-' ? '' : (el.textContent || '').trim();
    });
    const grouped: Record<string, FormRow[]> = {};
    root.querySelectorAll('[data-array-row]').forEach(rowEl => {
      const name = rowEl.getAttribute('data-array-row');
      if (!name) return;
      const item: FormRow = {};
      rowEl.querySelectorAll('[data-key]').forEach(cell => {
        const key = cell.getAttribute('data-key');
        if (key) item[key] = (cell.textContent || '').trim() === '-' ? '' : (cell.textContent || '').trim();
      });
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(item);
    });
    Object.entries(grouped).forEach(([key, value]) => { form[key] = value; });
    return form;
  } catch {
    return null;
  }
}

function hasValue(value: string | FormRow[] | undefined) {
  if (typeof value === 'string') return value.trim().length > 0;
  return Array.isArray(value) && value.some(row => Object.values(row).some(v => String(v || '').trim()));
}
function mergeEmpty(base: FormState, incoming: FormState): FormState {
  const next: FormState = { ...base };
  Object.entries(incoming).forEach(([key, value]) => {
    if (!hasValue(next[key]) && hasValue(value)) next[key] = value;
  });
  return next;
}

function buildPrefill(activityId: string, prior: PriorForms): FormState {
  const out = emptyForm(activityId);
  const t1 = prior.TASK1_ISSUE;
  const t2 = prior.TASK2_GAP;
  const t3 = prior.TASK3_DESIGN;
  const t4 = prior.TASK4_INSTRUMENT;
  if (activityId === 'TASK2_GAP' && t1) {
    out.proposed_title = scalar(t1,'proposed_title');
    out.unresolved_problem = scalar(t1,'unresolved');
    out.existing_knowledge = scalar(t1,'synthesis');
  }
  if (activityId === 'TASK3_DESIGN') {
    out.title = t2 ? scalar(t2,'proposed_title') : (t1 ? scalar(t1,'proposed_title') : '');
    out.research_gap = t2 ? scalar(t2,'research_gap') : '';
    out.state_of_art = t2 ? scalar(t2,'state_of_art') : '';
  }
  if (activityId === 'TASK4_INSTRUMENT' && t3) {
    out.title = scalar(t3,'title');
    out.approach = scalar(t3,'approach');
    out.design = scalar(t3,'design');
    const variable = scalar(t3,'variables_or_focus');
    const operational = scalar(t3,'operational_definition');
    if (variable || operational) out.constructs = [{...blankConstruct(), name: variable, operational}];
  }
  if (activityId === 'TASK5_PROPOSAL') {
    out.title = t3 ? scalar(t3,'title') : (t2 ? scalar(t2,'proposed_title') : (t1 ? scalar(t1,'proposed_title') : ''));
    out.ch1_background = [t1 ? scalar(t1,'problem_description') : '', t1 ? scalar(t1,'importance') : ''].filter(Boolean).join('\n\n');
    out.ch1_identification = t1 ? scalar(t1,'phenomenon') : '';
    out.ch1_problem = t3 ? scalar(t3,'research_questions') : '';
    out.ch1_objectives = t3 ? scalar(t3,'objectives') : '';
    out.ch2_relevant_research = t1 ? scalar(t1,'synthesis') : '';
    out.ch2_research_gap = t2 ? scalar(t2,'research_gap') : '';
    out.ch2_state_of_art = t2 ? scalar(t2,'state_of_art') : '';
    out.ch3_approach = t3 ? scalar(t3,'approach') : '';
    out.ch3_design = t3 ? scalar(t3,'design') : '';
    out.ch3_population_subject = t3 ? [scalar(t3,'population'), scalar(t3,'sample')].filter(Boolean).join('\n') : '';
    out.ch3_sample = t3 ? scalar(t3,'sample_size') : '';
    out.ch3_sampling = t3 ? scalar(t3,'sampling') : '';
    out.ch3_variables_focus = t3 ? scalar(t3,'variables_or_focus') : '';
    out.ch3_operational_definition = t3 ? scalar(t3,'operational_definition') : '';
    out.ch3_collection = t3 ? scalar(t3,'collection_methods') : '';
    out.ch3_analysis = t3 ? scalar(t3,'analysis_plan') : '';
    out.ch3_procedure = t3 ? scalar(t3,'procedure') : '';
    if (t4) {
      out.ch3_instrument = scalar(t4,'instrument_types');
      out.ch3_validity = [scalar(t4,'validity_type'), scalar(t4,'validity_procedure'), scalar(t4,'validity_criteria')].filter(Boolean).join('\n');
      out.ch3_reliability = [scalar(t4,'reliability_method'), scalar(t4,'reliability_plan'), scalar(t4,'reliability_criteria')].filter(Boolean).join('\n');
    }
  }
  return out;
}

function validateForm(activityId: string, form: FormState) {
  if (activityId === 'TASK1_ISSUE') {
    if (!scalar(form,'theme').trim() || !scalar(form,'phenomenon').trim()) return 'Tema dan fenomena/permasalahan wajib diisi.';
    const complete = rows(form,'articles').filter(a => String(a.title || '').trim()).length;
    if (complete < 5) return 'Tugas 1 memerlukan minimal 5 artikel. Isi minimal judul pada lima baris artikel.';
    if (!scalar(form,'proposed_title').trim()) return 'Calon judul penelitian wajib diisi.';
  }
  if (activityId === 'TASK2_GAP') {
    if (!scalar(form,'primary_article_title').trim()) return 'Pilih atau isi artikel utama yang dianalisis.';
    if (!scalar(form,'research_gap').trim() || !scalar(form,'state_of_art').trim()) return 'Research gap dan state of the art wajib diisi.';
  }
  if (activityId === 'TASK3_DESIGN') {
    if (!scalar(form,'title').trim() || !scalar(form,'research_questions').trim() || !scalar(form,'objectives').trim()) return 'Judul, rumusan masalah, dan tujuan penelitian wajib diisi.';
    if (!scalar(form,'approach').trim() || !scalar(form,'design').trim() || !scalar(form,'analysis_plan').trim()) return 'Pendekatan, desain, dan rencana analisis data wajib diisi.';
  }
  if (activityId === 'TASK4_INSTRUMENT') {
    const constructs = rows(form,'constructs').filter(r => String(r.name || '').trim()).length;
    const items = rows(form,'items').filter(r => String(r.item_text || '').trim()).length;
    if (!scalar(form,'title').trim() || constructs < 1) return 'Judul dan minimal satu variabel/fokus instrumen wajib diisi.';
    if (items < 1) return 'Tambahkan minimal satu butir instrumen.';
    if (!scalar(form,'validity_procedure').trim()) return 'Rencana/prosedur validitas wajib diisi.';
  }
  if (activityId === 'TASK5_PROPOSAL') {
    const required = ['title','ch1_background','ch1_problem','ch1_objectives','ch2_theory','ch3_design','ch3_analysis'];
    if (required.some(key => !scalar(form,key).trim())) return 'Lengkapi minimal judul, latar belakang, rumusan masalah, tujuan, kajian teori, desain penelitian, dan teknik analisis data.';
  }
  return '';
}

function TextField({ label, value, onChange, placeholder = '', type = 'text' }: { label: string; value: string; onChange: (v:string)=>void; placeholder?: string; type?: string }) {
  return <label className="field"><span>{label}</span><input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></label>;
}
function TextAreaField({ label, value, onChange, placeholder = '', rows = 5, hint = '' }: { label:string; value:string; onChange:(v:string)=>void; placeholder?:string; rows?:number; hint?:string }) {
  return <label className="field"><span>{label}</span>{hint ? <small>{hint}</small> : null}<textarea className="list-search" value={value} onChange={e=>onChange(e.target.value)} rows={rows} placeholder={placeholder}/></label>;
}
function SelectField({ label, value, onChange, options }: {label:string; value:string; onChange:(v:string)=>void; options:string[]}) {
  return <label className="field"><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}><option value="">Pilih...</option>{options.map(o=><option key={o} value={o}>{o}</option>)}</select></label>;
}

function EditableTable({ title, columns, data, onChange, onAdd, onRemove, minRows = 1 }: {
  title:string;
  columns:Array<{key:string;label:string;wide?:boolean}>;
  data:FormRow[];
  onChange:(index:number,key:string,value:string)=>void;
  onAdd:()=>void;
  onRemove:(index:number)=>void;
  minRows?:number;
}) {
  return <div style={{marginTop:16}}>
    <div className="row between wrap gap"><h4 style={{margin:0}}>{title}</h4><button type="button" className="button soft compact" onClick={onAdd}><Plus/>Tambah baris</button></div>
    <div style={{overflowX:'auto',marginTop:10}}>
      <table className="rubric-table">
        <thead><tr>{columns.map(c=><th key={c.key}>{c.label}</th>)}<th>Aksi</th></tr></thead>
        <tbody>{data.map((row,index)=><tr key={index}>{columns.map(c=><td key={c.key} style={{minWidth:c.wide?220:130}}><textarea className="list-search" rows={c.wide?3:2} value={row[c.key]||''} onChange={e=>onChange(index,c.key,e.target.value)}/></td>)}<td><button type="button" className="icon-button" disabled={data.length<=minRows} onClick={()=>onRemove(index)} title="Hapus baris"><Trash2/></button></td></tr>)}</tbody>
      </table>
    </div>
  </div>;
}

export default function TaskPage() {
  const params = useParams<{ id: string | string[] }>();
  const id = useMemo(() => {
    const raw = params?.id;
    return Array.isArray(raw) ? String(raw[0] || '') : String(raw || '');
  }, [params]);

  const rubric = useMemo(() => (id ? rubricFor(id) : undefined), [id]);
  const [data, setData] = useState<TaskData | null>(null);
  const [form, setForm] = useState<FormState>(()=>emptyForm(id));
  const [priorForms, setPriorForms] = useState<PriorForms>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const getPriorIds = useCallback((activityId:string) => {
    const index = TASK_IDS.indexOf(activityId as typeof TASK_IDS[number]);
    return index > 0 ? TASK_IDS.slice(0,index) : [];
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const result = await api<TaskData>('getTask', { activity_id: id });
      if (!result || !result.activity) throw new Error('Data tugas tidak lengkap. Pastikan seed aktivitas Apps Script sudah dibuat.');

      const prior: PriorForms = {};
      const priorIds = getPriorIds(id);
      await Promise.all(priorIds.map(async priorId => {
        try {
          const p = await api<TaskData>('getTask', {activity_id: priorId});
          prior[priorId] = parseStructuredForm(p?.latest?.content_html, priorId);
        } catch { prior[priorId] = null; }
      }));
      setPriorForms(prior);

      const restored = parseStructuredForm(result.latest?.content_html, id);
      const base = restored || emptyForm(id);
      setForm(restored ? base : mergeEmpty(base, buildPrefill(id, prior)));
      setLink(result.latest?.link_url || '');
      setData(result);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [id, getPriorIds]);

  useEffect(() => { if (id) void load(); }, [id, load]);

  const setField = (key:string,value:string) => setForm(prev=>({...prev,[key]:value}));
  const updateRow = (key:string,index:number,col:string,value:string) => setForm(prev=>{
    const copy = rows(prev,key).map(r=>({...r}));
    if (!copy[index]) return prev;
    copy[index][col]=value;
    return {...prev,[key]:copy};
  });
  const addRow = (key:string, factory:()=>FormRow) => setForm(prev=>({...prev,[key]:[...rows(prev,key),factory()]}));
  const removeRow = (key:string,index:number,minRows=1) => setForm(prev=>{
    const current=rows(prev,key); if(current.length<=minRows)return prev;
    return {...prev,[key]:current.filter((_,i)=>i!==index)};
  });
  const pullPrior = () => setForm(prev=>mergeEmpty(prev,buildPrefill(id,priorForms)));

  const applyPrimaryArticle = (title:string) => {
    const t1=priorForms.TASK1_ISSUE;
    const article=t1?rows(t1,'articles').find(a=>String(a.title||'')===title):undefined;
    if(!article){setField('primary_article_title',title);return;}
    setForm(prev=>({...prev,
      primary_article_title:title, authors:article.authors||'', year:article.year||'', journal:article.journal||'', url:article.url||'',
      problem:article.focus||'', findings:article.findings||'',
    }));
  };

  const submit = async () => {
    if (!id) return;
    setBusy(true);
    setError('');
    try {
      const validation = validateForm(id,form);
      if (validation) throw new Error(validation);
      const contentHtml = structuredHtml(id,form);
      if (contentHtml.length > 48000) throw new Error('Isi form terlalu panjang untuk satu record LMS. Ringkas isian pada form dan lampirkan dokumen lengkap melalui Google Drive/file.');

      let base64 = '', file_name = '', file_mime = '';
      if (file) {
        if (file.size > 5 * 1024 * 1024) throw new Error('File langsung maksimal 5 MB. Untuk file lebih besar gunakan URL Google Drive.');
        base64 = await fileToBase64(file); file_name = file.name; file_mime = file.type || 'application/octet-stream';
      }
      await api('submitWork', { activity_id:id, content_html:contentHtml, link_url:link.trim(), file_base64:base64, file_name, file_mime });
      setFile(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally { setBusy(false); }
  };

  const activity = data?.activity || null;
  const latest = data?.latest || null;
  const grade = data?.grade || null;
  const previousAvailable = Object.values(priorForms).some(Boolean);
  const articleOptions = priorForms.TASK1_ISSUE ? rows(priorForms.TASK1_ISSUE,'articles').map(a=>a.title).filter(Boolean) : [];

  const renderTaskForm = () => {
    if (id === 'TASK1_ISSUE') return <>
      <GlassCard>
        <span className="eyebrow">BAGIAN A</span><h3>Identitas Isu Penelitian</h3>
        <div className="form-grid two"><TextField label="Tema/isu penelitian" value={scalar(form,'theme')} onChange={v=>setField('theme',v)} placeholder="Contoh: miskonsepsi pada materi mekanika"/><TextField label="Jenjang/konteks pendidikan" value={scalar(form,'level')} onChange={v=>setField('level',v)} placeholder="SMA kelas XI / mahasiswa / sekolah tertentu"/></div>
        <TextAreaField label="Fenomena/permasalahan yang ditemukan" value={scalar(form,'phenomenon')} onChange={v=>setField('phenomenon',v)} rows={4}/>
        <TextAreaField label="Deskripsi singkat masalah" value={scalar(form,'problem_description')} onChange={v=>setField('problem_description',v)} rows={5}/>
      </GlassCard>
      <GlassCard>
        <span className="eyebrow">BAGIAN B</span><h3>Kajian Pustaka Minimal 5 Artikel</h3><p className="muted">Kelima artikel harus berada pada tema yang sama. Tambahkan baris bila diperlukan.</p>
        <EditableTable title="Matriks artikel" columns={[{key:'title',label:'Judul',wide:true},{key:'authors',label:'Penulis'},{key:'year',label:'Tahun'},{key:'journal',label:'Jurnal'},{key:'url',label:'DOI/URL',wide:true},{key:'focus',label:'Masalah/Fokus',wide:true},{key:'method',label:'Metode'},{key:'findings',label:'Temuan Utama',wide:true},{key:'relevance',label:'Relevansi',wide:true}]} data={rows(form,'articles')} onChange={(i,k,v)=>updateRow('articles',i,k,v)} onAdd={()=>addRow('articles',blankArticle)} onRemove={i=>removeRow('articles',i,5)} minRows={5}/>
      </GlassCard>
      <GlassCard>
        <span className="eyebrow">BAGIAN C</span><h3>Sintesis dan Calon Penelitian</h3>
        <TextAreaField label="Sintesis pola temuan dari artikel" value={scalar(form,'synthesis')} onChange={v=>setField('synthesis',v)} rows={5}/>
        <TextAreaField label="Penyebab/akar masalah" value={scalar(form,'root_cause')} onChange={v=>setField('root_cause',v)} rows={4}/>
        <TextAreaField label="Apa yang belum terselesaikan?" value={scalar(form,'unresolved')} onChange={v=>setField('unresolved',v)} rows={4}/>
        <TextAreaField label="Mengapa isu ini penting diteliti?" value={scalar(form,'importance')} onChange={v=>setField('importance',v)} rows={4}/>
        <div className="form-grid two"><TextField label="Calon topik penelitian" value={scalar(form,'proposed_topic')} onChange={v=>setField('proposed_topic',v)}/><TextField label="Calon judul penelitian" value={scalar(form,'proposed_title')} onChange={v=>setField('proposed_title',v)}/></div>
        <TextAreaField label="Argumentasi akademik pemilihan topik" value={scalar(form,'academic_argument')} onChange={v=>setField('academic_argument',v)} rows={5}/>
      </GlassCard>
    </>;

    if (id === 'TASK2_GAP') return <>
      <GlassCard>
        <span className="eyebrow">BAGIAN A</span><h3>Artikel Utama</h3>
        {articleOptions.length ? <label className="field"><span>Pilih artikel dari Tugas 1</span><select value={scalar(form,'primary_article_title')} onChange={e=>applyPrimaryArticle(e.target.value)}><option value="">Pilih artikel...</option>{articleOptions.map(a=><option key={a} value={a}>{a}</option>)}</select></label> : <TextField label="Judul artikel utama" value={scalar(form,'primary_article_title')} onChange={v=>setField('primary_article_title',v)}/>} 
        <div className="form-grid two"><TextField label="Penulis" value={scalar(form,'authors')} onChange={v=>setField('authors',v)}/><TextField label="Tahun" value={scalar(form,'year')} onChange={v=>setField('year',v)}/><TextField label="Nama jurnal" value={scalar(form,'journal')} onChange={v=>setField('journal',v)}/><TextField label="DOI/URL" value={scalar(form,'url')} onChange={v=>setField('url',v)}/></div>
      </GlassCard>
      <GlassCard>
        <span className="eyebrow">BAGIAN B</span><h3>Analisis Artikel</h3>
        <div className="article-question-grid"><TextAreaField label="Masalah penelitian" value={scalar(form,'problem')} onChange={v=>setField('problem',v)}/><TextAreaField label="Tujuan penelitian" value={scalar(form,'objective')} onChange={v=>setField('objective',v)}/><TextAreaField label="Pendekatan penelitian" value={scalar(form,'approach')} onChange={v=>setField('approach',v)}/><TextAreaField label="Desain/metode" value={scalar(form,'design')} onChange={v=>setField('design',v)}/><TextAreaField label="Subjek/populasi/sampel" value={scalar(form,'subject')} onChange={v=>setField('subject',v)}/><TextAreaField label="Instrumen" value={scalar(form,'instrument')} onChange={v=>setField('instrument',v)}/><TextAreaField label="Teknik analisis data" value={scalar(form,'data_analysis')} onChange={v=>setField('data_analysis',v)}/><TextAreaField label="Temuan utama" value={scalar(form,'findings')} onChange={v=>setField('findings',v)}/><TextAreaField label="Kontribusi penelitian" value={scalar(form,'contribution')} onChange={v=>setField('contribution',v)}/></div>
      </GlassCard>
      <GlassCard>
        <span className="eyebrow">BAGIAN C–D</span><h3>Critical Review, GAP & State of the Art</h3>
        <div className="article-question-grid"><TextAreaField label="Kelebihan penelitian" value={scalar(form,'strengths')} onChange={v=>setField('strengths',v)}/><TextAreaField label="Keterbatasan penelitian" value={scalar(form,'limitations')} onChange={v=>setField('limitations',v)}/><TextAreaField label="Existing knowledge — apa yang sudah diketahui?" value={scalar(form,'existing_knowledge')} onChange={v=>setField('existing_knowledge',v)}/><TextAreaField label="Unresolved problem — apa yang belum terselesaikan?" value={scalar(form,'unresolved_problem')} onChange={v=>setField('unresolved_problem',v)}/><TextAreaField label="Research gap" value={scalar(form,'research_gap')} onChange={v=>setField('research_gap',v)} rows={6}/><TextAreaField label="Peluang penelitian berikutnya" value={scalar(form,'opportunity')} onChange={v=>setField('opportunity',v)}/><TextAreaField label="State of the art / posisi penelitian yang diusulkan" value={scalar(form,'state_of_art')} onChange={v=>setField('state_of_art',v)} rows={6}/><TextAreaField label="Kebaruan/kekhasan atau kontribusi yang ditawarkan" value={scalar(form,'novelty')} onChange={v=>setField('novelty',v)}/></div>
        <TextField label="Judul penelitian setelah analisis gap" value={scalar(form,'proposed_title')} onChange={v=>setField('proposed_title',v)}/>
      </GlassCard>
    </>;

    if (id === 'TASK3_DESIGN') return <>
      <GlassCard>
        <span className="eyebrow">BAGIAN A</span><h3>Identitas dan Rumusan Penelitian</h3>
        <TextField label="Judul penelitian" value={scalar(form,'title')} onChange={v=>setField('title',v)}/>
        <div className="article-question-grid"><TextAreaField label="Research gap" value={scalar(form,'research_gap')} onChange={v=>setField('research_gap',v)}/><TextAreaField label="State of the art" value={scalar(form,'state_of_art')} onChange={v=>setField('state_of_art',v)}/><TextAreaField label="Rumusan masalah / pertanyaan penelitian" value={scalar(form,'research_questions')} onChange={v=>setField('research_questions',v)} rows={6}/><TextAreaField label="Tujuan penelitian" value={scalar(form,'objectives')} onChange={v=>setField('objectives',v)} rows={6}/></div>
      </GlassCard>
      <GlassCard>
        <span className="eyebrow">BAGIAN B</span><h3>Desain Penelitian</h3>
        <div className="form-grid two"><SelectField label="Pendekatan" value={scalar(form,'approach')} onChange={v=>setField('approach',v)} options={['Kuantitatif','Kualitatif','Mixed Methods']}/><SelectField label="Jenis/desain penelitian" value={scalar(form,'design')} onChange={v=>setField('design',v)} options={['Eksperimen','Kuasi eksperimen','Survei','Korelasional','Kualitatif','R&D / Pengembangan','Penelitian Tindakan Kelas','Lainnya']}/></div>
        <TextAreaField label="Alasan pemilihan desain" value={scalar(form,'design_reason')} onChange={v=>setField('design_reason',v)}/>
        <TextAreaField label="Variabel penelitian atau fokus penelitian" value={scalar(form,'variables_or_focus')} onChange={v=>setField('variables_or_focus',v)} hint="Kuantitatif: tuliskan variabel bebas/terikat/kontrol. Kualitatif: tuliskan fokus/subfokus. R&D: tuliskan produk dan fokus pengembangan."/>
        <TextAreaField label="Definisi operasional / batasan fokus" value={scalar(form,'operational_definition')} onChange={v=>setField('operational_definition',v)}/>
        <TextAreaField label="Hipotesis (jika relevan)" value={scalar(form,'hypothesis')} onChange={v=>setField('hypothesis',v)}/>
      </GlassCard>
      <GlassCard>
        <span className="eyebrow">BAGIAN C</span><h3>Subjek, Pengumpulan, dan Analisis Data</h3>
        <div className="form-grid two"><TextField label="Populasi" value={scalar(form,'population')} onChange={v=>setField('population',v)}/><TextField label="Sampel/subjek" value={scalar(form,'sample')} onChange={v=>setField('sample',v)}/><TextField label="Ukuran sampel" value={scalar(form,'sample_size')} onChange={v=>setField('sample_size',v)}/><TextField label="Teknik sampling" value={scalar(form,'sampling')} onChange={v=>setField('sampling',v)}/></div>
        <TextAreaField label="Argumentasi pemilihan sampel/teknik sampling" value={scalar(form,'sampling_reason')} onChange={v=>setField('sampling_reason',v)}/>
        <TextAreaField label="Setting penelitian" value={scalar(form,'setting')} onChange={v=>setField('setting',v)}/>
        <div className="article-question-grid"><TextAreaField label="Jenis data" value={scalar(form,'data_types')} onChange={v=>setField('data_types',v)}/><TextAreaField label="Teknik pengumpulan data" value={scalar(form,'collection_methods')} onChange={v=>setField('collection_methods',v)}/><TextAreaField label="Instrumen yang diperlukan" value={scalar(form,'instruments_needed')} onChange={v=>setField('instruments_needed',v)}/><TextAreaField label="Prosedur/tahapan penelitian" value={scalar(form,'procedure')} onChange={v=>setField('procedure',v)} rows={6}/><TextAreaField label="Rencana analisis data" value={scalar(form,'analysis_plan')} onChange={v=>setField('analysis_plan',v)} rows={6}/><TextAreaField label="Alasan pemilihan teknik analisis" value={scalar(form,'analysis_reason')} onChange={v=>setField('analysis_reason',v)}/></div>
        <TextField label="Software analisis (jika digunakan)" value={scalar(form,'software')} onChange={v=>setField('software',v)}/>
      </GlassCard>
    </>;

    if (id === 'TASK4_INSTRUMENT') return <>
      <GlassCard>
        <span className="eyebrow">BAGIAN A</span><h3>Acuan Desain Penelitian</h3>
        <TextField label="Judul penelitian" value={scalar(form,'title')} onChange={v=>setField('title',v)}/><div className="form-grid two"><TextField label="Pendekatan" value={scalar(form,'approach')} onChange={v=>setField('approach',v)}/><TextField label="Desain penelitian" value={scalar(form,'design')} onChange={v=>setField('design',v)}/></div>
        <TextField label="Jenis instrumen yang dikembangkan" value={scalar(form,'instrument_types')} onChange={v=>setField('instrument_types',v)} placeholder="Tes, angket, observasi, wawancara, rubrik, lembar validasi, dll."/>
      </GlassCard>
      <GlassCard><span className="eyebrow">BAGIAN B–D</span><h3>Variabel, Kisi-kisi, dan Butir Instrumen</h3>
        <EditableTable title="Konstruk/variabel dan indikator" columns={[{key:'name',label:'Variabel/Fokus'},{key:'conceptual',label:'Definisi Konseptual',wide:true},{key:'operational',label:'Definisi Operasional',wide:true},{key:'dimensions',label:'Dimensi'},{key:'indicators',label:'Indikator',wide:true}]} data={rows(form,'constructs')} onChange={(i,k,v)=>updateRow('constructs',i,k,v)} onAdd={()=>addRow('constructs',blankConstruct)} onRemove={i=>removeRow('constructs',i)}/>
        <EditableTable title="Kisi-kisi instrumen" columns={[{key:'variable',label:'Variabel/Aspek'},{key:'indicator',label:'Indikator',wide:true},{key:'subindicator',label:'Subindikator',wide:true},{key:'item_no',label:'No. Item'},{key:'item_type',label:'Bentuk Item'},{key:'scale',label:'Skala'}]} data={rows(form,'blueprint')} onChange={(i,k,v)=>updateRow('blueprint',i,k,v)} onAdd={()=>addRow('blueprint',blankBlueprint)} onRemove={i=>removeRow('blueprint',i)}/>
        <EditableTable title="Butir instrumen" columns={[{key:'item_no',label:'No.'},{key:'indicator',label:'Indikator',wide:true},{key:'item_text',label:'Butir/Pertanyaan',wide:true},{key:'response_scale',label:'Pilihan/Skala',wide:true},{key:'theory_source',label:'Sumber Teori',wide:true}]} data={rows(form,'items')} onChange={(i,k,v)=>updateRow('items',i,k,v)} onAdd={()=>addRow('items',blankItem)} onRemove={i=>removeRow('items',i)}/>
      </GlassCard>
      <GlassCard><span className="eyebrow">BAGIAN E</span><h3>Validitas dan Reliabilitas</h3>
        <div className="article-question-grid"><TextAreaField label="Jenis validitas" value={scalar(form,'validity_type')} onChange={v=>setField('validity_type',v)}/><TextAreaField label="Validator ahli" value={scalar(form,'expert_validator')} onChange={v=>setField('expert_validator',v)}/><TextAreaField label="Prosedur validasi" value={scalar(form,'validity_procedure')} onChange={v=>setField('validity_procedure',v)} rows={6}/><TextAreaField label="Kriteria keputusan validitas" value={scalar(form,'validity_criteria')} onChange={v=>setField('validity_criteria',v)}/><TextAreaField label="Teknik reliabilitas" value={scalar(form,'reliability_method')} onChange={v=>setField('reliability_method',v)}/><TextAreaField label="Rencana uji reliabilitas" value={scalar(form,'reliability_plan')} onChange={v=>setField('reliability_plan',v)} rows={6}/><TextAreaField label="Kriteria reliabel" value={scalar(form,'reliability_criteria')} onChange={v=>setField('reliability_criteria',v)}/><TextAreaField label="Catatan tambahan" value={scalar(form,'notes')} onChange={v=>setField('notes',v)}/></div>
      </GlassCard>
    </>;

    return <>
      <GlassCard><span className="eyebrow">IDENTITAS</span><h3>Proposal Penelitian</h3><TextField label="Judul penelitian" value={scalar(form,'title')} onChange={v=>setField('title',v)}/><p className="notice">Form ini menjadi lembar kerja terstruktur. Untuk proposal panjang, tetap lampirkan DOCX/PDF atau URL Google Drive pada bagian akhir agar tidak terkena batas ukuran sel database.</p></GlassCard>
      <GlassCard><span className="eyebrow">BAB I</span><h3>Pendahuluan</h3><TextAreaField label="Latar belakang" value={scalar(form,'ch1_background')} onChange={v=>setField('ch1_background',v)} rows={10}/><TextAreaField label="Identifikasi masalah" value={scalar(form,'ch1_identification')} onChange={v=>setField('ch1_identification',v)} rows={5}/><TextAreaField label="Batasan masalah" value={scalar(form,'ch1_limitation')} onChange={v=>setField('ch1_limitation',v)} rows={4}/><TextAreaField label="Rumusan masalah" value={scalar(form,'ch1_problem')} onChange={v=>setField('ch1_problem',v)} rows={5}/><TextAreaField label="Tujuan penelitian" value={scalar(form,'ch1_objectives')} onChange={v=>setField('ch1_objectives',v)} rows={5}/><TextAreaField label="Manfaat penelitian" value={scalar(form,'ch1_benefits')} onChange={v=>setField('ch1_benefits',v)} rows={5}/></GlassCard>
      <GlassCard><span className="eyebrow">BAB II</span><h3>Kajian Pustaka</h3><TextAreaField label="Kajian teori" value={scalar(form,'ch2_theory')} onChange={v=>setField('ch2_theory',v)} rows={10}/><TextAreaField label="Penelitian relevan" value={scalar(form,'ch2_relevant_research')} onChange={v=>setField('ch2_relevant_research',v)} rows={8}/><div className="article-question-grid"><TextAreaField label="Research gap" value={scalar(form,'ch2_research_gap')} onChange={v=>setField('ch2_research_gap',v)}/><TextAreaField label="State of the art" value={scalar(form,'ch2_state_of_art')} onChange={v=>setField('ch2_state_of_art',v)}/><TextAreaField label="Kerangka berpikir" value={scalar(form,'ch2_framework')} onChange={v=>setField('ch2_framework',v)} rows={6}/><TextAreaField label="Hipotesis (jika relevan)" value={scalar(form,'ch2_hypothesis')} onChange={v=>setField('ch2_hypothesis',v)}/></div></GlassCard>
      <GlassCard><span className="eyebrow">BAB III</span><h3>Metode Penelitian</h3><div className="article-question-grid"><TextAreaField label="Pendekatan" value={scalar(form,'ch3_approach')} onChange={v=>setField('ch3_approach',v)}/><TextAreaField label="Jenis/desain penelitian" value={scalar(form,'ch3_design')} onChange={v=>setField('ch3_design',v)}/><TextAreaField label="Tempat dan waktu" value={scalar(form,'ch3_place_time')} onChange={v=>setField('ch3_place_time',v)}/><TextAreaField label="Populasi/subjek" value={scalar(form,'ch3_population_subject')} onChange={v=>setField('ch3_population_subject',v)}/><TextAreaField label="Sampel" value={scalar(form,'ch3_sample')} onChange={v=>setField('ch3_sample',v)}/><TextAreaField label="Teknik sampling" value={scalar(form,'ch3_sampling')} onChange={v=>setField('ch3_sampling',v)}/><TextAreaField label="Variabel/fokus" value={scalar(form,'ch3_variables_focus')} onChange={v=>setField('ch3_variables_focus',v)}/><TextAreaField label="Definisi operasional" value={scalar(form,'ch3_operational_definition')} onChange={v=>setField('ch3_operational_definition',v)}/><TextAreaField label="Teknik pengumpulan data" value={scalar(form,'ch3_collection')} onChange={v=>setField('ch3_collection',v)}/><TextAreaField label="Instrumen" value={scalar(form,'ch3_instrument')} onChange={v=>setField('ch3_instrument',v)}/><TextAreaField label="Validitas" value={scalar(form,'ch3_validity')} onChange={v=>setField('ch3_validity',v)}/><TextAreaField label="Reliabilitas" value={scalar(form,'ch3_reliability')} onChange={v=>setField('ch3_reliability',v)}/><TextAreaField label="Teknik analisis data" value={scalar(form,'ch3_analysis')} onChange={v=>setField('ch3_analysis',v)} rows={6}/><TextAreaField label="Prosedur penelitian" value={scalar(form,'ch3_procedure')} onChange={v=>setField('ch3_procedure',v)} rows={6}/></div></GlassCard>
      <GlassCard><span className="eyebrow">REFERENSI & LAMPIRAN</span><h3>Kelengkapan Proposal</h3><TextAreaField label="Daftar referensi" value={scalar(form,'references')} onChange={v=>setField('references',v)} rows={8}/><TextAreaField label="Catatan lampiran" value={scalar(form,'attachments_notes')} onChange={v=>setField('attachments_notes',v)} rows={4}/></GlassCard>
    </>;
  };

  return (
    <AuthGate>
      <AppShell title="Tugas Penelitian">
        <div className="row wrap gap" style={{ marginBottom: 14 }}>
          <Link href="/tasks" className="button soft compact"><ArrowLeft />Kembali</Link>
          {!loading && <button type="button" className="button soft compact" onClick={() => void load()}><RefreshCw />Muat ulang</button>}
          {!loading && previousAvailable && id !== 'TASK1_ISSUE' ? <button type="button" className="button soft compact" onClick={pullPrior}><Download/>Tarik data tugas sebelumnya</button> : null}
        </div>

        {error && <div className="error-box">{error}</div>}

        {loading ? (
          <div className="screen-center small"><div className="spinner" />Memuat tugas...</div>
        ) : !activity ? (
          <GlassCard><h3>Tugas belum dapat dimuat</h3><p className="muted">Periksa koneksi Apps Script atau data aktivitas tugas, lalu tekan “Muat ulang”.</p></GlassCard>
        ) : (
          <div className="stack">
            <GlassCard>
              <div className="row gap"><div className="icon-bubble teal"><ClipboardCheck /></div><div className="grow"><span className="eyebrow">{String(activity.type || 'assignment').toUpperCase()}</span><h2>{activity.title || id}</h2></div></div>
              <RichHtml html={activity.description_html || '<p>Instruksi belum diisi.</p>'} />
              <div className="row wrap gap"><span className="badge">Skala nilai 0–100</span>{activity.due_at ? <span className="badge">{formatDate(activity.due_at)}</span> : null}</div>
            </GlassCard>

            {rubric ? <GlassCard><div className="row gap"><div className="icon-bubble amber"><Scale /></div><div><span className="eyebrow">RUBRIK PENILAIAN</span><h3>{rubric.name}</h3></div></div>{rubric.note ? <p className="source-note">{rubric.note}</p> : null}<div style={{ overflowX: 'auto' }}><table className="rubric-table"><thead><tr><th>Aspek</th><th>Bobot</th><th>4</th><th>3</th><th>2</th><th>1</th></tr></thead><tbody>{rubric.criteria.map(c => <tr key={c.id}><td><strong>{c.name}</strong></td><td>{c.weight}%</td>{[4,3,2,1].map(v=><td className="rubric-level" key={v}>{c.levels.find(x=>x.score===v)?.description||'-'}</td>)}</tr>)}</tbody></table></div></GlassCard> : null}

            {grade ? <GlassCard className="grade-highlight"><div><span className="eyebrow">NILAI TERBIT</span><h2>{Number(grade.score || 0)} / {Number(grade.max_score || 100)}</h2></div><RichHtml html={grade.feedback_html || '<p>Belum ada feedback tertulis.</p>'} /></GlassCard> : null}

            {latest ? <GlassCard><span className="eyebrow">SUBMISSION TERAKHIR • VERSI {Number(latest.version || 1)}</span><RichHtml html={latest.content_html || '<p>Belum ada isi form terstruktur.</p>'} /><div className="row wrap gap">{latest.link_url ? <a className="button soft compact" target="_blank" rel="noreferrer" href={latest.link_url}><ExternalLink />Buka tautan</a> : null}{latest.file_url ? <a className="button soft compact" target="_blank" rel="noreferrer" href={latest.file_url}><ExternalLink />{latest.file_name || 'Buka file'}</a> : null}</div>{latest.submitted_at ? <small>{formatDate(latest.submitted_at)}</small> : null}</GlassCard> : null}

            <div className="section-title"><div><span className="eyebrow">FORM TUGAS</span><h2>{latest ? 'Perbaiki & Kirim Revisi' : 'Lengkapi Lembar Kerja'}</h2></div></div>
            {renderTaskForm()}

            <GlassCard>
              <span className="eyebrow">LAMPIRAN & SUBMISSION</span><h3>Dokumen Pendukung</h3>
              <p className="muted">Komentar antarpeserta tidak digunakan. Diskusi tetap dilakukan pada menu Diskusi, sedangkan halaman ini fokus pada evidence tugas, penilaian, dan feedback dosen. Setiap pengiriman ulang akan dibuat sebagai versi baru.</p>
              <div className="form-grid two"><label className="field"><span>URL dokumen / Google Drive (opsional)</span><input value={link} onChange={e=>setLink(e.target.value)} placeholder="https://..." /></label><label className="field"><span>File langsung (opsional, maks. 5 MB)</span><input type="file" onChange={e=>setFile(e.target.files?.[0] || null)} /></label></div>
              <div className="right-actions"><button className="button primary" disabled={busy} onClick={() => void submit()}><Upload />{busy ? 'Mengirim...' : latest ? 'Kirim Revisi' : 'Kirim Tugas'}</button></div>
            </GlassCard>
          </div>
        )}
      </AppShell>
    </AuthGate>
  );
}
