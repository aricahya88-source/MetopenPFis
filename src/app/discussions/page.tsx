'use client';
import { useEffect,useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';
import GlassCard from '@/components/GlassCard';
import RichHtml from '@/components/RichHtml';
import { api } from '@/lib/api';
import type { DiscussionSummary } from '@/lib/types';
import { MessagesSquare,ArrowRight,MessageCircle,Users } from 'lucide-react';

export default function DiscussionsPage(){const[rows,setRows]=useState<DiscussionSummary[]>([]);const[error,setError]=useState('');useEffect(()=>{api<DiscussionSummary[]>('listDiscussions').then(setRows).catch(e=>setError(e.message))},[]);return <AuthGate><AppShell title="Diskusi"><div className="stack discussions-v2">
  <section className="page-hero-compact"><div><span className="eyebrow">FORUM PEMBELAJARAN</span><h2>Diskusi Kelas</h2><p>Bertanya, menanggapi, dan menguji gagasan penelitian bersama dosen serta mahasiswa lain.</p></div><div className="hero-icon-square"><MessagesSquare/></div></section>
  <div className="discussion-summary-row"><GlassCard><MessageCircle/><div><strong>{rows.length}</strong><span>Topik diskusi</span></div></GlassCard><GlassCard><Users/><div><strong>{rows.reduce((n,r)=>n+(r.post_count||0),0)}</strong><span>Total post</span></div></GlassCard></div>
  {error&&<div className="error-box">{error}</div>}
  <div className="discussion-list-v2">{rows.length?rows.map(d=><Link href={`/discussions/${d.activity_id}`} className="discussion-row-v2" key={d.activity_id}><div className="discussion-avatar"><MessagesSquare/></div><div className="grow"><div className="row wrap gap"><span className="eyebrow">{d.week_id} • DISKUSI</span><span className="badge">Skala 0–100</span></div><h3>{d.title}</h3><div className="discussion-prompt"><RichHtml html={d.prompt_html||''}/></div><div className="discussion-meta"><span><MessageCircle/>{d.post_count||0} post</span>{d.due_label&&<span>{d.due_label}</span>}</div></div><ArrowRight/></Link>):<GlassCard><p className="muted">Belum ada diskusi aktif.</p></GlassCard>}</div>
</div></AppShell></AuthGate>}
