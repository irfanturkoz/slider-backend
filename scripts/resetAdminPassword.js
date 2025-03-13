const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const connectDB = require('../config/db');

// Çevre değişkenlerini yükle
dotenv.config();

// MongoDB bağlantısı
connectDB();

const resetAdminPassword = async () => {
  try {
    // Admin kullanıcısını bul
    const admin = await User.findOne({ isAdmin: true });
    
    if (!admin) {
      console.log('Admin kullanıcısı bulunamadı!');
      process.exit(1);
    }
    
    // Şifreyi sıfırla
    admin.password = 'admin123';
    await admin.save();
    
    console.log('Admin şifresi başarıyla sıfırlandı!');
    console.log(`Kullanıcı adı: ${admin.username}`);
    console.log('Yeni şifre: admin123');
    
    process.exit();
  } catch (error) {
    console.error(`Hata: ${error.message}`);
    process.exit(1);
  }
};

resetAdminPassword(); 