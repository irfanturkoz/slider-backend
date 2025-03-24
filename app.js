const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const { errorHandler } = require('./middleware/errorMiddleware');
require('dotenv').config();

const app = express();

// CORS ayarlarını düzelt
const allowedOrigins = [
    'https://www.dizifilmpal.com',
    'https://dizifilmpal.com',
    'http://localhost:3000',
    'http://localhost:5000'
];

// CORS middleware'i
const corsMiddleware = (req, res, next) => {
    const origin = req.headers.origin;
    
    // Origin kontrolü
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        res.setHeader('Access-Control-Max-Age', '86400'); // 24 saat
    }

    // Preflight istekleri için
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    next();
};

// Global CORS ayarları
app.use(corsMiddleware);

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

// Auth rotaları için özel CORS ayarları
app.use('/api/auth', corsMiddleware, (req, res, next) => {
    // Auth rotaları için ek güvenlik kontrolleri
    const origin = req.headers.origin;
    if (!origin || !allowedOrigins.includes(origin)) {
        return res.status(403).json({ 
            message: 'CORS politikası: Bu kaynağa erişim izniniz yok',
            origin: origin
        });
    }
    next();
}, authRoutes);

// API rotaları için özel CORS ayarları
app.use('/api', corsMiddleware, apiRoutes);

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
app.use(errorHandler);

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