// frontend/src/app/auth/verify/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react'; // Import useCallback
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth'; // Sesuaikan path jika perlu
import { api } from '@/lib/api';        // Sesuaikan path jika perlu
import Link from 'next/link';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refresh } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState<string>('Verifying your email address...');

  // Bungkus verifyEmail dalam useCallback agar tidak dibuat ulang terus menerus
  const verifyEmail = useCallback(async (token: string) => {
    setStatus('verifying');
    setMessage('Verifying your email address...');
    try {
      console.log(`[VerifyPage] Sending token prefix ${token.substring(0,10)}... to backend via /api/auth/verify`);
      // ++ GUNAKAN PATH /api/auth/verify ++
      const response = await api('/api/auth/verify', {
        method: 'POST',
        json: { token }
      });
      // ++ -------------------------- ++

      if (response?.ok && response?.user) {
        console.log('[VerifyPage] Verification successful:', response.message);
        setStatus('success');
        setMessage(response.message || 'Email verified successfully! Redirecting...');
        await refresh(); // Tunggu refresh selesai sebelum redirect
        setTimeout(() => {
          router.push('/dashboard');
        }, 2500);
      } else {
        throw new Error(response?.message || 'Verification failed. Please try again.');
      }
    } catch (err: any) {
      console.error('[VerifyPage] Verification API call failed:', err);
      setStatus('error');
      const msg = err?.response?.data?.message || err.message || 'An error occurred during verification.';
      setMessage(msg);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh, router]); // Tambahkan router ke dependencies useCallback

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Verification token missing in URL.');
      return;
    }

    // Panggil fungsi yang sudah di-memoize
    verifyEmail(token);

  }, [searchParams, verifyEmail]); // Gunakan verifyEmail dari useCallback

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-10 shadow-md text-center">
        {/* Tampilan Loading */}
        {status === 'verifying' && (
          <>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-t-4 border-gray-200 border-t-blue-600"></div>
            <h2 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">
              Verifying Your Email
            </h2>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
          </>
        )}
        {/* Tampilan Sukses */}
        {status === 'success' && (
           <>
            <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">
              Verification Successful!
            </h2>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
          </>
        )}
         {/* Tampilan Error */}
         {status === 'error' && (
           <>
             <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
             </svg>
            <h2 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">
              Verification Failed
            </h2>
            <p className="mt-2 text-sm text-red-600">{message}</p>
            <p className="mt-4 text-sm">
              <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
                Go back to Sign In {/* Sesuaikan path jika halaman login Anda berbeda */}
              </Link>
              {/* TODO: Tambah link/tombol Resend Verification */}
            </p>
          </>
        )}
      </div>
    </div>
  );
}