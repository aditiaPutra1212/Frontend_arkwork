export const metadata = {
    title: "Terms & Conditions | ArkWork",
    description: "Syarat dan ketentuan penggunaan platform ArkWork.",
};

export default function TermsPage() {
    return (
        <main className="mx-auto max-w-4xl px-4 py-10">
            <h1 className="text-3xl font-bold mb-6">Terms & Conditions</h1>

            <p className="mb-4">
                Selamat datang di ArkWork. Dengan menggunakan layanan kami, Anda
                menyetujui syarat dan ketentuan berikut. Jika Anda tidak setuju, silakan
                berhenti menggunakan layanan kami.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">1. Penggunaan Layanan</h2>
            <p className="mb-4">
                Anda setuju untuk tidak menyalahgunakan platform, termasuk namun tidak
                terbatas pada pencurian data, spam, atau akses tidak sah.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">2. Akun Pengguna</h2>
            <p className="mb-4">
                Anda bertanggung jawab menjaga keamanan akun Anda. Aktivitas yang
                terjadi melalui akun Anda merupakan tanggung jawab Anda sepenuhnya.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">3. Perubahan Syarat</h2>
            <p className="mb-4">
                Kami dapat memperbarui syarat dan ketentuan sewaktu-waktu.
                Perubahan berlaku setelah dipublikasikan di halaman ini.
            </p>

            <p className="mt-10 text-sm text-neutral-600">Terakhir diperbarui: 2025</p>
        </main>
    );
}
