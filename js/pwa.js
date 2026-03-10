/**
 * ====================================================================
 * PWA Manager
 * ====================================================================
 * مسؤول عن:
 * - تسجيل Service Worker
 * - اكتشاف التحديثات
 * - تمرير worker الجديد إلى app.js
 * - دعم المسارات النسبية لتجنب كسر النشر تحت subpath
 */

export const pwa = {
    registration: null,
    initialized: false,

    init() {
        if (this.initialized) return;
        this.initialized = true;

        if (!('serviceWorker' in navigator)) {
            console.warn('[PWA] Service Worker غير مدعوم في هذا المتصفح.');
            return;
        }

        window.addEventListener('load', () => {
            this.registerServiceWorker();
        });
    },

    getServiceWorkerPath() {
        // مسار نسبي آمن مع المشاريع المنشورة داخل subpath
        return './sw.js';
    },

    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register(this.getServiceWorkerPath());
            this.registration = registration;

            console.log('[PWA] Service Worker registered successfully.');

            this.listenForUpdates(registration);
            this.setupInstallPrompt();
        } catch (error) {
            console.error('[PWA] Failed to register Service Worker:', error);
        }
    },

    listenForUpdates(registration) {
        if (!registration) return;

        // إذا كان هناك worker جاهز بالفعل
        if (registration.waiting) {
            this.notifyUpdate(registration.waiting);
        }

        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                    // controller موجود = هذا تحديث وليس أول تثبيت
                    if (navigator.serviceWorker.controller) {
                        console.log('[PWA] New update is available.');
                        this.notifyUpdate(newWorker);
                    } else {
                        console.log('[PWA] App cached for offline use.');
                    }
                }
            });
        });
    },

    notifyUpdate(worker) {
        if (!worker) return;

        if (window.app && typeof window.app.showUpdateModal === 'function') {
            window.app.showUpdateModal(worker);
        } else {
            console.warn('[PWA] app.showUpdateModal is not available.');
        }
    },

    setupInstallPrompt() {
        const installContainer = document.getElementById('installAppContainer');
        if (!installContainer) return;

        let deferredPrompt = null;

        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            deferredPrompt = event;

            installContainer.style.display = 'block';
            installContainer.innerHTML = `
                <button type="button" class="btn btn--primary btn--full btn--start">
                    <i class="fa-solid fa-download" aria-hidden="true"></i> تثبيت التطبيق
                </button>
            `;

            const button = installContainer.querySelector('button');
            if (!button) return;

            button.addEventListener('click', async () => {
                if (!deferredPrompt) return;

                deferredPrompt.prompt();
                await deferredPrompt.userChoice;

                deferredPrompt = null;
                installContainer.style.display = 'none';
                installContainer.innerHTML = '';
            }, { once: true });
        });

        window.addEventListener('appinstalled', () => {
            installContainer.style.display = 'none';
            installContainer.innerHTML = '';
            console.log('[PWA] App installed successfully.');
        });
    }
};

window.pwa = pwa;
pwa.init();