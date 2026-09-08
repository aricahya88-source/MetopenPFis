'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';
import GlassCard from '@/components/GlassCard';
import RichTextEditor from '@/components/RichTextEditor';
import { api } from '@/lib/api';
import type { Material } from '@/lib/types';
import { Save } from 'lucide-react';

export default function AdminMaterialsPage(){
  const [rows,setRows]=useState<Material[]>([]);const[selected,setSelected]=useState<Material|null>(null);const[msg,setMsg]=useState('');
  const load=()=>api<Material[]>('adminListMaterials').then(r=>{setRows(r);if(!selected&&r[0])setSelected(r[0])});
  useEffect(()=>{load().catch(e=>setMsg(e.message));},[]);
  const save=async()=>{if(!selected)return;setMsg('Menyimpan...');try{await api('adminSaveMaterial',{material:selected});setMsg('Materi tersimpan.');await load();}catch(e){setMsg(e instanceof Error?e.message:String(e))}};
  return <AuthGate adminOnly><AppShell title="Kelola Materi">
    <div className="admin-split">
      <GlassCard className="admin-list"><span className="eyebrow">UNIT MATERI</span><h3>1 unit inti × 16 pertemuan</h3><div className="scroll-list">{rows.map(m=><button key={m.material_id} onClick={()=>setSelected(m)} className={selected?.material_id===m.material_id?'select-row active':'select-row'}><strong>{m.material_no}. {m.title}</strong><small>{m.week_id}</small></button>)}</div></GlassCard>
      <div className="stack">{selected&&<>
        <GlassCard>
          <div className="form-grid two"><label className="field"><span>Judul</span><input value={selected.title} onChange={e=>setSelected({...selected,title:e.target.value})}/></label><label className="field"><span>URL media/sumber</span><input value={selected.resource_url||''} onChange={e=>setSelected({...selected,resource_url:e.target.value})} placeholder="YouTube / MP3 / MP4 / halaman sumber"/></label></div>
          <label className="switch-row"><input type="checkbox" checked={selected.visible!==false} onChange={e=>setSelected({...selected,visible:e.target.checked})}/><span>Tampilkan ke mahasiswa</span></label>
        </GlassCard>
        <GlassCard><span className="eyebrow">WYSIWYG LENGKAP</span><RichTextEditor value={selected.content_html||''} onChange={v=>setSelected({...selected,content_html:v})} minHeight={520}/><div className="right-actions"><button className="button primary" onClick={save}><Save/>Simpan Materi</button></div></GlassCard>
      </>}</div>
    </div>{msg&&<div className="notice">{msg}</div>}
  </AppShell></AuthGate>
}
