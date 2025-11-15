'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
// Pastikan path ini benar mengarah ke file api wrapper Anda
import { api } from '@/lib/api';

type Role = 'user' | 'admin' | 'employer';

export type EmployerLite = { id: string; slug?: string; displayName?: string | null };

export type UserLite = {
  id: string;
  email?: string | null;
  name?: string | null;
  photoUrl?: string | null;
  cvUrl?: string | null;
  role: Role;
  employer?: EmployerLite | null;
  username?: string | null;
};

// Tipe konteks otentikasi
export type AuthCtx = {
  user: UserLite | null; // Data pengguna saat ini atau null jika belum login
  loading: boolean; // Status loading saat memeriksa sesi
  // Fungsi untuk login pengguna biasa
  signinUser: (usernameOrEmail: string, password: string) => Promise<UserLite>;
  // Fungsi untuk mendaftar pengguna baru
  signup: (name: string, email: string, password: string) => Promise<UserLite>;
  // Fungsi untuk login employer (jika ada)
  signinEmployer: (usernameOrEmail: string, password: string) => Promise<UserLite>;
  // Fungsi untuk login admin (jika ada)
  signinAdmin: (username: string, password: string) => Promise<UserLite>;
  // Fungsi untuk logout
  signout: () => Promise<void>;
  // Fungsi untuk memeriksa ulang sesi dengan backend
  refresh: () => Promise<void>;
};

// Membuat React Context
const Ctx = createContext<AuthCtx>(null as any);

/* ================== Manajemen Cache Snapshot di LocalStorage ================== */
const LS_KEY = 'ark:auth:user:v1'; // Kunci localStorage
const LS_TTL_MS = 1000 * 60 * 30; // Time-to-live cache: 30 menit

function readSnapshot(): UserLite | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null;
    if (!raw) return null;
    const obj = JSON.parse(raw) as { ts: number; user: UserLite | null };
    if (!obj?.ts) return null;
    if (Date.now() - obj.ts > LS_TTL_MS) {
      localStorage.removeItem(LS_KEY);
      return null;
    }
    return obj.user ?? null;
  } catch (e) {
    console.warn('[Auth][readSnapshot] parse error', e);
    return null;
  }
}

function writeSnapshot(user: UserLite | null) {
  try {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem(LS_KEY, JSON.stringify({ ts: Date.now(), user }));
    } else {
      localStorage.removeItem(LS_KEY);
    }
  } catch (e) {
      console.warn('[Auth][writeSnapshot] error', e);
  }
}

function clearSnapshot() {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(LS_KEY);
  } catch (e) {
    console.warn('[Auth][clearSnapshot] error', e);
  }
}

/* ================== Helper untuk Nama Tampilan ================== */
const prefixEmail = (e?: string | null) => (e && e.includes('@') ? e.split('@')[0] : e) || '';
const nameForEmployer = (e: any) => e?.displayName?.trim() || prefixEmail(e?.email) || 'Company';
const nameForUser = (u: any) => (u?.name && String(u.name).trim()) || prefixEmail(u?.email) || 'User';
const nameForAdmin = (a: any) => (a?.username?.trim?.() || 'Admin');

/* ================== Helper Ekstraksi Data Respons API ================== */
function extractData(resp: any) {
  if (!resp) return null;
  return resp.data ?? resp.user ?? resp;
}

/* ================== Mapper Data Pengguna dari API ================== */
function mapEmployerMe(resp: any): UserLite | null {
  const raw = extractData(resp);
  if (!raw) return null;
  const role = (raw.role ?? 'employer').toString().toLowerCase();
  if (role !== 'employer') return null;
  const employerObj = raw.employer ?? (raw.employerId ? { id: raw.employerId, displayName: raw.displayName } : null);
  return {
    id: raw.id || raw.adminId || raw.admin?.id || String(raw.email ?? raw.id ?? 'unknown'),
    email: raw.email ?? null,
    name: nameForEmployer(raw),
    role: 'employer',
    employer: employerObj ? { id: employerObj.id, slug: employerObj.slug, displayName: employerObj.displayName } : undefined,
  };
}

function mapCandidateMe(resp: any): UserLite | null {
  const raw = extractData(resp);
  if (!raw) return null;
  const role = (raw.role ?? 'user').toString().toLowerCase();
  if (role !== 'user') return null;
  if (!raw.id) return null;
  return {
    id: raw.id,
    email: raw.email ?? null,
    name: nameForUser(raw),
    photoUrl: raw.photoUrl ?? null,
    cvUrl: raw.cvUrl ?? null,
    role: 'user',
  };
}

function mapAdminMe(resp: any): UserLite | null {
  const raw = extractData(resp);
  if (!raw) return null;
  const role = (raw.role ?? 'admin').toString().toLowerCase();
  if (role !== 'admin') return null;
  if (!raw.id) return null;
  return {
    id: raw.id,
    email: raw.username ? `${raw.username}@local` : raw.email ?? null,
    name: nameForAdmin(raw),
    role: 'admin',
    username: raw.username ?? null,
  };
}

/* ================== Komponen Provider Otentikasi ================== */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserLite | null>(() => readSnapshot());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_KEY) {
        console.log('[Auth] storage event - updating user from snapshot');
        setUser(readSnapshot());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setUserAndCache = useCallback((u: UserLite | null) => {
    console.log('[Auth] Setting user & cache:', u);
    setUser(u);
    writeSnapshot(u);
  }, []);

  const refresh = useCallback(async () => {
    console.log('Auth Refresh: Checking session...');
    setLoading(true);
    try {
      // Coba cek sesi Admin
      try {
        console.log('Auth Refresh: trying /api/admin/me...');
        const adm = await api('/api/admin/me'); // Dipanggil via proxy /api/*
        console.log('Auth Refresh: /api/admin/me response:', adm);
        const mapped = mapAdminMe(adm);
        if (mapped) {
          setUserAndCache(mapped);
          console.log('Auth Refresh: admin found');
          return;
        }
      } catch (e: any) {
        console.log('Auth Refresh: admin check failed (ok to continue):', e?.message || e);
      }

      // Coba cek sesi Employer
      try {
        console.log('Auth Refresh: trying /api/employers/auth/me...');
        const emp = await api('/api/employers/auth/me'); // Dipanggil via proxy /api/*
        console.log('Auth Refresh: /api/employers/auth/me response:', emp);
        const mapped = mapEmployerMe(emp);
        if (mapped) {
          setUserAndCache(mapped);
          console.log('Auth Refresh: employer found');
          return;
        }
      } catch (e: any) {
        console.log('Auth Refresh: employer check failed (ok to continue):', e?.message || e);
     }

      // Coba cek sesi User Biasa
      try {
        console.log('Auth Refresh: trying /auth/me...');
        const u = await api('/auth/me'); // Dipanggil via proxy /auth/*
        console.log('Auth Refresh: /auth/me response:', u);
        const mapped = mapCandidateMe(u);
        if (mapped) {
          setUserAndCache(mapped);
          console.log('Auth Refresh: user found');
          return;
        }
      } catch (e: any) {
        console.log('Auth Refresh: user check failed (ok to continue):', e?.message || e);
      }

      console.log('Auth Refresh: no valid session found');
      setUserAndCache(null);

    } catch (err) {
      console.error('Auth Refresh: unexpected error', err);
      setUserAndCache(null);
    } finally {
      setLoading(false);
      console.log('Auth Refresh: finished');
    }
  }, [setUserAndCache]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /* ================== Aksi Otentikasi ================== */

  // --- Fungsi Login User Biasa ---
  const signinUser = useCallback(async (usernameOrEmail: string, password: string) => {
    console.log('[signinUser] trying', usernameOrEmail);
    
    // ==========================================
    // ===== PERBAIKAN 1: TAMBAHKAN try...catch =====
    // ==========================================
    try {
      const res = await api('/api/auth/signin', { json: { usernameOrEmail, password } });
      console.log('[signinUser] signin response:', res); 

      await refresh();

      const snap = readSnapshot();
      if (!snap) {
        console.error('[signinUser] Snapshot still null after refresh');
        throw new Error('Signin succeeded but session not established in client');
      }
      return snap;
    } catch (err: any) {
      // 'Bersihkan' error sebelum melemparnya ke AuthPage.tsx
      // Ambil pesan error yang sesungguhnya dari backend
      const cleanMessage = err?.response?.data?.message || err?.message || "Login failed. Please try again.";
      throw new Error(cleanMessage); // Lempar error BARU yang HANYA berisi pesan bersih
    }
  }, [refresh]);


  // --- Fungsi Signup User Baru ---
  const signup = useCallback(async (name: string, email: string, password: string) => {
    console.log('[signup] creating', email);

    // ==========================================
    // ===== PERBAIKAN 2: TAMBAHKAN try...catch =====
    // ==========================================
    try {
      const res = await api('/auth/signup', { json: { name, email, password } });
      console.log('[signup] response:', res);
      // JANGAN refresh di sini, karena user belum verify
      // await refresh(); 
    
      // Kembalikan respons sukses dari backend (berisi 'message' dan 'ok')
      // Perlu di-cast ke any karena 'api' mungkin tidak punya tipe T
      return res as any; 
  
    } catch (err: any) {
      // 'Bersihkan' error sebelum melemparnya ke AuthPage.tsx
      const cleanMessage = err?.response?.data?.message || err?.message || "Signup failed. Please try again.";
      throw new Error(cleanMessage); // Lempar error BARU yang HANYA berisi pesan bersih
   }
  }, [refresh]); // refresh tetap di dependency array, meskipun tidak dipanggil


  // --- Fungsi Login Employer ---
  const signinEmployer = useCallback(async (usernameOrEmail: string, password: string) => {
    console.log('[signinEmployer] trying', usernameOrEmail);
    
    // ==========================================
    // ===== PERBAIKAN 3: TAMBAHKAN try...catch =====
    // ==========================================
    try {
      const res = await api('/api/employers/auth/signin', { json: { usernameOrEmail, password } });
      console.log('[signinEmployer] response:', res);
      await refresh();
      const snap = readSnapshot();
      if (!snap) throw new Error('Employer signin succeeded but session not established in client');
      return snap;
    } catch (err: any) {
      // 'Bersihkan' error sebelum melemparnya ke AuthPage.tsx
      const cleanMessage = err?.response?.data?.message || err?.message || "Login failed. Please try again.";
      throw new Error(cleanMessage); // Lempar error BARU yang HANYA berisi pesan bersih
    }
  }, [refresh]);

  // --- Fungsi Login Admin ---
  const signinAdmin = useCallback(async (username: string, password: string) => {
    console.log('[signinAdmin] trying', username);
    
    // ==========================================
    // ===== PERBAIKAN 4: TAMBAHKAN try...catch =====
    // ==========================================
    try {
      
      // ==========================================================
      // ===== INI ADALAH PERBAIKAN YANG SEBENARNYA =====
      // Backend Anda 'admin.ts' mengharapkan 'usernameOrEmail'.
      // Kita kirim 'usernameOrEmail' dengan nilai dari variabel 'username'.
      // ==========================================================
      const res = await api('/api/admin/signin', { json: { usernameOrEmail: username, password } });
    
      console.log('[signinAdmin] response:', res);
      await refresh();
      const snap = readSnapshot();
      if (!snap) throw new Error('Admin signin succeeded but session not established in client');
      return snap;
    } catch (err: any) {
      // 'Bersihkan' error sebelum melemparnya ke AuthPage.tsx
      const cleanMessage = err?.response?.data?.message || err?.message || "Login failed. Please try again.";
      throw new Error(cleanMessage); // Lempar error BARU yang HANYA berisi pesan bersih
    }
  }, [refresh]);

  // --- Fungsi Logout ---
  const signout = useCallback(async () => {
    console.log('[signout] calling signout endpoints to clear cookies');
    setLoading(true);
    try {
      // Panggil endpoint signout yang sesuai (via proxy)
      if (user?.role === 'employer') {
        await api('/api/employers/auth/signout', { method: 'POST', expectJson: false });
      } else if (user?.role === 'admin') {
        await api('/api/admin/signout', { method: 'POST', expectJson: false });
      } else {
        await api('/auth/signout', { method: 'POST', expectJson: false });
      }
    } catch (e) {
      console.warn('[signout] signout endpoint error (ignored):', e);
      try { await api('/api/employers/auth/signout', { method: 'POST', expectJson: false }); } catch {}
      try { await api('/auth/signout', { method: 'POST', expectJson: false }); } catch {}
      try { await api('/api/admin/signout', { method: 'POST', expectJson: false }); } catch {}
    } finally {
      clearSnapshot();
      setUser(null);
      setLoading(false);
    }
  }, [user]);

  const value = useMemo<AuthCtx>(() => ({
    user,
    loading,
    signinUser,
    signup,
    signinEmployer,
    signinAdmin,
    signout,
    refresh,
  }), [user, loading, signinUser, signup, signinEmployer, signinAdmin, signout, refresh]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);