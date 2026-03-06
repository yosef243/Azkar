import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// 💡 رجعنا استدعاء signInWithPopup لأنها الأفضل لتطبيقات PWA الحديثة
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyATTnC5E_oSzZ2ef3OPngLwect_OubtISc",
  authDomain: "azkar-app-18d03.firebaseapp.com",
  projectId: "azkar-app-18d03",
  storageBucket: "azkar-app-18d03.firebasestorage.app",
  messagingSenderId: "299978759339",
  appId: "1:299978759339:web:a72a1bc49d25218abb6bee",
  measurementId: "G-WXG1QL95N0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// إجبار جوجل على إظهار شاشة اختيار الحساب دائماً
provider.setCustomParameters({
  prompt: 'select_account'
});

// مراقب حالة تسجيل الدخول
onAuthStateChanged(auth, (user) => {
    updateAuthUI(user);
    if (user) {
        // لو مسجل دخول، هات بياناته من السحابة في الخلفية
        fetchDataFromCloud(user.uid);
    }
});

function updateAuthUI(user) {
    const authArea = document.getElementById('authButtonArea');
    const userNameEl = document.getElementById('userName');
    const avatarEl = document.getElementById('modalUserAvatar');

    if (!authArea) return;

    if (user) {
        if (userNameEl) userNameEl.textContent = user.displayName || 'حسابي';
        if (avatarEl && user.photoURL) avatarEl.src = user.photoURL;
        
        authArea.innerHTML = `
            <div class="flex-gap">
                <button id="btnSync" class="btn btn--primary" style="padding: 8px 12px; font-size: 0.9rem;"><i class="fa-solid fa-cloud-arrow-up"></i> مزامنة</button>
                <button id="btnLogout" class="btn btn--ghost" style="padding: 8px 12px; font-size: 0.9rem; color: #ef4444;"><i class="fa-solid fa-right-from-bracket"></i></button>
            </div>
        `;

        document.getElementById('btnLogout').addEventListener('click', () => {
            signOut(auth).then(() => {
                if(window.app) window.app.showToast('تم تسجيل الخروج');
            });
        });

        document.getElementById('btnSync').addEventListener('click', () => {
            syncDataToCloud(user.uid);
        });

    } else {
        if (userNameEl) userNameEl.textContent = 'حسابي';
        if (avatarEl) avatarEl.src = 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';

        authArea.innerHTML = `
            <button id="btnLogin" class="btn btn--primary" style="padding: 8px 12px; font-size: 0.9rem;">
                <i class="fa-brands fa-google"></i> تسجيل الدخول
            </button>
        `;

        // 💡 استخدام النافذة المنبثقة السريعة
        document.getElementById('btnLogin').addEventListener('click', async () => {
            if(window.app) window.app.showToast('جاري فتح نافذة تسجيل الدخول... ⏳');
            try {
                // نأمر المتصفح بحفظ الدخول للأبد
                await setPersistence(auth, browserLocalPersistence);
                // نفتح نافذة جوجل المنبثقة
                const result = await signInWithPopup(auth, provider);
                if (result && result.user) {
                    if(window.app) window.app.showToast('تم تسجيل الدخول بنجاح! ✅');
                }
            } catch (error) {
                alert("سبب المشكلة: " + error.message);
                console.error("Auth Error:", error);
            }
        });
    }
}

async function syncDataToCloud(uid) {
    if (!window.storage || !window.storage.state) return;
    try {
        if(window.app) window.app.showToast('جاري المزامنة مع السحابة... ⏳');
        await setDoc(doc(db, "users", uid), {
            state: window.storage.state,
            lastSync: new Date().toISOString()
        });
        if(window.app) window.app.showToast('تم حفظ بياناتك بنجاح! ☁️✅');
    } catch (e) {
        if(window.app) window.app.showToast('حدث خطأ أثناء المزامنة', 'error');
    }
}

async function fetchDataFromCloud(uid) {
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.state && window.storage) {
                window.storage.state = data.state;
                window.storage.save();
                
                if (window.masbaha) window.masbaha.updateUI();
                if (window.tasks) window.tasks.render();
            }
        }
    } catch (e) {
        console.error("Fetch Error: ", e);
    }
}
