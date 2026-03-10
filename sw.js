/**
 * ====================================================================
 * Service Worker
 * ====================================================================
 * مسؤول عن:
 * - تخزين App Shell
 * - دعم التشغيل بدون إنترنت
 * - fallback آمن لصفحة التطبيق
 * - دعم التحديثات الذكية
 * - العمل بمسارات نسبية لتجنب مشاكل subpath deployment
 */

const CACHE_VERSION = 'azkar-v6';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const APP_SHELL_URLS = [
    './',
    './index.html',
    './manifest.json',

    './css/main.css',
    './css/modules.css',
    './css/themes.css',

    './js/dom.js',
    './js/storage.js',
    './js/achievements.js',
    './js/content.js',
    './js/masbaha.js',
    './js/tasks/tasks-core.js',
    './js/tasks/tasks-stats.js',
    './js/tasks/tasks-motivation.js',
    './js/tasks/tasks-ui.js',
    './js/tasks.js',
    './js/quran.js',
    './js/notifications.js', // تمت إضافة ملف الإشعارات هنا
    './js/app.js',
    './js/pwa.js',
    './js/firebase-core.js',

    './data/azkar.js',
    './data/names.js',
    './data/messages.js',
    './data/duasData.js',
    './data/quranData.js',
    './data/stories.js'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(APP_SHELL_CACHE)
            .then(cache => cache.addAll(APP_SHELL_URLS))
    );
});

self.addEventListener('activate', event => {
    const currentCaches = [APP_SHELL_CACHE, RUNTIME_CACHE];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
        }).then(cachesToDelete => {
            return Promise.all(cachesToDelete.map(cacheToDelete => {
                return caches.delete(cacheToDelete);
            }));
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;

    if (!request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(request).then(cached => {
            if (cached) {
                return cached;
            }

            return fetch(request)
                .then(response => {
                    // لا نخزن الاستجابات غير الناجحة
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    const copy = response.clone();
                    caches.open(RUNTIME_CACHE).then(cache => cache.put(request, copy));

                    return response;
                })
                .catch(() => {
                    // fallback بسيط للملفات النصية/الصفحات
                    if (request.destination === 'document') {
                        return caches.match('./index.html');
                    }

                    return new Response('', {
                        status: 404,
                        statusText: 'Not Found'
                    });
                });
        })
    );
});

self.addEventListener('message', event => {
    if (!event.data) return;

    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});

// ==========================================
// التعامل مع النقر على الإشعارات
// ==========================================
self.addEventListener('notificationclick', event => {
    event.notification.close(); // إغلاق الإشعار عند النقر عليه

    // المسار الذي سيتم فتحه (الصفحة الرئيسية أو قسم الأذكار)
    const targetUrl = event.notification.data?.url || './index.html';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // إذا كان التطبيق مفتوحاً بالفعل في الخلفية، قم بإحضاره للمقدمة
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes('index.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            // إذا كان التطبيق مغلقاً تماماً، افتح نافذة جديدة
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
