'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  House, CalendarDays, ClipboardCheck, Star, Settings2,
  Users, BookOpenCheck, LogOut, Menu, X, ScrollText, UserRound,
  MessagesSquare, Route, Database, Megaphone, MoreHorizontal, type LucideIcon
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

type NavItem = readonly [string,string,LucideIcon];

const learningNav:NavItem[] = [
  ['/dashboard','Beranda',House],
  ['/weeks','Pertemuan',CalendarDays],
  ['/tasks','Tugas',ClipboardCheck]
];

const researchNav:NavItem[] = [
  ['/research-path','Jejak Penelitian',Route],
  ['/projects','Karya Mahasiswa',BookOpenCheck],
  ['/discussions','Diskusi',MessagesSquare]
];

const academicNav:NavItem[] = [
  ['/rencana-pembelajaran','RPS',ScrollText],
  ['/grades','Nilai',Star]
];

export default function AppShell({children,title='METOPEN PFIS'}:{children:React.ReactNode;title?:string}) {
  const {user,logout}=useAuth();
  const path=usePathname();
  const [open,setOpen]=useState(false);
  const [accountOpen,setAccountOpen]=useState(false);
  const isAdmin=!!user && ['admin','dosen'].includes(user.role);

  const adminNav:NavItem[] = isAdmin ? [
    ['/admin','Dashboard Admin',Settings2],
    ['/admin/gradebook','Gradebook',BookOpenCheck],
    ['/admin/users','Pengguna',Users],
    ['/admin/announcements','Pengumuman',Megaphone],
    ['/admin/data','Import / Export',Database]
  ] : [];

  const bottomPrimary:NavItem[] = isAdmin
    ? [['/dashboard','Beranda',House],['/weeks','Pertemuan',CalendarDays],['/admin','Kelola',Settings2],['/admin/gradebook','Nilai',Star]]
    : [['/dashboard','Beranda',House],['/weeks','Pertemuan',CalendarDays],['/tasks','Tugas',ClipboardCheck],['/grades','Nilai',Star]];

  const drawerNav:NavItem[] = isAdmin
    ? [...researchNav,...academicNav,...adminNav]
    : [...researchNav,...academicNav];

  const active=(href:string)=>(href==='/dashboard'||href==='/admin')?path===href:path.startsWith(href);
  const doLogout=()=>{if(window.confirm('Keluar dari LMS?')){setAccountOpen(false);setOpen(false);logout();}};
  const renderSection=(label:string,items:NavItem[])=><div className="side-nav-section" key={label}>
    <span className="side-nav-label">{label}</span>
    {items.map(([href,itemLabel,Icon])=><Link key={href} href={href} className={cn('side-link',active(href)&&'active')}>
      <Icon size={18}/><span>{itemLabel}</span>
    </Link>)}
  </div>;

  return <div className="app-bg ui-refresh">
    <aside className="desktop-sidebar">
      <div className="brand">
        <img className="brand-logo-image" src="/icon-192.png" alt="Logo METOPEN PFIS"/>
        <div><strong>METOPEN PFIS</strong><small>Research Learning Workspace</small></div>
      </div>
      <nav className="side-nav">
        {renderSection('PEMBELAJARAN',learningNav)}
        {renderSection('PENELITIAN',researchNav)}
        {renderSection('AKADEMIK',academicNav)}
        {isAdmin&&renderSection('PENGELOLAAN',adminNav)}
      </nav>
      <div className="sidebar-user">
        <div className="avatar">{(user?.name||'U').slice(0,1).toUpperCase()}</div>
        <div className="grow"><strong>{user?.name}</strong><small>{user?.role}{user?.class_name?` • ${user.class_name}`:''}</small></div>
        <button className="sidebar-logout" onClick={doLogout} title="Keluar"><LogOut size={17}/></button>
      </div>
    </aside>

    <div className="app-stage">
      <header className="topbar">
        <div>
          <span className="eyebrow">METODE PENELITIAN PENDIDIKAN FISIKA • OBE • 3 SKS</span>
          <h1>{title}</h1>
        </div>
        <div className="topbar-actions">
          <span className="user-chip"><span className="dot"/>{user?.name}</span>
          <div className="mobile-account-wrap mobile-only">
            <button className="mobile-account-button" aria-label="Menu akun" onClick={()=>{setAccountOpen(v=>!v);setOpen(false)}}><span>{(user?.name||'U').slice(0,1).toUpperCase()}</span></button>
            {accountOpen&&<div className="account-popover"><div className="account-summary"><div className="avatar">{(user?.name||'U').slice(0,1).toUpperCase()}</div><div><strong>{user?.name}</strong><small>{user?.nim||user?.role}</small></div></div><div className="account-divider"/><div className="account-role"><UserRound/> <span>{user?.role}</span></div><button className="account-logout" onClick={doLogout}><LogOut/>Keluar dari LMS</button></div>}
          </div>
          <button className="icon-button mobile-only top-menu-button" aria-label="Buka menu" onClick={()=>{setOpen(v=>!v);setAccountOpen(false)}}>{open?<X/>:<Menu/>}</button>
        </div>
      </header>
      {open && <div className="mobile-drawer mobile-only">
        <div className="drawer-title">Menu lainnya</div>
        {drawerNav.map(([href,label,Icon])=><Link key={href} href={href} onClick={()=>setOpen(false)} className={cn('drawer-link',active(href)&&'active')}><Icon size={18}/>{label}</Link>)}
        <div className="drawer-divider"/><button className="drawer-link drawer-logout" onClick={doLogout}><LogOut size={18}/>Keluar</button>
      </div>}
      <main className="page-content">{children}</main>
    </div>

    <nav className="bottom-nav">
      {bottomPrimary.map(([href,label,Icon])=><Link key={href} href={href} className={cn('bottom-link',active(href)&&'active')}>
        <Icon size={20}/><span>{label}</span>
      </Link>)}
      <button className={cn('bottom-link bottom-more',open&&'active')} onClick={()=>{setOpen(v=>!v);setAccountOpen(false)}}><MoreHorizontal size={20}/><span>Lainnya</span></button>
    </nav>
  </div>;
}
