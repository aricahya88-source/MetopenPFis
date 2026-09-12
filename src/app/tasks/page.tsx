'use client';
import { useEffect,useMemo,useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';
import { api } from '@/lib/api';
import { FORMAL_TASKS } from '@/lib/courseConfig';
import { ClipboardCheck,ArrowRight,CalendarClock,CheckCircle2,FileCheck2,Clock3 } from 'lucide-react';

type Row={activity_id:string;week_id:string;type:string;title:string;max_score:number;due_at?:string;submitted?:boolean;status?:string};
type Filter='all'|'active'|'done';
function formatDue(value?:string){if(!value)return 'Deadline belum ditentukan';const d=new Date(value);if(Number.isNaN(d.getTime()))return value;return new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short',year:'numeric'}).format(d)}
function countdown(value?:string){if(!value)return '';const ms=new Date(value).getTime()-Date.now();if(Number.isNaN(ms))return '';const days=Math.ceil(ms/86400000);if(days<0)return 'Deadline lewat';if(days===0)return 'Hari ini';if(days===1)return 'Besok';return `${days} hari lagi`;}

export default function TasksPage(){
 const[rows,setRows]=useState<Row[]>([]);const[error,setError]=useState('');const[filter,setFilter]=useState<Filter>('all');
 useEffect(()=>{api<Row[]>('listTasks').then(setRows).catch(e=>setError(e.message))},[]);
 const byId=Object.fromEntries(rows.map(r=>[r.activity_id,r]));
 const visibleTasks=useMemo(()=>FORMAL_TASKS.filter(t=>{const r=byId[t.code];if(filter==='done')return !!r?.submitted;if(filter==='active')return !r?.submitted;return true}),[byId,filter]);
 const evalRows=rows.filter(r=>['UTS_METOPEN','UAS_METOPEN'].includes(r.activity_id));
 return <AuthGate><AppShell title="Tugas">
  <div className="stack tasks-v2">
   <section className="page-hero-compact"><div><span className="eyebrow">5 PRODUK TUGAS • BERJENJANG</span><h2>Dari Isu Menjadi Proposal</h2><p>Setiap tugas membangun evidence untuk tahap berikutnya. Pantau status, deadline, dan submission dari satu halaman.</p></div><div className="hero-icon-square"><ClipboardCheck/></div></section>
   <div className="task-filter-tabs"><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>Semua</button><button className={filter==='active'?'active':''} onClick={()=>setFilter('active')}>Aktif</button><button className={filter==='done'?'active':''} onClick={()=>setFilter('done')}>Selesai</button></div>
   {error&&<div className="error-box">{error}</div>}
   <div className="task-list-v2">{visibleTasks.map(t=>{const r=byId[t.code];const done=!!r?.submitted;return <Link href={`/tasks/${t.code}`} key={t.code} className="task-row-v2">
     <div className={`task-status-icon ${done?'done':''}`}>{done?<CheckCircle2/>:<ClipboardCheck/>}</div>
     <div className="grow"><div className="row wrap gap"><span className="eyebrow">TUGAS {t.no} • {t.cpmk} • PERTEMUAN {t.week}</span>{done&&<span className="badge success">Sudah submit</span>}</div><h3>{t.title}</h3><p>{t.short}</p><div className="task-meta-row"><span><CalendarClock/>{formatDue(r?.due_at)}</span>{r?.due_at&&!done&&<span className="deadline-pill"><Clock3/>{countdown(r.due_at)}</span>}<span>Rubrik 4–1</span></div></div>
     <span className="task-open"><ArrowRight/></span>
   </Link>})}</div>
   {visibleTasks.length===0&&<div className="content-card empty-state"><CheckCircle2/><h3>Tidak ada tugas pada filter ini</h3><p>Gunakan tab lain untuk melihat daftar tugas.</p></div>}
   {evalRows.length>0&&<section><div className="section-title"><div><span className="eyebrow">EVALUASI SEMESTER</span><h3>UTS & UAS</h3></div></div><div className="task-list-v2 compact">{evalRows.map(r=><Link href={`/tasks/${r.activity_id}`} key={r.activity_id} className="task-row-v2"><div className="task-status-icon exam"><FileCheck2/></div><div className="grow"><span className="eyebrow">{r.week_id}</span><h3>{r.title}</h3><div className="task-meta-row"><span><CalendarClock/>{formatDue(r.due_at)}</span>{r.submitted&&<span className="badge success"><CheckCircle2/>Sudah submit</span>}</div></div><span className="task-open"><ArrowRight/></span></Link>)}</div></section>}
  </div>
 </AppShell></AuthGate>;
}
