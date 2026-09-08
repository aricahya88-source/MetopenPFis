'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function AuthGate({children,adminOnly=false}:{children:React.ReactNode;adminOnly?:boolean}) {
  const {user,loading} = useAuth();
  const router=useRouter();
  useEffect(()=>{
    if (!loading && !user) router.replace('/login');
    if (!loading && adminOnly && user && !['admin','dosen'].includes(user.role)) router.replace('/dashboard');
  },[user,loading,adminOnly,router]);
  if (loading) return <div className="screen-center"><div className="spinner"/><span>Memuat LMS...</span></div>;
  if (!user) return null;
  if (adminOnly && !['admin','dosen'].includes(user.role)) return null;
  return <>{children}</>;
}
