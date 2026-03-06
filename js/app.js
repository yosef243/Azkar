/**
 * ====================================================================
 * App Maestro (Core Engine & Navigation & Smart Updates)
 * ====================================================================
 */

const app = {
    newWorker: null, // لتخزين التحديث الجديد إن وجد

    init() {
        this.initTheme();
        this.loadUserProfile();
        
        window.addEventListener('popstate', (e) => this.handleBackButton(e));
        
        setTimeout(() => {
            if(window.content) window.content.init();
            if(window.masbaha) window.masbaha.renderAzkarCategories();
        }, 400);

        this.setupSmartUpdates();
    },

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `position:fixed; bottom:20px; left:50%; transform:translateX(-50%) translateY(100px); background:${type==='error' ? '#ef4444' : 'var(--primary)'}; color:#fff; padding:12px 24px; border-radius:999px; font-weight:bold; z-index:9999; transition:transform 0.3s; box-shadow:var(--shadow-md); white-space:nowrap;`;
        
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.style.transform = 'translateX(-50%) translateY(0)');
        
        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) translateY(100px)';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    },

    handleBackButton(e) {
        const subViews = [
            { id: 'surahReader', container: 'surahListContainer', check: () => window.quran?.checkBookmark() },
            { id: 'wirdListView', container: 'wirdMainView', check: null },
            { id: 'duaCategoryContent', container: 'duaCategoriesGrid', check: null },
            { id: 'storyCategoryContent', container: 'storyCategoriesGrid', check: null }
        ];

        for (let view of subViews) {
            const el = document.getElementById(view.id);
            if (el && (!el.classList.contains('is-hidden') || el.style.display === 'block')) {
                el.classList.add('is-hidden');
                el.style.display = 'none'; 
                
                const containerEl = document.getElementById(view.container);
                if (containerEl) {
                    containerEl.classList.remove('is-hidden');
                    containerEl.style.display = ''; 
                }
                
                if (view.check) view.check();
                return; 
            }
        }

        if (e.state && e.state.section) {
            this.showSectionInternal(e.state.section, e.state.title);
        } else {
            this.showHomeInternal();
        }
    },

    resetSubviews() {
        const subViews = [
            { id: 'surahReader', container: 'surahListContainer' },
            { id: 'wirdListView', container: 'wirdMainView' },
            { id: 'duaCategoryContent', container: 'duaCategoriesGrid' },
            { id: 'storyCategoryContent', container: 'storyCategoriesGrid' }
        ];

        subViews.forEach(view => {
            const el = document.getElementById(view.id);
            const containerEl = document.getElementById(view.container);
            if (el && containerEl) {
                el.classList.add('is-hidden');
                el.style.display = 'none';
                containerEl.classList.remove('is-hidden');
                containerEl.style.display = '';
            }
        });
        
        if (window.quran && typeof window.quran.checkBookmark === 'function') {
            window.quran.checkBookmark();
        }
    },

    showSectionInternal(id, title) {
        document.querySelectorAll('.tab-content').forEach(p => { 
            p.classList.remove('active'); 
            p.setAttribute('aria-hidden', 'true'); 
        });
        const target = document.getElementById(id);
        if(target) {
            target.classList.add('active');
            target.setAttribute('aria-hidden', 'false');
        }
        document.getElementById('headerTitle').textContent = title || 'أذكار المسلم';
        
        const backBtn = document.getElementById('backBtn');
        if(backBtn) backBtn.style.display = 'flex'; 
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    showHomeInternal() {
        document.querySelectorAll('.tab-content').forEach(p => { 
            p.classList.remove('active'); 
            p.setAttribute('aria-hidden', 'true'); 
        });
        const home = document.getElementById('home');
        if(home) {
            home.classList.add('active');
            home.setAttribute('aria-hidden', 'false');
        }
        document.getElementById('headerTitle').textContent = 'أذكار المسلم';
        
        const backBtn = document.getElementById('backBtn');
        if(backBtn) backBtn.style.display = 'none';

        this.resetSubviews(); 
    },

    openSection(id, title) {
        this.showSectionInternal(id, title);
        window.history.pushState({ section: id, title: title }, '', `#${id}`);

        if (id === 'quran' && window.quran) window.quran.init();
        if (id === 'duas' && window.content) window.content.renderDuas();
        if (id === 'tasks' && window.tasks) window.tasks.render();
        if (id === 'wird' && window.masbaha) { window.masbaha.init(); window.masbaha.renderAzkarCategories(); }
        if (id === 'names' && window.content) window.content.renderNames();
        if (id === 'stories' && window.content) window.content.renderStories();
    },

    goHome() {
        this.showHomeInternal();
        window.history.pushState(null, '', window.location.pathname);
    },

    initTheme() { this.setTheme(localStorage.getItem('azkar_theme') || 'default'); },
    
    setTheme(themeName) { 
        if (themeName === 'default') {
            document.body.removeAttribute('data-theme'); 
        } else {
            document.body.setAttribute('data-theme', themeName); 
        }
        localStorage.setItem('azkar_theme', themeName); 
    },
    
    loadUserProfile() {
        const targetInput = document.getElementById('dailyTargetInput');
        if (targetInput) targetInput.value = localStorage.getItem('azkar_daily_target') || 1000;
    },
    
    saveUserProfile() {
        const targetInput = document.getElementById('dailyTargetInput');
        if(targetInput && targetInput.value) {
            localStorage.setItem('azkar_daily_target', Math.max(1, targetInput.value));
        }
        if (window.tasks && typeof window.tasks.renderStatsOnly === 'function') {
            window.tasks.renderStatsOnly();
        }
    },

    // ==========================================
    // Modals
    // ==========================================
    openAboutModal() { 
        const modal = document.getElementById('aboutModal');
        if(modal) modal.style.display = 'flex'; 
    },
    closeAboutModal() { 
        const modal = document.getElementById('aboutModal');
        if(modal) modal.style.display = 'none'; 
    },

    // ==========================================
    // Smart Updates System (نظام التحديثات)
    // ==========================================
    setupSmartUpdates() {
        if ('serviceWorker' in navigator) {
            // الاستماع لحدث اكتمال التحديث وتغيير المتحكم لتحديث الصفحة
            let refreshing;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (refreshing) return;
                refreshing = true;
                window.location.reload(); // إعادة تحميل الصفحة للنسخة الجديدة فوراً
            });
        }
    },

    checkForUpdates() {
        if ('serviceWorker' in navigator) {
            this.showToast('جاري البحث عن تحديثات... ⏳');
            navigator.serviceWorker.getRegistration().then(reg => {
                if (reg) {
                    reg.update().then(() => {
                        if (reg.waiting) {
                            this.showUpdateModal(reg.waiting);
                        } else {
                            setTimeout(() => this.showToast('أنت على أحدث إصدار بالفعل! ✅'), 800);
                        }
                    }).catch(err => {
                        this.showToast('تعذر الاتصال بالخادم، تأكد من الإنترنت.', 'error');
                    });
                }
            });
        } else {
            this.showToast('عفواً، المتصفح لا يدعم التحديثات الذكية.', 'error');
        }
    },

    showUpdateModal(worker) {
        this.newWorker = worker;
        const modal = document.getElementById('updateModal');
        if(modal) modal.style.display = 'flex';
    },

    closeUpdateModal() {
        const modal = document.getElementById('updateModal');
        if(modal) modal.style.display = 'none';
    },

    applyUpdate() {
        if (this.newWorker) {
            this.showToast('جاري التحديث... 🚀');
            // إرسال رسالة لعامل الخدمة ليقوم بتخطي الانتظار وتفعيل نفسه
            this.newWorker.postMessage({ action: 'skipWaiting' });
        } else {
            this.closeUpdateModal();
        }
    },

    // ==========================================
    // Sharing Utilities
    // ==========================================
    shareApp() { 
        const url = 'https://yosef243.github.io/Azkar/';
        const text = 'أنصحك بتجربة تطبيق "أذكار المسلم" المذهل 📱✨:\n\n'; 
        if (navigator.share) {
            navigator.share({ title: 'أذكار', text: text, url: url }).catch(()=>{}); 
        } else {
            this.copyToClipboard(text + url); 
        }
    },
    
    shareText(text) {
        if (navigator.share) {
            navigator.share({ text: text }).catch(()=>{});
        } else {
            this.copyToClipboard(text);
        }
    },
    
    copyToClipboard(text) { 
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('تم النسخ بنجاح! 📋');
        }).catch(() => {
            this.showToast('تعذر النسخ', 'error');
        });
    }
};

window.app = app;
document.addEventListener('DOMContentLoaded', () => { app.init(); });
