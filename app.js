const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const { errorHandler } = require('./middleware/errorMiddleware');
require('dotenv').config();

const app = express();

// CORS ayarları - en başa alındı
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://www.dizifilmpal.com');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // OPTIONS istekleri için hemen yanıt ver
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    next();
});

// JSON parser
app.use(express.json());

// Statik dosyalar için public klasörünü kullan
app.use(express.static(path.join(__dirname, 'public')));

// Uploads klasörüne doğrudan erişim sağla
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Uploads klasörünün varlığını kontrol et ve oluştur
const uploadsDir = path.join(__dirname, 'public/uploads');
const fs = require('fs');
if (!fs.existsSync(uploadsDir)) {
    console.log('Uploads klasörü oluşturuluyor:', uploadsDir);
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Auth rotaları
app.use('/api/auth', authRoutes);

// API rotaları
app.use('/api', apiRoutes);

// 404 sayfası için yönlendirme
app.use((req, res, next) => {
    // API istekleri için JSON yanıtı
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ message: 'Endpoint bulunamadı' });
    }
    
    // Diğer istekler için 404.html sayfasına yönlendir
    res.status(404).sendFile(path.join(__dirname, '../404.html'));
});

// Hata işleyici middleware
app.use((err, req, res, next) => {
    console.error('Hata:', err);
    
    // Hata yanıtını gönder
    res.status(err.status || 500).json({
        message: err.message || 'Sunucu hatası oluştu',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// MongoDB bağlantısı
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB bağlantısı başarılı');
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda çalışıyor`));
    })
    .catch(err => {
        console.error('MongoDB bağlantı hatası:', err.message);
        process.exit(1);
    }); 