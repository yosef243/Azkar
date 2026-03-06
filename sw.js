// تم التحديث إلى نسخة جديدة
const CACHE_NAME = 'azkar-app-v0.0.6';

const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './css/main.css',
    './css/themes.css',
    './css/modules.css',
    './js/app.js',
    './js/masbaha.js',
    './js/tasks.js',
    './js/quran.js',
    './js/content.js', 
    './js/storage.js',
    './js/pwa.js',
    './data/azkar.js',
    './data/names.js',
    './data/messages.js',
    './data/quranData.js',
    './data/duasData.js',
    './data/stories.js',
    './icons/icon-192x192.png', 
    './icons/icon-512x512.png'
];

// 1. تنصيب وتخزين الملفات 
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log('[ServiceWorker] Caching App Shell');
            return cache.addAll(urlsToCache);
        })
    );
    // لا نقوم بـ skipWaiting هنا مباشرة، بل ننتظر أمر المستخدم
});

// 2. تفعيل وتنظيف الكاش القديم
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[ServiceWorker] Removing old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 3. جلب الملفات (من الكاش أو الشبكة)
self.addEventListener('fetch', event => {
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    event.respondWith(
        caches.match(event.request)
        .then(response => {
            if (response) {
                return response; 
            }
            return fetch(event.request).catch(() => {
                console.log('[ServiceWorker] Fetch failed; returning offline page instead.');
            });
        })
    );
});

// 4. الاستماع لأوامر التحديث من واجهة المستخدم
self.addEventListener('message', event => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
