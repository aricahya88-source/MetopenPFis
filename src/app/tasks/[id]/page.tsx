'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';
import GlassCard from '@/components/GlassCard';
import RichHtml from '@/components/RichHtml';
import RichTextEditor from '@/components/RichTextEditor';
import { api, fileToBase64 } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { rubricFor } from '@/lib/taskRubrics';
import { ArrowLeft, Upload, ExternalLink, ClipboardCheck, Scale } from 'lucide-react';

type TaskData={
  activity:{activity_id:string;type:string;title:string;description_html:string;max_score:number;due_at:string;allow_comments:boolean};
  latest?:{submission_id:string;version:number;content_html:string;link_url:string;file_url:string;file_name:string;submitted_at:string};
  grade?:{score:number;max_score:number;feedback_html:string};
  comments:Array<{comment_id:string;content_html:string;created_at:string;author?:{name:string}}>;
};

export default function TaskPage({params}:{params:Promise<{id:string}>}){
  const {id}=use(params); const rubric=rubricFor(id);
  const [d,setD]=useState<TaskData|null>(null);const [error,setError]=useState('');
  const [content,setContent]=useState('');const [link,setLink]=useState('');const [file,setFile]=useState<File|null>(null);const [busy,setBusy]=useState(false);
  const load=()=>api<TaskData>('getTask',{activity_id:id}).then(setD).catch(e=>setError(e.message));
  useEffect(()=>{load();},[id]);
  const submit=async()=>{setBusy(true);setError('');try{let base64='';let file_name='';let file_mime='';if(file){if(file.size>5*1024*1024)throw new Error('File langsung maksimal 5 MB. Untuk file lebih besar gunakan URL Google Drive.');base64=await fileToBase64(file);file_name=file.name;file_mime=file.type;}await api('submitWork',{activity_id:id,content_html:content,link_url:link,file_base64:base64,file_name,file_mime});setContent('');setLink('');setFile(null);await load();}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}};
  return <AuthGate><AppShell title="Tugas Penelitian"><Link href="/tasks" className="button soft compact"><ArrowLeft/>Kembali</Link>{error&&<div className="error-box">{error}</div>}{!d?<div className="screen-center small"><div className="spinner"/>Memuat tugas...</div>:<div className="stack">
    <GlassCard><div className="row gap"><div className="icon-bubble teal"><ClipboardCheck/></div><div className="grow"><span className="eyebrow">{d.activity.type.toUpperCase()}</span><h2>{d.activity.title}</h2></div></div><RichHtml html={d.activity.description_html||'<p>Instruksi belum diisi.</p>'}/><div className="row wrap gap"><span className="badge">Skala nilai 0–100</span>{d.activity.due_at&&<span className="badge">{formatDate(d.activity.due_at)}</span>}</div></GlassCard>
    {rubric&&<GlassCard><div className="row gap"><div className="icon-bubble amber"><Scale/></div><div><span className="eyebrow">RUBRIK PENILAIAN</span><h3>{rubric.name}</h3></div></div>{rubric.note&&<p className="source-note">{rubric.note}</p>}<div style={{overflowX:'auto'}}><table className="rubric-table"><thead><tr><th>Aspek</th><th>Bobot</th><th>4</th><th>3</th><th>2</th><th>1</th></tr></thead><tbody>{rubric.criteria.map(c=><tr key={c.id}><td><strong>{c.name}</strong></td><td>{c.weight}%</td>{[4,3,2,1].map(v=><td className="rubric-level" key={v}>{c.levels.find(x=>x.score===v)?.description}</td>)}</tr>)}</tbody></table></div></GlassCard>}
    {d.grade&&<GlassCard className="grade-highlight"><div><span className="eyebrow">NILAI TERBIT</span><h2>{d.grade.score} / {d.grade.max_score}</h2></div><RichHtml html={d.grade.feedback_html||'<p>Belum ada feedback tertulis.</p>'}/></GlassCard>}
    {d.latest&&<GlassCard><span className="eyebrow">SUBMISSION TERAKHIR • VERSI {d.latest.version}</span><RichHtml html={d.latest.content_html}/>{d.latest.link_url&&<a className="button soft compact" target="_blank" rel="noreferrer" href={d.latest.link_url}><ExternalLink/>Buka tautan</a>}{d.latest.file_url&&<a className="button soft compact" target="_blank" rel="noreferrer" href={d.latest.file_url}><ExternalLink/>{d.latest.file_name||'Buka file'}</a>}<small>{formatDate(d.latest.submitted_at)}</small></GlassCard>}
    <GlassCard><span className="eyebrow">{d.latest?'KIRIM REVISI':'KUMPULKAN'}</span><h3>Submission</h3><p className="muted">Tuliskan ringkasan/penjelasan submission. Dokumen utama dapat dikirim sebagai file kecil atau tautan Google Drive. Setiap pengiriman ulang dibuat sebagai versi baru.</p><RichTextEditor value={content} onChange={setContent} minHeight={180}/><div className="form-grid two"><label className="field"><span>URL dokumen / Google Drive</span><input value={link} onChange={e=>setLink(e.target.value)} placeholder="https://..."/></label><label className="field"><span>File langsung (maks. 5 MB)</span><input type="file" onChange={e=>setFile(e.target.files?.[0]||null)}/></label></div><div className="right-actions"><button className="button primary" disabled={busy} onClick={submit}><Upload/>{busy?'Mengirim...':'Kirim Submission'}</button></div></GlassCard>
    {d.comments.length>0&&<><div className="section-title"><h3>Komentar & Feedback</h3></div><div className="stack small-gap">{d.comments.map(c=><GlassCard key={c.comment_id}><strong>{c.author?.name||'Pengguna'}</strong><RichHtml html={c.content_html}/><small>{formatDate(c.created_at)}</small></GlassCard>)}</div></>}
  </div>}</AppShell></AuthGate>;
}
