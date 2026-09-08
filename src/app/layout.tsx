import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import PwaRegister from '@/components/PwaRegister';

export const metadata: Metadata = {
  title: 'METOPEN PFIS — Metode Penelitian Pendidikan Fisika',
  description: 'LMS OBE untuk mata kuliah Metode Penelitian Pendidikan Fisika: 16 pertemuan, 5 tugas produk, rubrik, diskusi, feedback, dan proposal penelitian.',
  manifest: '/manifest.webmanifest',
  icons: { icon:[{url:'/favicon.png',sizes:'64x64',type:'image/png'},{url:'/favicon.ico'}], apple:'/icon-192.png' }
};

export const viewport: Viewport = {
  themeColor:'#2E7D32',
  width:'device-width',
  initialScale:1,
  viewportFit:'cover'
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="id"><body><AuthProvider>{children}<PwaRegister/></AuthProvider></body></html>;
}
