'use client';
import { useEffect,useMemo,useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';
import GlassCard from '@/components/GlassCard';
import { api } from '@/lib/api';
import { FORMAL_TASKS } from '@/lib/courseConfig';
import { BookOpenCheck,ExternalLink,FileText,Search,Users,Clock3,LibraryBig } from 'lucide-react';

type ProjectRow={submission_id:string;activity_id:string;activity_title:string;week_id:string;version:number;submitted_at:string;article_count:number;author?:{name:string;class_name?:string}|null};
function dateLabel(v:string){try{return new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short',year:'numeric'}).format(new Date(v));}catch{return '-'}}

export default function ProjectsPage(){
  const[rows,setRows]=useState<ProjectRow[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[task,setTask]=useState('ALL'),[query,setQuery]=useState('');
  useEffect(()=>{api<ProjectRow[]>('listPublicProjects').then(setRows).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[]);
  const filtered=useMemo(()=>rows.filter(r=>{if(task!=='ALL'&&r.activity_id!==task)return false;const q=query.trim().toLowerCase();if(!q)return true;return `${r.author?.name||''} ${r.author?.class_name||''} ${r.activity_title}`.toLowerCase().includes(q);}),[rows,task,query]);
  return <AuthGate><AppShell title="Karya Mahasiswa"><div className="stack projects-v2">
    <section className="page-hero-compact"><div><span className="eyebrow">OPEN LEARNING PORTFOLIO</span><h2>Galeri Karya & Publikasi Mahasiswa</h2><p>Pelajari submission terbaru Tugas 1–5 dari rekan satu kelas. Nilai dan feedback dosen tetap privat.</p></div><div className="hero-icon-square"><LibraryBig/></div></section>
    <section className="filter-panel-v2"><label className="field"><span>Filter tugas</span><select value={task} onChange={e=>setTask(e.target.value)}><option value="ALL">Semua tugas</option>{FORMAL_TASKS.map(t=><option key={t.code} value={t.code}>Tugas {t.no} — {t.title}</option>)}</select></label><label className="field"><span>Cari mahasiswa / karya</span><div className="search-input"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nama mahasiswa atau judul tugas"/></div></label></section>
    {error&&<div className="error-box">{error}</div>}
    {loading?<div className="screen-center small"><div className="spinner"/>Memuat karya mahasiswa...</div>:<div className="project-public-grid project-grid-v2">{filtered.map(r=><Link href={`/projects/${r.submission_id}`} key={r.submission_id} className="public-project-card-v2"><div className="project-doc-preview"><BookOpenCheck/><span>V{r.version}</span></div><div className="project-card-body"><span className="eyebrow">{r.week_id} • {r.activity_title}</span><h3>{r.author?.name||'Mahasiswa'}</h3><p>{r.author?.class_name||'Kelas belum diisi'}</p><div className="project-card-meta">{r.activity_id==='TASK1_ISSUE'&&<span><FileText/>{r.article_count} artikel</span>}<span><Clock3/>{r.submitted_at?dateLabel(r.submitted_at):'-'}</span></div><span className="project-card-link">Lihat karya <ExternalLink/></span></div></Link>)}</div>}
    {!loading&&!filtered.length&&<GlassCard><div className="empty-state"><Users/><h3>Belum ada karya yang sesuai</h3><p>Ubah filter atau kata kunci pencarian.</p></div></GlassCard>}
  </div></AppShell></AuthGate>
}
