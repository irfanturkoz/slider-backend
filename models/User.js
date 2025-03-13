const mongoose = require('mongoose');

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

// Basit şifre doğrulama
UserSchema.methods.matchPassword = function(enteredPassword) {
  return enteredPassword === this.password;
};

module.exports = mongoose.model('User', UserSchema); 