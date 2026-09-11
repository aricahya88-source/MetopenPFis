'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  House, CalendarDays, ClipboardCheck, Star, Settings2,
  Users, BookOpenCheck, LogOut, Menu, X, ScrollText, UserRound,
  MessagesSquare, Route, Database, Megaphone
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const studentDesktop = [
  ['/dashboard','Home',House],
  ['/rencana-pembelajaran','RPS',ScrollText],
  ['/weeks','Pertemuan',CalendarDays],
  ['/research-path','Jejak Penelitian',Route],
  ['/tasks','Tugas',ClipboardCheck],
  ['/projects','Karya Mahasiswa',BookOpenCheck],
  ['/discussions','Diskusi',MessagesSquare],
  ['/grades','Nilai',Star]
] as const;

const studentMobile = [
  ['/dashboard','Home',House],
  ['/weeks','Pertemuan',CalendarDays],
  ['/tasks','Tugas',ClipboardCheck],
  ['/projects','Karya',BookOpenCheck],
  ['/discussions','Diskusi',MessagesSquare],
  ['/grades','Nilai',Star]
] as const;

export default function AppShell({children,title='METOPEN PFIS'}:{children:React.ReactNode;title?:string}) {
  const {user,logout}=useAuth();
  const path=usePathname();
  const [open,setOpen]=useState(false);
  const [accountOpen,setAccountOpen]=useState(false);
  const isAdmin=!!user && ['admin','dosen'].includes(user.role);
  const mobileNav=isAdmin
    ? [['/dashboard','Home',House],['/weeks','Pertemuan',CalendarDays],['/admin','Kelola',Settings2],['/admin/gradebook','Nilai',Star],['/admin/users','Pengguna',Users]] as const
    : studentMobile;

  const adminExtra=isAdmin ? [
    ['/admin','Kelola',Settings2],
    ['/admin/users','Pengguna',Users],
    ['/admin/gradebook','Gradebook',BookOpenCheck]
  ] as const : [];
  const nav=[...studentDesktop,...adminExtra];

  const drawerNav=[
    ['/rencana-pembelajaran','RPS',ScrollText] as const,
    ['/research-path','Jejak Penelitian',Route] as const,
    ...(isAdmin?[
      ['/admin','Kelola',Settings2] as const,
      ['/admin/announcements','Pengumuman',Megaphone] as const,
      ['/admin/data','Import / Export',Database] as const,
      ['/admin/users','Pengguna',Users] as const
    ]:[])
  ];
  const doLogout=()=>{if(window.confirm('Keluar dari LMS?')){setAccountOpen(false);setOpen(false);logout();}};

  return <div className="app-bg">
    <div className="liquid-orb orb-a"/><div className="liquid-orb orb-b"/><div className="liquid-orb orb-c"/>
    <aside className="desktop-sidebar glass-panel">
      <div className="brand">
        <img className="brand-logo-image" src="/icon-192.png" alt="Logo METOPEN PFIS"/>
        <div><strong>METOPEN PFIS</strong><small>Metode Penelitian • OBE</small></div>
      </div>
      <nav className="side-nav">
        {nav.map(([href,label,Icon])=><Link key={href} href={href} className={cn('side-link',path.startsWith(href) && (href!='/dashboard'||path==='/dashboard') && 'active')}>
          <Icon size={19}/><span>{label}</span>
        </Link>)}
      </nav>
      <div className="sidebar-user">
        <div className="avatar">{(user?.name||'U').slice(0,1).toUpperCase()}</div>
        <div className="grow"><strong>{user?.name}</strong><small>{user?.role}</small></div>
        <button className="icon-button" onClick={logout} title="Keluar"><LogOut size={17}/></button>
      </div>
    </aside>

    <div className="app-stage">
      <header className="topbar glass-panel">
        <div>
          <span className="eyebrow">METODE PENELITIAN PENDIDIKAN FISIKA • OBE • 3 SKS</span>
          <h1>{title}</h1>
        </div>
        <div className="topbar-actions">
          <span className="user-chip"><span className="dot"/>{user?.name}</span>
          <div className="mobile-account-wrap mobile-only">
            <button className="mobile-account-button" aria-label="Menu akun" onClick={()=>{setAccountOpen(v=>!v);setOpen(false)}}><span>{(user?.name||'U').slice(0,1).toUpperCase()}</span></button>
            {accountOpen&&<div className="account-popover glass-panel"><div className="account-summary"><div className="avatar">{(user?.name||'U').slice(0,1).toUpperCase()}</div><div><strong>{user?.name}</strong><small>{user?.nim||user?.role}</small></div></div><div className="account-divider"/><div className="account-role"><UserRound/> <span>{user?.role}</span></div><button className="account-logout" onClick={doLogout}><LogOut/>Keluar dari LMS</button></div>}
          </div>
          <button className="icon-button mobile-only" onClick={()=>{setOpen(v=>!v);setAccountOpen(false)}}>{open?<X/>:<Menu/>}</button>
        </div>
      </header>
      {open && <div className="mobile-drawer glass-panel mobile-only">
        {drawerNav.map(([href,label,Icon])=><Link key={href} href={href} onClick={()=>setOpen(false)} className="drawer-link"><Icon size={18}/>{label}</Link>)}
        <div className="drawer-divider"/><button className="drawer-link drawer-logout" onClick={doLogout}><LogOut size={18}/>Keluar</button>
      </div>}
      <main className="page-content">{children}</main>
    </div>

    <nav className="bottom-nav glass-panel">
      {mobileNav.map(([href,label,Icon])=><Link key={href} href={href} className={cn('bottom-link',path.startsWith(href) && (href!='/dashboard'||path==='/dashboard') && 'active')}>
        <Icon size={20}/><span>{label}</span>
      </Link>)}
    </nav>
  </div>;
}
