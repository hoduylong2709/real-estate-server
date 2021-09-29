const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error('Email is invalid!');
      }
    }
  },
  phoneNumber: {
    type: Number,
    trim: true
  },
  password: {
    type: String,
    required: true,
    trim: true,
  }
}, { timestamps: true });

// Hash the plain text password before saving
userSchema.pre('save', async function (next) {

});

const User = mongoose.model('User', userSchema);

module.exports = User;