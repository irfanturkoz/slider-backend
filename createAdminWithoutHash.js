const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createAdminUser() {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // Önce tüm kullanıcıları sil
    await User.deleteMany({});
    console.log('Tüm kullanıcılar silindi');

    // Yeni admin kullanıcısı oluştur (şifre hash'lenmeden)
    const user = new User({
      username: 'admin',
      password: 'admin123',
      isAdmin: true
    });
    
    // Kullanıcıyı kaydet
    await user.save();
    console.log('Admin kullanıcısı başarıyla oluşturuldu!');
    console.log('Kullanıcı adı: admin');
    console.log('Şifre: admin123');
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    // Bağlantıyı kapat
    mongoose.disconnect();
    console.log('MongoDB bağlantısı kapatıldı');
  }
}

// Fonksiyonu çalıştır
createAdminUser(); 