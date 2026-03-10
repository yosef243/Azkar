/**
 * ====================================================================
 * Tasks Stats
 * ====================================================================
 * مسؤول عن:
 * - حساب الإحصائيات المرتبطة بالمهام
 * - قراءة counters من storage
 * - تجهيز summary موحد
 * - احتساب نسبة الإنجاز اليومي على أساس:
 *   (المهام + هدف التسبيح اليومي)
 */
 import { storage } from '../storage.js';
import { TasksCore } from './tasks-core.js';


export const TasksStats = {
    getCompletedTasksCount() {
        return TasksCore.getTasks().filter(task => task.completed).length;
    },

    getTotalTasksCount() {
        return TasksCore.getTasks().length;
    },

    getDailyTasbeeh() {
        return Number(storage?.state?.dailyTasbeeh || 0);
    },

    getMonthlyTasbeeh() {
        return Number(
            storage?.state?.monthlyTasbeeh || 0);
    },

    getStreakCount() {
        return Number(storage?.state?.streakCount || 0);
    },

    getTasksCompletedLifetime() {
        return Number(
            storage?.state?.tasksCompleted || 0);
    },

    getTasksRemainingCount() {
        return Math.max(0, this.getTotalTasksCount() - this.getCompletedTasksCount());
    },

    getDailyTasbeehTarget() {
        const target = Number(localStorage.getItem('azkar_daily_target') || 1000);
        return Number.isFinite(target) && target > 0 ? target : 1000;
    },

    getDailyTasbeehProgressRatio() {
        const target = this.getDailyTasbeehTarget();
        const current = this.getDailyTasbeeh();

        if (target <= 0) return 1;

        return Math.min(current / target, 1);
    },

    getDailyTasbeehRemaining() {
        return Math.max(0, this.getDailyTasbeehTarget() - this.getDailyTasbeeh());
    },

    getCompletionRate() {
        const completedTasks = this.getCompletedTasksCount();
        const totalTasks = this.getTotalTasksCount();
        const tasbeehProgress = this.getDailyTasbeehProgressRatio();

        const totalUnits = totalTasks + 1;
        const completedUnits = completedTasks + tasbeehProgress;

        if (totalUnits <= 0) return 0;

        return Math.round((completedUnits / totalUnits) * 100);
    },

    getTasksProgressText() {
        return `${this.getCompletedTasksCount()} / ${this.getTotalTasksCount()}`;
    },

    getTasbeehProgressText() {
        return `${this.getDailyTasbeeh()} / ${this.getDailyTasbeehTarget()}`;
    },

    getRemainingSummaryText() {
        const remainingTasks = this.getTasksRemainingCount();
        const remainingTasbeeh = this.getDailyTasbeehRemaining();

        if (remainingTasks === 0 && remainingTasbeeh === 0) {
            return 'اكتمل هدف اليوم بالكامل ✅';
        }

        if (remainingTasks > 0 && remainingTasbeeh > 0) {
            return `باقي ${remainingTasks} مهام و ${remainingTasbeeh} تسبيحة`;
        }

        if (remainingTasks > 0) {
            return `باقي ${remainingTasks} مهام فقط`;
        }

        return `باقي ${remainingTasbeeh} تسبيحة فقط`;
    },

    getSmartStatsMessage(summary) {
        if (summary.completionRate === 100) {
            return 'أتممت كل مهامك وحققت هدف التسبيح اليومي، ما شاء الله 🌟';
        }

        if (summary.completedTasks === summary.totalTasks && summary.totalTasks > 0 && summary.dailyTasbeeh < summary.dailyTasbeehTarget) {
            return `أنجزت كل المهام، وبقي ${summary.dailyTasbeehRemaining} تسبيحة لإغلاق اليوم على 100%`;
        }

        if (summary.dailyTasbeeh >= summary.dailyTasbeehTarget && summary.remainingTasks > 0) {
            return `حققت هدف التسبيح اليومي، وبقي ${summary.remainingTasks} مهام للوصول إلى 100%`;
        }

        if (summary.remainingTasks === 1 && summary.dailyTasbeehRemaining === 0) {
            return 'بقيت مهمة واحدة فقط للوصول إلى يوم مثالي 🔥';
        }

        if (summary.remainingTasks === 0 && summary.dailyTasbeehRemaining > 0) {
            return `بقي ${summary.dailyTasbeehRemaining} تسبيحة فقط لتحقيق هدف اليوم`;
        }

        if (summary.completionRate >= 75) {
            return 'أنت قريب جدًا من إكمال يومك بنجاح ممتاز 👏';
        }

        if (summary.completionRate >= 40) {
            return 'تقدمك جيد، استمر بنفس الوتيرة 🌱';
        }

        return 'ابدأ بخطوة صغيرة: مهمة واحدة أو دفعة تسبيح، والباقي سيأتي بسهولة ✨';
    },

    getActivityLevelFromSummary(summary) {
        if (summary.totalTasks === 0 && summary.dailyTasbeeh === 0) {
            return {
                label: 'ابدأ اليوم',
                tone: 'neutral'
            };
        }

        if (summary.completionRate === 100) {
            return {
                label: 'يوم مثالي',
                tone: 'excellent'
            };
        }

        if (summary.completionRate >= 85) {
            return {
                label: 'ممتاز جدًا',
                tone: 'excellent'
            };
        }

        if (summary.completionRate >= 65) {
            return {
                label: 'تقدم قوي',
                tone: 'good'
            };
        }

        if (summary.completionRate >= 40) {
            return {
                label: 'تقدم جيد',
                tone: 'good'
            };
        }

        if (summary.dailyTasbeeh > 0 || summary.completedTasks > 0) {
            return {
                label: 'بداية موفقة',
                tone: 'neutral'
            };
        }

        return {
            label: 'بداية اليوم',
            tone: 'neutral'
        };
    },

    getStatsSummary() {
        const summary = {
            dailyTasbeeh: this.getDailyTasbeeh(),
            dailyTasbeehTarget: this.getDailyTasbeehTarget(),
            dailyTasbeehProgressRatio: this.getDailyTasbeehProgressRatio(),
            dailyTasbeehRemaining: this.getDailyTasbeehRemaining(),
            monthlyTasbeeh: this.getMonthlyTasbeeh(),
            streakCount: this.getStreakCount(),
            completedTasks: this.getCompletedTasksCount(),
            totalTasks: this.getTotalTasksCount(),
            remainingTasks: this.getTasksRemainingCount(),
            completionRate: this.getCompletionRate(),
            tasksCompletedLifetime: this.getTasksCompletedLifetime(),
            tasksProgressText: this.getTasksProgressText(),
            tasbeehProgressText: this.getTasbeehProgressText(),
            remainingSummaryText: this.getRemainingSummaryText()
        };

        summary.activity = this.getActivityLevelFromSummary(summary);
        summary.smartMessage = this.getSmartStatsMessage(summary);

        return summary;
    }
};