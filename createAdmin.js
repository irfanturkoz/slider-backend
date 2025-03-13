const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createAdminUser() {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // Admin kullanıcısını kontrol et
    let adminUser = await User.findOne({ username: 'admin' });
    
    if (adminUser) {
      // Varolan admin kullanıcısını güncelle
      adminUser.password = 'admin123';
      adminUser.isAdmin = true;
      await adminUser.save();
      console.log('Admin kullanıcısı güncellendi');
    } else {
      // Yeni admin kullanıcısı oluştur
      adminUser = new User({
        username: 'admin',
        password: 'admin123',
        isAdmin: true
      });
      await adminUser.save();
      console.log('Yeni admin kullanıcısı oluşturuldu');
    }

    console.log('Admin bilgileri:');
    console.log('Kullanıcı adı: admin');
    console.log('Şifre: admin123');
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB bağlantısı kapatıldı');
  }
}

// Fonksiyonu çalıştır
createAdminUser(); 