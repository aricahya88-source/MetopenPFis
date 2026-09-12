'use client';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';
import GlassCard from '@/components/GlassCard';
import { FORMAL_TASKS } from '@/lib/courseConfig';
import { ArrowRight,BookOpenText,Search,GitBranch,ClipboardCheck,FileText,Route,CheckCircle2 } from 'lucide-react';
const icons=[Search,BookOpenText,GitBranch,ClipboardCheck,FileText];
const evidence=[
  ['Fenomena/masalah spesifik','Minimal 5 artikel satu tema','Topik/judul awal'],
  ['Masalah & research gap','State of the art','Kritik metodologi artikel'],
  ['Rumusan masalah & tujuan','Variabel/fokus','Desain, populasi/sampel, analisis'],
  ['Definisi & indikator','Kisi-kisi instrumen','Validitas & reliabilitas'],
  ['BAB I','BAB II','BAB III']
];
export default function ResearchPathPage(){return <AuthGate><AppShell title="Jejak Penelitian"><div className="stack research-path-v2">
  <section className="page-hero-compact research-hero"><div><span className="eyebrow">RESEARCH PIPELINE</span><h2>Dari Isu Menjadi Proposal Penelitian</h2><p>Lima tugas adalah satu perjalanan yang saling terhubung. Evidence dari tahap sebelumnya digunakan, diuji, dan diperbaiki pada tahap berikutnya.</p></div><div className="hero-icon-square"><Route/></div></section>
  <div className="research-timeline-v2">
    {FORMAL_TASKS.map((t,i)=>{const Icon=icons[i];return <div className="research-timeline-item" key={t.code}>
      <div className="research-rail"><span>{t.no}</span>{i<FORMAL_TASKS.length-1&&<i/>}</div>
      <Link href={`/tasks/${t.code}`} className="research-card-v2">
        <div className="research-card-head"><div className={`research-icon phase-${i+1}`}><Icon/></div><div className="grow"><span className="eyebrow">TAHAP {t.no} • {t.cpmk}</span><h3>{t.title}</h3></div><ArrowRight/></div>
        <p>{t.short}</p>
        <div className="research-evidence-v2"><strong>Evidence utama</strong>{evidence[i].map(x=><span key={x}><CheckCircle2/>{x}</span>)}</div>
      </Link>
    </div>})}
  </div>
  <GlassCard className="workflow-note"><div className="icon-bubble teal"><Route/></div><div><span className="eyebrow">PRINSIP WORKFLOW</span><h3>Draft → Feedback → Revisi → Evidence Berikutnya</h3><p className="muted">Submission bersifat versioned. Dosen dapat memberi komentar, mahasiswa melakukan revisi, lalu hasilnya menjadi fondasi tahap penelitian berikutnya.</p></div></GlassCard>
</div></AppShell></AuthGate>}
