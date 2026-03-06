/**
 * ====================================================================
 * Smart Masbaha & Azkar Manager
 * ====================================================================
 */

const masbaha = {
    isSilent: localStorage.getItem('azkar_silent') === 'true',
    isCustomZekrActive: false,
    currentTarget: 33,
    customAzkar: JSON.parse(localStorage.getItem('azkar_custom_list')) || [],
    zekrToDeleteIndex: null, 

    azkarCycle: [
        "سبحان الله", 
        "الحمد لله", 
        "الله أكبر", 
        "لا إله إلا الله", 
        "اللهم صل على محمد", 
        "أستغفر الله",
        "لا حول ولا قوة إلا بالله",
        "حسبنا الله ونعم الوكيل"
    ],

    init() {
        const savedTarget = localStorage.getItem('masbaha_target');
        if (savedTarget) {
            this.currentTarget = parseInt(savedTarget);
            const inputEl = document.getElementById('masbahaTargetInput');
            if(inputEl) inputEl.value = this.currentTarget;
        }
        
        this.updateUI();
        this.updateSilentIcon();
    },

    updateTarget() {
        const inputEl = document.getElementById('masbahaTargetInput');
        if (inputEl && inputEl.value) {
            this.currentTarget = Math.max(1, parseInt(inputEl.value));
            localStorage.setItem('masbaha_target', this.currentTarget);
            this.updateUI();
            if (window.app) window.app.showToast(`تم التغيير إلى ${this.currentTarget} 🔄`);
        }
    },

    toggleSilent() {
        this.isSilent = !this.isSilent;
        localStorage.setItem('azkar_silent', this.isSilent);
        this.updateSilentIcon();
    },

    updateSilentIcon() {
        const icon = document.getElementById('silentIcon');
        if (icon) {
            icon.className = this.isSilent ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
            icon.style.color = this.isSilent ? 'var(--text-sub)' : 'var(--primary)';
        }
    },

    increment() {
        if (!window.storage) return;
        
        window.storage.state.dailyTasbeeh++;
        window.storage.state.totalTasbeeh++;
        window.storage.save();

        if (!this.isSilent) {
            try { 
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                audio.volume = 0.5;
                audio.play().catch(()=>{}); 
            } catch (e) {}
        }
        
        if (navigator.vibrate) {
            if (window.storage.state.totalTasbeeh % this.currentTarget === 0) {
                navigator.vibrate([100, 50, 100]);
            } else {
                navigator.vibrate(50);
            }
        }
        
        this.updateUI();
        
        if (window.tasks && typeof window.tasks.renderStatsOnly === 'function') {
            window.tasks.renderStatsOnly();
        }
    },

    // 💡 1. فتح نافذة التصفير بدلاً من Confirm
    reset() {
        const modal = document.getElementById('resetMasbahaModal');
        if (modal) modal.style.display = 'flex';
    },

    // 💡 2. إغلاق نافذة التصفير
    closeResetModal() {
        const modal = document.getElementById('resetMasbahaModal');
        if (modal) modal.style.display = 'none';
    },

    // 💡 3. تأكيد وتنفيذ التصفير
    confirmReset() {
        if (window.storage) {
            window.storage.state.totalTasbeeh = 0;
            window.storage.save();
        }
        this.isCustomZekrActive = false;
        this.updateUI();
        this.closeResetModal();
        if (window.app) window.app.showToast('تم تصفير العداد 🔄');
    },

    updateUI() {
        const totalEl = document.getElementById('totalCounter');
        const batchEl = document.getElementById('batchCounter');
        const zekrDisplay = document.getElementById('generalZekrDisplay');
        
        if (!window.storage) return;
        const total = window.storage.state.totalTasbeeh;

        if (totalEl) totalEl.textContent = total;
        if (batchEl) batchEl.textContent = `${total % this.currentTarget} / ${this.currentTarget}`;
        
        if (zekrDisplay && !this.isCustomZekrActive) {
            const currentPhase = Math.floor(total / this.currentTarget) % this.azkarCycle.length;
            zekrDisplay.textContent = this.azkarCycle[currentPhase];
        }
    },
    
    openCustomZekrModal() {
        const modal = document.getElementById('customZekrModal');
        if (modal) {
            this.renderCustomZekrList(); 
            modal.style.display = 'flex';
            setTimeout(() => {
                const input = document.getElementById('newCustomZekrInput');
                if(input) input.focus();
            }, 100);
        }
    },

    closeCustomZekrModal() {
        const modal = document.getElementById('customZekrModal');
        if (modal) modal.style.display = 'none';
    },

    saveCustomZekr() {
        const input = document.getElementById('newCustomZekrInput');
        if (!input) return;
        const zekr = input.value.trim();
        
        if (zekr) {
            if(!this.customAzkar.includes(zekr) && !this.azkarCycle.includes(zekr)){
                this.customAzkar.unshift(zekr); 
                localStorage.setItem('azkar_custom_list', JSON.stringify(this.customAzkar));
            } else if (this.azkarCycle.includes(zekr)) {
                if (window.app) window.app.showToast('هذا الذكر موجود بالفعل في الأذكار الأساسية!', 'error');
                return;
            }
            
            input.value = ''; 
            this.selectCustomZekr(zekr); 
            if (window.app) window.app.showToast('تمت الإضافة بنجاح ✨');
        }
    },

    deleteCustomZekr(index) {
        this.zekrToDeleteIndex = index;
        const modal = document.getElementById('deleteZekrModal');
        if (modal) modal.style.display = 'flex';
    },

    closeDeleteModal() {
        const modal = document.getElementById('deleteZekrModal');
        if (modal) modal.style.display = 'none';
        this.zekrToDeleteIndex = null;
    },

    confirmDeleteZekr() {
        if (this.zekrToDeleteIndex !== null) {
            this.customAzkar.splice(this.zekrToDeleteIndex, 1);
            localStorage.setItem('azkar_custom_list', JSON.stringify(this.customAzkar));
            this.renderCustomZekrList(); 
            this.closeDeleteModal();
            if (window.app) window.app.showToast('تم حذف الذكر بنجاح 🗑️');
        }
    },

    selectCustomZekr(zekr) {
        this.isCustomZekrActive = true;
        const zekrDisplay = document.getElementById('generalZekrDisplay');
        if (zekrDisplay) zekrDisplay.textContent = zekr;
        
        if (window.storage) {
            window.storage.state.totalTasbeeh = 0;
            window.storage.save();
        }
        this.updateUI();
        this.closeCustomZekrModal(); 
    },

    renderCustomZekrList() {
        const container = document.getElementById('customZekrListContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.azkarCycle.forEach((zekr) => {
            const item = document.createElement('div');
            item.className = 'custom-zekr-item';
            item.style.borderRight = '4px solid var(--primary)';
            
            const textDiv = document.createElement('div');
            textDiv.className = 'custom-zekr-text amiri-text';
            textDiv.textContent = zekr;
            textDiv.onclick = () => this.selectCustomZekr(zekr);
            textDiv.style.cursor = 'pointer';
            
            item.appendChild(textDiv);
            container.appendChild(item);
        });

        if (this.customAzkar.length > 0) {
            const divider = document.createElement('div');
            divider.className = 'muted';
            divider.style.margin = '15px 0 5px 0';
            divider.style.fontWeight = 'bold';
            divider.textContent = 'أذكاري المضافة:';
            container.appendChild(divider);
        }
        
        this.customAzkar.forEach((zekr, index) => {
            const item = document.createElement('div');
            item.className = 'custom-zekr-item';
            
            const textDiv = document.createElement('div');
            textDiv.className = 'custom-zekr-text amiri-text';
            textDiv.textContent = zekr;
            textDiv.onclick = () => this.selectCustomZekr(zekr);
            textDiv.style.cursor = 'pointer';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'icon-btn icon-btn--transparent';
            deleteBtn.style.color = '#ef4444';
            deleteBtn.style.width = '35px';
            deleteBtn.style.height = '35px';
            deleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
            deleteBtn.onclick = (e) => {
                e.stopPropagation(); 
                this.deleteCustomZekr(index);
            };
            
            item.appendChild(textDiv);
            item.appendChild(deleteBtn);
            container.appendChild(item);
        });
    },

    renderAzkarCategories() {
        const grid = document.getElementById('azkarCategoriesGrid');
        if (!grid) return;
        
        grid.innerHTML = ''; 
        
        if (!window.AZKAR_JSON || !window.AZKAR_JSON.categories) {
            const p = document.createElement('p');
            p.className = 'muted cardx--center';
            p.style.gridColumn = 'span 2';
            p.textContent = 'جاري تحميل الأذكار...';
            grid.appendChild(p);
            return;
        }

        const iconMap = {
            'صباح': 'fa-sun', 'مساء': 'fa-cloud-sun', 'نوم': 'fa-moon', 
            'استيقاظ': 'fa-sun-plant-wilt', 'صلاة': 'fa-pray', 'مسجد': 'fa-mosque', 
            'سفر': 'fa-plane', 'وضوء': 'fa-hand-holding-droplet'
        };

        const template = document.getElementById('tpl-dashboard-btn');
        if (!template) return;

        window.AZKAR_JSON.categories.forEach(cat => {
            let iconName = 'fa-book-open';
            for (let keyword in iconMap) {
                if (cat.category.includes(keyword)) {
                    iconName = iconMap[keyword];
                    break;
                }
            }

            const clone = template.content.cloneNode(true);
            const btn = clone.querySelector('.home-btn');
            
            btn.style.padding = '10px';
            btn.style.gap = '8px';
            btn.onclick = () => window.masbaha?.openAzkarCategory(cat.category, cat.category);

            const iconBox = clone.querySelector('.home-icon-box');
            iconBox.style.width = '38px';
            iconBox.style.height = '38px';
            iconBox.style.fontSize = '1.1rem';
            iconBox.innerHTML = `<i class="fa-solid ${iconName}"></i>`;

            const textSpan = clone.querySelector('.home-btn-text');
            textSpan.style.fontSize = '0.85rem';
            textSpan.textContent = cat.category; 

            grid.appendChild(clone);
        });
    },

    openAzkarCategory(key, title) {
        if (!window.AZKAR_JSON) return;
        
        const categoryData = window.AZKAR_JSON.categories.find(c => c.category === key);
        if (!categoryData) return;

        document.getElementById('azkarListTitle').textContent = title;
        
        if (!window.storage.state.azkarProgress) window.storage.state.azkarProgress = {};
        if (!window.storage.state.azkarProgress[key]) window.storage.state.azkarProgress[key] = {};

        const listContainer = document.getElementById('wirdAzkarList');
        listContainer.innerHTML = ''; 

        const template = document.getElementById('tpl-zekr-card');
        if (!template) return;

        const safeKey = key.replace(/\s+/g, '-');

        categoryData.azkar.forEach((zekr, index) => {
            const target = zekr.repeat || zekr.count || 1;
            const current = window.storage.state.azkarProgress[key][index] || 0;
            const isDone = current >= target;
            const textToCopy = (zekr.text || "").replace(/'/g, "\\'");

            const clone = template.content.cloneNode(true);
            const card = clone.querySelector('.zekr-card');
            const zekrTextEl = clone.querySelector('.zekr-text');
            const fadlContainer = clone.querySelector('.zekr-fadl-container');
            const fadlText = clone.querySelector('.zekr-fadl');
            const copyBtn = clone.querySelector('.copy-btn');
            const shareBtn = clone.querySelector('.share-btn');
            const counterBtn = clone.querySelector('.zekr-counter-btn');
            const statusSpan = clone.querySelector('.zekr-status');
            const countSpan = clone.querySelector('.zekr-count');

            zekrTextEl.textContent = zekr.text;
            
            if (zekr.fadl) {
                fadlText.textContent = `💡 ${zekr.fadl}`;
                fadlContainer.style.display = 'block';
            }
            
            copyBtn.onclick = () => window.app?.copyToClipboard(textToCopy);
            shareBtn.onclick = () => window.app?.shareText(textToCopy);

            counterBtn.id = `zekr-btn-${safeKey}-${index}`;
            countSpan.textContent = `${current} / ${target}`;

            if (isDone) {
                card.style.border = '2px solid var(--primary)';
                card.style.opacity = '0.6';
                counterBtn.disabled = true;
                statusSpan.innerHTML = '<i class="fa-solid fa-check-double"></i> اكتمل';
            } else {
                card.style.border = '2px solid var(--border)';
                counterBtn.classList.add('btn--primary');
                counterBtn.onclick = () => window.masbaha?.tickZekr(key, index, target);
                statusSpan.innerHTML = '<i class="fa-solid fa-hand-pointer"></i> اضغط للعد';
            }

            listContainer.appendChild(clone);
        });

        document.getElementById('wirdMainView').classList.add('is-hidden');
        document.getElementById('wirdMainView').style.display = 'none';
        
        document.getElementById('wirdListView').classList.remove('is-hidden');
        document.getElementById('wirdListView').style.display = '';
        
        window.history.pushState({ section: 'wird', sub: true }, '', '#azkar-list');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    tickZekr(category, index, target) {
        if (!window.storage) return;
        
        let current = window.storage.state.azkarProgress[category][index] || 0;
        
        if (current < target) {
            current++;
            window.storage.state.azkarProgress[category][index] = current;
            window.storage.save();
            
            if (navigator.vibrate) navigator.vibrate(50);

            const safeCategory = category.replace(/\s+/g, '-');
            const btn = document.getElementById(`zekr-btn-${safeCategory}-${index}`);
            
            if (btn) {
                const countSpan = btn.querySelector('.zekr-count');
                const statusSpan = btn.querySelector('.zekr-status');
                
                if (countSpan) countSpan.textContent = `${current} / ${target}`;
                
                if (current >= target) {
                    btn.classList.remove('btn--primary');
                    btn.disabled = true;
                    btn.parentElement.style.borderColor = 'var(--primary)';
                    btn.parentElement.style.opacity = '0.6';
                    if (statusSpan) statusSpan.innerHTML = '<i class="fa-solid fa-check-double"></i> اكتمل';
                    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                }
            }
        }
    },

    closeAzkarCategory() { 
        window.history.back(); 
    }
};

window.masbaha = masbaha;
