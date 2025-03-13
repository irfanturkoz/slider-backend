require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/slider')
  .then(() => console.log('MongoDB bağlantısı başarılı'))
  .catch(err => {
    console.error('MongoDB bağlantı hatası:', err);
    process.exit(1);
  });

const checkSuperAdmin = async () => {
  try {
    console.log('Tüm kullanıcılar:');
    const users = await User.find({});
    users.forEach(user => {
      console.log(`Kullanıcı adı: ${user.username}`);
      console.log(`Admin mi: ${user.isAdmin}`);
      console.log(`Süper Admin mi: ${user.isSuperAdmin}`);
      console.log('------------------------');
    });

    const superAdmin = await User.findOne({ isSuperAdmin: true });
    if (superAdmin) {
      console.log('\nMevcut süper admin bulundu:');
      console.log('Kullanıcı adı:', superAdmin.username);
      console.log('ID:', superAdmin._id);
    } else {
      console.log('\nSüper admin bulunamadı!');
    }
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
};

checkSuperAdmin(); 