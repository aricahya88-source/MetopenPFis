'use client';
import { useEffect,useMemo,useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';
import { api } from '@/lib/api';
import type { WeekSummary } from '@/lib/types';
import { MEETINGS,PHASES } from '@/lib/courseConfig';
import { CalendarDays,ArrowRight,BookOpenText,ClipboardCheck,Flag,CheckCircle2 } from 'lucide-react';

export default function WeeksPage(){
  const[rows,setRows]=useState<WeekSummary[]>([]);const[error,setError]=useState('');
  useEffect(()=>{api<WeekSummary[]>('listWeeks').then(setRows).catch(e=>setError(e.message))},[]);
  const rowsByWeek=useMemo(()=>Object.fromEntries(rows.map(w=>[w.week_no,w] as const)),[rows]);
  return <AuthGate><AppShell title="Pertemuan">
    <div className="stack weeks-v2">
      <section className="page-hero-compact"><div><span className="eyebrow">16 PERTEMUAN • 3 FASE PEMBELAJARAN</span><h2>Research Learning Journey</h2><p>Ikuti alur dari fondasi penelitian, perancangan metode, hingga sintesis evidence dan proposal.</p></div><Link href="/rencana-pembelajaran" className="button soft compact">Lihat RPS <ArrowRight/></Link></section>
      {error&&<div className="error-box">{error}</div>}
      {PHASES.map(phase=>{
        const meetings=MEETINGS.filter(m=>m.phase===phase.no);
        return <section className="phase-section" key={phase.no}>
          <div className="phase-header">
            <div className={`phase-marker phase-${phase.no}`}><Flag/></div>
            <div className="grow"><div className="row wrap gap"><span className="eyebrow">FASE {phase.no}</span><span className="badge">{phase.range}</span></div><h3>{phase.label}</h3><p>{phase.description}</p></div>
            <span className="phase-count">{meetings.length} pertemuan</span>
          </div>
          <div className="phase-meeting-list">
            {meetings.map(m=>{const w=rowsByWeek[m.no];return <Link key={m.no} href={`/weeks/${m.no}`} className="meeting-row-card">
              <div className="meeting-step"><span>{m.no}</span></div>
              <div className="grow"><div className="row wrap gap"><strong>{w?.title||m.title}</strong>{m.activityHref&&<span className="badge success"><CheckCircle2/>Ada aktivitas</span>}</div><small>{m.mode}</small><div className="row wrap gap meeting-meta"><span><BookOpenText/>{w?.material_count??0} materi</span><span><ClipboardCheck/>{w?.activity_count??0} aktivitas</span></div></div>
              <ArrowRight className="meeting-arrow"/>
            </Link>})}
          </div>
        </section>;
      })}
    </div>
  </AppShell></AuthGate>;
}
