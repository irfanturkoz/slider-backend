const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function deleteAdminUser() {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // Admin kullanıcısını sil
    const result = await User.deleteOne({ username: 'admin' });
    
    if (result.deletedCount > 0) {
      console.log('Admin kullanıcısı başarıyla silindi!');
    } else {
      console.log('Admin kullanıcısı bulunamadı!');
    }
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    // Bağlantıyı kapat
    mongoose.disconnect();
    console.log('MongoDB bağlantısı kapatıldı');
  }
}

// Fonksiyonu çalıştır
deleteAdminUser(); 