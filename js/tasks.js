/**
 * ====================================================================
 * Tasks & Stats Manager
 * ====================================================================
 */

const tasks = {
    taskToDeleteIndex: null,

    init() {
        this.setupDefaultTasks(); 
        this.render();
    },

    setupDefaultTasks() {
        if (!window.storage) return;
        
        if (!localStorage.getItem('azkar_tasks_initialized')) {
            if (!window.storage.state.tasks) {
                window.storage.state.tasks = [];
            }
            
            const defaultTasks = [
                { text: 'قراءة أذكار الصباح ☀️', completed: false },
                { text: 'قراءة أذكار المساء 🌙', completed: false },
                { text: 'ورد القرآن الكريم 📖', completed: false },
                { text: 'صلاة الضحى 🕌', completed: false },
                { text: 'صلاة الوتر 🌌', completed: false }
            ];
            
            window.storage.state.tasks = defaultTasks;
            window.storage.save();
            localStorage.setItem('azkar_tasks_initialized', 'true');
        }
    },

    // 💡 1. فتح نافذة الاستعادة
    restoreDefaultTasks() {
        const modal = document.getElementById('restoreTasksModal');
        if (modal) modal.style.display = 'flex';
    },

    // 💡 2. إغلاق نافذة الاستعادة
    closeRestoreModal() {
        const modal = document.getElementById('restoreTasksModal');
        if (modal) modal.style.display = 'none';
    },

    // 💡 3. تأكيد وتنفيذ الاستعادة
    confirmRestoreTasks() {
        if (!window.storage) return;
        
        if (!window.storage.state.tasks) window.storage.state.tasks = [];
        
        const defaultTasks = [
            { text: 'قراءة أذكار الصباح ☀️', completed: false },
            { text: 'قراءة أذكار المساء 🌙', completed: false },
            { text: 'ورد القرآن الكريم 📖', completed: false },
            { text: 'صلاة الضحى 🕌', completed: false },
            { text: 'صلاة الوتر 🌌', completed: false }
        ];
        
        let addedCount = 0;
        
        // إضافة المهام الافتراضية بشرط ألا تكون موجودة مسبقاً
        defaultTasks.forEach(dt => {
            const exists = window.storage.state.tasks.some(t => t.text === dt.text);
            if (!exists) {
                window.storage.state.tasks.push(dt);
                addedCount++;
            }
        });
        
        if (addedCount > 0) {
            window.storage.save();
            this.render();
            if (window.app) window.app.showToast('تمت استعادة المهام بنجاح 🔄');
        } else {
            if (window.app) window.app.showToast('المهام الافتراضية موجودة بالفعل ✅');
        }
        
        this.closeRestoreModal(); // إغلاق النافذة بعد الانتهاء
    },

    renderStatsOnly() {
        if (!window.storage || !window.storage.state) return;
        
        const dailyEl = document.getElementById('statDailyTasbeeh');
        const streakEl = document.getElementById('statStreak');
        
        if (dailyEl) {
            dailyEl.textContent = window.storage.state.dailyTasbeeh || 0;
        }
        if (streakEl) {
            streakEl.textContent = window.storage.state.streak || 0;
        }
    },

    render() {
        this.renderStatsOnly();
        
        const list = document.getElementById('tasksList');
        const template = document.getElementById('tpl-task-card');
        if (!list || !template || !window.storage) return;
        
        list.innerHTML = '';
        const myTasks = window.storage.state.tasks || [];
        
        if (myTasks.length === 0) {
            list.innerHTML = '<p class="muted cardx--center" style="margin: 10px 0;">لا توجد مهام حالياً. أضف وردك اليومي بالأعلى!</p>';
            return;
        }
        
        myTasks.forEach((task, index) => {
            const clone = template.content.cloneNode(true);
            const card = clone.querySelector('.task-card');
            const text = clone.querySelector('.task-text');
            const toggleBtn = clone.querySelector('.toggle-btn');
            const deleteBtn = clone.querySelector('.delete-btn');
            
            text.textContent = task.text;
            
            if (task.completed) {
                card.style.opacity = '0.6';
                text.style.textDecoration = 'line-through';
                toggleBtn.innerHTML = '<i class="fa-solid fa-circle-check" style="color: var(--primary); font-size: 1.3rem;"></i>';
            } else {
                toggleBtn.innerHTML = '<i class="fa-regular fa-circle" style="font-size: 1.3rem; color: var(--text-sub);"></i>';
            }
            
            toggleBtn.onclick = () => this.toggleTask(index);
            deleteBtn.onclick = () => this.deleteTask(index);
            
            list.appendChild(clone);
        });
    },

    addTask() {
        const input = document.getElementById('newTaskInput');
        if (!input || !input.value.trim() || !window.storage) return;
        
        if (!window.storage.state.tasks) window.storage.state.tasks = [];
        
        window.storage.state.tasks.push({ text: input.value.trim(), completed: false });
        window.storage.save();
        
        input.value = ''; 
        this.render(); 
        
        if (window.app) window.app.showToast('تمت إضافة المهمة ✨');
    },

    toggleTask(index) {
        if (!window.storage || !window.storage.state.tasks) return;
        
        window.storage.state.tasks[index].completed = !window.storage.state.tasks[index].completed;
        window.storage.save();
        this.render();
        
        if (navigator.vibrate) navigator.vibrate(50);
    },

    deleteTask(index) {
        this.taskToDeleteIndex = index;
        const modal = document.getElementById('deleteTaskModal');
        if (modal) modal.style.display = 'flex';
    },

    closeDeleteModal() {
        const modal = document.getElementById('deleteTaskModal');
        if (modal) modal.style.display = 'none';
        this.taskToDeleteIndex = null;
    },

    confirmDeleteTask() {
        if (this.taskToDeleteIndex !== null && window.storage && window.storage.state.tasks) {
            window.storage.state.tasks.splice(this.taskToDeleteIndex, 1);
            window.storage.save();
            this.render();
            this.closeDeleteModal();
            if (window.app) window.app.showToast('تم حذف المهمة 🗑️');
        }
    }
};

window.tasks = tasks;
