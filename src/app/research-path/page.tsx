'use client';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';
import GlassCard from '@/components/GlassCard';
import { FORMAL_TASKS } from '@/lib/courseConfig';
import { ArrowRight,BookOpenText,Search,GitBranch,ClipboardCheck,FileText,Route } from 'lucide-react';
const icons=[Search,BookOpenText,GitBranch,ClipboardCheck,FileText];
const evidence=[
  ['Fenomena/masalah spesifik','Minimal 5 artikel satu tema','Topik/judul awal'],
  ['Masalah & research gap','State of the art','Kritik metodologi artikel'],
  ['Rumusan masalah & tujuan','Variabel/fokus','Desain, populasi/sampel, analisis'],
  ['Definisi & indikator','Kisi-kisi instrumen','Validitas & reliabilitas'],
  ['BAB I','BAB II','BAB III']
];
export default function ResearchPathPage(){return <AuthGate><AppShell title="Jejak Penelitian"><div className="stack"><section className="hero-panel glass-panel"><div><span className="eyebrow">RESEARCH PIPELINE</span><h2>Dari Isu Menjadi Proposal Penelitian</h2><p>Lima tugas dirancang sebagai satu alur evidence. Mahasiswa tidak memulai ulang pada setiap tugas; output sebelumnya digunakan, diuji, dan diperbaiki untuk tahap berikutnya.</p></div><div className="icon-bubble teal" style={{width:72,height:72,borderRadius:24}}><Route/></div></section><div className="research-path-grid">{FORMAL_TASKS.map((t,i)=>{const Icon=icons[i];return <Link href={`/tasks/${t.code}`} className="glass-card research-step" key={t.code}><div className="row between"><span className="step-no">T{t.no}</span><Icon/></div><span className="eyebrow">{t.cpmk}</span><h3>{t.title}</h3><p className="muted tiny">{t.short}</p><div className="research-evidence"><strong>Evidence utama</strong>{evidence[i].map(x=><small key={x} style={{display:'block',marginTop:5}}>• {x}</small>)}</div><span className="button soft compact" style={{marginTop:'auto'}}>Buka tugas <ArrowRight/></span></Link>})}</div><GlassCard><span className="eyebrow">PRINSIP WORKFLOW</span><h3>Draft → Feedback → Revisi → Evidence Berikutnya</h3><p className="muted">Submission bersifat versioned. Dosen dapat memberi komentar tanpa nilai, kemudian mahasiswa mengirim revisi. Nilai formal dapat diberikan menggunakan rubrik yang tersedia pada Tugas 1–5.</p></GlassCard></div></AppShell></AuthGate>}
