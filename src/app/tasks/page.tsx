'use client';
import { useEffect,useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';
import GlassCard from '@/components/GlassCard';
import { api } from '@/lib/api';
import { FORMAL_TASKS } from '@/lib/courseConfig';
import { ClipboardCheck,ArrowRight,CalendarClock,CheckCircle2,FileCheck2 } from 'lucide-react';
type Row={activity_id:string;week_id:string;type:string;title:string;max_score:number;due_at?:string;submitted?:boolean;status?:string};
export default function TasksPage(){const[rows,setRows]=useState<Row[]>([]);const[error,setError]=useState('');useEffect(()=>{api<Row[]>('listTasks').then(setRows).catch(e=>setError(e.message))},[]);const byId=Object.fromEntries(rows.map(r=>[r.activity_id,r]));const evalRows=rows.filter(r=>['UTS_METOPEN','UAS_METOPEN'].includes(r.activity_id));return <AuthGate><AppShell title="Tugas Penelitian"><div className="section-title"><div><span className="eyebrow">5 PRODUK TUGAS • BERJENJANG</span><h2>Dari Isu Menjadi Proposal</h2><p className="muted">Setiap tugas menjadi evidence untuk tugas berikutnya. Rubrik berasal dari kisi-kisi mata kuliah yang diunggah.</p></div></div>{error&&<div className="error-box">{error}</div>}<div className="stack small-gap">{FORMAL_TASKS.map(t=>{const r=byId[t.code];return <Link href={`/tasks/${t.code}`} key={t.code} className="glass-card list-card"><div className="icon-bubble teal"><ClipboardCheck/></div><div className="grow"><span className="eyebrow">TUGAS {t.no} • {t.cpmk} • PERTEMUAN {t.week}</span><h3>{t.title}</h3><p className="muted tiny">{t.short}</p><div className="row wrap gap"><span className="badge">Rubrik 4–1</span>{r?.due_at&&<span className="badge"><CalendarClock/>Deadline tersedia</span>}{r?.submitted&&<span className="badge success"><CheckCircle2/>Sudah submit</span>}</div></div><ArrowRight/></Link>})}</div>
{evalRows.length>0&&<><div className="section-title"><div><span className="eyebrow">EVALUASI SEMESTER</span><h3>UTS & UAS</h3></div></div><div className="stack small-gap">{evalRows.map(r=><Link href={`/tasks/${r.activity_id}`} key={r.activity_id} className="glass-card list-card"><div className="icon-bubble amber"><FileCheck2/></div><div className="grow"><span className="eyebrow">{r.week_id}</span><h3>{r.title}</h3><small>Instruksi detail dapat diatur dosen melalui Kelola Aktivitas.</small>{r.submitted&&<span className="badge success"><CheckCircle2/>Sudah submit</span>}</div><ArrowRight/></Link>)}</div></>}
</AppShell></AuthGate>}
