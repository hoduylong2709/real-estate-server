const mongoose = require('mongoose');
const { categoryFilterSchema } = require('./categoryFilter');
const { cloudinaryImageSchema } = require('./cloudinaryImage');
const { ratingSchema } = require('./rating');

const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Object,
    required: true
  },
  category: {
    type: categoryFilterSchema,
    required: true
  },
  location: {
    type: Object,
    required: true
  },
  photos: {
    type: [cloudinaryImageSchema]
  },
  isSold: {
    type: Boolean,
    default: false
  },
  favoriteUsers: {
    type: [mongoose.ObjectId],
    default: []
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  ratings: [ratingSchema],
  views: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const Listing = mongoose.model('Listing', listingSchema);

module.exports = Listing;