/**
 * ====================================================================
 * Tasks Manager - Daily Routine
 * ====================================================================
 */

const tasks = {
  render() {
    const list = document.getElementById('tasksList');
    // التأكد من وجود الواجهة وقاعدة البيانات (storage)
    if (!list || !window.storage) return;
    
    // المهام الأساسية الثابتة
    const defaultTasks = [
      { id: 't1', text: 'صلاة الفجر' },
      { id: 't2', text: 'أذكار الصباح' },
      { id: 't3', text: 'صلاة الظهر' },
      { id: 't4', text: 'صلاة العصر' },
      { id: 't5', text: 'أذكار المساء' },
      { id: 't6', text: 'صلاة المغرب' },
      { id: 't7', text: 'صلاة العشاء' },
      { id: 't8', text: 'ورد القرآن الكريم' }
    ];
    
    // جلب المهام المنجزة اليوم من الـ storage
    const currentCompleted = window.storage.state.completedTasks || [];
    
    // جلب المهام المخصصة اللي ضافها المستخدم (إن وجدت)
    let customTasks = [];
    try {
      customTasks = JSON.parse(localStorage.getItem('azkar_custom_tasks')) || [];
    } catch (e) {
      customTasks = [];
    }
    
    // دمج المهام الأساسية مع المخصصة
    const allTasks = [...defaultTasks, ...customTasks];
    
    let html = '';
    allTasks.forEach(task => {
      const isCompleted = currentCompleted.includes(task.id);
      const isCustom = String(task.id).startsWith('c_');
      
      html += `
                <div class="cardx" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; margin-bottom: 8px; opacity: ${isCompleted ? '0.6' : '1'}; transition: opacity 0.3s ease;">
                    <div style="display: flex; align-items: center; gap: 12px; flex: 1; cursor: pointer;" onclick="window.tasks?.toggleTask('${task.id}')">
                        <div style="width: 24px; height: 24px; border-radius: 6px; border: 2px solid ${isCompleted ? 'var(--primary)' : 'var(--text-sub)'}; background: ${isCompleted ? 'var(--primary)' : 'transparent'}; display: flex; justify-content: center; align-items: center; color: white; transition: background 0.2s, border 0.2s;">
                            ${isCompleted ? '<i class="fa-solid fa-check" style="font-size: 12px;"></i>' : ''}
                        </div>
                        <span style="font-size: 1.1rem; color: ${isCompleted ? 'var(--text-sub)' : 'var(--text-main)'}; text-decoration: ${isCompleted ? 'line-through' : 'none'}; transition: color 0.2s;">${task.text}</span>
                    </div>
                    ${isCustom ? `<button class="icon-btn" style="width: 30px; height: 30px; background: transparent; border: none; color: #ef4444; box-shadow: none;" onclick="window.tasks?.deleteCustomTask('${task.id}')"><i class="fa-solid fa-trash-can"></i></button>` : ''}
                </div>
            `;
    });
    
    list.innerHTML = html;
  },
  
  toggleTask(id) {
    if (!window.storage) return;
    
    let completed = window.storage.state.completedTasks || [];
    
    if (completed.includes(id)) {
      // إلغاء الإنجاز
      completed = completed.filter(t => t !== id);
    } else {
      // إتمام المهمة
      completed.push(id);
      
      // إطلاق كونفيتي (الاحتفال) عند الإنجاز 🎉
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#125B50', '#D8A25E', '#ffffff']
        });
      }
    }
    
    // حفظ التعديلات في storage
    window.storage.state.completedTasks = completed;
    window.storage.save();
    
    // إعادة الرسم
    this.render();
    
    // تحديث شاشة الإحصائيات مباشرة إذا كانت مفتوحة
    if (window.stats && document.getElementById('stats').classList.contains('active')) {
      window.stats.render();
    }
  },
  
  addTask() {
    const input = document.getElementById('newTaskInput');
    if (!input || input.value.trim() === '') return;
    
    let customTasks = [];
    try {
      customTasks = JSON.parse(localStorage.getItem('azkar_custom_tasks')) || [];
    } catch (e) {}
    
    const newTask = {
      id: 'c_' + Date.now(),
      text: input.value.trim()
    };
    
    customTasks.push(newTask);
    localStorage.setItem('azkar_custom_tasks', JSON.stringify(customTasks));
    
    input.value = '';
    this.render();
    
    if (window.app) {
      window.app.showToast('تمت إضافة المهمة بنجاح ✅');
    }
  },
  
  deleteCustomTask(id) {
    if (!confirm('هل أنت متأكد من حذف هذه المهمة نهائياً؟')) return;
    
    let customTasks = [];
    try {
      customTasks = JSON.parse(localStorage.getItem('azkar_custom_tasks')) || [];
    } catch (e) {}
    
    // حذفها من المهام المخصصة
    customTasks = customTasks.filter(t => t.id !== id);
    localStorage.setItem('azkar_custom_tasks', JSON.stringify(customTasks));
    
    // حذفها من المهام المنجزة (إذا كانت منجزة)
    if (window.storage && window.storage.state.completedTasks) {
      window.storage.state.completedTasks = window.storage.state.completedTasks.filter(t => t !== id);
      window.storage.save();
    }
    
    this.render();
    
    // تحديث شاشة الإحصائيات
    if (window.stats && document.getElementById('stats').classList.contains('active')) {
      window.stats.render();
    }
  }
};

// كشف الكائن للنطاق العام ليعمل مع أزرار الـ HTML
window.tasks = tasks;                                                                        