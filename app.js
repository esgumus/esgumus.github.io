<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Akıllı Güvenlik Paneli</title>
    <link rel="icon" type="image/png" href="favicon.png">
    <link rel="stylesheet" href="style.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
</head>
<body>
    <div id="login-container" class="container">
        <h2>Sisteme Giriş</h2>
        <input type="email" id="email" placeholder="E-posta" autocomplete="username" required>
        <input type="password" id="password" placeholder="Şifre" autocomplete="current-password" required>
        <button id="login-btn">Giriş Yap</button>
        <p id="error-message" style="color: red; display: none;"></p>
    </div>

    <div id="dashboard-container" style="display: none;">
        <div class="main-layout">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h2 style="margin: 0;">Kontrol Paneli</h2>
                <button id="logout-btn" style="width: auto; padding: 8px 15px;">Çıkış</button>
            </div>

            <div class="tabs">
                <button id="tab-cam-btn" class="active-tab">📸 Kamera</button>
                <button id="tab-chat-btn" class="inactive-tab">💬 Sohbet</button>
            </div>

            <!-- Sol Panel: Kamera -->
            <div id="camera-section" class="container">
                
                <!-- CİHAZ AYARLARI KONTROL PANELİ -->
                <div style="background: #0d1117; padding: 10px; border-radius: 8px; margin-bottom: 15px;">
                    <h4 style="margin-top: 0; color: #4caf50;">⚙️ Cihaz Ayarları</h4>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <label>Ön/Arka Kamera:</label>
                        <select id="kamera-yonu-select" style="background: #21262d; color: white; border: 1px solid #30363d; border-radius: 4px;">
                            <option value="arka">Arka Kamera</option>
                            <option value="on">Ön Kamera</option>
                        </select>
                    </div>

                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <label>Oto. Çalışma Modu:</label>
                        <select id="oto-cekim-select" style="background: #21262d; color: white; border: 1px solid #30363d; border-radius: 4px;">
                            <option value="0">Sadece Web'den</option>
                            <option value="1000">1 Saniyede Bir</option>
                            <option value="2000">2 Saniyede Bir</option>
                            <option value="5000">5 Saniyede Bir</option>
                            <option value="10000">10 Saniyede Bir</option>
                            <option value="30000">30 Saniyede Bir</option>
                            <option value="60000">1 Dakikada Bir</option>
                            <option value="300000">5 Dakikada Bir</option>
                            <option value="900000">15 Dakikada Bir</option>
                        </select>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <label>Hareket Hassasiyeti:</label>
                        <input type="range" id="hassasiyet-slider" min="5" max="50" value="15" style="width: 100px;">
                        <span id="hassasiyet-deger">%15</span>
                    </div>
                </div>

                <button id="capture-btn">📸 Manuel Fotoğraf Çek</button>
                
                <div id="image-gallery">
                    <h3 id="foto-durum" style="color: #aaa;">Görüntü Bekleniyor...</h3>
                    <img id="main-image" src="" style="display: none; width: 100%; border-radius: 8px; margin-top: 15px;">
                    <p id="foto-zaman" style="color: #888; font-size: 12px;"></p>
                </div>

                <div class="slider-container" style="margin-top: 20px;">
                    <p>Geçmiş Fotoğraflar (Son 30)</p>
                    <input type="range" id="history-slider" min="0" max="0" value="0" style="width: 100%;">
                </div>
            </div>

            <!-- Sağ Panel: Chat -->
            <div id="chat-section" class="container" style="display: none;">
                <h3 style="margin-top: 0;">Olay Günlüğü <span style="font-size:10px; color:#4caf50;">🔒 E2EE Şifreli</span></h3>
                <div id="chat-box" class="chat-box"></div>
                <div class="chat-input-area">
                    <input type="text" id="chat-input" placeholder="Mesaj yaz...">
                    <button id="send-chat-btn">Gönder</button>
                </div>
            </div>
        </div>
    </div>
    <script type="module" src="app.js"></script>
</body>
</html>
