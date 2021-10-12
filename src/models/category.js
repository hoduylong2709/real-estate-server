const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    required: true
  },
  hasRentOrBuy: {
    type: Boolean,
    required: true
  },
  hasPriceRange: {
    type: Boolean,
    required: true
  },
  hasSquareFeet: {
    type: Boolean,
    required: true
  },
  hasBedrooms: {
    type: Boolean,
    required: true
  },
  hasBaths: {
    type: Boolean,
    required: true
  },
  hasNewConstruction: {
    type: Boolean,
    required: true
  },
  hasYearBuilt: {
    type: Boolean,
    required: true
  },
  hasCloseToPublicTransportation: {
    type: Boolean,
    required: true
  }
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;