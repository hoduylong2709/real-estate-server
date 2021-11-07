const mongoose = require('mongoose');

const googleLoginSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  idToken: {
    type: String,
    required: true
  }
});

module.exports = { googleLoginSchema };