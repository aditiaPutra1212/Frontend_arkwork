export const metadata = {
    title: "Cookies Policy | ArkWork",
    description: "Kebijakan penggunaan cookies pada platform ArkWork.",
};

export default function CookiesPage() {
    return (
        <main className="mx-auto max-w-4xl px-4 py-10">
            <h1 className="text-3xl font-bold mb-6">Cookies Policy</h1>

            <p className="mb-4">
                Platform ArkWork menggunakan cookies untuk meningkatkan pengalaman
                pengguna, menyimpan preferensi, dan menjaga sesi login.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">1. Apa itu Cookies?</h2>
            <p className="mb-4">
                Cookies adalah file kecil yang disimpan pada perangkat Anda untuk
                membantu situs bekerja lebih efisien.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">2. Jenis Cookies</h2>
            <p className="mb-4">
                Kami menggunakan cookies fungsional, analitik, dan keamanan.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">3. Mengelola Cookies</h2>
            <p className="mb-4">
                Anda dapat menonaktifkannya melalui pengaturan browser, namun beberapa
                fitur mungkin tidak bekerja dengan optimal.
            </p>

            <p className="mt-10 text-sm text-neutral-600">Terakhir diperbarui: 2025</p>
        </main>
    );
}
