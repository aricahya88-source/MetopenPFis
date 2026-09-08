'use client';
import { useEffect,useState } from 'react';
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';
import GlassCard from '@/components/GlassCard';
import RichHtml from '@/components/RichHtml';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { meetingByNo,COURSE_NAME,COURSE_TAGLINE,FORMAL_TASKS } from '@/lib/courseConfig';
import { BookOpenText,CalendarDays,Award,ArrowRight,Megaphone,ScrollText,MessagesSquare,Route,ClipboardCheck } from 'lucide-react';
import Link from 'next/link';

type Dash={stats:{progress:number;activities:number;completed:number;graded:number};currentWeek?:{week_no:number;title:string};upcoming:Array<{activity_id:string;title:string;type:string;due_at:string}>;announcements:Array<{announcement_id:string;title:string;content_html:string;published_at:string}>};

export default function DashboardPage(){
  const{user}=useAuth();const[d,setD]=useState<Dash|null>(null);const[error,setError]=useState('');
  useEffect(()=>{api<Dash>('getDashboard').then(setD).catch(e=>setError(e.message))},[]);
  const plan=d?.currentWeek?meetingByNo(d.currentWeek.week_no):null;
  return <AuthGate><AppShell title="Beranda">{error&&<div className="error-box">{error}</div>}{!d?<div className="screen-center small"><div className="spinner"/>Memuat dashboard...</div>:<div className="stack">
    <section className="hero-panel glass-panel"><div><span className="eyebrow">HALO, {user?.name?.toUpperCase()}</span><h2>{user?.role==='mahasiswa'?COURSE_TAGLINE:'Kelola materi, tugas penelitian, rubrik, diskusi, feedback, dan proposal mahasiswa dari satu LMS.'}</h2><p>{plan?`Fase ${plan.phase} — ${plan.phaseLabel}`:COURSE_NAME}</p></div><div className="progress-orb"><strong>{d.stats.progress}%</strong><small>progress</small></div></section>
    <div className="stats-grid"><GlassCard className="stat-card"><div className="icon-bubble teal"><ClipboardCheck/></div><div><strong>{FORMAL_TASKS.length}</strong><span>Tugas produk</span></div></GlassCard><GlassCard className="stat-card"><div className="icon-bubble amber"><CalendarDays/></div><div><strong>{d.currentWeek?.week_no||1}</strong><span>Pertemuan aktif</span></div></GlassCard><GlassCard className="stat-card"><div className="icon-bubble coral"><BookOpenText/></div><div><strong>{d.stats.completed}</strong><span>Submission selesai</span></div></GlassCard><GlassCard className="stat-card"><div className="icon-bubble teal"><Award/></div><div><strong>{d.stats.graded}</strong><span>Nilai terbit</span></div></GlassCard></div>
    {d.currentWeek&&<GlassCard className="feature-card"><div className="icon-bubble teal"><CalendarDays/></div><div className="grow"><span className="eyebrow">PERTEMUAN BERJALAN</span><h3>{d.currentWeek.title}</h3><p className="muted">{plan?.mode}</p><div className="row wrap gap"><Link className="button soft compact" href="/rencana-pembelajaran"><ScrollText/>Lihat RPS</Link><Link className="button primary compact" href={`/weeks/${d.currentWeek.week_no}`}>Buka Pertemuan <ArrowRight/></Link></div></div></GlassCard>}
    <GlassCard><div className="row between wrap gap"><div><span className="eyebrow">RESEARCH PIPELINE</span><h3>Dari Isu Menjadi Proposal</h3></div><Link className="button soft compact" href="/research-path"><Route/>Lihat Jejak Penelitian</Link></div><div className="pipeline-line">{FORMAL_TASKS.map((t,i)=><span key={t.code} style={{display:'contents'}}><Link href={`/tasks/${t.code}`} className="pipeline-node">T{t.no} {t.title.split('—')[0]}</Link>{i<FORMAL_TASKS.length-1&&<span className="pipeline-arrow">→</span>}</span>)}</div></GlassCard>
    <div className="two-column"><div><div className="section-title"><h3>Aktivitas Mendatang</h3></div><div className="stack small-gap">{d.upcoming.length?d.upcoming.map(a=><GlassCard key={a.activity_id} className="list-card"><div className="icon-bubble amber">{a.type==='discussion'?<MessagesSquare/>:<BookOpenText/>}</div><div className="grow"><strong>{a.title}</strong><small>{a.type}</small></div></GlassCard>):<GlassCard><p className="muted">Belum ada deadline.</p></GlassCard>}</div></div><div><div className="section-title"><h3>Pengumuman</h3></div><div className="stack small-gap">{d.announcements.length?d.announcements.map(a=><GlassCard key={a.announcement_id} className="list-card"><div className="icon-bubble coral"><Megaphone/></div><div className="grow"><strong>{a.title}</strong><RichHtml html={a.content_html}/></div></GlassCard>):<GlassCard><p className="muted">Belum ada pengumuman.</p></GlassCard>}</div></div></div>
  </div>}</AppShell></AuthGate>;
}
