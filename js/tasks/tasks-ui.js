/**
 * ====================================================================
 * Tasks UI
 * ====================================================================
 * مسؤول عن:
 * - عناصر DOM
 * - المودالات
 * - render للقائمة والإحصائيات الحالية
 * - التبويبات
 */
 import { storage } from '../storage.js';
import { app } from '../app.js';
import { TasksCore } from './tasks-core.js';
import { TasksStats } from './tasks-stats.js';
import { TasksMotivation } from './tasks-motivation.js';


export const TasksUI = {

    getElement(id) {
        return document.getElementById(id);
    },

    getModal(id) {
        return this.getElement(id);
    },

    showModal(id) {
        const modal = this.getModal(id);
        if (modal) {
            modal.style.display = 'flex';
        }
    },

    hideModal(id) {
        const modal = this.getModal(id);
        if (modal) {
            modal.style.display = 'none';
        }
    },

    notify(message, type = 'success') {
        app?.showToast?.(message, type);
    },

    renderStatsOnly() {
        const summary = TasksStats.getStatsSummary();

        const dailyEl = this.getElement('statDailyTasbeeh');
        const dailyInlineEl = this.getElement('statDailyTasbeehInline');
        const dailyTargetInlineEl = this.getElement('statDailyTasbeehTargetInline');
        const streakEl = this.getElement('statStreak');
        const monthlyEl = this.getElement('statMonthlyTasbeeh');
        const completedEl = this.getElement('statTasksCompleted');
        const totalEl = this.getElement('statTasksTotal');
        const percentEl = this.getElement('statTasksPercent');
        const percentInlineEl = this.getElement('statTasksPercentInline');
        const progressBar = this.getElement('tasksProgressBar');
        const statusLabel = this.getElement('statsActivityLabel');
        const badgeLabel = this.getElement('tasksBadgeText');

        const tasbeehProgressBar = this.getElement('tasbeehProgressBar');
        const tasbeehPercentInlineEl = this.getElement('statTasbeehPercentInline');
        const tasksProgressDetailsEl = this.getElement('statTasksProgressDetails');
        const tasbeehProgressDetailsEl = this.getElement('statTasbeehProgressDetails');
        const remainingSummaryEl = this.getElement('statRemainingSummary');
        const smartMessageEl = this.getElement('statsSmartMessage');

        const tasbeehPercent = Math.round(summary.dailyTasbeehProgressRatio * 100);

        if (dailyEl) {
            dailyEl.textContent = summary.dailyTasbeeh;
        }

        if (dailyInlineEl) {
            dailyInlineEl.textContent = summary.dailyTasbeeh;
        }

        if (dailyTargetInlineEl) {
            dailyTargetInlineEl.textContent = summary.dailyTasbeehTarget;
        }

        if (streakEl) {
            streakEl.textContent = summary.streakCount;
        }

        if (monthlyEl) {
            monthlyEl.textContent = summary.monthlyTasbeeh;
        }

        if (completedEl) {
            completedEl.textContent = summary.completedTasks;
        }

        if (totalEl) {
            totalEl.textContent = summary.totalTasks;
        }

        if (percentEl) {
            percentEl.textContent = `${summary.completionRate}%`;
        }

        if (percentInlineEl) {
            percentInlineEl.textContent = `${summary.completionRate}%`;
        }

        if (progressBar) {
            progressBar.style.width = `${summary.completionRate}%`;
        }

        if (statusLabel) {
            statusLabel.textContent = summary.activity.label;
        }

        if (badgeLabel) {
            badgeLabel.textContent = TasksMotivation.getBadge();
        }

        if (tasbeehProgressBar) {
            tasbeehProgressBar.style.width = `${tasbeehPercent}%`;
        }

        if (tasbeehPercentInlineEl) {
            tasbeehPercentInlineEl.textContent = `${tasbeehPercent}%`;
        }

        if (tasksProgressDetailsEl) {
            tasksProgressDetailsEl.textContent = summary.tasksProgressText;
        }

        if (tasbeehProgressDetailsEl) {
            tasbeehProgressDetailsEl.textContent = summary.tasbeehProgressText;
        }

        if (remainingSummaryEl) {
            remainingSummaryEl.textContent = summary.remainingSummaryText;
        }

        if (smartMessageEl) {
            smartMessageEl.textContent = summary.smartMessage;
        }
    },

    renderMotivation() {
        const motivationEl = this.getElement('tasksMotivationText');
        if (motivationEl) {
            motivationEl.textContent = TasksMotivation.getMessage();
        }
    },

    renderEmptyState(list) {
        list.innerHTML = '<p class="muted cardx--center" style="margin: 10px 0;">لا توجد مهام حالياً. أضف وردك اليومي بالأعلى!</p>';
    },

    updateTaskCardState({ task, card, text, toggleBtn, deleteBtn }) {
        if (text) {
            text.textContent = task.text;
            text.style.textDecoration = task.completed ? 'line-through' : 'none';
        }

        if (card) {
            card.style.opacity = task.completed ? '0.6' : '1';
        }

        if (toggleBtn) {
            toggleBtn.innerHTML = task.completed
                ? '<i class="fa-solid fa-circle-check" style="color: var(--primary); font-size: 1.3rem;"></i>'
                : '<i class="fa-regular fa-circle" style="font-size: 1.3rem; color: var(--text-sub);"></i>';
        }

        if (deleteBtn) {
            deleteBtn.style.display = task.isDefault ? 'none' : 'inline-flex';
        }
    },

    renderTaskItem(task, index, template, controller) {
        const clone = template.content.cloneNode(true);

        const card = clone.querySelector('.task-card');
        const text = clone.querySelector('.task-text');
        const toggleBtn = clone.querySelector('.toggle-btn');
        const deleteBtn = clone.querySelector('.delete-btn');

        this.updateTaskCardState({
            task,
            card,
            text,
            toggleBtn,
            deleteBtn
        });

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => controller.toggleTask(index));
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => controller.deleteTask(index));
        }

        return clone;
    },

    renderList(controller) {
        const list = this.getElement('tasksList');
        const template = this.getElement('tpl-task-card');

        if (!list || !template || !storage) return;

        TasksCore.ensureTaskState();

        list.innerHTML = '';

        const myTasks = TasksCore.getTasks();

        if (myTasks.length === 0) {
            this.renderEmptyState(list);
        } else {
            myTasks.forEach((task, index) => {
                const taskNode = this.renderTaskItem(task, index, template, controller);
                list.appendChild(taskNode);
            });
        }

        try {
            this.renderStatsOnly();
        } catch (error) {
            console.error('[TasksUI] renderStatsOnly error:', error);
        }

        try {
            this.renderMotivation();
        } catch (error) {
            console.error('[TasksUI] renderMotivation error:', error);
        }
    },

    switchTab(tabName) {
        const tasksView = this.getElement('tasksView');
        const statsView = this.getElement('statsView');
        const tasksBtn = this.getElement('tasksTabBtn');
        const statsBtn = this.getElement('statsTabBtn');

        const isTasksTab = tabName === 'tasks';

        if (tasksView && statsView) {
            tasksView.classList.toggle('is-hidden', !isTasksTab);
            statsView.classList.toggle('is-hidden', isTasksTab);
        }

        if (tasksBtn && statsBtn) {
            tasksBtn.classList.toggle('active', isTasksTab);
            statsBtn.classList.toggle('active', !isTasksTab);
        }
    }
};
