const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isSuperAdmin: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Şifreyi hashleme (geçici olarak devre dışı bırakıldı)
// UserSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) {
//     return next();
//   }
//   
//   try {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// Şifre doğrulama metodu (geçici olarak basitleştirildi)
UserSchema.methods.matchPassword = async function(enteredPassword) {
  // return await bcrypt.compare(enteredPassword, this.password);
  return enteredPassword === this.password;
};

module.exports = mongoose.model('User', UserSchema); 