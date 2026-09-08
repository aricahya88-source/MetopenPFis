'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';
import GlassCard from '@/components/GlassCard';
import RichTextEditor from '@/components/RichTextEditor';
import { api } from '@/lib/api';
import { Plus, Save } from 'lucide-react';

type A={announcement_id?:string;title:string;content_html:string;published_at:string;visible:boolean};
const empty:A={title:'',content_html:'',published_at:'',visible:true};
export default function AdminAnnouncements(){
  const[rows,setRows]=useState<A[]>([]);const[a,setA]=useState<A>(empty);const[msg,setMsg]=useState('');
  const load=()=>api<A[]>('adminListAnnouncements').then(setRows);
  useEffect(()=>{load().catch(e=>setMsg(e.message));},[]);
  const save=async()=>{try{const d=await api<{announcement:A}>('adminSaveAnnouncement',{announcement:a});setA(d.announcement);setMsg('Pengumuman tersimpan.');await load()}catch(e){setMsg(e instanceof Error?e.message:String(e))}};
  return <AuthGate adminOnly><AppShell title="Pengumuman"><div className="admin-split">
    <GlassCard className="admin-list"><div className="row between"><div><span className="eyebrow">INFO KELAS</span><h3>Pengumuman</h3></div><button className="icon-button" onClick={()=>setA({...empty})}><Plus/></button></div><div className="scroll-list">{rows.map(x=><button key={x.announcement_id} className={a.announcement_id===x.announcement_id?'select-row active':'select-row'} onClick={()=>setA(x)}><strong>{x.title}</strong><small>{x.visible?'Tampil':'Draft'}</small></button>)}</div></GlassCard>
    <GlassCard><label className="field"><span>Judul</span><input value={a.title} onChange={e=>setA({...a,title:e.target.value})}/></label><label className="field"><span>Isi</span><RichTextEditor value={a.content_html} onChange={v=>setA({...a,content_html:v})} minHeight={300}/></label><label className="switch-row"><input type="checkbox" checked={a.visible} onChange={e=>setA({...a,visible:e.target.checked})}/>Tampilkan di dashboard</label><div className="right-actions"><button className="button primary" onClick={save}><Save/>Simpan</button></div></GlassCard>
  </div>{msg&&<div className="notice">{msg}</div>}</AppShell></AuthGate>
}
