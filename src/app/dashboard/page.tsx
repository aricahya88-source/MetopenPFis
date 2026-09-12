'use client';
import { useEffect,useState } from 'react';
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';
import GlassCard from '@/components/GlassCard';
import RichHtml from '@/components/RichHtml';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { meetingByNo,COURSE_NAME,FORMAL_TASKS } from '@/lib/courseConfig';
import { BookOpenText,CalendarDays,Award,ArrowRight,Megaphone,ScrollText,MessagesSquare,Route,ClipboardCheck,Clock3,CheckCircle2,TrendingUp } from 'lucide-react';
import Link from 'next/link';

type Dash={stats:{progress:number;activities:number;completed:number;graded:number};currentWeek?:{week_no:number;title:string};upcoming:Array<{activity_id:string;title:string;type:string;due_at:string}>;announcements:Array<{announcement_id:string;title:string;content_html:string;published_at:string}>};

function dateLabel(value?:string){
  if(!value)return 'Belum dijadwalkan';
  const d=new Date(value);if(Number.isNaN(d.getTime()))return value;
  return new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short',year:'numeric'}).format(d);
}
function daysLeft(value?:string){
  if(!value)return '';
  const ms=new Date(value).getTime()-Date.now();if(Number.isNaN(ms))return '';
  const days=Math.ceil(ms/86400000);
  if(days<0)return 'Terlewat';if(days===0)return 'Hari ini';if(days===1)return 'Besok';return `${days} hari lagi`;
}

export default function DashboardPage(){
  const{user}=useAuth();const[d,setD]=useState<Dash|null>(null);const[error,setError]=useState('');
  useEffect(()=>{api<Dash>('getDashboard').then(setD).catch(e=>setError(e.message))},[]);
  const plan=d?.currentWeek?meetingByNo(d.currentWeek.week_no):null;
  const isStudent=user?.role==='mahasiswa';
  return <AuthGate><AppShell title="Beranda">{error&&<div className="error-box">{error}</div>}{!d?<div className="screen-center small"><div className="spinner"/>Memuat dashboard...</div>:<div className="stack dashboard-v2">
    <section className="dashboard-hero">
      <div className="dashboard-hero-copy">
        <span className="eyebrow">SELAMAT DATANG, {user?.name?.toUpperCase()}</span>
        <h2>{isStudent?'Terus selangkah lebih dekat ke proposal penelitian Anda.':'Pantau perjalanan penelitian kelas dari satu tempat.'}</h2>
        <p>{plan?`Pertemuan ${d.currentWeek?.week_no} • Fase ${plan.phase} — ${plan.phaseLabel}`:COURSE_NAME}</p>
        <div className="row wrap gap dashboard-hero-actions">
          {d.currentWeek&&<Link className="button primary" href={`/weeks/${d.currentWeek.week_no}`}>Lanjutkan Pembelajaran <ArrowRight/></Link>}
          <Link className="button soft" href="/rencana-pembelajaran"><ScrollText/>Lihat RPS</Link>
        </div>
      </div>
      <div className="dashboard-progress-card">
        <div className="progress-orb" style={{background:`conic-gradient(var(--teal) ${Math.max(0,Math.min(100,d.stats.progress))*3.6}deg, rgba(46,125,50,.1) 0deg)`}}><strong>{d.stats.progress}%</strong><small>semester</small></div>
        <div><strong>Progress Semester</strong><span>{d.stats.completed} aktivitas selesai</span></div>
      </div>
    </section>

    <div className="stats-grid dashboard-stats">
      <GlassCard className="stat-card"><div className="icon-bubble teal"><ClipboardCheck/></div><div><strong>{FORMAL_TASKS.length}</strong><span>Tugas produk</span></div></GlassCard>
      <GlassCard className="stat-card"><div className="icon-bubble amber"><CalendarDays/></div><div><strong>{d.currentWeek?.week_no||1}</strong><span>Pertemuan aktif</span></div></GlassCard>
      <GlassCard className="stat-card"><div className="icon-bubble coral"><CheckCircle2/></div><div><strong>{d.stats.completed}</strong><span>Submission selesai</span></div></GlassCard>
      <GlassCard className="stat-card"><div className="icon-bubble teal"><Award/></div><div><strong>{d.stats.graded}</strong><span>Nilai terbit</span></div></GlassCard>
    </div>

    {d.currentWeek&&<section className="current-learning-card">
      <div className="current-learning-index">{String(d.currentWeek.week_no).padStart(2,'0')}</div>
      <div className="grow"><span className="eyebrow">PERTEMUAN SEDANG BERJALAN</span><h3>{d.currentWeek.title}</h3><p>{plan?.mode}</p></div>
      <Link className="button primary compact" href={`/weeks/${d.currentWeek.week_no}`}>Buka Pertemuan <ArrowRight/></Link>
    </section>}

    <div className="dashboard-main-grid">
      <section className="dashboard-deadlines">
        <div className="section-title"><div><span className="eyebrow">PRIORITAS</span><h3>Deadline Terdekat</h3></div><Link href="/tasks">Lihat semua</Link></div>
        <div className="stack small-gap">
          {d.upcoming.length?d.upcoming.slice(0,4).map(a=><Link href={a.type==='discussion'?`/discussions/${a.activity_id}`:`/tasks/${a.activity_id}`} key={a.activity_id} className="deadline-card">
            <div className={`deadline-icon ${a.type==='discussion'?'discussion':''}`}>{a.type==='discussion'?<MessagesSquare/>:<Clock3/>}</div>
            <div className="grow"><strong>{a.title}</strong><span>{dateLabel(a.due_at)}</span></div>
            <span className="deadline-pill">{daysLeft(a.due_at)||'Terjadwal'}</span>
          </Link>):<GlassCard><p className="muted">Belum ada deadline mendatang.</p></GlassCard>}
        </div>
      </section>
      <section className="dashboard-announcements">
        <div className="section-title"><div><span className="eyebrow">INFORMASI KELAS</span><h3>Pengumuman</h3></div></div>
        <div className="stack small-gap">{d.announcements.length?d.announcements.slice(0,3).map(a=><GlassCard key={a.announcement_id} className="announcement-card"><div className="icon-bubble amber"><Megaphone/></div><div className="grow"><strong>{a.title}</strong><small>{dateLabel(a.published_at)}</small><RichHtml html={a.content_html}/></div></GlassCard>):<GlassCard><p className="muted">Belum ada pengumuman.</p></GlassCard>}</div>
      </section>
    </div>

    <GlassCard className="pipeline-card"><div className="row between wrap gap"><div><span className="eyebrow">RESEARCH PIPELINE</span><h3>Dari Isu Menjadi Proposal</h3><p className="muted tiny">Setiap tugas membangun evidence untuk tahap penelitian berikutnya.</p></div><Link className="button soft compact" href="/research-path"><Route/>Lihat Jejak Penelitian</Link></div><div className="pipeline-line pipeline-v2">{FORMAL_TASKS.map((t,i)=><span key={t.code} style={{display:'contents'}}><Link href={`/tasks/${t.code}`} className="pipeline-node"><span>T{t.no}</span>{t.title.split('—')[0]}</Link>{i<FORMAL_TASKS.length-1&&<span className="pipeline-arrow">→</span>}</span>)}</div></GlassCard>

    {!isStudent&&<GlassCard className="lecturer-shortcut"><div className="icon-bubble teal"><TrendingUp/></div><div className="grow"><span className="eyebrow">PENGELOLAAN KELAS</span><h3>Butuh melihat submission dan penilaian?</h3><p className="muted">Buka dashboard admin untuk mengelola aktivitas, pengguna, rubrik, dan gradebook.</p></div><Link href="/admin" className="button primary compact">Dashboard Admin <ArrowRight/></Link></GlassCard>}
  </div>}</AppShell></AuthGate>;
}
