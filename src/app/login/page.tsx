'use client';
import { FormEvent, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Eye, EyeOff, LogIn, ShieldCheck, BookOpenCheck, Users, Route } from 'lucide-react';

export default function LoginPage() {
  const {login}=useAuth();
  const [identity,setIdentity]=useState(''); const [pin,setPin]=useState('');
  const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  const [showPin,setShowPin]=useState(false);
  const submit=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setError('');try{await login(identity,pin)}catch(err){setError(err instanceof Error?err.message:String(err))}finally{setBusy(false)}};
  return <div className="login-screen login-v2">
    <div className="login-shell-v2">
      <section className="login-visual-panel">
        <div className="login-visual-overlay"/>
        <div className="login-visual-content">
          <img className="login-visual-logo" src="/metopen-pfis-logo.png" alt="METOPEN PFIS"/>
          <div className="login-visual-quote">“Dari pertanyaan, lahir pengetahuan.<br/>Dari penelitian, tumbuh perubahan.”</div>
          <div className="login-visual-meta"><span>UIN Sunan Kalijaga Yogyakarta</span><span>Metodologi Penelitian Pendidikan Fisika</span></div>
        </div>
      </section>
      <section className="login-form-panel">
        <div className="login-form-wrap">
          <div className="login-mobile-brand"><img src="/metopen-pfis-logo.png" alt="METOPEN PFIS"/></div>
          <span className="eyebrow">RESEARCH LEARNING WORKSPACE</span>
          <h1>Selamat Datang <span aria-hidden="true">👋</span></h1>
          <p className="login-intro">Masuk untuk melanjutkan pembelajaran, tugas penelitian, diskusi, feedback, dan jejak proposal Anda.</p>
          <div className="login-feature-row">
            <span><BookOpenCheck/>16 Pertemuan</span><span><Route/>5 Produk Tugas</span><span><Users/>Kolaboratif</span>
          </div>
          <form onSubmit={submit} className="login-form-card">
            <div className="login-security"><ShieldCheck/><div><strong>Akses METOPEN PFIS</strong><small>Gunakan NIM/email dan PIN Anda</small></div></div>
            <label className="field"><span>NIM / Email</span><input autoFocus value={identity} onChange={e=>setIdentity(e.target.value)} placeholder="Masukkan NIM atau email" autoComplete="username"/></label>
            <label className="field"><span>PIN</span><div className="password-field"><input type={showPin?'text':'password'} value={pin} onChange={e=>setPin(e.target.value)} placeholder="Masukkan PIN" autoComplete="current-password"/><button type="button" aria-label={showPin?'Sembunyikan PIN':'Tampilkan PIN'} onClick={()=>setShowPin(v=>!v)}>{showPin?<EyeOff/>:<Eye/>}</button></div></label>
            {error&&<div className="error-box">{error}</div>}
            <button disabled={busy||!identity||!pin} className="button primary large login-submit" type="submit"><LogIn/>{busy?'Memeriksa...':'Masuk'}</button>
          </form>
          <p className="login-powered">Powered by <strong>Supabase</strong> • Google Drive • Vercel</p>
        </div>
      </section>
    </div>
  </div>;
}
