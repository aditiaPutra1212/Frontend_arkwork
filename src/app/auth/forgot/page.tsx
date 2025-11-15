"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import Logo from "@/app/Images/Ungu__1_-removebg-preview.png";

export default function ForgotPasswordPage() {
  const t = useTranslations("forgotPassword"); 
  const tIn = useTranslations("signin"); 
  const [email, setEmail] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function onRequestReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsBusy(true);
    setError(null);
    setSuccessMessage(null);
    try {
      // --- PERBAIKAN LOGIKA TRY...CATCH ---
      // 'api()' akan throw error jika gagal, jadi kita tidak perlu 'else'
      const response = await api("/api/auth/forgot", { // Pastikan 'forgot'
        method: "POST",
        json: { email },
      });
      
      // Jika sampai di sini, PASTI sukses
      setSuccessMessage(response.message || t("success.message"));
      setEmail(""); 
      // --- BATAS PERBAIKAN ---

    } catch (err: any) {
      const msg = err?.response?.data?.message || (err as { message?: string })?.message || t("error.default");
      setError(msg);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.08),transparent_60%)] from-slate-50 via-white to-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[520px]">
        <div className="relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-white shadow-[0_10px_50px_rgba(2,6,23,0.08)] ring-1 ring-slate-100/60">
          <div className="px-8 pt-8 text-center">
            <Image src={Logo} alt="ArkWork Logo" width={96} height={96} className="mx-auto mb-5 h-20 w-20 object-contain drop-shadow-sm" priority />
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t("title")}</h1>
            <p className="mt-1 text-sm text-slate-600">{t("subtitle")}</p>
          </div>
          {successMessage && (<div className="mx-8 mt-5 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="alert">{successMessage}</div>)}
          {error && (<div className="mx-8 mt-5 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</div>)}
          <div className="px-8 pb-8 pt-6">
            {!successMessage ? (
              <form onSubmit={onRequestReset} noValidate className="space-y-4">
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-600">Email</span>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" placeholder="you@example.com" />
                </label>
                <button type="submit" disabled={isBusy} className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60">
                  {isBusy ? (<><span className="mr-2 inline-block animate-spin">⏳</span>{t("form.sending")}</>) : (t("form.sendLink"))}
                </button>
                <p className="mt-6 text-center text-sm text-slate-600">
                  {t("backTo")}{" "}
                  <Link href="/auth/signin" className="font-medium text-blue-700 hover:underline">{tIn("form.signInBtn")}</Link>
                </p>
              </form>
            ) : (
               <p className="mt-6 text-center text-sm text-slate-600">
                  {t("backTo")}{" "}
                  <Link href="/auth/signin" className="font-medium text-blue-700 hover:underline">{tIn("form.signInBtn")}</Link>
                </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}