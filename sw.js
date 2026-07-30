// Service Worker - 工时打卡 PWA
const CACHE_NAME = 'workclock-v1';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // 只对同源 GET 请求做缓存兜底
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      // 先返回缓存，后台再更新（stale-while-revalidate）
      const fetchPromise = fetch(e.request).then(res => {
        if (res && res.status === 200) {
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
