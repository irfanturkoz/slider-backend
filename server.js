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
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost',
            'https://dizifilmpal.com',
            'http://dizifilmpal.com'
        ];
        
        // origin null olabilir (örneğin Postman'den gelen istekler için)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('CORS policy violation'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

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
  console.log('İzin verilen originler:', corsOptions.origin);
}); 