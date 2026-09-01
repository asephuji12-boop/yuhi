// Service worker — strategi NETWORK-FIRST.
// Selalu coba ambil versi terbaru dari internet dulu. Kalau berhasil,
// simpan salinannya ke cache (buat cadangan offline) dan tampilkan.
// Kalau gagal (offline/koneksi putus), baru pakai salinan cache terakhir.
//
// Dengan ini, tiap kali kamu update index.html di GitHub, versi terbaru
// akan langsung tampil saat HP online — tidak perlu bikin ulang APK.

const CACHE_NAME = 'data-santri-v2'; // dinaikkan supaya cache lama v1 dibuang
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (event.request.method !== 'GET' || !isSameOrigin) {
    return; // biarkan request ke Firestore/Google API lewat jaringan langsung
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request)) // offline fallback
  );
});
