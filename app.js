const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const { errorHandler } = require('./middleware/errorMiddleware');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors());

// Statik dosyalar için public klasörünü kullan
app.use(express.static(path.join(__dirname, 'public')));
// Uploads klasörüne doğrudan erişim sağla
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

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