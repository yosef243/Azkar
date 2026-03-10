import { app } from './app.js';

export const notifications = {
    settings: {
        morning: { enabled: false, time: '06:00', label: 'أذكار الصباح', message: 'حان الآن موعد قراءة أذكار الصباح ☀️' },
        evening: { enabled: false, time: '16:00', label: 'أذكار المساء', message: 'حان الآن موعد قراءة أذكار المساء 🌙' },
        sleep: { enabled: false, time: '21:00', label: 'أذكار النوم', message: 'لا تنسَ قراءة أذكار النوم قبل أن تغفو 😴' }
    },
    lastNotifiedDate: {}, // لمنع تكرار الإشعار في نفس اليوم

    init() {
        // فحص دعم المتصفح للإشعارات
        if (!('Notification' in window)) {
            console.warn('[Notifications] المتصفح لا يدعم الإشعارات.');
            return;
        }
        this.loadSettings();
        this.bindUI();
        this.startChecker();
    },

    loadSettings() {
        try {
            const saved = JSON.parse(localStorage.getItem('azkar_notifications'));
            if (saved) {
                if (saved.morning) this.settings.morning = { ...this.settings.morning, ...saved.morning };
                if (saved.evening) this.settings.evening = { ...this.settings.evening, ...saved.evening };
                if (saved.sleep) this.settings.sleep = { ...this.settings.sleep, ...saved.sleep };
            }
        } catch (e) {
            console.error('Error loading notification settings', e);
        }
        this.updateUI();
    },

    saveSettings() {
        localStorage.setItem('azkar_notifications', JSON.stringify(this.settings));
        if (app && typeof app.showToast === 'function') {
            app.showToast('تم حفظ إعدادات التنبيهات بنجاح 🔔', 'success');
        }
    },

    bindUI() {
        const saveBtn = document.getElementById('saveNotificationsBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.handleSaveClick());
        }
    },

    updateUI() {
        ['morning', 'evening', 'sleep'].forEach(key => {
            const toggle = document.getElementById(`notify${key.charAt(0).toUpperCase() + key.slice(1)}`);
            const timeInput = document.getElementById(`time${key.charAt(0).toUpperCase() + key.slice(1)}`);
            
            if (toggle) toggle.checked = this.settings[key].enabled;
            if (timeInput) timeInput.value = this.settings[key].time;
        });
    },

    async handleSaveClick() {
        // طلب الصلاحية من المستخدم إذا لم تكن ممنوحة
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                if (app) app.showToast('يرجى السماح للإشعارات من إعدادات المتصفح', 'error');
                return;
            }
        } else if (Notification.permission === 'denied') {
            if (app) app.showToast('لقد قمت بحظر الإشعارات، يرجى تفعيلها من إعدادات المتصفح', 'error');
            return;
        }

        ['morning', 'evening', 'sleep'].forEach(key => {
            const toggle = document.getElementById(`notify${key.charAt(0).toUpperCase() + key.slice(1)}`);
            const timeInput = document.getElementById(`time${key.charAt(0).toUpperCase() + key.slice(1)}`);
            
            if (toggle) this.settings[key].enabled = toggle.checked;
            if (timeInput && timeInput.value) this.settings[key].time = timeInput.value;
        });

        this.saveSettings();
        
        // إرسال إشعار تجريبي إذا تم تفعيل أي منها
        if (Object.values(this.settings).some(s => s.enabled)) {
            this.showNotification('تم تفعيل التنبيهات!', 'سيقوم التطبيق بتذكيرك في الأوقات المحددة إن شاء الله.');
        }
    },

    startChecker() {
        // فحص الوقت كل دقيقة
        setInterval(() => this.checkTimeAndNotify(), 60000);
        // فحص فوري عند تشغيل التطبيق (بعد 5 ثوانٍ)
        setTimeout(() => this.checkTimeAndNotify(), 5000);
    },

    checkTimeAndNotify() {
        if (Notification.permission !== 'granted') return;

        const now = new Date();
        const currentHours = String(now.getHours()).padStart(2, '0');
        const currentMinutes = String(now.getMinutes()).padStart(2, '0');
        const currentTime = `${currentHours}:${currentMinutes}`;
        const todayDate = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

        ['morning', 'evening', 'sleep'].forEach(key => {
            const setting = this.settings[key];
            if (setting.enabled && setting.time === currentTime) {
                // التأكد من عدم إرسال الإشعار مرتين في نفس اليوم
                if (this.lastNotifiedDate[key] !== todayDate) {
                    this.showNotification(setting.label, setting.message);
                    this.lastNotifiedDate[key] = todayDate;
                }
            }
        });
    },

    async showNotification(title, body) {
        // استخدام Service Worker لعرض الإشعار بشكل متقدم واحترافي
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                registration.showNotification(title, {
                    body: body,
                    icon: './icons/icon-192x192.png',
                    badge: './icons/icon-192x192.png', // الأيقونة الصغيرة التي تظهر في شريط الإشعارات
                    vibrate: [200, 100, 200, 100, 200], // نمط الاهتزاز
                    tag: 'azkar-notification',
                    renotify: true, // إصدار صوت حتى لو كان هناك إشعار سابق
                    data: { url: './index.html' } // المسار الذي سيفتح عند النقر
                });
                return;
            } catch (error) {
                console.error('[Notifications] Error via SW:', error);
            }
        }
        
        // Fallback للمتصفحات التي لا تدعم الـ Service Worker بشكل كامل للإشعارات
        new Notification(title, { body: body, icon: './icons/icon-192x192.png' });
    }
};
