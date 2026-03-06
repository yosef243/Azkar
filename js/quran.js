/**
 * ====================================================================
 * Quran Reader & Bookmark Manager
 * Using HTML Templates & DOM APIs for Enterprise Performance
 * ====================================================================
 */

const quran = {
    currentSurah: null,

    init() {
        this.renderSurahList();
        this.checkBookmark();
    },

    // ==========================================
    // 1. عرض قائمة السور (باستخدام القوالب)
    // ==========================================
    renderSurahList() {
        const list = document.getElementById('surahList');
        if (!list || !window.QURAN_JSON) return;

        list.innerHTML = ''; // تفريغ القائمة
        
        const template = document.getElementById('tpl-surah-btn');
        if (!template) return;

        // المرور على الـ 114 سورة
        for (let i = 1; i <= 114; i++) {
            if (window.QURAN_JSON[i] && window.QURAN_JSON[i].length > 0) {
                const firstAyah = window.QURAN_JSON[i][0];
                const surahName = firstAyah.surah_name_ar || firstAyah.surah_name || `سورة ${i}`;
                
                // استنساخ قالب السورة
                const clone = template.content.cloneNode(true);
                const btn = clone.querySelector('.surah-item');
                const nameSpan = clone.querySelector('.surah-name');
                const numSpan = clone.querySelector('.surah-num');

                // تعبئة البيانات برمجياً
                nameSpan.textContent = surahName;
                numSpan.textContent = i;
                
                // إضافة خاصية البحث وحدث الضغط
                btn.setAttribute('data-name', surahName);
                btn.onclick = () => window.quran?.openSurah(i, surahName);

                list.appendChild(clone);
            }
        }
    },

    // ==========================================
    // 2. البحث والتصفية
    // ==========================================
    filterSurahs() {
        const searchInput = document.getElementById('searchSurah');
        if (!searchInput) return;
        
        const query = searchInput.value.trim();
        const items = document.querySelectorAll('.surah-item');
        
        items.forEach(item => {
            const name = item.getAttribute('data-name') || '';
            if (name.includes(query)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    },

    // ==========================================
    // 3. فتح السورة وقراءة الآيات (DOM Creation)
    // ==========================================
    openSurah(num, name) {
        window.history.pushState({ section: 'quran', sub: true }, '', '#surah-reader');
        this.currentSurah = { num, name };
        
        const titleEl = document.getElementById('currentSurahTitle');
        if (titleEl) titleEl.textContent = name;
        
        const container = document.getElementById('ayahsContainer');
        if (!container) return;
        
        container.innerHTML = ''; // تفريغ السورة السابقة
        const ayahs = window.QURAN_JSON[num];
        
        // إضافة البسملة لجميع السور عدا الفاتحة (1) والتوبة (9)
        if (num !== 1 && num !== 9) {
            const basmala = document.createElement('div');
            basmala.className = 'cardx--center';
            basmala.style.cssText = 'margin-bottom: 20px; color: var(--accent); font-size: 1.8rem; font-weight: bold;';
            basmala.textContent = 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ';
            container.appendChild(basmala);
        }

        // بناء الآيات برمجياً
        ayahs.forEach(ayah => {
            let text = ayah.text;
            
            // إزالة البسملة المدمجة في الآية الأولى
            if (num !== 1 && num !== 9 && ayah.numberInSurah === 1) {
                text = text.replace("بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ", "").trim();
            }
            
            // حاوية الآية
            const ayahSpan = document.createElement('span');
            ayahSpan.style.display = 'inline';
            ayahSpan.style.lineHeight = '2.2';
            
            // نص الآية
            const textNode = document.createTextNode(text + ' ');
            ayahSpan.appendChild(textNode);
            
            // دائرة رقم الآية
            const numberSpan = document.createElement('span');
            numberSpan.className = 'no-select';
            numberSpan.style.cssText = 'display: inline-flex; justify-content: center; align-items: center; width: 35px; height: 35px; background: var(--primary-light); color: var(--primary); border-radius: 50%; font-size: 1rem; margin: 0 5px; font-family: "Tajawal", sans-serif; border: 1px solid var(--border); font-weight: bold;';
            numberSpan.textContent = ayah.numberInSurah;
            
            ayahSpan.appendChild(numberSpan);
            container.appendChild(ayahSpan);
        });
        
        // إضافة زر حفظ العلامة في نهاية السورة
        const saveContainer = document.createElement('div');
        saveContainer.className = 'cardx--center';
        saveContainer.style.marginTop = '35px';
        
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn--primary';
        saveBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i> حفظ العلامة هنا';
        saveBtn.onclick = () => window.quran?.saveBookmark();
        
        saveContainer.appendChild(saveBtn);
        container.appendChild(saveContainer);
        
        // إخفاء القائمة وإظهار القارئ
        const listContainer = document.getElementById('surahListContainer');
        const readerContainer = document.getElementById('surahReader');
        
        if (listContainer) {
            listContainer.classList.add('is-hidden');
            listContainer.style.display = 'none';
        }
        if (readerContainer) {
            readerContainer.classList.remove('is-hidden');
            readerContainer.style.display = 'block';
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    closeSurah() {
        window.history.back();
    },

    // ==========================================
    // 4. نظام العلامات (Bookmarks)
    // ==========================================
    saveBookmark() {
        if (!this.currentSurah || !window.storage) return;
        
        window.storage.state.quranBookmark = {
            surahNum: this.currentSurah.num,
            surahName: this.currentSurah.name,
            scroll: window.scrollY
        };
        window.storage.save();
        
        if (window.app) window.app.showToast('تم حفظ العلامة بنجاح 🔖');
        this.checkBookmark(); // لتحديث زر "أكمل" في القائمة
    },

    checkBookmark() {
        const card = document.getElementById('resumeReadingCard');
        const nameSpan = document.getElementById('lastReadSurahName');
        
        if (!window.storage || !window.storage.state.quranBookmark || !window.storage.state.quranBookmark.surahNum) {
            if (card) {
                card.classList.add('is-hidden');
                card.style.display = 'none';
            }
            return;
        }
        
        if (card && nameSpan) {
            nameSpan.textContent = window.storage.state.quranBookmark.surahName;
            card.classList.remove('is-hidden');
            card.style.display = 'block';
        }
    },

    resumeReading() {
        if (!window.storage || !window.storage.state.quranBookmark) return;
        
        const b = window.storage.state.quranBookmark;
        this.openSurah(b.surahNum, b.surahName);
        
        setTimeout(() => {
            window.scrollTo({ top: b.scroll || 0, behavior: 'smooth' });
            if (window.app) window.app.showToast('مرحباً بعودتك 📖');
        }, 300);
    }
};

window.quran = quran;
