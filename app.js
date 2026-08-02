import { getDatabase, ref, set, onValue, query, limitToLast, push, orderByChild, startAt, endAt, get, remove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
    // BURAYI KENDİ BİLGİLERİNLE DOLDUR
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

function sifrele(metin) { return CryptoJS.AES.encrypt(metin, GIZLI_ANAHTAR).toString(); }
function sifreCoz(sifreliMetin) {
    try {
        const bytes = CryptoJS.AES.decrypt(sifreliMetin, GIZLI_ANAHTAR);
        return bytes.toString(CryptoJS.enc.Utf8) || "[Şifresi Çözülemedi]";
    } catch (e) { return sifreliMetin; }
}
// -------------------------------------------

let aktifKullaniciAdi = "Kullanıcı";
let fotoGecmisi = [];

const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const mainImage = document.getElementById('main-image');
const fotoDurum = document.getElementById('foto-durum');
const fotoZaman = document.getElementById('foto-zaman');
const historySlider = document.getElementById('history-slider');
const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chat-input');

const tabCamBtn = document.getElementById('tab-cam-btn');
const tabChatBtn = document.getElementById('tab-chat-btn');
const cameraSection = document.getElementById('camera-section');
const chatSection = document.getElementById('chat-section');

const kameraYonuSelect = document.getElementById('kamera-yonu-select');
const otoCekimSelect = document.getElementById('oto-cekim-select');
const hassasiyetSlider = document.getElementById('hassasiyet-slider');
const hassasiyetDeger = document.getElementById('hassasiyet-deger');

tabCamBtn.addEventListener('click', () => {
    cameraSection.style.display = 'flex'; chatSection.style.display = 'none';
    tabCamBtn.className = 'active-tab'; tabChatBtn.className = 'inactive-tab';
});

tabChatBtn.addEventListener('click', () => {
    cameraSection.style.display = 'none'; chatSection.style.display = 'flex';
    tabChatBtn.className = 'active-tab'; tabCamBtn.className = 'inactive-tab';
    chatBox.scrollTop = chatBox.scrollHeight; 
});

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

// --- YENİ MİMARİ: AYARLARI DİREKT TELEFONA YAZ ---
function ayarlariGuncelle() {
    const saniye = parseInt(otoCekimSelect.value);
    
    set(ref(db, 'kamera_komutlari/ayarlar'), {
        arka_kamera_mi: kameraYonuSelect.value === 'arka',
        hassasiyet: parseInt(hassasiyetSlider.value),
        oto_cekim_saniye: saniye
    });

    if (saniye === 0) {
        gonderMesaj("Sistem", "Otomatik takip kapatıldı (Sadece Manuel Mod).", false);
    } else if (saniye >= 60) {
        gonderMesaj("Sistem", `Otomatik takip aktif (${saniye/60} dk). Telefon kendi sayacak.`, false);
    } else {
        gonderMesaj("Sistem", `Otomatik takip aktif (${saniye} sn). Telefon kendi sayacak.`, false);
    }
}

kameraYonuSelect.addEventListener('change', ayarlariGuncelle);
otoCekimSelect.addEventListener('change', ayarlariGuncelle);
hassasiyetSlider.addEventListener('input', (e) => hassasiyetDeger.innerText = `%${e.target.value}`);
hassasiyetSlider.addEventListener('change', ayarlariGuncelle);

// MANUEL FOTOĞRAF ÇEK BUTONU
document.getElementById('capture-btn').addEventListener('click', () => {
    set(ref(db, 'kamera_komutlari/anlik_durum'), { fotograf_cek: true, zaman: Date.now() });
    gonderMesaj("Sistem", "Manuel çekim komutu gönderildi.", false); 
});

// DİNLEYİCİLER (Fotoğraf ve Chat)
function baslatDinleyiciler() {
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

// 30 DK'DAN ESKİLERİ SİL
function eskiMesajlariTemizle() {
    const otuzDkOncesi = Date.now() - (30 * 60 * 1000);
    const eskiMesajlarSorgusu = query(ref(db, 'chat_messages'), orderByChild('timestamp'), endAt(otuzDkOncesi));
    
    get(eskiMesajlarSorgusu).then((snapshot) => {
        if (snapshot.exists()) {
            snapshot.forEach(child => remove(ref(db, `chat_messages/${child.key}`)));
        }
    });
}
eskiMesajlariTemizle();
setInterval(eskiMesajlariTemizle, 60000);
