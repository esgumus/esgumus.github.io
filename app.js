import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, set, onValue, query, limitToLast, push, orderByChild, startAt } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

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

// HTML Elementleri
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const mainImage = document.getElementById('main-image');
const fotoDurum = document.getElementById('foto-durum');
const fotoZaman = document.getElementById('foto-zaman');
const historySlider = document.getElementById('history-slider');
const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chat-input');

let fotoGecmisi = [];

document.getElementById('login-btn').addEventListener('click', () => {
    signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('password').value)
        .catch(err => alert("Giriş hatası: " + err.message));
});

document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginContainer.style.display = 'none';
        dashboardContainer.style.display = 'block';
        baslatDinleyiciler();
    } else {
        dashboardContainer.style.display = 'none';
        loginContainer.style.display = 'block';
    }
});

// KAMERAYI UZAKTAN TETİKLE
document.getElementById('capture-btn').addEventListener('click', () => {
    set(ref(db, 'kamera_komutlari/anlik_durum'), { fotograf_cek: true, zaman: Date.now() });
    gonderMesaj("Sistem", "Kameraya fotoğraf çekme emri gönderildi.");
});

function baslatDinleyiciler() {
    // 1. FOTOĞRAF GEÇMİŞİNİ DİNLE (Son 30 fotoğraf)
    const fotoRef = query(ref(db, 'kamera_verileri/fotograflar'), limitToLast(30));
    onValue(fotoRef, (snapshot) => {
        fotoGecmisi = [];
        snapshot.forEach(child => { fotoGecmisi.push(child.val()); });
        
        if (fotoGecmisi.length > 0) {
            historySlider.max = fotoGecmisi.length - 1;
            historySlider.value = fotoGecmisi.length - 1; // En güncele al
            gorseliGuncelle(fotoGecmisi[fotoGecmisi.length - 1]);
        }
    });

    // 2. CHAT SİSTEMİNİ DİNLE (Son 10 Dakika)
    const onDkAralik = Date.now() - (10 * 60 * 1000);
    const chatRef = query(ref(db, 'chat_messages'), orderByChild('timestamp'), startAt(onDkAralik));
    
    onValue(chatRef, (snapshot) => {
        chatBox.innerHTML = '';
        snapshot.forEach(child => {
            const data = child.val();
            const div = document.createElement('div');
            const saat = new Date(data.timestamp).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
            
            div.className = `chat-message ${data.sender === 'Sistem' ? 'msg-system' : 'msg-user'}`;
            div.innerHTML = `<strong>${data.sender}</strong><br>${data.text} <div class="msg-time">${saat}</div>`;
            chatBox.appendChild(div);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

// SLIDER DEĞİŞTİĞİNDE
historySlider.addEventListener('input', (e) => {
    if (fotoGecmisi[e.target.value]) gorseliGuncelle(fotoGecmisi[e.target.value]);
});

function gorseliGuncelle(data) {
    mainImage.style.display = 'block';
    fotoDurum.style.display = 'none';
    mainImage.src = data.base64_resim;
    fotoZaman.innerText = "Çekim: " + new Date(data.zaman_damgasi).toLocaleString('tr-TR');
}

// CHAT MESAJI GÖNDERME
document.getElementById('send-chat-btn').addEventListener('click', () => {
    if(chatInput.value.trim() !== "") {
        gonderMesaj("Kullanıcı", chatInput.value);
        chatInput.value = '';
    }
});

function gonderMesaj(gonderici, metin) {
    push(ref(db, 'chat_messages'), { sender: gonderici, text: metin, timestamp: Date.now() });
}
