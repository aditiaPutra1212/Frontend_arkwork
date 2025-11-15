"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import type React from "react"; // for React types used below
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

/** ================== Types & Const ================== */
type AvatarMeta = { name: string; type: string; key: string } | null;

type StoredUser = {
  email: string;
  name?: string;
  profile?: {
    location?: string;
    phone?: string;
    skills?: string;
    photo?: AvatarMeta;

    // konten CV (tetap ada di tipe agar kompatibel data lama, tapi tidak dipakai)
    about?: string;
    experience?: string;
    education?: string;
    organizations?: string;
    certifications?: string;
    photoUrl?: string | null; // tidak dipakai di CV (hanya simpan)
  };
  createdAt?: string;
  updatedAt?: string;
};

const LS_KEY = "ark_users";
const NAV_AVATAR_KEY_PREFIX = "ark_nav_avatar:"; // dataURL thumbnail utk navbar
const NAV_NAME_KEY_PREFIX = "ark_nav_name:"; // display name untuk navbar
const MAX_AVATAR_MB = 2;

/** ================== IndexedDB (avatar saja) ================== */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("ark_db", 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("avatar_files"))
        db.createObjectStore("avatar_files");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbPutAvatar(key: string, blob: Blob) {
  const db = await openDB();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction("avatar_files", "readwrite");
    tx.objectStore("avatar_files").put(blob, key);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  db.close();
}
async function idbGetAvatar(key: string): Promise<Blob | null> {
  const db = await openDB();
  const out = await new Promise<Blob | null>((res, rej) => {
    const tx = db.transaction("avatar_files", "readonly");
    const r = tx.objectStore("avatar_files").get(key);
    r.onsuccess = () => res((r.result as Blob) ?? null);
    r.onerror = () => rej(r.error);
  });
  db.close();
  return out;
}
async function idbDelAvatar(key: string) {
  const db = await openDB();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction("avatar_files", "readwrite");
    tx.objectStore("avatar_files").delete(key);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  db.close();
}

/** ================== LocalStorage utils ================== */
const readUsers = (): StoredUser[] => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
  } catch {
    return [];
  }
};
const writeUsers = (arr: StoredUser[]) =>
  localStorage.setItem(LS_KEY, JSON.stringify(arr));

/** ================== Shared Name helpers ================== */
function getNavName(email: string) {
  return localStorage.getItem(NAV_NAME_KEY_PREFIX + email) ?? "";
}
function setNavName(email: string, name: string) {
  localStorage.setItem(NAV_NAME_KEY_PREFIX + email, name);
  window.dispatchEvent(new Event("ark:name-updated"));
}

/** ================== Small UI helpers ================== */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-neutral-800">
      {children}
    </label>
  );
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-neutral-900 ${className ?? ""}`}
    />
  );
}
type Toast = { type: "success" | "error" | "info"; message: string } | null;
function ToastBanner({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: () => void;
}) {
  if (!toast) return null;
  const style =
    toast.type === "success"
      ? "bg-green-50 text-green-800 border-green-200"
      : toast.type === "error"
        ? "bg-red-50 text-red-700 border-red-200"
        : "bg-neutral-50 text-neutral-700 border-neutral-200";
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${style}`}>
      <div className="flex items-start justify-between gap-3">
        <span>{toast.message}</span>
        <button
          onClick={onClose}
          className="text-xs opacity-70 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/** ================== Image helpers ================== */
async function fileToThumbDataURL(
  file: File | Blob,
  maxSize = 160,
): Promise<string> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      URL.revokeObjectURL(url);
      res(im);
    };
    im.onerror = (e) => rej(e);
    im.src = url;
  });
  const canvas = document.createElement("canvas");
  const max = Math.max(img.width, img.height);
  const scale = maxSize / max;
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

/** ================== Wilayah Select ================== */
type Opt = { id: string; name: string };
function WilayahSelect({
  value,
  onChange,
  labelProv = "Provinsi",
  labelKab = "Kabupaten/Kota",
  labelKec = "Kecamatan",
}: {
  value: string;
  onChange: (v: string) => void;
  labelProv?: string;
  labelKab?: string;
  labelKec?: string;
}) {
  const [provinces, setProvinces] = useState<Opt[]>([]);
  const [regencies, setRegencies] = useState<Opt[]>([]);
  const [districts, setDistricts] = useState<Opt[]>([]);

  const [prov, setProv] = useState<Opt | null>(null);
  const [kab, setKab] = useState<Opt | null>(null);
  const [kec, setKec] = useState<Opt | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(
          "https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json",
        );
        const data = await r.json();
        const items = (data || []).map((d: any) => ({
          id: String(d.id),
          name: d.name,
        }));
        setProvinces(items);
      } catch {
        setProvinces([]);
      }
    })();
  }, []);

  // 2. Fetch Kabupaten
  useEffect(() => {
    if (!prov) {
      setRegencies([]);
      setKab(null);
      setDistricts([]);
      setKec(null);
      return;
    }
    (async () => {
      try {
        const r = await fetch(
          `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${prov.id}.json`,
        );
        const data = await r.json();
        const items = (data || []).map((d: any) => ({
          id: String(d.id),
          name: d.name,
        }));
        setRegencies(items);
        setKab(null);
        setDistricts([]);
        setKec(null);
      } catch {
        setRegencies([]);
        setKab(null);
      }
    })();
  }, [prov?.id]);

  // 3. Fetch Kecamatan
  useEffect(() => {
    if (!kab) {
      setDistricts([]);
      setKec(null);
      return;
    }
    (async () => {
      try {
        const r = await fetch(
          `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${kab.id}.json`,
        );
        const data = await r.json();
        const items = (data || []).map((d: any) => ({
          id: String(d.id),
          name: d.name,
        }));
        setDistricts(items);
        setKec(null);
      } catch {
        setDistricts([]);
        setKec(null);
      }
    })();
  }, [kab?.id]);

  // Gabungkan label lokasi
  useEffect(() => {
    const parts = [kec?.name, kab?.name, prov?.name].filter(Boolean);
    onChange(parts.join(", "));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prov, kab, kec]);

  const Select = ({
    value,
    setValue,
    options,
    placeholder,
    disabled,
  }: {
    value: Opt | null;
    setValue: (o: Opt | null) => void;
    options: Opt[];
    placeholder: string;
    disabled?: boolean;
  }) => (
    <div className="relative">
      <select
        value={value?.id || ""}
        onChange={(e) => {
          const val = e.target.value;
          const o = options.find((x) => x.id === val) || null;
          setValue(o);
        }}
        disabled={disabled}
        className="w-full appearance-none rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-500"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
        ▾
      </span>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <span className="mb-1 block text-sm text-neutral-700">
            {labelProv}
          </span>
          <Select
            value={prov}
            setValue={setProv}
            options={provinces}
            placeholder="Pilih provinsi…"
          />
        </div>
        <div>
          <span className="mb-1 block text-sm text-neutral-700">
            {labelKab}
          </span>
          <Select
            value={kab}
            setValue={setKab}
            options={regencies}
            placeholder="Pilih kab/kota…"
            disabled={!prov}
          />
        </div>
        <div>
          <span className="mb-1 block text-sm text-neutral-700">
            {labelKec}
          </span>
          <Select
            value={kec}
            setValue={setKec}
            options={districts}
            placeholder="Pilih kecamatan…"
            disabled={!kab}
          />
        </div>
      </div>

      {value && (
        <div className="text-xs text-neutral-600">
          Dipilih: <span className="font-medium">{value}</span>
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={() => {
            setProv(null);
            setKab(null);
            setKec(null);
            onChange("Remote");
          }}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
        >
          Pilih “Remote”
        </button>
      </div>
    </div>
  );
}

/** ================== Page ================== */
export default function ProfilePage() {
  const t = useTranslations("profile");
  const { user } = useAuth();
  const router = useRouter();

  const email = user?.email ?? null;
  const notSignedIn = !email;

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");

  // data lain (about/experience/dst) tidak dipakai di UI
  const [avatarMeta, setAvatarMeta] = useState<AvatarMeta>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [busySave, setBusySave] = useState(false);
  const [busyUploadAvatar, setBusyUploadAvatar] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    if (notSignedIn) {
      const id = setTimeout(() => router.replace("/auth/signin"), 50);
      return () => clearTimeout(id);
    }
  }, [notSignedIn, router]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  // load biodata
  useEffect(() => {
    if (!email) return;
    const users = readUsers();
    const u = users.find((x) => x.email === email);

    const navName = getNavName(email);
    setName(navName || u?.name || "");
    setLocation(u?.profile?.location ?? "");
    setPhone(u?.profile?.phone ?? "");
    setAvatarMeta(u?.profile?.photo ?? null);
  }, [email]);

  // objectURL Avatar (UI saja)
  useEffect(() => {
    let currentUrl: string | null = null;
    let canceled = false;
    (async () => {
      if (!avatarMeta) {
        setAvatarUrl(null);
        return;
      }
      const blob = await idbGetAvatar(avatarMeta.key);
      if (!blob) {
        setAvatarUrl(null);
        return;
      }
      currentUrl = URL.createObjectURL(blob);
      if (!canceled) setAvatarUrl(currentUrl);
    })();
    return () => {
      canceled = true;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [avatarMeta?.key]);

  /** ========== Actions ========== */
  async function onPickAvatar(file: File) {
    if (!email) return;
    if (!file.type.startsWith("image/")) {
      setToast({ type: "error", message: "File harus gambar (PNG/JPG/SVG)." });
      return;
    }
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > MAX_AVATAR_MB) {
      setToast({
        type: "error",
        message: `Ukuran foto maksimum ${MAX_AVATAR_MB}MB`,
      });
      return;
    }
    setBusyUploadAvatar(true);
    try {
      const key = `avatar:${email}`;
      await idbPutAvatar(key, file);
      setAvatarMeta({ name: file.name, type: file.type, key });

      const url = URL.createObjectURL(file);
      setAvatarUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return url;
      });

      const thumbDataUrl = await fileToThumbDataURL(file, 160);
      localStorage.setItem(NAV_AVATAR_KEY_PREFIX + email, thumbDataUrl);
      window.dispatchEvent(new Event("ark:avatar-updated"));

      setToast({ type: "success", message: "Foto profil diperbarui." });
    } catch {
      setToast({ type: "error", message: "Gagal mengunggah foto." });
    } finally {
      setBusyUploadAvatar(false);
    }
  }

  async function removeAvatar() {
    if (!email) return;
    try {
      if (avatarMeta?.key) await idbDelAvatar(avatarMeta.key);
      setAvatarUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return null;
      });
      setAvatarMeta(null);
      localStorage.removeItem(NAV_AVATAR_KEY_PREFIX + email);

      const users = readUsers();
      const idx = users.findIndex((x) => x.email === email);
      if (idx >= 0) {
        users[idx].profile = { ...users[idx].profile, photo: null };
        users[idx].updatedAt = new Date().toISOString();
        writeUsers(users);
      }
      window.dispatchEvent(new Event("ark:avatar-updated"));
      setToast({ type: "success", message: "Foto profil dihapus." });
    } catch {
      setToast({ type: "error", message: "Gagal menghapus foto." });
    }
  }

  function save() {
    if (!email) return;
    setBusySave(true);
    try {
      const users = readUsers();
      const now = new Date().toISOString();
      const idx = users.findIndex((x) => x.email === email);
      const data: StoredUser = {
        email,
        name,
        profile: {
          location,
          phone,
          photo: avatarMeta,
          photoUrl: avatarUrl ?? null,
        },
        createdAt: idx >= 0 ? users[idx].createdAt : now,
        updatedAt: now,
      };
      if (idx >= 0) users[idx] = { ...users[idx], ...data };
      else users.push(data);
      writeUsers(users);

      setNavName(email, name);
      setToast({ type: "success", message: t("toast.saved") || "Tersimpan." });
    } catch {
      setToast({
        type: "error",
        message: t("toast.failed") || "Gagal menyimpan.",
      });
    } finally {
      setBusySave(false);
    }
  }

  if (notSignedIn) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-4">
        <div className="text-center">
          <p className="text-sm text-neutral-600">
            Mengarahkan ke halaman masuk…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-10">
      <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            {t("title") || "Profil Saya"}
          </h1>
          <div className="flex items-center gap-2">
            {/* Tombol preview CV dihapus */}
            <button
              onClick={save}
              disabled={busySave}
              className="rounded-xl bg-neutral-900 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busySave
                ? t("actions.saving") || "Menyimpan..."
                : t("actions.save") || "Simpan Profil"}
            </button>
          </div>
        </div>

        {/* Toast */}
        <ToastBanner toast={toast} onClose={() => setToast(null)} />

        {/* Card */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          {/* Header row dengan avatar */}
          <div className="mb-6 flex items-center gap-5">
            <div className="relative">
              <div className="h-20 w-20 overflow-hidden rounded-full border border-neutral-300 bg-neutral-100">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-neutral-500">
                    {(name?.[0] || email?.[0] || "U").toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2">
                <span className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800">
                  Ubah Foto
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e: ChangeEvent<HTMLInputElement>) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    await onPickAvatar(f);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
              {avatarMeta && (
                <button
                  onClick={removeAvatar}
                  className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-700 transition hover:bg-neutral-50"
                >
                  Hapus Foto
                </button>
              )}
              {busyUploadAvatar && (
                <span className="text-xs text-neutral-500">Mengunggah...</span>
              )}
            </div>
          </div>

          {/* Basic */}
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label>Nama Lengkap</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input readOnly value={email ?? ""} className="bg-neutral-100" />
            </div>

            <div className="md:col-span-2">
              <Label>Lokasi</Label>
              <WilayahSelect value={location} onChange={setLocation} />
            </div>

            <div>
              <Label>Nomor HP</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxxx"
              />
            </div>

            {/* Ringkasan, Pengalaman, Pendidikan, Organisasi, Sertifikasi, Skills — DIHAPUS */}
          </div>
        </div>
      </div>
    </div>
  );
}
