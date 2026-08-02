import { getDatabase, ref, set, onValue, query, limitToLast, push, orderByChild, startAt, endAt, get, remove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// --- E2EE (UÇTAN UCA ŞİFRELEME) AYARLARI ---
const GIZLI_ANAHTAR = "guvenlik_anahtarim_123!"; 

function sifrele(metin) {
    return CryptoJS.AES.encrypt(metin, GIZLI_ANAHTAR).toString();
}

function sifreCoz(sifreliMetin) {
    try {
        const bytes = CryptoJS.AES.decrypt(sifreliMetin, GIZLI_ANAHTAR);
        const orjinalMetin = bytes.toString(CryptoJS.enc.Utf8);
        return orjinalMetin || "[Şifresi Çözülemedi]";
    } catch (e) {
        return sifreliMetin; // Şifreli değilse (sistem mesajıysa) olduğu gibi göster
    }
}
// -------------------------------------------

let aktifKullaniciAdi = "Kullanıcı";
let fotoGecmisi = [];
let otoCekimTimer = null; // Web'den göndereceğimiz zamanlayıcı

// HTML Elementleri
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const mainImage = document.getElementById('main-image');
const fotoDurum = document.getElementById('foto-durum');
const fotoZaman = document.getElementById('foto-zaman');
const historySlider = document.getElementById('history-slider');
const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chat-input');

// Sekme Elementleri
const tabCamBtn = document.getElementById('tab-cam-btn');
const tabChatBtn = document.getElementById('tab-chat-btn');
const cameraSection = document.getElementById('camera-section');
const chatSection = document.getElementById('chat-section');

// Ayar Elementleri
const kameraYonuSelect = document.getElementById('kamera-yonu-select');
const otoCekimSelect = document.getElementById('oto-cekim-select');
const hassasiyetSlider = document.getElementById('hassasiyet-slider');
const hassasiyetDeger = document.getElementById('hassasiyet-deger');

// --- SEKME DEĞİŞTİRME MANTIĞI ---
tabCamBtn.addEventListener('click', () => {
    cameraSection.style.display = 'flex';
    chatSection.style.display = 'none';
    tabCamBtn.className = 'active-tab';
    tabChatBtn.className = 'inactive-tab';
});

tabChatBtn.addEventListener('click', () => {
    cameraSection.style.display = 'none';
    chatSection.style.display = 'flex';
    tabChatBtn.className = 'active-tab';
    tabCamBtn.className = 'inactive-tab';
    chatBox.scrollTop = chatBox.scrollHeight; 
});

// --- GİRİŞ İŞLEMLERİ ---
document.getElementById('login-btn').addEventListener('click', () => {
    signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('password').value)
        .catch(err => alert("Giriş hatası: " + err.message));
});

document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
    if (user) {
        aktifKullaniciAdi = user.email.split('@')[0];
        loginContainer.style.display = 'none';
        dashboardContainer.style.display = 'block';
        baslatDinleyiciler();
    } else {
        dashboardContainer.style.display = 'none';
        loginContainer.style.display = 'block';
    }
});

// --- AYARLARI FIREBASE'E GÖNDERME İŞLEMLERİ ---
function ayarlariGuncelle() {
    set(ref(db, 'kamera_komutlari/ayarlar'), {
        arka_kamera_mi: kameraYonuSelect.value === 'arka',
        hassasiyet: parseInt(hassasiyetSlider.value)
    });
}

kameraYonuSelect.addEventListener('change', ayarlariGuncelle);

hassasiyetSlider.addEventListener('input', (e) => {
    hassasiyetDeger.innerText = `%${e.target.value}`;
});
hassasiyetSlider.addEventListener('change', ayarlariGuncelle);

// --- WEB ZAMANLAYICISI (Telefona "Uyan" Emri Gönderen Kısım) ---
otoCekimSelect.addEventListener('change', (e) => {
    const sureMs = parseInt(e.target.value);
    
    // Eski zamanlayıcıyı iptal et
    if (otoCekimTimer) clearInterval(otoCekimTimer);
    
    if (sureMs > 0) {
        // Eğer 60.000 ms (1 dk) altındaysa saniye olarak, üstündeyse dakika olarak yazsın
        const mesaj = sureMs >= 60000 
            ? `Otomatik takip aktif (${sureMs/60000} dk)` 
            : `Otomatik takip aktif (${sureMs/1000} sn)`;
            
        gonderMesaj("Sistem", mesaj, false);
        
        // Belirtilen sürede bir firebase'e komut yaz (Telefon bu emri dinliyor)
        otoCekimTimer = setInterval(() => {
            set(ref(db, 'kamera_komutlari/anlik_durum'), { fotograf_cek: true, otomatik_mi: true, zaman: Date.now() });
        }, sureMs);
    } else {
        gonderMesaj("Sistem", "Otomatik takip kapatıldı (Sadece Web modu).", false);
    }
});

// --- MANUEL TETİKLEME ---
document.getElementById('capture-btn').addEventListener('click', () => {
    set(ref(db, 'kamera_komutlari/anlik_durum'), { fotograf_cek: true, otomatik_mi: false, zaman: Date.now() });
    gonderMesaj("Sistem", "Kameraya fotoğraf çekme emri gönderildi.", false); 
});

// --- VERİ DİNLEME VE CHAT İŞLEMLERİ ---
function baslatDinleyiciler() {
    // Fotoğraf Geçmişi (Son 30 fotoğraf)
    const fotoRef = query(ref(db, 'kamera_verileri/fotograflar'), limitToLast(30));
    onValue(fotoRef, (snapshot) => {
        fotoGecmisi = [];
        snapshot.forEach(child => { fotoGecmisi.push(child.val()); });
        
        if (fotoGecmisi.length > 0) {
            historySlider.max = fotoGecmisi.length - 1;
            historySlider.value = fotoGecmisi.length - 1; 
            gorseliGuncelle(fotoGecmisi[fotoGecmisi.length - 1]);
        }
    });

    // Chat Sistemi (Son 30 Dakika)
    const otuzDkAralik = Date.now() - (30 * 60 * 1000);
    const chatRef = query(ref(db, 'chat_messages'), orderByChild('timestamp'), startAt(otuzDkAralik));
    
    onValue(chatRef, (snapshot) => {
        chatBox.innerHTML = '';
        snapshot.forEach(child => {
            const data = child.val();
            const div = document.createElement('div');
            const saat = new Date(data.timestamp).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
            
            const gosterilecekMetin = data.sender === 'Sistem' ? data.text : sifreCoz(data.text);
            
            div.className = `chat-message ${data.sender === 'Sistem' ? 'msg-system' : 'msg-user'}`;
            div.innerHTML = `<strong>${data.sender}</strong><br>${gosterilecekMetin} <div class="msg-time">${saat}</div>`;
            chatBox.appendChild(div);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

historySlider.addEventListener('input', (e) => {
    if (fotoGecmisi[e.target.value]) gorseliGuncelle(fotoGecmisi[e.target.value]);
});

function gorseliGuncelle(data) {
    mainImage.style.display = 'block';
    fotoDurum.style.display = 'none';
    mainImage.src = data.base64_resim;
    fotoZaman.innerText = "Çekim: " + new Date(data.zaman_damgasi).toLocaleString('tr-TR');
}

document.getElementById('send-chat-btn').addEventListener('click', () => {
    if(chatInput.value.trim() !== "") {
        gonderMesaj(aktifKullaniciAdi, chatInput.value, true);
        chatInput.value = '';
    }
});

function gonderMesaj(gonderici, metin, sifrelensinMi = true) {
    const sonMetin = sifrelensinMi ? sifrele(metin) : metin;
    push(ref(db, 'chat_messages'), { sender: gonderici, text: sonMetin, timestamp: Date.now() });
}

// --- OTOMATİK VERİ TEMİZLİĞİ (30 DK'DAN ESKİLERİ SİL) ---
function eskiMesajlariTemizle() {
    const otuzDkOncesi = Date.now() - (30 * 60 * 1000);
    
    const eskiMesajlarSorgusu = query(ref(db, 'chat_messages'), orderByChild('timestamp'), endAt(otuzDkOncesi));
    
    get(eskiMesajlarSorgusu).then((snapshot) => {
        if (snapshot.exists()) {
            snapshot.forEach(child => {
                remove(ref(db, `chat_messages/${child.key}`));
            });
            console.log("Eski mesajlar temizlendi.");
        }
    }).catch(error => {
        console.error("Temizlik sırasında hata:", error);
    });
}

// Site açıldığında bir kere temizle
eskiMesajlariTemizle();

// Ardından her 60 saniyede bir arka planda temizlik yapmaya devam et
setInterval(eskiMesajlariTemizle, 60000);
