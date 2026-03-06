/**
 * ====================================================================
 * Local Storage & State Manager
 * ====================================================================
 */

const storage = {
    // الحالة الافتراضية للبيانات
    state: {
        dailyTasbeeh: 0,
        totalTasbeeh: 0,
        streakCount: 0,
        lastDate: '',
        completedTasks: [],
        azkarProgress: {},
        quranBookmark: null
    },
    
    init() {
        this.load();
        this.checkNewDay();
    },
    
    // ==========================================
    // تحميل البيانات بأمان
    // ==========================================
    load() {
        try {
            const saved = localStorage.getItem('azkar_data');
            if (saved) {
                // دمج البيانات المحفوظة مع الحالة الافتراضية
                this.state = { ...this.state, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('[Storage Error] بيانات تالفة، سيتم إعادة التهيئة.', error);
            // في حالة التلف، نقوم بمسحها لتجنب انهيار التطبيق
            localStorage.removeItem('azkar_data');
        }
    },
    
    // ==========================================
    // حفظ البيانات
    // ==========================================
    save() {
        try {
            localStorage.setItem('azkar_data', JSON.stringify(this.state));
            
            // مزامنة سحابية صامتة إذا كان المستخدم مسجلاً دخوله (اختياري)
            if (typeof window.saveDataToCloud === 'function') {
                // استخدام مهلة لتقليل الضغط على السيرفر (Debounce)
                clearTimeout(this.cloudTimeout);
                this.cloudTimeout = setTimeout(() => {
                    window.saveDataToCloud(this.state);
                }, 2000);
            }
        } catch (error) {
            console.error('[Storage Error] فشل الحفظ، قد تكون الذاكرة ممتلئة.', error);
        }
    },
    
    // ==========================================
    // التحقق من يوم جديد (لتصفير العدادات اليومية وحساب الستريك)
    // ==========================================
    checkNewDay() {
        // استخدام صيغة التاريخ الموحدة YYYY-MM-DD
        const today = new Date().toISOString().split('T')[0];
        
        if (this.state.lastDate !== today) {
            if (this.state.lastDate) {
                const last = new Date(this.state.lastDate);
                const current = new Date(today);
                
                // حساب الفارق بالأيام
                const diffTime = Math.abs(current - last);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                    // استمرار الالتزام
                    this.state.streakCount++;
                } else if (diffDays > 1) {
                    // كسر الالتزام، البدء من جديد
                    this.state.streakCount = 1;
                }
            } else {
                // أول يوم استخدام
                this.state.streakCount = 1;
            }
            
            // تصفير الإحصائيات اليومية فقط
            this.state.dailyTasbeeh = 0;
            this.state.completedTasks = [];
            this.state.azkarProgress = {};
            this.state.lastDate = today;
            
            this.save();
        }
    },
    
    // ==========================================
    // استرجاع البيانات من السحابة (تستخدم عند تسجيل الدخول)
    // ==========================================
    updateFromCloud(cloudState) {
        if (!cloudState) return;
        
        try {
            this.state = { ...this.state, ...cloudState };
            this.save();
            
            // تحديث الواجهات بعد دمج البيانات
            if (window.tasks && typeof window.tasks.render === 'function') window.tasks.render();
            if (window.masbaha && typeof window.masbaha.updateUI === 'function') window.masbaha.updateUI();
            if (window.quran && typeof window.quran.checkBookmark === 'function') window.quran.checkBookmark();
        } catch (error) {
            console.error('[Storage Error] خطأ في دمج البيانات السحابية.', error);
        }
    }
};

// ⚠️ السطر الأهم: كشف الكائن للنطاق العام ليعمل مع باقي الملفات
window.storage = storage;

// تشغيل مدير البيانات فوراً
storage.init();