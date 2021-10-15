const mongoose = require('mongoose');

const categoryFilterSchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
    trim: true
  },
  rentOrBuy: {
    type: String,
    required: true
  },
  priceRange: {
    type: Object,
    required: true
  },
  squareFeet: {
    type: Object
  },
  bedrooms: {
    type: Number
  },
  baths: {
    type: Number
  },
  newConstruction: {
    type: Boolean
  },
  yearBuilt: {
    type: Number
  },
  closeToPublicTransportation: {
    type: Boolean
  }
}, { timestamps: true });

module.exports = { categoryFilterSchema };