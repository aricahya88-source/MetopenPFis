'use client';
import { useEffect,useMemo,useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';
import GlassCard from '@/components/GlassCard';
import RichHtml from '@/components/RichHtml';
import { api } from '@/lib/api';
import { ArrowLeft,ExternalLink,FileText,UserRound,Clock3 } from 'lucide-react';

type Article={slot_no:number;url?:string;file_url?:string;file_name?:string};
type Data={activity?:{activity_id:string;title:string;week_id:string}|null;author?:{name:string;class_name?:string}|null;submission:{submission_id:string;activity_id:string;version:number;content_html:string;link_url?:string;file_url?:string;file_name?:string;submitted_at?:string;articles?:Article[]}};

export default function PublicProjectDetail(){
 const params=useParams<{id:string|string[]}>();const sid=useMemo(()=>Array.isArray(params?.id)?String(params.id[0]||''):String(params?.id||''),[params]);const[data,setData]=useState<Data|null>(null),[error,setError]=useState('');
 useEffect(()=>{if(sid)api<Data>('getPublicProject',{submission_id:sid}).then(setData).catch(e=>setError(e.message))},[sid]);
 return <AuthGate><AppShell title="Karya Mahasiswa"><Link href="/projects" className="button soft compact"><ArrowLeft/>Kembali</Link>{error&&<div className="error-box">{error}</div>}{!data&&!error?<div className="screen-center small"><div className="spinner"/>Memuat proyek...</div>:null}{data&&<div className="stack" style={{marginTop:14}}>
   <section className="hero-panel glass-panel"><div><span className="eyebrow">{data.activity?.week_id} • SUBMISSION V{data.submission.version}</span><h2>{data.activity?.title||'Proyek Mahasiswa'}</h2><div className="row wrap gap"><span className="badge"><UserRound/>{data.author?.name||'Mahasiswa'}</span>{data.author?.class_name&&<span className="badge">{data.author.class_name}</span>}{data.submission.submitted_at&&<span className="badge"><Clock3/>{new Date(data.submission.submitted_at).toLocaleString('id-ID')}</span>}</div></div></section>
   {data.submission.articles?.length?<GlassCard><span className="eyebrow">SUMBER ARTIKEL</span><h3>5 Artikel yang Dianalisis</h3><div className="stack small-gap">{data.submission.articles.map(a=><div className="article-source-view" key={a.slot_no}><strong>Artikel {a.slot_no}</strong>{a.url&&<a className="button soft compact" href={a.url} target="_blank" rel="noreferrer"><ExternalLink/>Buka Link</a>}{a.file_url&&<a className="button soft compact" href={a.file_url} target="_blank" rel="noreferrer"><FileText/>{a.file_name||'Buka PDF'}</a>}</div>)}</div></GlassCard>:null}
   <GlassCard><span className="eyebrow">ISI PROYEK</span><RichHtml html={data.submission.content_html||'<p>Belum ada isi.</p>'}/><div className="row wrap gap">{data.submission.link_url&&<a className="button soft compact" href={data.submission.link_url} target="_blank" rel="noreferrer"><ExternalLink/>Buka tautan pendukung</a>}{data.submission.file_url&&<a className="button soft compact" href={data.submission.file_url} target="_blank" rel="noreferrer"><FileText/>{data.submission.file_name||'Buka dokumen'}</a>}</div></GlassCard>
   <div className="notice">Karya ini dibuka untuk pembelajaran sejawat. Nilai dan feedback dosen tidak ditampilkan kepada mahasiswa lain.</div>
 </div>}</AppShell></AuthGate>
}
