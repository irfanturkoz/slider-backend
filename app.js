const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const { errorHandler } = require('./middleware/errorMiddleware');
require('dotenv').config();

const app = express();

// CORS ayarlarını düzelt - tüm domainlere izin ver
app.use(cors({
  origin: ['https://dizifilmpal.com', 'http://localhost:3000', 'http://localhost:5000', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// CORS ön kontrol istekleri için
app.options('*', cors());

app.use(express.json());

// Statik dosyalar için public klasörünü kullan
app.use(express.static(path.join(__dirname, 'public')));

// Uploads klasörüne doğrudan erişim sağla - bu kısmı özellikle düzenliyoruz
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Uploads klasörünün varlığını kontrol et ve oluştur
const uploadsDir = path.join(__dirname, 'public/uploads');
const fs = require('fs');
if (!fs.existsSync(uploadsDir)) {
  console.log('Uploads klasörü oluşturuluyor:', uploadsDir);
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Her istekte CORS başlıklarını ekle
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Uploads klasörüne erişim için özel kontrol
  if (req.url.startsWith('/uploads/')) {
    console.log('Uploads klasörüne erişim:', req.url);
  }
  
  next();
});

// API rotalarını kullan
app.use('/api', apiRoutes);
app.use('/auth', authRoutes);

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