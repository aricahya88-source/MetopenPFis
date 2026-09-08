'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, clearSession, getStoredUser, getToken, saveSession } from './api';
import type { User } from './types';

type AuthValue = {
  user: User | null;
  loading: boolean;
  login: (identity:string,pin:string)=>Promise<void>;
  logout: ()=>void;
  refresh: ()=>Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({children}:{children:React.ReactNode}) {
  const router = useRouter();
  const [user,setUser] = useState<User | null>(() => getStoredUser<User>());
  const [loading,setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) { setUser(null); setLoading(false); return; }
    try {
      const data = await api<{user:User}>('me');
      setUser(data.user);
      saveSession(token, data.user);
    } catch {
      clearSession();
      setUser(null);
    } finally {
      setLoading(false);
    }
  },[]);

  useEffect(() => { refresh(); }, [refresh]);

  const login = useCallback(async (identity:string,pin:string) => {
    const data = await api<{token:string,user:User}>('login',{identity,pin});
    saveSession(data.token,data.user);
    setUser(data.user);
    router.replace('/dashboard');
  },[router]);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    router.replace('/login');
  },[router]);

  const value = useMemo(() => ({user,loading,login,logout,refresh}),[user,loading,login,logout,refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus berada di dalam AuthProvider');
  return ctx;
}
