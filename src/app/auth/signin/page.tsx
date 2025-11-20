"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import Cookies from "js-cookie";

import Logo from "@/app/Images/logo.png";
import { api, API_BASE } from "@/lib/api"; // Impor API_BASE

/**
 * Helper Ikon Google (Bisa ditaruh di file terpisah jika mau)
 */
function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width="20px"
      height="20px"
      aria-hidden="true"
      {...props}
    >
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  );
}

export default function AuthPage() {
  const tIn = useTranslations("signin");
  const tUp = useTranslations("signup");
  const router = useRouter();

  const { signinUser, signup, user, refresh } = useAuth();
  const searchParams = useSearchParams();

  type Mode = "signin" | "signup";
  const [mode, setMode] = useState<Mode>("signin");

  // shared
  const [error, setError] = useState<string | null>(null);

  // signin
  const [siEmailOrUsername, setSiEmailOrUsername] = useState("");
  const [siPw, setSiPw] = useState("");
  const [siShow, setSiShow] = useState(false);
  const [siBusy, setSiBusy] = useState(false);

  // signup
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPw, setSuPw] = useState("");
  const [suConfirm, setSuConfirm] = useState("");
  const [suShow, setSuShow] = useState(false);
  const [suShowC, setSuShowC] = useState(false);
  const [suAgree, setSuAgree] = useState(false);
  const [suBusy, setSuBusy] = useState(false);
  const [signupSuccessMessage, setSignupSuccessMessage] = useState<
    string | null
  >(null);

  // State untuk loading Google
  const [googleBusy, setGoogleBusy] = useState(false);

  // ========== TOKEN -> COOKIE DARI user / hasil refresh ==========
  useEffect(() => {
    // Di sini kita coba ambil token dari berbagai kemungkinan shape objek
    const anyUser: any = user;
    const token =
      anyUser?.token ??
      anyUser?.accessToken ??
      anyUser?.jwt ??
      anyUser?.sessionToken ??
      anyUser?.user?.token ??
      null;

    if (token) {
      Cookies.set("arkwork_token", token, {
        expires: 7, // 7 hari
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    } else {
      // Kalau tidak ada user/token, pastikan cookie dihapus
      Cookies.remove("arkwork_token");
    }
  }, [user]);
  // ===============================================================

  // Efek untuk menangani callback dari Google
  useEffect(() => {
    const fromGoogle = searchParams.get("from");
    const googleError = searchParams.get("error");

    if (googleError) {
      setError(
        tIn("error.google") || "Google sign-in failed. Please try again.",
      );
      setGoogleBusy(false);
      router.replace("/auth/signin");
    } else if (fromGoogle === "google" && !user) {
      setGoogleBusy(true);
      setError(null);
      console.log("Google callback success, refreshing session...");
      refresh();
    }
  }, [searchParams, router, tIn, refresh, user]);

  // Efek untuk me-redirect SETELAH user berhasil di-refresh (Google)
  useEffect(() => {
    const fromGoogle = searchParams.get("from");
    if (user && fromGoogle === "google") {
      console.log("User populated after Google refresh, redirecting...");
      redirectByRole(user);
    }
  }, [user, searchParams]);

  const suStrong =
    suPw.length >= 8 &&
    /[A-Z]/.test(suPw) &&
    /[a-z]/.test(suPw) &&
    /[0-9]/.test(suPw);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  // helper redirect sesuai role
  function redirectByRole(u: any) {
    const role = u?.role ?? u?.type ?? u?.user?.role;

    if (role === "admin") {
      router.push("/admin");
    } else if (role === "employer") {
      router.push("/employer");
    } else {
      router.push("/dashboard");
    }

    router.refresh();
  }

  async function onSignin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSiBusy(true);
    setError(null);
    try {
      const u: any = await signinUser(siEmailOrUsername.trim(), siPw);

      // ========== SET TOKEN KE COOKIE DARI RESPONS signin ==========
      if (u) {
        const token =
          u?.token ??
          u?.accessToken ??
          u?.jwt ??
          u?.sessionToken ??
          u?.user?.token ??
          null;

        if (token) {
          Cookies.set("arkwork_token", token, {
            expires: 7,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
          });
        }
      }
      // ============================================================

      if (u) redirectByRole(u);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (err as { message?: string })?.message ||
        tIn("error.default");
      setError(msg);

      // Kalau login gagal, pastikan token dihapus
      Cookies.remove("arkwork_token");
    } finally {
      setSiBusy(false);
    }
  }

  async function onSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSignupSuccessMessage(null);

    if (!suAgree) {
      setError(tUp("error.agree"));
      return;
    }
    if (suPw !== suConfirm) {
      setError(tUp("error.mismatch"));
      return;
    }

    setSuBusy(true);

    try {
      const response: any = await api("/auth/signup", {
        method: "POST",
        json: {
          name: suName.trim(),
          email: suEmail.trim(),
          password: suPw,
        },
      });

      if (response?.ok && response?.message) {
        setSignupSuccessMessage(response.message);
        setSuName("");
        setSuEmail("");
        setSuPw("");
        setSuConfirm("");
        setSuAgree(false);

        // NOTE:
        // Kalau mau auto-login setelah signup dan set cookie token,
        // di sini bisa panggil signinUser / pakai response.token kalau backend mengirimkan.
        // Contoh (opsional):
        //
        // if (response.token) {
        //   Cookies.set("arkwork_token", response.token, { ... });
        // }
        //
      } else {
        throw new Error(response?.message || tUp("error.default"));
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (err as { message?: string })?.message ||
        tUp("error.default");
      setError(msg);
    } finally {
      setSuBusy(false);
    }
  }

  // Handler untuk klik tombol Google
  function onGoogleSignin() {
    setGoogleBusy(true);
    setError(null);
    window.location.href = `${API_BASE}/auth/google`;
  }

  // Helper JSX untuk Tombol Google
  const googleButton = (
    <>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-slate-500">{tIn("or")}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onGoogleSignin}
        disabled={googleBusy || siBusy || suBusy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
      >
        {googleBusy ? (
          <span className="mr-2 inline-block animate-spin">⏳</span>
        ) : (
          <GoogleIcon className="h-5 w-5" />
        )}
        {tIn("googleBtn")}
      </button>
    </>
  );

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.08),transparent_60%)] from-slate-50 via-white to-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[520px]">
        {/* Outer Card */}
        <div className="relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-white shadow-[0_10px_50px_rgba(2,6,23,0.08)] ring-1 ring-slate-100/60">
          {/* Decorative blur blobs */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-400/10 blur-3xl" />

          {/* Header */}
          <div className="px-8 pt-8 text-center">
            <Image
              src={Logo}
              alt="ArkWork Logo"
              width={96}
              height={96}
              className="mx-auto mb-4 h-20 w-20 sm:h-20 sm:w-20 object-contain"
              priority
            />
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {mode === "signin" ? tIn("title") : tUp("title")}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {mode === "signin" ? tIn("subtitle") : tUp("subtitle")}
            </p>

            {/* Tabs */}
            <div className="mt-6 inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1 text-sm">
              <button
                onClick={() => switchMode("signin")}
                className={`px-4 py-1.5 rounded-xl transition ${
                  mode === "signin"
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                aria-pressed={mode === "signin"}
              >
                {tIn("form.signInBtn")}
              </button>
              <button
                onClick={() => switchMode("signup")}
                className={`px-4 py-1.5 rounded-xl transition ${
                  mode === "signup"
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                aria-pressed={mode === "signup"}
              >
                {tUp("createBtn")}
              </button>
            </div>
          </div>

          {/* Pesan Sukses Signup */}
          {signupSuccessMessage && !error && (
            <div
              className="mx-8 mt-5 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              role="alert"
            >
              {signupSuccessMessage}
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="mx-8 mt-5 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Form container */}
          <div className="px-8 pb-8 pt-6">
            {mode === "signin" ? (
              <form onSubmit={onSignin} noValidate className="space-y-4">
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-600">
                    Email / Username
                  </span>
                  <input
                    type="text"
                    value={siEmailOrUsername}
                    onChange={(e) => setSiEmailOrUsername(e.target.value)}
                    required
                    autoComplete="username"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                    placeholder="you@example.com"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs text-slate-600">
                    {tIn("form.password")}
                  </span>
                  <div className="relative">
                    <input
                      type={siShow ? "text" : "password"}
                      value={siPw}
                      onChange={(e) => setSiPw(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-10 text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setSiShow((v) => !v)}
                      className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-500 hover:text-slate-700"
                      tabIndex={-1}
                      aria-label={tIn("form.togglePw")}
                    >
                      {siShow ? (
                        <Eye size={20} aria-hidden="true" />
                      ) : (
                        <EyeOff size={20} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </label>

                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-blue-600"
                    />
                    {tIn("form.remember")}
                  </label>
                  <Link
                    className="text-sm font-medium text-blue-700 hover:underline"
                    href="/auth/forgot"
                  >
                    {tIn("form.forgot")}
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={siBusy || googleBusy}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
                >
                  {siBusy ? (
                    <>
                      <span className="mr-2 inline-block animate-spin">⏳</span>
                      {tIn("form.signingIn")}
                    </>
                  ) : (
                    tIn("form.signInBtn")
                  )}
                </button>

                {googleButton}

                <p className="mt-6 text-center text-sm text-slate-600">
                  {tIn("noAccount")}{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    {tIn("signUp")}
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={onSignup} noValidate className="space-y-4">
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-600">
                    {tUp("form.name")}
                  </span>
                  <input
                    value={suName}
                    onChange={(e) => setSuName(e.target.value)}
                    required
                    placeholder={tUp("placeholder.name")}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                    autoComplete="name"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs text-slate-600">
                    {tUp("form.email")}
                  </span>
                  <input
                    type="email"
                    value={suEmail}
                    onChange={(e) => setSuEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder={tUp("placeholder.email")}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs text-slate-600">
                    {tUp("form.password")}
                  </span>
                  <div className="relative">
                    <input
                      type={suShow ? "text" : "password"}
                      value={suPw}
                      onChange={(e) => setSuPw(e.target.value)}
                      required
                      minLength={8}
                      placeholder={tUp("placeholder.password")}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-10 text-sm"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setSuShow((v) => !v)}
                      className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-500 hover:text-slate-700"
                      tabIndex={-1}
                      aria-label={tUp("form.togglePw")}
                    >
                      {suShow ? (
                        <Eye size={20} aria-hidden="true" />
                      ) : (
                        <EyeOff size={20} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  <div
                    className="mt-1 flex items-center gap-2"
                    aria-hidden="true"
                  >
                    <div
                      className={`h-1 w-1/3 rounded ${
                        suPw.length >= 6 ? "bg-amber-400" : "bg-slate-200"
                      }`}
                    />
                    <div
                      className={`h-1 w-1/3 rounded ${
                        suPw.length >= 8 ? "bg-amber-500" : "bg-slate-200"
                      }`}
                    />
                    <div
                      className={`h-1 w-1/3 rounded ${
                        suStrong ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {tUp("password.hint")}
                  </p>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs text-slate-600">
                    {tUp("form.confirm")}
                  </span>
                  <div className="relative">
                    <input
                      type={suShowC ? "text" : "password"}
                      value={suConfirm}
                      onChange={(e) => setSuConfirm(e.target.value)}
                      required
                      placeholder={tUp("placeholder.confirm")}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-10 text-sm"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setSuShowC((v) => !v)}
                      className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-500 hover:text-slate-700"
                      tabIndex={-1}
                      aria-label={tUp("form.toggleConfirm")}
                    >
                      {suShowC ? (
                        <Eye size={20} aria-hidden="true" />
                      ) : (
                        <EyeOff size={20} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {suConfirm.length > 0 && (
                    <p
                      className={`mt-1 text-xs ${
                        suPw === suConfirm
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {suPw === suConfirm ? tUp("match.ok") : tUp("match.no")}
                    </p>
                  )}
                </label>

                <label className="mt-1 inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={suAgree}
                    onChange={(e) => setSuAgree(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  {tUp("agree.1")}{" "}
                  <Link href="/terms" prefetch={false} className="text-blue-700 hover:underline">
                    {tUp("agree.terms")}
                  </Link>

                  <Link href="/privacy" prefetch={false} className="text-blue-700 hover:underline">
                    {tUp("agree.privacy")}
                  </Link>

                  .
                </label>

                <button
                  type="submit"
                  disabled={suBusy || googleBusy}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
                >
                  {suBusy ? (
                    <>
                      <span className="mr-2 inline-block animate-spin">⏳</span>
                      {tUp("creating")}
                    </>
                  ) : (
                    tUp("createBtn")
                  )}
                </button>

                {googleButton}

                <p className="mt-6 text-center text-sm text-slate-600">
                  {tUp("haveAccount")}{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    {tUp("signIn")}
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
