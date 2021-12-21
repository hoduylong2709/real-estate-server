const mongoose = require('mongoose');
const { categoryFilterSchema } = require('./categoryFilter');
const { cloudinaryImageSchema } = require('./cloudinaryImage');
const Rating = require('./rating');
const User = require('./user');

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
  favoriteUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  ratings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rating'
  }],
  views: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Do necessary things when listing is removed
listingSchema.pre('remove', async function (next) {
  const listing = this;
  await Rating.deleteMany({ listingId: listing._id });
  for await (const user of User.find({ favoriteListings: listing._id })) {
    user.favoriteListings = user.favoriteListings.filter(
      id => id.toString() !== listing._id.toString()
    );
    await user.save();
  }
  next();
});

const Listing = mongoose.model('Listing', listingSchema);

module.exports = Listing;