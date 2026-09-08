'use client';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';
import GlassCard from '@/components/GlassCard';
import { ClipboardCheck,Megaphone,Users,Award,Database,ArrowRight,BookOpenText,MessagesSquare,Scale } from 'lucide-react';
const cards=[
  ['/admin/materials','Kelola Materi','Edit 16 unit materi inti sesuai pertemuan RPS menggunakan WYSIWYG.',BookOpenText],
  ['/admin/activities','Kelola Aktivitas','Kelola 5 tugas produk, UTS/UAS, deadline, visibility, dan instruksi submission.',ClipboardCheck],
  ['/admin/discussions','Kelola Diskusi','Buat forum diskusi terarah pada pertemuan pilihan; mahasiswa dan dosen dapat membalas.',MessagesSquare],
  ['/admin/gradebook','Gradebook & Rubrik','Nilai submission/diskusi, gunakan rubrik tugas, beri feedback, dan import/export Excel.',Scale],
  ['/admin/announcements','Pengumuman','Informasi yang tampil pada dashboard mahasiswa.',Megaphone],
  ['/admin/users','Pengguna','Mahasiswa, dosen, PIN, kelas, dan import Excel.',Users],
  ['/admin/data','Import / Export','Backup dan pemindahan database LMS multi-sheet XLSX.',Database]
] as const;
export default function AdminPage(){return <AuthGate adminOnly><AppShell title="Kelola"><GlassCard className="admin-welcome"><div><span className="eyebrow">METOPEN PFIS</span><h2>Kelola research learning journey dari satu tempat</h2><p className="muted">Materi mengikuti RPS, sedangkan lima produk tugas dan rubrik mengikuti kisi-kisi tugas yang disimpan. Submission, komentar dosen, diskusi, nilai, dan export/import Excel terhubung dalam satu workflow.</p></div></GlassCard><div className="admin-grid">{cards.map(([href,title,desc,Icon])=><Link href={href} className="glass-card admin-card" key={href}><div className="icon-bubble teal"><Icon/></div><div className="grow"><h3>{title}</h3><p>{desc}</p></div><ArrowRight/></Link>)}</div></AppShell></AuthGate>}
