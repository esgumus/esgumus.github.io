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

// --- UÇTAN UCA ŞİFRELEME ---
const GIZLI_ANAHTAR = "guvenlik_anahtarim_123!"; 

function sifrele(metin) { return CryptoJS.AES.encrypt(metin, GIZLI_ANAHTAR).toString(); }
function sifreCoz(sifreliMetin) {
    try {
        const bytes = CryptoJS.AES.decrypt(sifreliMetin, GIZLI_ANAHTAR);
        return bytes.toString(CryptoJS.enc.Utf8) || "[Şifresi Çözülemedi]";
    } catch (e) { return sifreliMetin; }
}

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

// Form Elementleri
const kameraYonuSelect = document.getElementById('kamera-yonu-select');
const otoCekimSelect = document.getElementById('oto-cekim-select');
const hareketAktifSelect = document.getElementById('hareket-aktif-select');
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

// Sadece görselliği günceller, veritabanına YAZMAZ
hassasiyetSlider.addEventListener('input', (e) => {
    hassasiyetDeger.innerText = `%${e.target.value}`;
});

// YENİ: AYARLARI "DEĞİŞTİR" BUTONUYLA GÖNDER
document.getElementById('ayarlari-degistir-btn').addEventListener('click', () => {
    const saniye = parseInt(otoCekimSelect.value);
    
    set(ref(db, 'kamera_komutlari/ayarlar'), {
        arka_kamera_mi: kameraYonuSelect.value === 'arka',
        hassasiyet: parseInt(hassasiyetSlider.value),
        oto_cekim_saniye: saniye,
        hareket_aktif: hareketAktifSelect.value === 'true'
    });

    gonderMesaj("Sistem", "Ayarlar güncellendi.", false);
});

// MANUEL TETİKLEME
document.getElementById('capture-btn').addEventListener('click', () => {
    set(ref(db, 'kamera_komutlari/anlik_durum'), { fotograf_cek: true, zaman: Date.now() });
    gonderMesaj("Sistem", "Manuel çekim komutu gönderildi.", false); 
});

function baslatDinleyiciler() {
    
    // YENİ: CİHAZ AYARLARININ CANLI DİNLEYİCİSİ (Şu Anki Ayarlar Panosunu Günceller)
    onValue(ref(db, 'kamera_komutlari/ayarlar'), (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            
            // Sağ Taraftaki "Şu Anki Ayarlar" Kısmını Güncelle
            document.getElementById('guncel-kamera').innerText = data.arka_kamera_mi ? "Arka Kamera" : "Ön Kamera";
            document.getElementById('guncel-uyari').innerText = data.hareket_aktif ? "Açık (Mail Atar)" : "Kapalı (Sadece Çeker)";
            document.getElementById('guncel-hassasiyet').innerText = `%${data.hassasiyet}`;
            
            let modMetin = "Sadece Web'den";
            if (data.oto_cekim_saniye > 0) {
                if (data.oto_cekim_saniye >= 60) {
                    modMetin = `${data.oto_cekim_saniye / 60} Dakikada Bir`;
                } else {
                    modMetin = `${data.oto_cekim_saniye} Saniyede Bir`;
                }
            }
            document.getElementById('guncel-mod').innerText = modMetin;

            // Diğer cihazlarda menüler farklı kalmasın diye sol taraftaki seçicileri de güncel veriye eşitle
            kameraYonuSelect.value = data.arka_kamera_mi ? 'arka' : 'on';
            hareketAktifSelect.value = data.hareket_aktif ? 'true' : 'false';
            otoCekimSelect.value = data.oto_cekim_saniye.toString();
            hassasiyetSlider.value = data.hassasiyet;
            hassasiyetDeger.innerText = `%${data.hassasiyet}`;
        }
    });

    // Fotoğrafları Dinle
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

    // Chat Dinle
    const otuzDkAralik = Date.now() - (30 * 60 * 1000);
    const chatRef = query(ref(db, 'chat_messages'), orderByChild('timestamp'), startAt(otuzDkAralik));
    onValue(chatRef, (snapshot) => {
        chatBox.innerHTML = '';
        snapshot.forEach(child => {
            const data = child.val();
            const saat = new Date(data.timestamp).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
            const gosterilecekMetin = data.sender === 'Sistem' ? data.text : sifreCoz(data.text);
            const div = document.createElement('div');
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

// --- FİREBASE OTO-TEMİZLİK ---
function veritabaniniTemizle() {
    const otuzDkOncesi = Date.now() - (30 * 60 * 1000);
    get(query(ref(db, 'chat_messages'), orderByChild('timestamp'), endAt(otuzDkOncesi))).then((snapshot) => {
        if (snapshot.exists()) snapshot.forEach(child => remove(ref(db, `chat_messages/${child.key}`)));
    });

    get(query(ref(db, 'kamera_verileri/fotograflar'), orderByChild('zaman_damgasi'))).then((snapshot) => {
        if (snapshot.exists()) {
            const toplamFoto = snapshot.size;
            if (toplamFoto > 30) {
                const silinecekMiktar = toplamFoto - 30;
                let sayac = 0;
                snapshot.forEach(child => {
                    if (sayac < silinecekMiktar) {
                        remove(ref(db, `kamera_verileri/fotograflar/${child.key}`));
                        sayac++;
                    }
                });
            }
        }
    });
}

veritabaniniTemizle();
setInterval(veritabaniniTemizle, 60000);
