'use client';
import { useEffect,useMemo,useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';
import GlassCard from '@/components/GlassCard';
import { api } from '@/lib/api';
import { FORMAL_TASKS } from '@/lib/courseConfig';
import { BookOpenCheck,ExternalLink,FileText,Search,Users,Clock3 } from 'lucide-react';

type ProjectRow={submission_id:string;activity_id:string;activity_title:string;week_id:string;version:number;submitted_at:string;article_count:number;author?:{name:string;class_name?:string}|null};

export default function ProjectsPage(){
  const[rows,setRows]=useState<ProjectRow[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[task,setTask]=useState('ALL'),[query,setQuery]=useState('');
  useEffect(()=>{api<ProjectRow[]>('listPublicProjects').then(setRows).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[]);
  const filtered=useMemo(()=>rows.filter(r=>{
    if(task!=='ALL'&&r.activity_id!==task)return false;
    const q=query.trim().toLowerCase();if(!q)return true;
    return `${r.author?.name||''} ${r.author?.class_name||''} ${r.activity_title}`.toLowerCase().includes(q);
  }),[rows,task,query]);
  return <AuthGate><AppShell title="Karya Mahasiswa"><div className="stack">
    <section className="hero-panel glass-panel"><div><span className="eyebrow">OPEN LEARNING PORTFOLIO</span><h2>Proyek dan Tugas Penelitian Mahasiswa</h2><p>Submission terbaru Tugas 1–5 dapat dipelajari oleh seluruh mahasiswa kelas. Nilai dan feedback dosen tetap privat.</p></div><div className="icon-bubble teal" style={{width:70,height:70,borderRadius:22}}><Users/></div></section>
    <GlassCard><div className="form-grid two"><label className="field"><span>Filter tugas</span><select value={task} onChange={e=>setTask(e.target.value)}><option value="ALL">Semua tugas</option>{FORMAL_TASKS.map(t=><option key={t.code} value={t.code}>Tugas {t.no} — {t.title}</option>)}</select></label><label className="field"><span>Cari mahasiswa / karya</span><div className="search-input"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nama mahasiswa atau judul tugas"/></div></label></div></GlassCard>
    {error&&<div className="error-box">{error}</div>}
    {loading?<div className="screen-center small"><div className="spinner"/>Memuat karya mahasiswa...</div>:<div className="project-public-grid">{filtered.map(r=><Link href={`/projects/${r.submission_id}`} key={r.submission_id} className="glass-card public-project-card"><div className="row between wrap gap"><div className="icon-bubble teal"><BookOpenCheck/></div><span className="badge">V{r.version}</span></div><span className="eyebrow">{r.week_id} • {r.activity_title}</span><h3>{r.author?.name||'Mahasiswa'}</h3><p className="muted tiny">{r.author?.class_name||'Kelas belum diisi'}</p><div className="row wrap gap">{r.activity_id==='TASK1_ISSUE'&&<span className="badge"><FileText/>{r.article_count} artikel</span>}<span className="badge"><Clock3/>{r.submitted_at?new Date(r.submitted_at).toLocaleDateString('id-ID'):'-'}</span></div><span className="button soft compact">Lihat proyek <ExternalLink/></span></Link>)}</div>}
    {!loading&&!filtered.length&&<GlassCard><p className="muted">Belum ada proyek yang sesuai filter.</p></GlassCard>}
  </div></AppShell></AuthGate>
}
