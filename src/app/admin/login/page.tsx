"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react"; // Ikon dari lucide-react
import Cookies from "js-cookie"; // 🆕 Tambah js-cookie

import Logo from "@/app/Images/Ungu__1_-removebg-preview.png";

export default function AdminLoginPage() {
  const router = useRouter();
  const { signinAdmin } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleAdminLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!username.trim() || !password) {
      setError("Username dan password harus diisi.");
      setIsLoading(false);
      return;
    }

    try {
      console.log(
        `[AdminLogin] Attempting login for username: ${username.trim()}`,
      );

      // Ambil hasil login dari signinAdmin (jika mengembalikan data user/token)
      const admin: any = await signinAdmin(username.trim(), password);

      // 🆕 Set token ke cookies jika tersedia di respons
      if (admin) {
        const token =
          admin?.token ??
          admin?.accessToken ??
          admin?.jwt ??
          admin?.sessionToken ??
          admin?.user?.token ??
          null;

        if (token) {
          Cookies.set("arkwork_admin_token", token, {
            expires: 7, // 7 hari
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
          });
        }
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error("[AdminLogin] Login failed:", err);

      // Jika error, hapus cookie token agar tidak nyangkut
      Cookies.remove("arkwork_admin_token");

      const errorMessage =
        err?.message ||
        "Login gagal. Periksa kembali username dan password Anda.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <Image
          src={Logo}
          alt="Logo"
          width={80}
          height={80}
          className="mx-auto mb-6 h-16 w-auto"
          priority
        />
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">
          Admin Panel Login
        </h1>

        {error && (
          <div
            className="mb-4 rounded-md border border-red-400 bg-red-100 p-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleAdminLogin} noValidate className="space-y-6">
          <div>
            <label
              htmlFor="admin-username"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <input
              id="admin-username"
              type="text"
              value={username}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setUsername(e.target.value)
              }
              required
              autoComplete="username"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Enter admin username"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-10 text-base shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center rounded-r-lg px-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                tabIndex={-1}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`flex w-full items-center justify-center rounded-lg border border-transparent px-4 py-2.5 text-base font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              isLoading
                ? "cursor-not-allowed bg-indigo-400"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isLoading ? (
              <>
                <svg
                  className="mr-2 h-5 w-5 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2
                      5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824
                      3 7.938l3-2.647z"
                  ></path>
                </svg>
                Logging in...
              </>
            ) : (
              "Login to Admin Panel"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
