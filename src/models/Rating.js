const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  stars: {
    type: Number,
    required: true
  },
  review: {
    type: String,
    trim: true
  },
  owner: {
    type: Object,
    required: true
  }
}, { timestamps: true });

module.exports = { ratingSchema };