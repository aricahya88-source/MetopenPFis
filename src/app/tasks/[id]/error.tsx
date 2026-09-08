'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

export default function TaskError({error,reset}:{error:Error & {digest?:string};reset:()=>void}){
  useEffect(()=>{console.error('METOPEN task page error:',error);},[error]);
  return <div style={{maxWidth:760,margin:'48px auto',padding:20}}>
    <div className="glass-card">
      <div className="row gap"><div className="icon-bubble amber"><AlertTriangle/></div><div><span className="eyebrow">HALAMAN TUGAS</span><h2>Editor tugas perlu dimuat ulang</h2></div></div>
      <p className="muted">Draft yang sudah tersimpan di browser tetap aman. Coba muat ulang halaman tugas. Jika editor yang sedang dibuka bermasalah, tutup tab lalu buka kembali tugas.</p>
      <div className="row wrap gap">
        <button type="button" className="button primary" onClick={reset}><RefreshCw/>Muat Ulang</button>
        <Link href="/tasks" className="button soft"><ArrowLeft/>Kembali ke Daftar Tugas</Link>
      </div>
    </div>
  </div>;
}
