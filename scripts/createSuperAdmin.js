require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// MongoDB bağlantısı
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/slider')
  .then(() => console.log('MongoDB bağlantısı başarılı'))
  .catch(err => {
    console.error('MongoDB bağlantı hatası:', err);
    process.exit(1);
  });

// Süper admin kullanıcısı oluştur
const createSuperAdmin = async () => {
  try {
    // Önce mevcut süper admini kontrol et
    const existingSuperAdmin = await User.findOne({ username: 'superadmin' });
    
    if (existingSuperAdmin) {
      console.log('Süper admin zaten mevcut, şifre güncelleniyor...');
      existingSuperAdmin.password = 'superadmin123';
      await existingSuperAdmin.save();
      console.log('Süper admin şifresi güncellendi');
    } else {
      // Yeni süper admin oluştur
      const superAdmin = await User.create({
        username: 'superadmin',
        password: 'superadmin123',
        isAdmin: true,
        isSuperAdmin: true
      });
      console.log('Süper admin oluşturuldu:', superAdmin.username);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
};

createSuperAdmin(); 