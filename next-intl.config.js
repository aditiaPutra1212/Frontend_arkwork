// next-intl.config.mjs  (COPY-PASTE ke file di ROOT frontend)
export default {
  // daftar locale yang aplikasi dukung
  locales: ['id', 'en'],
  // locale default
  defaultLocale: 'id',
  // folder tempat file pesan (pastikan path relatif ke root frontend)
  // Dari screenshot kamu nampak pesan ada di src/lib/messages (en.json, id.json)
  messagesDirectory: './src/lib/messages',

  // opsi tambahan (tidak wajib) — aktifkan logs bila perlu
  // debug: true, // aktifkan bila mau debug
};
