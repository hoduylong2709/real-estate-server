const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  text: {
    type: String,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = { reviewSchema };