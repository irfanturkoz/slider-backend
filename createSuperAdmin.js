const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createSuperAdmin() {
  try {
    // MongoDB'ye bağlan
    const mongoUri = 'mongodb+srv://admin-1:admin@cluster0.muajk.mongodb.net/slider?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoUri);
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

    // Tüm kullanıcıları listele
    const users = await User.find();
    console.log('\nMevcut kullanıcılar:');
    users.forEach(user => {
      console.log(`- ${user.username} (Admin: ${user.isAdmin}, SuperAdmin: ${user.isSuperAdmin})`);
    });

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB bağlantısı kapatıldı');
  }
}

// Fonksiyonu çalıştır
createSuperAdmin(); 