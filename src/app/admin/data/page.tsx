'use client';
import { useState } from 'react';
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';
import GlassCard from '@/components/GlassCard';
import { api } from '@/lib/api';
import { downloadBase64 } from '@/lib/utils';
import { Download, Upload, FileSpreadsheet } from 'lucide-react';

export default function AdminData(){
  const[msg,setMsg]=useState('');const[busy,setBusy]=useState(false);
  const exportXlsx=async()=>{setBusy(true);try{const d=await api<{base64:string;file_name:string;mime_type:string}>('adminExportWorkbook');downloadBase64(d.base64,d.file_name,d.mime_type);setMsg('Export selesai.')}catch(e){setMsg(e instanceof Error?e.message:String(e))}finally{setBusy(false)}};
  const importFile=async(file:File)=>{
    if(file.size>3*1024*1024)return setMsg('File import maksimal 3 MB.');
    setBusy(true);setMsg('Membaca Excel...');
    try{
      const XLSX=await import('xlsx');
      const buf=await file.arrayBuffer();
      const wb=XLSX.read(buf,{type:'array'});
      const sheets:Record<string,unknown[]>={};
      wb.SheetNames.forEach(name=>{if(name!=='README')sheets[name]=XLSX.utils.sheet_to_json(wb.Sheets[name],{defval:'',raw:false})});
      const d=await api<{inserted:number;updated:number;skipped:number;errors:string[];generatedPins?:Array<{nim:string;name:string;pin:string}>}>('adminImportWorkbook',{sheets});
      setMsg(`Import selesai. Inserted ${d.inserted}, updated ${d.updated}, skipped ${d.skipped}. ${d.errors?.length?`Error: ${d.errors.join('; ')}`:''} ${d.generatedPins?.length?`PIN baru: ${d.generatedPins.map(x=>`${x.nim}=${x.pin}`).join(', ')}`:''}`);
    }catch(e){setMsg(e instanceof Error?e.message:String(e))}finally{setBusy(false)}
  };
  return <AuthGate adminOnly><AppShell title="Import / Export"><div className="two-column">
    <GlassCard><div className="icon-bubble teal"><Download/></div><h2>Export XLSX</h2><p className="muted">Mengunduh seluruh database LMS dalam workbook Excel multi-sheet: users, materi, aktivitas, diskusi, post, komentar, submission, nilai, kuis, proyek, dan log. Tabel kompatibilitas internal tetap ikut tersimpan bila ada.</p><button className="button primary" disabled={busy} onClick={exportXlsx}><FileSpreadsheet/>{busy?'Memproses...':'Export Excel'}</button></GlassCard>
    <GlassCard><div className="icon-bubble amber"><Upload/></div><h2>Import XLSX</h2><p className="muted">Data di-upsert berdasarkan ID pertama pada setiap sheet. Untuk USERS dapat memakai kolom tambahan <code>initial_pin</code>.</p><label className="button accent file-button"><Upload/>Pilih Excel<input hidden type="file" accept=".xlsx,.xls" onChange={e=>{const f=e.target.files?.[0];if(f)importFile(f);e.currentTarget.value=''}}/></label></GlassCard>
  </div>{msg&&<div className="notice selectable">{msg}</div>}</AppShell></AuthGate>
}
