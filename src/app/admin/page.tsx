'use client';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';
import { ClipboardCheck,Megaphone,Users,Database,ArrowRight,BookOpenText,MessagesSquare,Scale,CalendarDays,Layers3,FileCheck2,Plus } from 'lucide-react';
import { FORMAL_TASKS } from '@/lib/courseConfig';

const cards=[
  ['/admin/materials','Kelola Materi','Edit unit materi inti pada 16 pertemuan menggunakan editor WYSIWYG.',BookOpenText,'Konten'],
  ['/admin/activities','Kelola Aktivitas','Atur lima tugas produk, UTS/UAS, deadline, visibility, dan instruksi.',ClipboardCheck,'Pembelajaran'],
  ['/admin/discussions','Kelola Diskusi','Buat forum diskusi terarah dan pantau interaksi kelas.',MessagesSquare,'Kolaborasi'],
  ['/admin/gradebook','Gradebook & Rubrik','Nilai submission/diskusi, gunakan rubrik, feedback, dan ekspor Excel.',Scale,'Penilaian'],
  ['/admin/announcements','Pengumuman','Publikasikan informasi penting yang tampil pada dashboard mahasiswa.',Megaphone,'Komunikasi'],
  ['/admin/users','Pengguna','Kelola mahasiswa, dosen, PIN, kelas, dan import data pengguna.',Users,'Akses'],
  ['/admin/data','Import / Export','Backup dan pemindahan database LMS melalui file XLSX.',Database,'Data']
] as const;

export default function AdminPage(){return <AuthGate adminOnly><AppShell title="Dashboard Admin"><div className="stack admin-dashboard-v2">
  <section className="admin-hero-v2"><div><span className="eyebrow">PUSAT PENGELOLAAN METOPEN PFIS</span><h2>Kelola research learning journey dari satu tempat.</h2><p>Materi, aktivitas, diskusi, penilaian, pengguna, dan data tersusun dalam workflow yang konsisten dengan RPS.</p><div className="row wrap gap"><Link href="/admin/announcements" className="button primary compact"><Plus/>Tambah Pengumuman</Link><Link href="/admin/gradebook" className="button soft compact"><FileCheck2/>Buka Penilaian</Link></div></div><div className="admin-hero-icon"><Layers3/></div></section>
  <div className="admin-stat-grid"><div className="admin-stat"><CalendarDays/><div><strong>16</strong><span>Pertemuan</span></div></div><div className="admin-stat"><ClipboardCheck/><div><strong>{FORMAL_TASKS.length}</strong><span>Tugas Produk</span></div></div><div className="admin-stat"><Scale/><div><strong>100%</strong><span>Rubrik per Tugas</span></div></div><div className="admin-stat"><Database/><div><strong>Supabase</strong><span>Database Aktif</span></div></div></div>
  <div className="section-title"><div><span className="eyebrow">QUICK ACCESS</span><h3>Modul Pengelolaan</h3></div></div>
  <div className="admin-grid-v2">{cards.map(([href,title,desc,Icon,category])=><Link href={href} className="admin-module-card" key={href}><div className="row between"><div className="icon-bubble teal"><Icon/></div><span className="module-category">{category}</span></div><div className="grow"><h3>{title}</h3><p>{desc}</p></div><span className="module-open">Buka modul <ArrowRight/></span></Link>)}</div>
 </div></AppShell></AuthGate>}
