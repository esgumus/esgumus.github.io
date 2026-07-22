// 1. GEREKLİ MODÜLLERİ İÇE AKTAR
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// 2. FİREBASE YAPILANDIRMASI
const firebaseConfig = {
  apiKey: "AIzaSyBR2RemyP_Y4OUtmEPprKG_mJp9UhfVngw",
  authDomain: "esgumus-792d1.firebaseapp.com",
  databaseURL: "https://esgumus-792d1-default-rtdb.europe-west1.firebasedatabase.app", // EKLENEN YENİ SATIR
  projectId: "esgumus-792d1",
  storageBucket: "esgumus-792d1.firebasestorage.app",
  messagingSenderId: "968322039095",
  appId: "1:968322039095:web:52181aadb0467d99192eb2"
};

// 3. FİREBASE'İ BAŞLAT
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// 4. HTML ELEMENTLERİNİ SEÇ
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const errorMessage = document.getElementById('error-message');
const captureBtn = document.getElementById('capture-btn');

// 5. KİMLİK DOĞRULAMA (GİRİŞ / ÇIKIŞ) İŞLEMLERİ
loginBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            errorMessage.style.display = 'none';
        })
        .catch((error) => {
            errorMessage.innerText = "Giriş başarısız: " + error.message;
            errorMessage.style.display = 'block';
        });
});

logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

// Oturum durumunu dinle (Sayfa yenilense bile girişte kalması için)
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginContainer.style.display = 'none';
        dashboardContainer.style.display = 'block';
    } else {
        dashboardContainer.style.display = 'none';
        loginContainer.style.display = 'block';
        emailInput.value = '';
        passwordInput.value = '';
    }
});

// 6. VERİTABANI İŞLEMİ (FOTOĞRAF ÇEK BUTONUNA BASILDIĞINDA)
captureBtn.addEventListener('click', () => {
    // Firebase veritabanında yolu belirliyoruz
    const commandRef = ref(db, 'kamera_komutlari/anlik_durum');
    
    // Yola veriyi yazıyoruz
    set(commandRef, {
        fotograf_cek: true,
        zaman_damgasi: Date.now()
    })
    .then(() => {
        alert("Sinyal gönderildi! Veritabanını kontrol et.");
    })
    .catch((error) => {
        console.error("Sinyal gönderilemedi: ", error);
        alert("Hata oluştu, konsola bak: " + error.message);
    });
});
