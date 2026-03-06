import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ⚠️ ضع إعدادات Firebase الخاصة بك هنا
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// تحديث واجهة المستخدم بناءً على حالة تسجيل الدخول
function updateAuthUI(user) {
    const authArea = document.getElementById('authButtonArea');
    const userNameEl = document.getElementById('userName');
    const avatarEl = document.getElementById('modalUserAvatar');

    if (!authArea) return;

    if (user) {
        // المستخدم مسجل الدخول
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
        // المستخدم غير مسجل - 💡 تم تغيير النص إلى "تسجيل الدخول"
        if (userNameEl) userNameEl.textContent = 'حسابي';
        if (avatarEl) avatarEl.src = 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';

        authArea.innerHTML = `
            <button id="btnLogin" class="btn btn--primary" style="padding: 8px 12px; font-size: 0.9rem;">
                <i class="fa-brands fa-google"></i> تسجيل الدخول
            </button>
        `;

        document.getElementById('btnLogin').addEventListener('click', () => {
            if(window.app) window.app.showToast('جاري تسجيل الدخول... ⏳');
            signInWithPopup(auth, provider).then((result) => {
                if(window.app) window.app.showToast('تم تسجيل الدخول بنجاح! ✅');
                // محاولة جلب البيانات من السحابة بعد تسجيل الدخول
                fetchDataFromCloud(result.user.uid);
            }).catch((error) => {
                if(window.app) window.app.showToast('حدث خطأ أثناء تسجيل الدخول', 'error');
                console.error(error);
            });
        });
    }
}

// مزامنة البيانات للسحابة
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
        console.error("Error adding document: ", e);
    }
}

// استرجاع البيانات من السحابة
async function fetchDataFromCloud(uid) {
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.state && window.storage) {
                window.storage.state = data.state;
                window.storage.save();
                
                // تحديث الواجهة
                if (window.masbaha) window.masbaha.updateUI();
                if (window.tasks) window.tasks.render();
                
                if(window.app) window.app.showToast('تم استرجاع بياناتك بنجاح! ☁️⬇️');
            }
        }
    } catch (e) {
        console.error("Error fetching document: ", e);
    }
}

// مراقب حالة تسجيل الدخول
onAuthStateChanged(auth, (user) => {
    updateAuthUI(user);
});
