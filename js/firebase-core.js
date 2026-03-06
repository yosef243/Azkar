import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// 💡 التعديل هنا: ضفنا setPersistence و browserLocalPersistence
import { getAuth, signInWithRedirect, getRedirectResult, GoogleAuthProvider, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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

// التقاط نتيجة التحويل
getRedirectResult(auth).then((result) => {
    if (result && result.user) {
        if(window.app) window.app.showToast('تم تسجيل الدخول بنجاح! ✅');
        fetchDataFromCloud(result.user.uid);
    }
}).catch((error) => {
    console.error("Redirect Error:", error);
});

// مراقب حالة تسجيل الدخول (ده اللي بيحدث الواجهة)
onAuthStateChanged(auth, (user) => {
    updateAuthUI(user);
});

function updateAuthUI(user) {
    const authArea = document.getElementById('authButtonArea');
    const userNameEl = document.getElementById('userName');
    const avatarEl = document.getElementById('modalUserAvatar');

    if (!authArea) return;

    if (user) {
        // لو مسجل دخول
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
        // لو مش مسجل دخول
        if (userNameEl) userNameEl.textContent = 'حسابي';
        if (avatarEl) avatarEl.src = 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';

        authArea.innerHTML = `
            <button id="btnLogin" class="btn btn--primary" style="padding: 8px 12px; font-size: 0.9rem;">
                <i class="fa-brands fa-google"></i> تسجيل الدخول
            </button>
        `;

        // 💡 التعديل الأهم: إجبار المتصفح على حفظ الدخول في الذاكرة الدائمة
        document.getElementById('btnLogin').addEventListener('click', async () => {
            if(window.app) window.app.showToast('جاري الاتصال بجوجل... ⏳');
            try {
                // أمر الحفظ الدائم قبل التحويل
                await setPersistence(auth, browserLocalPersistence);
                await signInWithRedirect(auth, provider);
            } catch (error) {
                alert("مشكلة في الاتصال: " + error.message);
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
                
                if(window.app) window.app.showToast('تم استرجاع بياناتك بنجاح! ☁️⬇️');
            }
        }
    } catch (e) {
        console.error("Fetch Error: ", e);
    }
}
