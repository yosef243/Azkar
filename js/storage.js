/**
 * ====================================================================
 * Local Storage & State Manager
 * ====================================================================
 * العقد الرسمي للحالة:
 * - lastDate يعتمد على التاريخ المحلي للجهاز وليس UTC
 * - tasks هي المصدر الرسمي الوحيد لحالة المهام
 * - completedTasks يتم الاحتفاظ بها كقيمة مشتقة للتوافق الخلفي فقط
 * - updateFromCloud يدمج البيانات بشكل آمن مع الحفاظ على schema الرسمي
 */

export const storage = {
    STORAGE_KEY: 'azkar_data',
    SCHEMA_VERSION: 5,
    cloudTimeout: null,

    state: {
        schemaVersion: 5,
        dailyTasbeeh: 0,
        monthlyTasbeeh: 0,
        totalTasbeeh: 0,
        streakCount: 0,
        tasksCompleted: 0,
        achievements: [],
        lastDate: '',
        lastMonthKey: '',
        tasks: [],
        completedTasks: [],
        azkarProgress: {},
        quranBookmark: null
    },

    init() {
        this.load();
        this.checkNewDay();
        this.syncDerivedState();
        this.save();
    },

    // ==========================================
    // Helpers
    // ==========================================
    toSafeNumber(value, fallback = 0, { min = null } = {}) {
        const num = Number(value);

        if (!Number.isFinite(num)) {
            return fallback;
        }

        if (min !== null && num < min) {
            return min;
        }

        return num;
    },

    isPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    },

    // ==========================================
    // أدوات التاريخ المحلي
    // ==========================================
    getLocalDateKey(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    getLocalMonthKey(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    },

    parseDateKey(dateKey) {
        if (!dateKey || typeof dateKey !== 'string') return null;

        const parts = dateKey.split('-').map(Number);
        if (parts.length !== 3 || parts.some(Number.isNaN)) return null;

        const [year, month, day] = parts;
        const parsed = new Date(year, month - 1, day);

        if (Number.isNaN(parsed.getTime())) {
            return null;
        }

        return parsed;
    },

    getDayDifference(fromKey, toKey) {
        const fromDate = this.parseDateKey(fromKey);
        const toDate = this.parseDateKey(toKey);

        if (!fromDate || !toDate) return null;

        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(0, 0, 0, 0);

        const diffMs = toDate.getTime() - fromDate.getTime();
        return Math.round(diffMs / (1000 * 60 * 60 * 24));
    },

    // ==========================================
    // أدوات المهام والتطبيع
    // ==========================================
    createTaskId(prefix = 'task') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    },

    normalizeTask(task, index = 0) {
        const safeTask = this.isPlainObject(task) ? task : {};
        const text = typeof safeTask.text === 'string' ? safeTask.text.trim() : '';

        if (!text) return null;

        return {
            id: typeof safeTask.id === 'string' && safeTask.id.trim()
                ? safeTask.id.trim()
                : this.createTaskId(`task${index}`),
            text,
            completed: Boolean(safeTask.completed),
            createdAt: typeof safeTask.createdAt === 'string' && safeTask.createdAt
                ? safeTask.createdAt
                : new Date().toISOString(),
            isDefault: Boolean(safeTask.isDefault)
        };
    },

    normalizeTasks(tasks) {
        if (!Array.isArray(tasks)) return [];

        const seenIds = new Set();
        const normalized = [];

        tasks.forEach((task, index) => {
            const safeTask = this.normalizeTask(task, index);
            if (!safeTask) return;

            if (seenIds.has(safeTask.id)) {
                safeTask.id = this.createTaskId(`taskdup${index}`);
            }

            seenIds.add(safeTask.id);
            normalized.push(safeTask);
        });

        return normalized;
    },

    normalizeBookmark(bookmark) {
        if (!this.isPlainObject(bookmark)) return null;

        const surahNum = this.toSafeNumber(bookmark.surahNum, NaN);
        const surahName = typeof bookmark.surahName === 'string' ? bookmark.surahName.trim() : '';
        const scroll = this.toSafeNumber(bookmark.scroll, 0, { min: 0 });

        if (!Number.isFinite(surahNum) || surahNum <= 0) return null;
        if (!surahName) return null;

        return {
            surahNum,
            surahName,
            scroll
        };
    },

    normalizeAchievements(achievements) {
        if (!Array.isArray(achievements)) return [];

        return achievements.filter(item => typeof item === 'string' && item.trim());
    },

    normalizeCompletedTasks(completedTasks, tasks = []) {
        if (!Array.isArray(completedTasks)) return [];

        const validTaskIds = new Set(tasks.map(task => task.id));

        return completedTasks
            .filter(item => typeof item === 'string' && validTaskIds.has(item));
    },

    normalizeAzkarProgress(progress) {
        if (!this.isPlainObject(progress)) return {};

        const normalized = {};

        Object.entries(progress).forEach(([categoryKey, categoryProgress]) => {
            if (!this.isPlainObject(categoryProgress)) return;

            const safeCategory = {};

            Object.entries(categoryProgress).forEach(([indexKey, value]) => {
                const safeValue = this.toSafeNumber(value, 0, { min: 0 });
                safeCategory[indexKey] = safeValue;
            });

            normalized[categoryKey] = safeCategory;
        });

        return normalized;
    },

    syncDerivedState() {
        if (!Array.isArray(this.state.tasks)) {
            this.state.tasks = [];
        }

        if (!Array.isArray(this.state.achievements)) {
            this.state.achievements = [];
        }

        if (!Number.isFinite(Number(this.state.tasksCompleted))) {
            this.state.tasksCompleted = 0;
        }

        this.state.completedTasks = this.state.tasks
            .filter(task => task.completed)
            .map(task => task.id);
    },

    migrateState(savedState = {}) {
        const baseState = {
            schemaVersion: this.SCHEMA_VERSION,
            dailyTasbeeh: 0,
            monthlyTasbeeh: 0,
            totalTasbeeh: 0,
            streakCount: 0,
            tasksCompleted: 0,
            achievements: [],
            lastDate: '',
            lastMonthKey: '',
            tasks: [],
            completedTasks: [],
            azkarProgress: {},
            quranBookmark: null
        };

        const merged = {
            ...baseState,
            ...(this.isPlainObject(savedState) ? savedState : {})
        };

        merged.schemaVersion = this.SCHEMA_VERSION;
        merged.dailyTasbeeh = this.toSafeNumber(merged.dailyTasbeeh, 0, { min: 0 });
        merged.monthlyTasbeeh = this.toSafeNumber(merged.monthlyTasbeeh, 0, { min: 0 });
        merged.totalTasbeeh = this.toSafeNumber(merged.totalTasbeeh, 0, { min: 0 });
        merged.streakCount = this.toSafeNumber(merged.streakCount, 0, { min: 0 });
        merged.tasksCompleted = this.toSafeNumber(merged.tasksCompleted, 0, { min: 0 });
        merged.achievements = this.normalizeAchievements(merged.achievements);
        merged.lastDate = typeof merged.lastDate === 'string' ? merged.lastDate : '';
        merged.lastMonthKey = typeof merged.lastMonthKey === 'string' ? merged.lastMonthKey : '';
        merged.tasks = this.normalizeTasks(merged.tasks);
        merged.completedTasks = this.normalizeCompletedTasks(merged.completedTasks, merged.tasks);
        merged.azkarProgress = this.normalizeAzkarProgress(merged.azkarProgress);
        merged.quranBookmark = this.normalizeBookmark(merged.quranBookmark);

        return merged;
    },

    // ==========================================
    // تحميل البيانات بأمان
    // ==========================================
    load() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);

            if (!saved) {
                this.state = this.migrateState(this.state);
                return;
            }

            const parsed = JSON.parse(saved);
            this.state = this.migrateState(parsed);
            this.syncDerivedState();
        } catch (error) {
            console.error('[Storage Error] بيانات تالفة، سيتم إعادة التهيئة.', error);
            localStorage.removeItem(this.STORAGE_KEY);
            this.state = this.migrateState(this.state);
        }
    },

    // ==========================================
    // حفظ البيانات
    // ==========================================
    save() {
        try {
            this.state = this.migrateState(this.state);
            this.syncDerivedState();

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));

            if (typeof window.saveDataToCloud === 'function') {
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
    // التحقق من يوم/شهر جديد
    // ==========================================
    checkNewDay() {
        const today = this.getLocalDateKey();
        const monthKey = this.getLocalMonthKey();

        if (this.state.lastMonthKey !== monthKey) {
            this.state.monthlyTasbeeh = 0;
            this.state.lastMonthKey = monthKey;
        }

        if (this.state.lastDate === today) {
            return;
        }

        if (this.state.lastDate) {
            const diffDays = this.getDayDifference(this.state.lastDate, today);

            if (diffDays === 1) {
                this.state.streakCount += 1;
            } else {
                this.state.streakCount = 1;
            }
        } else {
            this.state.streakCount = 1;
        }

        this.state.dailyTasbeeh = 0;
        this.state.azkarProgress = {};
        this.state.lastDate = today;

        if (Array.isArray(this.state.tasks)) {
            this.state.tasks = this.state.tasks.map(task => ({
                ...task,
                completed: false
            }));
        } else {
            this.state.tasks = [];
        }

        this.syncDerivedState();
        this.save();
    },

    // ==========================================
    // دمج البيانات السحابية بشكل آمن
    // ==========================================
    mergeCloudState(cloudState) {
        const incoming = this.migrateState(cloudState);

        const localTasksById = new Map(
            (this.state.tasks || []).map(task => [task.id, task])
        );

        const mergedTasks = incoming.tasks.map(task => {
            const localTask = localTasksById.get(task.id);
            if (!localTask) return task;

            return {
                ...task,
                createdAt: task.createdAt || localTask.createdAt
            };
        });

        const mergedState = {
            ...this.state,
            ...incoming,
            tasks: mergedTasks
        };

        return this.migrateState(mergedState);
    },

        async updateFromCloud(cloudState) {
        if (!this.isPlainObject(cloudState)) return;

        try {
            this.state = this.mergeCloudState(cloudState);
            this.checkNewDay();
            this.save();

            // الاستيراد الديناميكي لمنع مشاكل التداخل (Circular Dependency)
            const { tasks } = await import('./tasks.js');
            const { masbaha } = await import('./masbaha.js');
            const { quran } = await import('./quran.js');

            if (tasks && typeof tasks.render === 'function') {
                tasks.render();
            }

            if (masbaha && typeof masbaha.updateUI === 'function') {
                masbaha.updateUI();
            }

            if (quran && typeof quran.checkBookmark === 'function') {
                quran.checkBookmark();
            }
        } catch (error) {
            console.error('[Storage Error] خطأ في دمج البيانات السحابية.', error);
        }
    } 
    };