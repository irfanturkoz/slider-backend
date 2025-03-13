const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT token doğrulama middleware'i
exports.protect = async (req, res, next) => {
  let token;

  // Token'ı header'dan al
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // Veya cookie'den al
    token = req.cookies.token;
  }

  // Token yoksa hata döndür
  if (!token) {
    return res.status(401).json({ message: 'Bu işlem için giriş yapmanız gerekiyor' });
  }

  try {
    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Kullanıcıyı bul
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Geçersiz token, lütfen tekrar giriş yapın' });
  }
};

// Admin kontrolü
exports.admin = (req, res, next) => {
  if (req.user && (req.user.isAdmin || req.user.isSuperAdmin)) {
    next();
  } else {
    return res.status(403).json({ message: 'Bu işlem için admin yetkisi gerekiyor' });
  }
};

// SuperAdmin kontrolü
exports.superAdmin = (req, res, next) => {
  if (req.user && req.user.isSuperAdmin) {
    next();
  } else {
    return res.status(403).json({ message: 'Bu işlem için süper admin yetkisi gerekiyor' });
  }
}; 