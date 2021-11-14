const mongoose = require('mongoose');

const cloudinaryImageSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  }
});

module.exports = { cloudinaryImageSchema };