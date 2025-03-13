const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const { errorHandler } = require('./middleware/errorMiddleware');
require('dotenv').config();

app.use(express.json());
app.use(cors());

// Statik dosyalar için public klasörünü kullan
app.use(express.static('public'));

// API rotalarını kullan
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