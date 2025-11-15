"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Nav from "@/components/nav";
import Footer from "@/components/Footer";

/* ---------------- Config ---------------- */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, "") ||
  "http://localhost:4000";

const API = {
  LIST: () => `${API_BASE}/api/employer-jobs`,
  TOGGLE: (id: string | number) => `${API_BASE}/api/employer-jobs/${id}`,
  DELETE: (id: string | number) => `${API_BASE}/api/employer-jobs/${id}`,
};

/* ---------------- Types ---------------- */
type LocalJob = {
  id: number | string;
  title: string;
  company: string;
  location: string;
  type: "full_time" | "part_time" | "contract" | "internship";
  description?: string;
  postedAt?: string;
  status?: "active" | "closed";
  logo?: string | null;
};

type JobDTO = {
  id: string;
  title: string;
  location: string | null;
  employment: string | null;
  description: string | null;
  postedAt: string;
  company: string;
  logoUrl: string | null;
  isActive: boolean | null;
};

/* ---------------- Helper: Fetch JSON ---------------- */
async function fetchJSON<T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json();
}

function initials(name: string) {
  const parts = name?.trim().split(/\s+/) || [];
  if (parts.length === 0) return "AW";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function mapDTO(x: JobDTO): LocalJob {
  const emp = (x.employment || "full_time").toLowerCase();
  const employment =
    emp === "full_time" ||
    emp === "part_time" ||
    emp === "contract" ||
    emp === "internship"
      ? emp
      : "full_time";

  return {
    id: x.id,
    title: x.title,
    company: x.company,
    location: x.location || "",
    type: employment,
    description: x.description || "",
    postedAt: x.postedAt,
    status: x.isActive ? "active" : "closed",
    logo: x.logoUrl,
  };
}

/* ---------------- Page ---------------- */
export default function EmployerJobsPage() {
  const [jobs, setJobs] = useState<LocalJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchJSON<{ ok: boolean; data: JobDTO[] }>(API.LIST());
      setJobs((data?.data || []).map(mapDTO));
    } catch (e: any) {
      setErrorMsg(e?.message || "Gagal memuat data");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleStatus(id: string | number) {
    const current = jobs.find((j) => String(j.id) === String(id));
    const nextStatus =
      (current?.status ?? "active") === "active" ? "INACTIVE" : "ACTIVE";

    try {
      await fetchJSON(API.TOGGLE(id), {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      await load();
      setAlertMsg("Status berhasil diperbarui.");
    } catch (e: any) {
      setErrorMsg(e?.message || "Gagal mengubah status");
    }
  }

  async function remove(id: string | number, title?: string, company?: string) {
    const ok =
      typeof window !== "undefined"
        ? window.confirm(
            `Hapus lowongan?\n"${title || "Tanpa judul"}" – ${company || "-"}`,
          )
        : true;
    if (!ok) return;

    try {
      await fetchJSON(API.DELETE(id), { method: "DELETE" });
      await load();
      setAlertMsg("Job berhasil dihapus.");
    } catch (e: any) {
      setErrorMsg(e?.message || "Gagal menghapus job");
    }
  }

  async function removeAll() {
    const ok =
      typeof window !== "undefined"
        ? window.confirm(
            "Ini akan menghapus semua lowongan (soft delete). Lanjutkan?",
          )
        : true;
    if (!ok) return;

    try {
      const ids = jobs.map((j) => j.id);
      await Promise.allSettled(
        ids.map((id) => fetchJSON(API.DELETE(id), { method: "DELETE" })),
      );
      await load();
      setAlertMsg("Semua job berhasil dihapus.");
    } catch (e: any) {
      setErrorMsg(e?.message || "Gagal menghapus semua job");
    }
  }

  const sorted = useMemo(
    () =>
      [...jobs].sort((a, b) => {
        const ta = new Date(a.postedAt ?? 0).getTime();
        const tb = new Date(b.postedAt ?? 0).getTime();
        return tb - ta;
      }),
    [jobs],
  );

  return (
    <>
      <Nav />
      <main className="min-h-[60vh] bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-slate-900">Jobs</h1>
            <div className="flex gap-2">
              <Link
                href="/employer/jobs/new"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Post a Job
              </Link>
              <button
                onClick={removeAll}
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                disabled={loading || jobs.length === 0}
              >
                Hapus Semua
              </button>
            </div>
          </div>

          {/* Banners sederhana pengganti AlertModal */}
          {alertMsg && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
              <div className="flex items-start justify-between gap-4">
                <span>{alertMsg}</span>
                <button
                  onClick={() => setAlertMsg(null)}
                  className="text-sm underline underline-offset-2"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
          {errorMsg && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
              <div className="flex items-start justify-between gap-4">
                <span>{errorMsg}</span>
                <button
                  onClick={() => setErrorMsg(null)}
                  className="text-sm underline underline-offset-2"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left">Posisi</th>
                  <th className="px-4 py-3 text-left">Perusahaan</th>
                  <th className="px-4 py-3 text-left">Lokasi</th>
                  <th className="px-4 py-3 text-left">Tipe</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Diposting</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-slate-600"
                    >
                      Memuat data…
                    </td>
                  </tr>
                )}

                {!loading && sorted.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-slate-600"
                    >
                      Belum ada lowongan. Klik Post a Job.
                    </td>
                  </tr>
                )}

                {!loading &&
                  sorted.map((j) => (
                    <tr key={j.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-amber-400 text-white font-bold place-items-center overflow-hidden">
                            {j.logo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={j.logo}
                                alt={j.company}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              initials(j.company)
                            )}
                          </div>
                          <div className="font-medium text-slate-900">
                            {j.title}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">{j.company}</td>
                      <td className="px-4 py-3">{j.location}</td>
                      <td className="px-4 py-3">
                        {j.type
                          .replace("_", "-")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                            j.status === "active"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : "bg-slate-100 text-slate-700 ring-slate-200"
                          } ring-1 ring-inset`}
                        >
                          {j.status === "active" ? "Active" : "Closed"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {j.postedAt
                          ? new Date(j.postedAt).toLocaleDateString()
                          : "-"}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link
                            href={`/employer/jobs/new?id=${j.id}`}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50"
                          >
                            Edit
                          </Link>

                          <button
                            onClick={() => toggleStatus(j.id)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50"
                            disabled={loading}
                          >
                            {j.status === "active" ? "Tutup" : "Buka"}
                          </button>

                          <button
                            onClick={() => remove(j.id, j.title, j.company)}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                            disabled={loading}
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
