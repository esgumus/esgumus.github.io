// Firebase kütüphanelerini içe aktar
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Firebase Config Bilgilerin
const firebaseConfig = {
  apiKey: "AIzaSyBR2RemyP_Y4OUtmEPprKG_mJp9UhfVngw",
  authDomain: "esgumus-792d1.firebaseapp.com",
  databaseURL: "https://esgumus-792d1-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "esgumus-792d1",
  storageBucket: "esgumus-792d1.firebasestorage.app",
  messagingSenderId: "968322039095",
  appId: "1:968322039095:web:52181aadb0467d99192eb2"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// HTML Elementlerini Seç
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const errorMessage = document.getElementById('error-message');
const captureBtn = document.getElementById('capture-btn');
const imageGallery = document.getElementById('image-gallery');

// 1. GİRİŞ YAPMA İŞLEMİ
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

// 2. ÇIKIŞ YAPMA İŞLEMİ
logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

// 3. KULLANICI DURUMUNU DİNLEME
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Kullanıcı giriş yaptıysa paneli göster
        loginContainer.style.display = 'none';
        dashboardContainer.style.display = 'block';
        
        // Giriş yapıldığı an veritabanındaki fotoğrafları dinlemeye başla
        baslatFotoDinleyici();
    } else {
        // Çıkış yapıldıysa giriş ekranına dön
        dashboardContainer.style.display = 'none';
        loginContainer.style.display = 'block';
        emailInput.value = '';
        passwordInput.value = '';
    }
});

// 4. TELEFONA FOTOĞRAF ÇEK SİNYALİ GÖNDERME
captureBtn.addEventListener('click', () => {
    const commandRef = ref(db, 'kamera_komutlari/anlik_durum');
    
    set(commandRef, {
        fotograf_cek: true,
        zaman_damgasi: Date.now()
    })
    .then(() => {
        alert("Sinyal gönderildi! Telefondan fotoğraf bekleniyor...");
    })
    .catch((error) => {
        console.error("Sinyal gönderilemedi: ", error);
        alert("Hata oluştu: " + error.message);
    });
});

// 5. TELEFONDAN GELEN FOTOĞRAFI EKRANDA GÖSTERME (YENİ EKLENEN KISIM)
function baslatFotoDinleyici() {
    // Veritabanında telefonun fotoğrafı kaydedeceği konumu dinliyoruz
    const fotoRef = ref(db, 'kamera_verileri/son_fotograf');
    
    onValue(fotoRef, (snapshot) => {
        const data = snapshot.val();
        
        // Eğer veri varsa ve içinde base64 formatında resim bulunuyorsa
        if (data && data.base64_resim) {
            // HTML içindeki div'e resmi bir <img> etiketi olarak basıyoruz
            imageGallery.innerHTML = `
                <h3 style="margin-top: 20px; color: #333;">Son Gelen Görüntü</h3>
                <img src="${data.base64_resim}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                <p style="font-size: 13px; color: #666; margin-top: 10px;">
                    Çekim Zamanı: ${new Date(data.zaman_damgasi).toLocaleTimeString('tr-TR')}
                </p>
            `;
        }
    });
}
