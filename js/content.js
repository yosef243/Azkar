/**
 * ====================================================================
 * Content Renderer (Duas, Names, Stories, Daily Content)
 * Using HTML Templates for High Performance & Clean Code (Fully Fixed)
 * ====================================================================
 */

const content = {
    init() {
        this.setDailyAyah();
        this.setDailyMessage();
    },

    setDailyAyah() {
        const el = document.getElementById('dailyAyahText');
        if (!el || !window.QURAN_JSON) return;

        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
        const chapterNum = (dayOfYear % 114) + 1;
        const ayahs = window.QURAN_JSON[chapterNum];

        if (ayahs && ayahs.length > 0) {
            let text = ayahs[0].text.replace("بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ", "").trim();
            el.textContent = text;
        }
    },

    setDailyMessage() {
        const el = document.getElementById('dailyMessageText');
        if (!el || !window.DAILY_MESSAGES) return;

        const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
        const period = Math.floor(currentHour / 6);
        const msg = window.DAILY_MESSAGES[period % window.DAILY_MESSAGES.length];

        el.textContent = msg.message || msg;
    },

    createDashboardBtn(text, iconClass, onClickFn) {
        const template = document.getElementById('tpl-dashboard-btn');
        if (!template) return null;

        const clone = template.content.cloneNode(true);
        const btn = clone.querySelector('.home-btn');

        btn.onclick = onClickFn;
        clone.querySelector('.home-icon-box i').className = `fa-solid ${iconClass}`;
        clone.querySelector('.home-btn-text').textContent = text;

        return clone;
    },

    // ==========================================
    // الأدعية الجامعة
    // ==========================================
    renderDuas() {
        const list = document.getElementById('duasList');
        if (!list || list.innerHTML !== '' || !window.DUAS_JSON) return;

        // 💡 استخدام DOM API بدلاً من innerHTML
        const grid = document.createElement('div');
        grid.id = 'duaCategoriesGrid';
        grid.className = 'home-grid';

        const contentDiv = document.createElement('div');
        contentDiv.id = 'duaCategoryContent';
        contentDiv.className = 'is-hidden';
        contentDiv.style.display = 'none';

        list.appendChild(grid);
        list.appendChild(contentDiv);

        let categoriesData = window.DUAS_JSON.categories || window.DUAS_JSON.duas || window.DUAS_JSON;

        const processCategory = (catName) => {
            const btnNode = this.createDashboardBtn(catName, 'fa-hands-praying', () => window.content?.openDuaCategory(catName));
            if (btnNode) grid.appendChild(btnNode);
        };

        if (Array.isArray(categoriesData)) {
            categoriesData.forEach(cat => processCategory(cat.category || cat.name || "أدعية"));
        } else {
            Object.keys(categoriesData).forEach(processCategory);
        }
    },

    openDuaCategory(catName) {
        window.history.pushState({ section: 'duas', sub: true }, '', '#duas-category');

        let categoriesData = window.DUAS_JSON.categories || window.DUAS_JSON.duas || window.DUAS_JSON;
        let duasList = [];

        if (Array.isArray(categoriesData)) {
            const category = categoriesData.find(c => (c.category === catName || c.name === catName));
            if (category) duasList = category.duas || category.list || [];
        } else {
            duasList = categoriesData[catName] || [];
        }

        const contentEl = document.getElementById('duaCategoryContent');
        contentEl.innerHTML = ''; // تفريغ المحتوى السابق

        // 💡 الحل: استخدام القالب للرأس (زر العودة والعنوان)
        const headerTemplate = document.getElementById('tpl-subview-header');
        if (headerTemplate) {
            const cloneHeader = headerTemplate.content.cloneNode(true);
            cloneHeader.querySelector('.subview-title').textContent = catName;
            contentEl.appendChild(cloneHeader);
        }

        if (duasList.length === 0) {
            const p = document.createElement('p');
            p.className = 'muted cardx--center';
            p.textContent = 'لا توجد أدعية في هذا القسم حالياً.';
            contentEl.appendChild(p);
        } else {
            const template = document.getElementById('tpl-dua-card');
            if (template) {
                duasList.forEach(item => {
                    const text = item.text || item.dua || item;
                    const textToCopy = text.replace(/'/g, "\\'");

                    const clone = template.content.cloneNode(true);
                    clone.querySelector('.dua-text').textContent = text;
                    clone.querySelector('.copy-btn').onclick = () => window.app?.copyToClipboard(textToCopy);
                    clone.querySelector('.share-btn').onclick = () => window.app?.shareText(textToCopy);

                    contentEl.appendChild(clone);
                });
            }
        }

        const gridEl = document.getElementById('duaCategoriesGrid');
        if (gridEl) {
            gridEl.classList.add('is-hidden');
            gridEl.style.display = 'none';
        }
        contentEl.classList.remove('is-hidden');
        contentEl.style.display = '';

        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // ==========================================
    // أسماء الله الحسنى
    // ==========================================
    renderNames() {
        const grid = document.getElementById('namesGrid');
        if (!grid || grid.innerHTML !== '' || !window.ALLAH_NAMES) return;

        let dataArray = Array.isArray(window.ALLAH_NAMES) ? window.ALLAH_NAMES : (window.ALLAH_NAMES.names || window.ALLAH_NAMES.ar || []);
        const template = document.getElementById('tpl-name-card');

        if (template) {
            dataArray.forEach(item => {
                const clone = template.content.cloneNode(true);
                clone.querySelector('.name-title').textContent = item.name || item;
                clone.querySelector('.name-desc').textContent = item.desc || item.meaning || "";
                grid.appendChild(clone);
            });
        }
    },

    // ==========================================
    // القصص والعبر
    // ==========================================
    renderStories() {
        const grid = document.getElementById('storiesGrid');
        if (!grid || grid.innerHTML !== '' || !window.STORIES_JSON || !window.STORIES_JSON.categories) return;

        // 💡 استخدام DOM API للقصص أيضاً
        const catGrid = document.createElement('div');
        catGrid.id = 'storyCategoriesGrid';
        catGrid.className = 'home-grid';

        const contentDiv = document.createElement('div');
        contentDiv.id = 'storyCategoryContent';
        contentDiv.className = 'is-hidden';
        contentDiv.style.display = 'none';

        grid.appendChild(catGrid);
        grid.appendChild(contentDiv);

        window.STORIES_JSON.categories.forEach(cat => {
            const btnNode = this.createDashboardBtn(cat.name, 'fa-book-journal-whills', () => window.content?.openStoryCategory(cat.name));
            if (btnNode) catGrid.appendChild(btnNode);
        });
    },

    openStoryCategory(catName) {
        window.history.pushState({ section: 'stories', sub: true }, '', '#stories-category');
        const category = window.STORIES_JSON.categories.find(c => c.name === catName);
        if (!category) return;

        const contentEl = document.getElementById('storyCategoryContent');
        contentEl.innerHTML = '';

        // 💡 استخدام القالب للرأس
        const headerTemplate = document.getElementById('tpl-subview-header');
        if (headerTemplate) {
            const cloneHeader = headerTemplate.content.cloneNode(true);
            cloneHeader.querySelector('.subview-title').textContent = catName;
            contentEl.appendChild(cloneHeader);
        }

        const template = document.getElementById('tpl-story-card');
        if (template) {
            category.stories.forEach(item => {
                const clone = template.content.cloneNode(true);
                clone.querySelector('.story-title').textContent = item.title;
                clone.querySelector('.story-content').textContent = item.story;
                clone.querySelector('.story-lesson').textContent = `💡 العبرة: ${item.lesson}`;
                contentEl.appendChild(clone);
            });
        }

        const gridEl = document.getElementById('storyCategoriesGrid');
        if (gridEl) {
            gridEl.classList.add('is-hidden');
            gridEl.style.display = 'none';
        }
        contentEl.classList.remove('is-hidden');
        contentEl.style.display = '';

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

window.content = content;
