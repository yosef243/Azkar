import { storage } from './storage.js';
import { achievements } from './achievements.js';
import { TasksCore } from './tasks/tasks-core.js';
import { TasksStats } from './tasks/tasks-stats.js';
import { TasksMotivation } from './tasks/tasks-motivation.js';
import { TasksUI } from './tasks/tasks-ui.js';

export const tasks = {
    taskToDeleteIndex: null,
    initialized: false,
    activeTab: 'tasks',

    init() {
        if (!storage || !TasksCore || !TasksStats || !TasksUI) return;
        if (!this.initialized) {
            TasksCore.ensureTaskState();
            this.initialized = true;
        }
        this.refreshVisibleState();
    },

    switchTab(tabName) {
        this.activeTab = tabName === 'stats' ? 'stats' : 'tasks';
        TasksUI.switchTab(this.activeTab);
        this.refreshVisibleState();
    },

    renderStatsOnly() {
        TasksUI.renderStatsOnly();
    },

    refreshVisibleState() {
        TasksCore.ensureTaskState();
        if (this.activeTab === 'stats') {
            TasksUI.renderStatsOnly();
            TasksUI.renderMotivation();
            TasksUI.switchTab('stats');
            return;
        }
        TasksUI.renderList(this);
        TasksUI.switchTab('tasks');
    },

    restoreDefaultTasks() {
        TasksUI.showModal('restoreTasksModal');
    },

    closeRestoreModal() {
        TasksUI.hideModal('restoreTasksModal');
    },

    confirmRestoreTasks() {
        const stateTasks = TasksCore.getTasks();
        const customTasks = stateTasks.filter(t => !t.isDefault);
        const defaults = TasksCore.buildDefaultTasks();

        storage.state.tasks = [...defaults, ...customTasks];
        TasksCore.saveState();
        this.render();
        this.closeRestoreModal();
        TasksUI.notify('تم استعادة المهام الافتراضية');
    },

    addTask() {
        const input = TasksUI.getElement('newTaskInput');
        if (!input) return;

        const text = input.value.trim();
        if (!text) return;

        const tasksList = TasksCore.getTasks();
        tasksList.push(TasksCore.createTask({ text }));
        TasksCore.saveState();

        input.value = '';
        this.render();
        TasksUI.notify('تمت الإضافة بنجاح ✨');
    },

    toggleTask(taskId) {
        const tasksList = TasksCore.getTasks();
        const task = tasksList.find(t => t.id === taskId);
        if (!task) return;

        const wasCompleted = task.completed;
        task.completed = !wasCompleted;

        if (task.completed && storage) {
            storage.state.tasksCompleted = (storage.state.tasksCompleted || 0) + 1;
        }

        TasksCore.saveState();
        achievements?.checkAchievements?.();
        this.render();

        if (navigator.vibrate) navigator.vibrate(40);

        const completed = TasksStats.getCompletedTasksCount();
        const total = TasksStats.getTotalTasksCount();

        if (completed === total && total > 0) {
            TasksUI.notify(TasksMotivation.getMessage());
        }
    },

    deleteTask(index) {
        this.taskToDeleteIndex = index;
        TasksUI.showModal('deleteTaskModal');
    },

    closeDeleteModal() {
        TasksUI.hideModal('deleteTaskModal');
        this.taskToDeleteIndex = null;
    },

    confirmDeleteTask() {
        if (this.taskToDeleteIndex === null) return;
        const tasksList = TasksCore.getTasks();
        const task = tasksList[this.taskToDeleteIndex];

        if (!task) {
            this.closeDeleteModal();
            return;
        }

        if (task.isDefault) {
            this.closeDeleteModal();
            TasksUI.notify('لا يمكن حذف المهام الافتراضية');
            return;
        }

        tasksList.splice(this.taskToDeleteIndex, 1);
        TasksCore.saveState();
        this.render();
        this.closeDeleteModal();
        TasksUI.notify('تم حذف المهمة');
    },

    render() {
        this.refreshVisibleState();
    }
};
