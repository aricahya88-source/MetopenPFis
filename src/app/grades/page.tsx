'use client';
import { useEffect,useMemo,useState } from 'react';
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';
import GlassCard from '@/components/GlassCard';
import RichHtml from '@/components/RichHtml';
import { api } from '@/lib/api';
import type { Grade } from '@/lib/types';
import { Award, Info, CheckCircle2, BarChart3, ClipboardCheck } from 'lucide-react';

export default function GradesPage(){
 const[rows,setRows]=useState<Grade[]>([]);const[error,setError]=useState('');useEffect(()=>{api<Grade[]>('listGrades').then(setRows).catch(e=>setError(e.message))},[]);
 const avg=useMemo(()=>rows.length?Math.round(rows.reduce((n,g)=>n+Number(g.score||0),0)/rows.length):0,[rows]);
 const best=useMemo(()=>rows.length?Math.max(...rows.map(g=>Number(g.score||0))):0,[rows]);
 return <AuthGate><AppShell title="Nilai"><div className="stack grades-v2">
  <section className="page-hero-compact"><div><span className="eyebrow">GRADEBOOK OBE</span><h2>Nilai & Feedback</h2><p>Pantau nilai per aktivitas dan gunakan feedback dosen untuk memperbaiki evidence penelitian berikutnya.</p></div><div className="hero-icon-square"><Award/></div></section>
  <div className="grade-stat-grid"><GlassCard><div className="icon-bubble teal"><BarChart3/></div><div><strong>{avg}</strong><span>Rata-rata nilai</span></div></GlassCard><GlassCard><div className="icon-bubble amber"><Award/></div><div><strong>{best}</strong><span>Nilai tertinggi</span></div></GlassCard><GlassCard><div className="icon-bubble coral"><ClipboardCheck/></div><div><strong>{rows.length}</strong><span>Nilai dipublikasikan</span></div></GlassCard></div>
  {error&&<div className="error-box">{error}</div>}
  <div className="notice"><Info size={16}/> Seluruh rubrik Tugas 1–5 menggunakan total bobot 100%. Bobot akhir mata kuliah tetap mengikuti RPS dan kebijakan dosen.</div>
  <div className="grade-list-v2">{rows.length?rows.map(g=><GlassCard key={g.grade_id} className="grade-row-v2"><div className="grade-score-badge"><strong>{g.score}</strong><span>/100</span></div><div className="grow"><div className="row wrap gap"><h3>{g.activity_title||g.activity_id}</h3><span className="badge success"><CheckCircle2/>Dipublikasikan</span></div><RichHtml html={g.feedback_html||'<p class="muted">Belum ada feedback tertulis.</p>'}/></div></GlassCard>):<GlassCard><p className="muted">Belum ada nilai yang dipublikasikan.</p></GlassCard>}</div>
 </div></AppShell></AuthGate>}
