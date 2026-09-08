'use client';
import { useEffect,useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';
import { api } from '@/lib/api';
import type { WeekSummary } from '@/lib/types';
import { MEETINGS,PHASES } from '@/lib/courseConfig';
import { CalendarDays,ArrowRight,BookOpenText,ClipboardCheck,Flag } from 'lucide-react';
export default function WeeksPage(){const[rows,setRows]=useState<WeekSummary[]>([]);const[error,setError]=useState('');useEffect(()=>{api<WeekSummary[]>('listWeeks').then(setRows).catch(e=>setError(e.message))},[]);return <AuthGate><AppShell title="Pertemuan Pembelajaran"><div className="section-title"><div><span className="eyebrow">16 PERTEMUAN • 3 SKS • 3 FASE</span><h2>Research Learning Journey</h2><p className="muted">Foundations → Research Design → Evidence & Proposal.</p></div></div><div className="two-column">{PHASES.map(p=><div className="glass-card feature-card" key={p.no}><div className="icon-bubble amber"><Flag/></div><div><span className="eyebrow">FASE {p.no} • {p.range}</span><h3>{p.label}</h3><p className="muted">{p.description}</p></div></div>)}</div>{error&&<div className="error-box">{error}</div>}<div className="week-grid">{rows.map(w=>{const m=MEETINGS.find(x=>x.no===w.week_no);return <Link key={w.week_id} href={`/weeks/${w.week_no}`} className="glass-card week-tile"><div className="week-number"><CalendarDays/><strong>{String(w.week_no).padStart(2,'0')}</strong></div><div className="grow"><span className="eyebrow">PERTEMUAN {w.week_no} • FASE {m?.phase||1}</span><h3>{w.title}</h3><p className="muted tiny">{m?.mode}</p><div className="row wrap gap"><span className="badge"><BookOpenText/>{w.material_count} unit materi</span><span className="badge"><ClipboardCheck/>{w.activity_count} aktivitas</span></div></div><ArrowRight/></Link>})}</div></AppShell></AuthGate>}
