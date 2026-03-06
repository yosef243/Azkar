/**
 * ====================================================================
 * PWA & Service Worker Registration (Production Ready)
 * ====================================================================
 */

// 1. تسجيل عامل الخدمة (Service Worker)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('[PWA] ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(error => {
                console.error('[PWA] ServiceWorker registration failed: ', error);
            });
    });
}

// ==========================================
// 2. إدارة نافذة التثبيت (Install Prompt)
// ==========================================
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // منع المتصفح من إظهار النافذة الافتراضية بشكل عشوائي
    e.preventDefault();
    // حفظ الحدث لاستخدامه لاحقاً عند ضغط المستخدم
    deferredPrompt = e;
    
    console.log('[PWA] التطبيق جاهز للتثبيت!');
    
    // استدعاء دالة بناء زر التثبيت في واجهة المستخدم
    showInstallButton();
});

// دالة لزرع زر التثبيت ديناميكياً في صفحة الإعدادات
function showInstallButton() {
    const settingsPage = document.getElementById('settingsPage');
    // لو الصفحة مش موجودة أو الزرار اتعمل قبل كده، وقف التنفيذ
    if (!settingsPage || document.getElementById('installAppBtn')) return;

    // هنجيب زر "عن التطبيق" عشان نحط زر التثبيت فوقه
    const aboutBtn = settingsPage.querySelector('button[onclick="window.app?.openAboutModal()"]');
    
    if (aboutBtn) {
        const installBtn = document.createElement('button');
        installBtn.id = 'installAppBtn';
        installBtn.className = 'btn btn--primary'; // نخليه بارز بلون التطبيق
        installBtn.style.marginBottom = '12px';
        installBtn.innerHTML = '<i class="fa-solid fa-download"></i> تثبيت التطبيق على الهاتف';
        
        // عند الضغط على الزر
        installBtn.onclick = async () => {
            if (deferredPrompt) {
                // إظهار نافذة التثبيت الرسمية للموبايل
                deferredPrompt.prompt();
                
                // انتظار قرار المستخدم (وافق أم رفض؟)
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`[PWA] User installation choice: ${outcome}`);
                
                // الحدث بيشتغل مرة واحدة بس، فلازم نصفره
                deferredPrompt = null;
                
                // إخفاء الزر فوراً بعد الضغط
                installBtn.style.display = 'none';
            }
        };

        // إدراج زر التثبيت قبل زر "عن التطبيق"
        aboutBtn.parentNode.insertBefore(installBtn, aboutBtn);
    }
}

// 3. الاستماع لحدث اكتمال التثبيت بنجاح (للاحتفال والتنظيف)
window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    console.log('[PWA] تم تثبيت التطبيق بنجاح!');
    
    // التخلص من الزر لو لسه موجود
    const installBtn = document.getElementById('installAppBtn');
    if (installBtn) installBtn.style.display = 'none';
    
    // إشعار تهنئة للمستخدم
    if (window.app) window.app.showToast('🎉 تم تثبيت التطبيق بنجاح!');
});
