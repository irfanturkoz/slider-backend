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

const corsOptions = {
    origin: function (origin, callback) {
        // origin null olabilir (örneğin Postman'den gelen istekler için)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('CORS isteği reddedildi:', origin);
            callback(new Error('CORS politikası tarafından reddedildi'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
};

// Global CORS ayarları
app.use(cors(corsOptions));

// CORS ön kontrol istekleri için
app.options('*', cors(corsOptions));

app.use(express.json());

// Her istekte CORS başlıklarını ekle
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Preflight istekleri için
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Max-Age', '86400'); // 24 saat
        return res.status(204).end();
    }
    
    next();
});

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
app.use('/api/auth', cors(corsOptions), authRoutes);

// API rotaları için özel CORS ayarları
app.use('/api', cors(corsOptions), apiRoutes);

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