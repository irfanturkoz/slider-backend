const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Token oluşturma fonksiyonu
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Kullanıcı kaydı
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, password, isAdmin, isSuperAdmin } = req.body;

    // Kullanıcı adı kontrolü
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'Bu kullanıcı adı zaten kullanılıyor' });
    }

    // Yeni kullanıcı oluştur
    const user = await User.create({
      username,
      password,
      isAdmin: isAdmin || false,
      isSuperAdmin: isSuperAdmin || false
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Kullanıcı girişi
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Kullanıcıyı bul
    const user = await User.findOne({ username });
    
    // Kullanıcı ve şifre kontrolü
    if (user && user.matchPassword(password)) {
      // Token oluştur
      const token = generateToken(user._id);

      res.json({
        _id: user._id,
        username: user.username,
        isAdmin: user.isAdmin,
        isSuperAdmin: user.isSuperAdmin,
        token
      });
    } else {
      console.log('Login başarısız:', { username, password });
      console.log('Bulunan kullanıcı:', user);
      res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' });
    }
  } catch (error) {
    console.error('Login hatası:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Kullanıcı bilgilerini getir
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Şifre değiştir
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Mevcut şifre ve yeni şifre gereklidir' });
    }
    
    // Kullanıcıyı bul
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    // Mevcut şifreyi kontrol et
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Mevcut şifre yanlış' });
    }
    
    // Yeni şifreyi ayarla
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Şifre başarıyla değiştirildi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Çıkış yap
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  
  res.json({ message: 'Başarıyla çıkış yapıldı' });
};

// @desc    Kullanıcı sil
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    // Admin kendisini silemesin
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Kendinizi silemezsiniz' });
    }
    
    // SuperAdmin kullanıcıları sadece başka bir SuperAdmin silebilir
    if (user.isSuperAdmin && !req.user.isSuperAdmin) {
      return res.status(403).json({ message: 'Süper admin kullanıcıları sadece başka bir süper admin silebilir' });
    }
    
    await user.deleteOne();
    
    res.json({ message: 'Kullanıcı başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Tüm kullanıcıları getir
// @route   GET /api/auth/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 