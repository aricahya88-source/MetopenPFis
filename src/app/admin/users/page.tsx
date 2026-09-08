'use client';
import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';
import GlassCard from '@/components/GlassCard';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';
import { Plus, Save, KeyRound, FileSpreadsheet, Upload, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';

type U=User&{active?:boolean;initial_pin?:string};
type ImportRow={nim:string;name:string;email:string;class_name:string;initial_pin:string;active:string|boolean};
type ImportReport={inserted:number;updated:number;skipped:number;errors:string[];generatedPins:Array<{nim:string;name:string;pin:string}>};
const empty:U={user_id:'',nim:'',name:'',email:'',role:'mahasiswa',class_name:'',active:true};

function text(v:unknown){return String(v??'').trim();}
function normalizeRow(raw:Record<string,unknown>):ImportRow{
  const low:Record<string,unknown>={};Object.keys(raw).forEach(k=>{low[k.trim().toLowerCase()]=raw[k]});
  return {
    nim:text(low.nim||low['nim / id']||low.id),
    name:text(low.name||low.nama||low['nama mahasiswa']),
    email:text(low.email),
    class_name:text(low.class_name||low.kelas||low.class),
    initial_pin:text(low.initial_pin||low.pin||low['pin awal']),
    active:low.active===undefined||low.active===''?'TRUE':text(low.active)
  };
}

export default function AdminUsers(){
  const[rows,setRows]=useState<U[]>([]);const[u,setU]=useState<U>(empty);const[msg,setMsg]=useState('');
  const[importRows,setImportRows]=useState<ImportRow[]>([]);const[importName,setImportName]=useState('');const[mode,setMode]=useState<'skip'|'update'>('skip');const[importBusy,setImportBusy]=useState(false);const[report,setReport]=useState<ImportReport|null>(null);const[importProgress,setImportProgress]=useState({done:0,total:0,batch:0,batches:0});
  const load=()=>api<U[]>('adminListUsers').then(setRows);
  useEffect(()=>{load().catch(e=>setMsg(e.message));},[]);
  const save=async()=>{try{const d=await api<{user:U;temporary_pin?:string}>('adminSaveUser',{user:u});setU(d.user);setMsg(d.temporary_pin?`Pengguna tersimpan. PIN sementara: ${d.temporary_pin}`:'Pengguna tersimpan.');await load()}catch(e){setMsg(e instanceof Error?e.message:String(e))}};
  const reset=async()=>{if(!u.user_id)return;const pin=prompt('PIN baru (minimal 6 karakter). Kosongkan untuk PIN acak:','');try{const d=await api<{pin:string}>('adminResetPin',{user_id:u.user_id,pin:pin||''});setMsg(`PIN baru: ${d.pin}`)}catch(e){setMsg(e instanceof Error?e.message:String(e))}};
  const existingNims=useMemo(()=>new Set(rows.map(x=>x.nim.trim().toLowerCase()).filter(Boolean)),[rows]);
  const validCount=importRows.filter(x=>x.nim&&x.name).length;
  const duplicateCount=importRows.filter(x=>existingNims.has(x.nim.toLowerCase())).length;
  const invalidCount=importRows.length-validCount;

  const readExcel=async(file:File|null)=>{
    if(!file)return;setMsg('');setReport(null);setImportRows([]);setImportName(file.name);
    try{
      const XLSX=await import('xlsx');
      const wb=XLSX.read(await file.arrayBuffer(),{type:'array'});
      const sheet=wb.Sheets[wb.SheetNames[0]];
      if(!sheet)throw new Error('Sheet pertama tidak ditemukan.');
      const raw=XLSX.utils.sheet_to_json<Record<string,unknown>>(sheet,{defval:'',raw:false});
      const normalized=raw.map(normalizeRow).filter(x=>x.nim||x.name||x.email||x.class_name||x.initial_pin);
      if(!normalized.length)throw new Error('Tidak ada baris user yang terbaca. Gunakan template import.');
      if(normalized.length>500)throw new Error('Maksimal 500 user per import.');
      setImportRows(normalized);
    }catch(e){setMsg(e instanceof Error?e.message:String(e));setImportName('');}
  };
  const runImport=async()=>{
    if(!importRows.length)return;setImportBusy(true);setMsg('');setReport(null);
    const valid=importRows.filter(x=>x.nim&&x.name),chunkSize=50,chunks:ImportRow[][]=[];let processed=0;
    for(let i=0;i<valid.length;i+=chunkSize)chunks.push(valid.slice(i,i+chunkSize));
    const total:ImportReport={inserted:0,updated:0,skipped:0,errors:[],generatedPins:[]};
    setImportProgress({done:0,total:valid.length,batch:0,batches:chunks.length});
    try{
      for(let i=0;i<chunks.length;i++){
        setImportProgress({done:i*chunkSize,total:valid.length,batch:i+1,batches:chunks.length});
        const r=await api<ImportReport>('adminImportUsers',{rows:chunks[i],duplicate_mode:mode});
        total.inserted+=r.inserted;total.updated+=r.updated;total.skipped+=r.skipped;total.errors.push(...r.errors);total.generatedPins.push(...r.generatedPins);
        processed=Math.min(valid.length,(i+1)*chunkSize);setImportProgress({done:processed,total:valid.length,batch:i+1,batches:chunks.length});
      }
      setReport(total);setMsg(`Import selesai: ${total.inserted} baru, ${total.updated} diperbarui, ${total.skipped} dilewati.`);await load();
    }catch(e){setReport(total);setMsg(`Import berhenti setelah ${processed} user. ${e instanceof Error?e.message:String(e)}`)}finally{setImportBusy(false)}
  };
  const downloadGeneratedPins=async()=>{
    if(!report?.generatedPins.length)return;
    const XLSX=await import('xlsx');const ws=XLSX.utils.json_to_sheet(report.generatedPins.map(x=>({nim:x.nim,name:x.name,pin:x.pin})));const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'PIN Otomatis');XLSX.writeFile(wb,`PIN_Import_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return <AuthGate adminOnly><AppShell title="Pengguna"><div className="stack">
    <GlassCard><div className="row between wrap gap"><div><span className="eyebrow">IMPORT MAHASISWA</span><h3>Import User dari Excel</h3><p className="muted">File Excel hanya dibaca ketika Anda memilih file, sehingga library XLSX tidak membebani halaman mahasiswa. Role hasil import otomatis menjadi mahasiswa.</p></div><div className="row wrap gap"><a className="button soft" href="/templates/import-users.xlsx" download><Download/>Template Excel</a><label className="button primary"><Upload/>Pilih Excel<input className="hidden" type="file" accept=".xlsx,.xls" onChange={e=>readExcel(e.target.files?.[0]||null)}/></label></div></div>
      {importRows.length>0&&<div className="stack small-gap"><div className="notice"><div className="row wrap gap"><FileSpreadsheet/><strong>{importName}</strong><span className="badge success"><CheckCircle2/> {validCount} valid</span>{duplicateCount>0&&<span className="badge"><AlertTriangle/> {duplicateCount} NIM sudah ada</span>}{invalidCount>0&&<span className="badge danger">{invalidCount} tidak lengkap</span>}</div></div>
        <div className="form-grid two"><label className="field"><span>Jika NIM sudah ada</span><select value={mode} onChange={e=>setMode(e.target.value as 'skip'|'update')}><option value="skip">Lewati user lama</option><option value="update">Perbarui data user lama</option></select></label><div className="field"><span>Kolom yang dibaca</span><div className="small-note">nim, name, email, class_name, initial_pin, active</div></div></div>
        <div className="scroll-list">{importRows.slice(0,8).map((x,i)=><div className="select-row" key={`${x.nim}-${i}`}><strong>{x.name||'(nama kosong)'}</strong><small>{x.nim||'(NIM kosong)'} • {x.class_name||'tanpa kelas'} • {existingNims.has(x.nim.toLowerCase())?'sudah ada':'baru'}</small></div>)}{importRows.length>8&&<div className="small-note">+ {importRows.length-8} baris lain</div>}</div>
        {importBusy&&<div className="import-progress"><div className="row between"><strong>Mengimpor mahasiswa</strong><span>{importProgress.done}/{importProgress.total}</span></div><div className="progress-track"><span style={{width:`${importProgress.total?Math.round(importProgress.done/importProgress.total*100):0}%`}}/></div><small>Batch {importProgress.batch} dari {importProgress.batches}. Jangan tutup halaman sampai selesai.</small></div>}
        <div className="right-actions"><button className="button primary" disabled={importBusy||validCount===0} onClick={runImport}><FileSpreadsheet/>{importBusy?'Mengimpor...':`Import ${validCount} User`}</button></div>
      </div>}
      {report&&<div className="stack small-gap"><div className="row wrap gap"><span className="badge success">{report.inserted} baru</span><span className="badge">{report.updated} update</span><span className="badge">{report.skipped} dilewati</span>{report.errors.length>0&&<span className="badge danger">{report.errors.length} error</span>}</div>{report.generatedPins.length>0&&<div className="notice selectable"><div className="row between wrap gap"><strong>PIN yang dibuat otomatis — simpan sebelum meninggalkan halaman:</strong><button className="button soft compact" onClick={downloadGeneratedPins}><Download/>Download PIN</button></div>{report.generatedPins.map(x=><div key={x.nim}>{x.nim} • {x.name}: <code>{x.pin}</code></div>)}</div>}{report.errors.length>0&&<div className="error-box selectable">{report.errors.slice(0,12).map((x,i)=><div key={i}>{x}</div>)}</div>}</div>}
    </GlassCard>

    <div className="admin-split">
      <GlassCard className="admin-list"><div className="row between"><div><span className="eyebrow">AKUN</span><h3>{rows.length} Pengguna</h3></div><button className="icon-button" onClick={()=>setU({...empty})}><Plus/></button></div><input className="list-search" placeholder="Cari nama/NIM..." onChange={e=>{const q=e.target.value.toLowerCase();document.querySelectorAll<HTMLElement>('[data-user-row]').forEach(el=>el.hidden=!el.dataset.userRow?.includes(q))}}/><div className="scroll-list">{rows.map(x=><button data-user-row={`${x.name} ${x.nim} ${x.email}`.toLowerCase()} key={x.user_id} className={u.user_id===x.user_id?'select-row active':'select-row'} onClick={()=>setU(x)}><strong>{x.name}</strong><small>{x.nim} • {x.role}</small></button>)}</div></GlassCard>
      <GlassCard><div className="form-grid two"><label className="field"><span>NIM / ID</span><input value={u.nim} onChange={e=>setU({...u,nim:e.target.value})}/></label><label className="field"><span>Nama</span><input value={u.name} onChange={e=>setU({...u,name:e.target.value})}/></label><label className="field"><span>Email</span><input type="email" value={u.email} onChange={e=>setU({...u,email:e.target.value})}/></label><label className="field"><span>Kelas</span><input value={u.class_name||''} onChange={e=>setU({...u,class_name:e.target.value})}/></label><label className="field"><span>Role</span><select value={u.role} onChange={e=>setU({...u,role:e.target.value as U['role']})}><option value="mahasiswa">Mahasiswa</option><option value="dosen">Dosen</option><option value="admin">Admin</option></select></label>{!u.user_id&&<label className="field"><span>PIN awal (opsional)</span><input value={u.initial_pin||''} onChange={e=>setU({...u,initial_pin:e.target.value})} placeholder="Kosong = dibuat otomatis"/></label>}</div><label className="switch-row"><input type="checkbox" checked={u.active!==false} onChange={e=>setU({...u,active:e.target.checked})}/>Akun aktif</label><div className="row between">{u.user_id?<button className="button soft" onClick={reset}><KeyRound/>Reset PIN</button>:<span/>}<button className="button primary" onClick={save}><Save/>Simpan Pengguna</button></div></GlassCard>
    </div>{msg&&<div className="notice selectable">{msg}</div>}
  </div></AppShell></AuthGate>
}
