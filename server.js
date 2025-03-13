const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// Çevre değişkenlerini yükle
dotenv.config();

// MongoDB bağlantısı
connectDB();

// Express uygulamasını başlat
const app = express();
const PORT = process.env.PORT || 3000;

// CORS ayarları
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:3000',
  process.env.FRONTEND_URL || 'https://sizindomaininiz.com' // Buraya domain adresinizi yazın
];

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With', 'Accept']
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Statik dosyalar için klasör tanımla
app.use(express.static(path.join(__dirname, 'public')));

// Ana rotalar
app.get('/', (req, res) => {
  res.json({ message: 'Backend API çalışıyor!' });
});

// API rotaları
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/authRoutes');

app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);

// 404 - Sayfa bulunamadı
app.use((req, res) => {
  res.status(404).json({ message: 'Sayfa bulunamadı' });
});

// Server'ı başlat
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
  console.log('İzin verilen originler:', allowedOrigins);
}); 