// Firebase kütüphanelerini içe aktar
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBR2RemyP_Y4OUtmEPprKG_mJp9UhfVngw",
  authDomain: "esgumus-792d1.firebaseapp.com",
  projectId: "esgumus-792d1",
  storageBucket: "esgumus-792d1.firebasestorage.app",
  messagingSenderId: "968322039095",
  appId: "1:968322039095:web:52181aadb0467d99192eb2"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Veritabanı referansını al
const db = getDatabase(app);
const captureBtn = document.getElementById('capture-btn');

// Anlık Fotoğraf Çek butonuna tıklandığında çalışacak kod
captureBtn.addEventListener('click', () => {
    // Veritabanında "kamera_komutlari/anlik_durum" adında bir yol oluşturuyoruz
    const commandRef = ref(db, 'kamera_komutlari/anlik_durum');
    
    // O yola veriyi yazıyoruz
    set(commandRef, {
        fotograf_cek: true,
        zaman_damgasi: Date.now() // Aynı butona art arda basıldığında verinin değiştiğini algılamak için
    })
    .then(() => {
        // Geçici bir geri bildirim, ileride burayı "Fotoğraf çekiliyor..." yazısı ile değiştirebiliriz
        alert("Sinyal gönderildi! Telefon fotoğraf çekiyor...");
    })
    .catch((error) => {
        console.error("Sinyal gönderilemedi: ", error);
        alert("Hata oluştu: " + error.message);
    });
});

// HTML Elementlerini Seç
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const errorMessage = document.getElementById('error-message');

// 1. GİRİŞ YAPMA İŞLEMİ
loginBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Giriş başarılı
            errorMessage.style.display = 'none';
        })
        .catch((error) => {
            // Hata oldu (Yanlış şifre vb.)
            errorMessage.innerText = "Giriş başarısız: " + error.message;
            errorMessage.style.display = 'block';
        });
});

// 2. ÇIKIŞ YAPMA İŞLEMİ
logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

// 3. KULLANICI DURUMUNU DİNLEME (Oturum açık mı kapalı mı?)
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Kullanıcı giriş yapmış, login ekranını gizle, paneli göster
        loginContainer.style.display = 'none';
        dashboardContainer.style.display = 'block';
    } else {
        // Kullanıcı giriş yapmamış veya çıkış yapmış
        dashboardContainer.style.display = 'none';
        loginContainer.style.display = 'block';
        
        // Inputları temizle
        emailInput.value = '';
        passwordInput.value = '';
    }
});
