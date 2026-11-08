// Midnight Bar POS — service worker
// เพิ่มเลขเวอร์ชันทุกครั้งที่แก้ไฟล์ เพื่อให้เครื่องดึงของใหม่
const VERSION = 'mbpos-v2';
const CACHE = VERSION;

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './css/base.css', './css/login.css', './css/menu.css', './css/bill.css',
  './css/payment.css', './css/summary.css', './css/bottles.css', './css/settings.css',
  './css/dialogs.css', './css/responsive.css', './css/motion.css', './css/theme-velvet.css',
  './css/login-galaxy.css', './css/palette.css', './css/lang.css', './css/login-final.css',
  './css/saved.css', './css/stars.css', './css/v2.css', './css/theme-holst.css',
  './js/i18n.js', './js/logo.js', './js/core.js', './js/auth.js', './js/menu.js',
  './js/bill.js', './js/payment.js', './js/summary.js', './js/bottles.js',
  './js/access.js', './js/settings.js', './js/sheets.js', './js/main.js', './js/sync.js',
  './js/motion.js', './js/login-ghost.js', './js/saved.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// เฉพาะไฟล์ของแอปเอง (same-origin, GET) — การเรียก Google Sheets / Fonts ไม่ถูกแตะ
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // หน้าหลัก: เน็ตก่อน ถ้าไม่มีเน็ตใช้ที่แคช
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // ไฟล์อื่น: ใช้แคชก่อนแล้วอัปเดตเบื้องหลัง
  e.respondWith(
    caches.match(req).then((cached) => {
      const net = fetch(req).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
