'use client';
import { useEffect,useMemo,useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';
import MaterialView from '@/components/MaterialView';
import { api } from '@/lib/api';
import type { Activity,Material } from '@/lib/types';
import { meetingByNo } from '@/lib/courseConfig';
import { ArrowLeft,ClipboardCheck,ArrowRight,Target,Activity as ActivityIcon,CheckCircle2,MessagesSquare,BookOpenText,Layers3 } from 'lucide-react';

type WeekData={week:{week_id:string;week_no:number;title:string;summary_html?:string};materials:Material[];activities:Activity[]};
export default function WeekPage(){
 const params=useParams<{week:string}>();const raw=Array.isArray(params?.week)?params.week[0]:params?.week;const weekNo=useMemo(()=>Number(raw),[raw]);const[d,setD]=useState<WeekData|null>(null);const[error,setError]=useState('');const plan=meetingByNo(weekNo);
 useEffect(()=>{if(!Number.isFinite(weekNo)||weekNo<1||weekNo>16){setError('Nomor pertemuan tidak valid.');return}api<WeekData>('getWeek',{week_no:weekNo}).then(setD).catch(e=>setError(e.message))},[weekNo]);
 const href=(a:Activity)=>a.type==='discussion'?`/discussions/${a.activity_id}`:`/tasks/${a.activity_id}`;
 const backendLinks=(d?.activities||[]).map(a=>href(a));
 return <AuthGate><AppShell title={`Pertemuan ${weekNo}`}>
  <div className="week-detail-v2">
   <div className="row between wrap gap week-detail-toolbar"><Link href="/weeks" className="button soft compact"><ArrowLeft/>Semua Pertemuan</Link><span className="badge success">Fase {plan?.phase||1}</span></div>
   {error&&<div className="error-box">{error}</div>}{!d&&!error?<div className="screen-center small"><div className="spinner"/>Memuat...</div>:null}
   {d&&<div className="stack">
    <section className="week-detail-hero"><div className="week-detail-number">{String(weekNo).padStart(2,'0')}</div><div className="grow"><span className="eyebrow">PERTEMUAN {weekNo} • {plan?.phaseLabel}</span><h2>{d.week.title}</h2><p>{plan?.mode}</p></div><div className="week-detail-meta"><span><BookOpenText/>{d.materials.length} materi</span><span><Layers3/>{d.activities.length} aktivitas</span></div></section>
    {plan&&<div className="learning-objective-grid"><section className="content-card"><div className="card-heading"><div className="icon-bubble teal"><Target/></div><div><span className="eyebrow">TUJUAN PEMBELAJARAN</span><h3>{plan.cpmk.join(' • ')}</h3></div></div><ul className="check-list">{plan.objectives.map((x,i)=><li key={i}><CheckCircle2/>{x}</li>)}</ul></section><section className="content-card"><div className="card-heading"><div className="icon-bubble amber"><ActivityIcon/></div><div><span className="eyebrow">AKTIVITAS KELAS</span><h3>{plan.mode}</h3></div></div><ul className="check-list neutral">{plan.during.map((x,i)=><li key={i}><CheckCircle2/>{x}</li>)}</ul></section></div>}
    <div className="section-title"><div><span className="eyebrow">MATERI PERTEMUAN</span><h3>Pelajari Materi</h3></div></div>
    {d.materials.map(m=><MaterialView key={m.material_id} material={m}/>)}
    {plan&&<section className="content-card evidence-card"><div className="card-heading"><div className="icon-bubble coral"><BookOpenText/></div><div><span className="eyebrow">OUTPUT / BUKTI BELAJAR</span><h3>Evidence untuk Jejak Penelitian</h3></div></div><div className="evidence-list">{plan.outputs.map((x,i)=><p key={i}><CheckCircle2/> {x}</p>)}</div></section>}
    <div className="section-title"><div><span className="eyebrow">TINDAK LANJUT</span><h3>Aktivitas Terkait</h3></div></div>
    {(plan?.activityHref||d.activities.length)?<div className="activity-grid">
      {plan?.activityHref&&!backendLinks.includes(plan.activityHref)&&<Link href={plan.activityHref} className="activity-card-v2"><div className="icon-bubble coral"><ClipboardCheck/></div><div className="grow"><span className="eyebrow">AKTIVITAS UTAMA</span><h3>{plan.activityLabel||'Buka Aktivitas'}</h3></div><ArrowRight/></Link>}
      {d.activities.map(a=><Link key={a.activity_id} href={href(a)} className="activity-card-v2"><div className="icon-bubble coral">{a.type==='discussion'?<MessagesSquare/>:<ClipboardCheck/>}</div><div className="grow"><span className="eyebrow">{a.type.toUpperCase()}</span><h3>{a.title}</h3></div><ArrowRight/></Link>)}
    </div>:<div className="notice">Tidak ada submission wajib pada pertemuan ini. Gunakan materi dan bukti proses untuk memperkuat tugas berikutnya.</div>}
   </div>}
  </div>
 </AppShell></AuthGate>;
}
