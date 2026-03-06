const stats = {
    render() {
        if (!window.storage) return;
        
        const tasbeehEl = document.getElementById('statDailyTasbeeh');
        const tasksEl = document.getElementById('statDailyTasks');
        const streakEl = document.getElementById('statStreak');
        
        if (tasbeehEl) {
            const daily = window.storage.state.dailyTasbeeh || 0;
            const target = localStorage.getItem('azkar_daily_target') || 1000;
            tasbeehEl.innerHTML = `${daily} <span style="font-size: 0.9rem; color: var(--text-sub); font-weight: normal;">/ ${target}</span>`;
            
            // تغيير اللون إذا حقق الهدف
            if (daily >= target && daily > 0) {
                tasbeehEl.style.color = '#10b981'; // أخضر للنجاح
            } else {
                tasbeehEl.style.color = 'var(--primary)';
            }
        }
        
        if (tasksEl) {
            const completed = window.storage.state.completedTasks ? window.storage.state.completedTasks.length : 0;
            tasksEl.textContent = completed;
        }
        
        if (streakEl) {
            const streak = window.storage.state.streakCount || 0;
            streakEl.textContent = streak;
            
            // إضافة نار للإستريك العالي 🔥
            if (streak > 3) {
                streakEl.parentElement.querySelector('.muted').innerHTML = `<i class="fa-solid fa-fire" style="color:#f97316;"></i> أيام الالتزام <i class="fa-solid fa-fire" style="color:#f97316;"></i>`;
            }
        }
    }
};

window.stats = stats;