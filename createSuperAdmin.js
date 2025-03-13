const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createSuperAdmin() {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // Superadmin kullanıcısını kontrol et
    let superAdmin = await User.findOne({ username: 'superadmin' });
    
    if (superAdmin) {
      // Varolan superadmin kullanıcısını güncelle
      superAdmin.password = 'superadmin123';
      superAdmin.isAdmin = true;
      superAdmin.isSuperAdmin = true;
      await superAdmin.save();
      console.log('Superadmin kullanıcısı güncellendi');
    } else {
      // Yeni superadmin kullanıcısı oluştur
      superAdmin = new User({
        username: 'superadmin',
        password: 'superadmin123',
        isAdmin: true,
        isSuperAdmin: true
      });
      await superAdmin.save();
      console.log('Yeni superadmin kullanıcısı oluşturuldu');
    }

    console.log('Superadmin bilgileri:');
    console.log('Kullanıcı adı: superadmin');
    console.log('Şifre: superadmin123');
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB bağlantısı kapatıldı');
  }
}

// Fonksiyonu çalıştır
createSuperAdmin(); 