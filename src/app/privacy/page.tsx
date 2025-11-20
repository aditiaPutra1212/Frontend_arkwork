export const metadata = {
    title: "Privacy Policy | ArkWork",
    description: "Kebijakan privasi penggunaan platform ArkWork.",
};

export default function PrivacyPage() {
    return (
        <main className="mx-auto max-w-4xl px-4 py-10">
            <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

            <p className="mb-4">
                ArkWork menghargai privasi Anda. Halaman ini menjelaskan bagaimana kami
                mengumpulkan, menggunakan, dan melindungi data Anda.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">1. Data yang Dikumpulkan</h2>
            <p className="mb-4">
                Kami mengumpulkan informasi dasar seperti nama, email, dan data
                penggunaan sistem untuk meningkatkan layanan.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">2. Penggunaan Data</h2>
            <p className="mb-4">
                Data digunakan untuk otentikasi, personalisasi, peningkatan fitur, dan
                pengamanan platform.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">3. Perlindungan Data</h2>
            <p className="mb-4">
                Kami menerapkan langkah keamanan untuk menjaga data Anda dari akses
                tidak sah atau penyalahgunaan.
            </p>

            <p className="mt-10 text-sm text-neutral-600">Terakhir diperbarui: 2025</p>
        </main>
    );
}
