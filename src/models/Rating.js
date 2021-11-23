const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  stars: {
    type: Number,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = { ratingSchema };