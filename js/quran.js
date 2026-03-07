/**
 * ====================================================================
 * Quran Reader & Bookmark Manager
 * ====================================================================
 */

const quran = {
    currentSurah: null,
    data: null,
    
    // 💡 مصفوفة بأسماء سور القرآن الكريم الـ 114 بالترتيب
    surahNames: [
        "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
        "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
        "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
        "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
        "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
        "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
        "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
        "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
        "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
        "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
        "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
        "المسد", "الإخلاص", "الفلق", "الناس"
    ],

    init() {
        this.data = window.quranData || window.QURAN_JSON;
        if (!this.data) {
            console.error("لم يتم العثور على بيانات القرآن. تأكد من استدعاء ملف quranData.js");
            return;
        }
        this.renderSurahList();
        this.checkBookmark();
    },

    renderSurahList() {
        const list = document.getElementById('surahList');
        if (!list || !this.data) return;

        list.innerHTML = ''; 
        const template = document.getElementById('tpl-surah-btn');
        if (!template) return;

        const isArray = Array.isArray(this.data);

        for (let i = 1; i <= 114; i++) {
            const surahData = isArray ? this.data[i - 1] : this.data[i];
            if (!surahData) continue;

            // 💡 سحب اسم السورة من المصفوفة بتاعتنا بدل الملف
            const surahName = "سورة " + this.surahNames[i - 1];

            const clone = template.content.cloneNode(true);
            const btn = clone.querySelector('.surah-item');
            const nameSpan = clone.querySelector('.surah-name');
            const numSpan = clone.querySelector('.surah-num');

            if (nameSpan) nameSpan.textContent = surahName;
            if (numSpan) numSpan.textContent = i;
            
            if (btn) {
                btn.setAttribute('data-name', surahName);
                btn.onclick = () => window.quran.openSurah(i, surahName, surahData);
            }

            list.appendChild(clone);
        }
    },

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

    openSurah(num, name, surahData) {
        window.history.pushState({ section: 'quran', sub: true }, '', '#surah-reader');
        this.currentSurah = { num, name };
        
        const titleEl = document.getElementById('currentSurahTitle');
        if (titleEl) titleEl.textContent = name;
        
        const container = document.getElementById('ayahsContainer');
        if (!container) return;
        
        container.innerHTML = ''; 
        
        let ayahs = [];
        if (Array.isArray(surahData)) {
            ayahs = surahData;
        } else if (surahData.verses) {
            ayahs = surahData.verses;
        } else if (surahData.ayahs) {
            ayahs = surahData.ayahs;
        }

        if (num !== 1 && num !== 9) {
            const basmala = document.createElement('div');
            basmala.className = 'cardx--center';
            basmala.style.cssText = 'margin-bottom: 20px; color: var(--accent); font-size: 1.8rem; font-weight: bold;';
            basmala.textContent = 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ';
            container.appendChild(basmala);
        }

        ayahs.forEach((ayah, index) => {
            let text = ayah.text || ayah.text_ar || ayah.content || (typeof ayah === 'string' ? ayah : '');
            let ayahNum = ayah.numberInSurah || ayah.verse_number || ayah.id || (index + 1);
            
            if (num !== 1 && num !== 9 && ayahNum === 1 && typeof text === 'string') {
                text = text.replace(/بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ/g, "").replace(/بسم الله الرحمن الرحيم/g, "").trim();
            }
            
            const ayahSpan = document.createElement('span');
            ayahSpan.style.display = 'inline';
            ayahSpan.style.lineHeight = '2.2';
            
            const textNode = document.createTextNode((text || '') + ' ');
            ayahSpan.appendChild(textNode);
            
            const numberSpan = document.createElement('span');
            numberSpan.className = 'no-select';
            numberSpan.style.cssText = 'display: inline-flex; justify-content: center; align-items: center; width: 35px; height: 35px; background: var(--primary-light); color: var(--primary); border-radius: 50%; font-size: 1rem; margin: 0 5px; font-family: "Tajawal", sans-serif; border: 1px solid var(--border); font-weight: bold;';
            numberSpan.textContent = ayahNum;
            
            ayahSpan.appendChild(numberSpan);
            container.appendChild(ayahSpan);
        });
        
        const saveContainer = document.createElement('div');
        saveContainer.className = 'cardx--center';
        saveContainer.style.marginTop = '35px';
        
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn--primary';
        saveBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i> حفظ العلامة هنا';
        saveBtn.onclick = () => window.quran?.saveBookmark();
        
        saveContainer.appendChild(saveBtn);
        container.appendChild(saveContainer);
        
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

    saveBookmark() {
        if (!this.currentSurah || !window.storage) return;
        
        window.storage.state.quranBookmark = {
            surahNum: this.currentSurah.num,
            surahName: this.currentSurah.name,
            scroll: window.scrollY
        };
        window.storage.save();
        
        if (window.app) window.app.showToast('تم حفظ العلامة بنجاح 🔖');
        this.checkBookmark();
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
        const isArray = Array.isArray(this.data);
        const surahData = isArray ? this.data[b.surahNum - 1] : this.data[b.surahNum];
        
        this.openSurah(b.surahNum, b.surahName, surahData);
        
        setTimeout(() => {
            window.scrollTo({ top: b.scroll || 0, behavior: 'smooth' });
            if (window.app) window.app.showToast('مرحباً بعودتك 📖');
        }, 300);
    }
};

window.quran = quran;
