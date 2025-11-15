"use client";
import { useState, useEffect, Suspense } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import Logo from "@/app/Images/Ungu__1_-removebg-preview.png";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

function ResetPasswordComponent() {
  const t = useTranslations("resetPassword");
  const tIn = useTranslations("signin");
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isTokenValidating, setIsTokenValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (!tokenFromUrl) {
      setError(t("error.noToken"));
      setIsTokenValidating(false);
      return;
    }
    const verifyToken = async () => {
      try {
        // --- PERBAIKAN: Panggil /api/auth/... ---
        await api(`/api/auth/verify-token/${tokenFromUrl}`, {
          method: "GET",
        });
        setIsTokenValid(true);
      } catch (err: any) {
        setError(err?.response?.data?.message || t("error.invalidToken"));
        setIsTokenValid(false);
      } finally {
        setIsTokenValidating(false);
      }
    };
    verifyToken();
  }, [searchParams, t]);

  async function onResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // ... (kode validasi Anda di sini sudah bagus) ...
    setIsBusy(true);
    setError(null);
    setSuccessMessage(null);
    try {
      // --- PERBAIKAN LOGIKA TRY...CATCH ---
      const tokenFromUrl = searchParams.get("token"); // Ambil token
      const response = await api("/api/auth/reset-password", { // Pastikan 'reset-password'
        method: "POST",
        // Kirim 'password' BUKAN 'newPassword' agar cocok dengan controller
        json: { token: tokenFromUrl, newPassword: password }, // Ubah 'password' -> 'newPassword'
      });
      
      // Jika sampai di sini, PASTI sukses
      setSuccessMessage(response.message || t("success.message"));
      // --- BATAS PERBAIKAN ---

    } catch (err: any) {
      const msg = err?.response?.data?.message || (err as { message?: string })?.message || t("error.default");
      setError(msg);
    } finally {
      setIsBusy(false);
    }
  }

  const renderContent = () => {
    if (isTokenValidating) {
      return (<div className="py-10 text-center text-slate-600"><span className="mr-2 inline-block animate-spin">⏳</span> {t("validating")}</div>);
    }
    if (successMessage) {
      return (
        <>
          <div className="mx-8 mt-5 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="alert">{successMessage}</div>
          <div className="px-8 pb-8 pt-6 text-center"><Link href="/auth/signin" className="font-medium text-blue-700 hover:underline">{tIn("form.signInBtn")}</Link></div>
        </>
      );
    }
    if (error && !isTokenValid) {
       return (
        <>
          <div className="mx-8 mt-5 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</div>
          <div className="px-8 pb-8 pt-6 text-center"><Link href="/auth/forgot" className="font-medium text-blue-700 hover:underline">{t("backToForgot")}</Link></div>
        </>
      );
    }
    return (
      <form onSubmit={onResetPassword} noValidate className="space-y-4 px-8 pb-8 pt-6">
        {error && (<div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</div>)}
        <label className="block">
          <span className="mb-1 block text-xs text-slate-600">{t("form.newPassword")}</span>
          <div className="relative">
            <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-10 text-sm" placeholder="••••••••" />
            <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-500 hover:text-slate-700">{showPw ? <Eye size={20} /> : <EyeOff size={20} />}</button>
          </div>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-slate-600">{t("form.confirmPassword")}</span>
          <div className="relative">
            <input type={showPwConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-10 text-sm" placeholder="••••••••" />
            <button type="button" onClick={() => setShowPwConfirm((v) => !v)} className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-500 hover:text-slate-700">{showPwConfirm ? <Eye size={20} /> : <EyeOff size={20} />}</button>
          </div>
        </label>
        <button type="submit" disabled={isBusy} className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60">
          {isBusy ? (<><span className="mr-2 inline-block animate-spin">⏳</span>{t("form.saving")}</>) : (t("form.savePassword"))}
        </button>
      </form>
    );
  };

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.08),transparent_60%)] from-slate-50 via-white to-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[520px]">
        <div className="relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-white shadow-[0_10px_50px_rgba(2,6,23,0.08)] ring-1 ring-slate-100/60">
          <div className="px-8 pt-8 text-center">
            <Image src={Logo} alt="ArkWork Logo" width={96} height={96} className="mx-auto mb-5 h-20 w-20 object-contain drop-shadow-sm" priority />
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t("title")}</h1>
            <p className="mt-1 text-sm text-slate-600">{t("subtitle")}</p>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordComponent />
    </Suspense>
  );
}