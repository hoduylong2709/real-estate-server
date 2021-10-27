const mongoose = require('mongoose');

const categoryFilterSchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
    trim: true
  },
  rentOrBuy: {
    type: String
  },
  squareFeet: {
    type: String
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
    type: String
  },
  closeToPublicTransportation: {
    type: Boolean
  }
}, { timestamps: true });

module.exports = { categoryFilterSchema };