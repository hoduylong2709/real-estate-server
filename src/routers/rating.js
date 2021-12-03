const express = require('express');
const Rating = require('../models/rating');
const Listing = require('../models/listing');
const router = new express.Router();
const auth = require('../middleware/auth');

router.get('/ratings/listings/:listingId', auth, async (req, res) => {
  const listingId = req.params.listingId;

  try {
    const ratings = await Rating.find({ listingId }).populate('owner');

    let yourRating = null;
    let otherRatings = [];
    let returnRatings = [];

    ratings.forEach(rating => {
      if (rating.owner.id.toString() === req.user._id.toString()) {
        yourRating = rating;
      } else {
        otherRatings.push(rating);
      }
    });

    otherRatings.sort((rating1, rating2) => {
      return rating2.createdAt - rating1.createdAt;
    });

    if (yourRating) {
      returnRatings = [yourRating, ...otherRatings];
    } else {
      returnRatings = otherRatings;
    }

    res.send(returnRatings);
  } catch (error) {
    res.status(500).send();
  }
});

router.post('/ratings', auth, async (req, res) => {
  const rating = new Rating({
    ...req.body,
    owner: req.user._id
  });

  const { listingId } = req.body;

  try {
    await rating.save();
    const listing = await Listing.findOne({ _id: listingId });

    if (!listing) {
      return res.status(404).send();
    }

    listing.ratings.push(rating);
    await listing.save();

    res.status(201).send(rating);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.delete('/ratings/:id', auth, async (req, res) => {
  try {
    const rating = await Rating.findOneAndDelete({ _id: req.params.id });

    if (!rating) {
      return res.status(404).send();
    }

    const listing = await Listing.findOne({ _id: rating.listingId });

    if (!listing) {
      return res.send(rating);
    }

    listing.ratings = listing.ratings.filter(
      ratingId => ratingId.toString() !== rating._id.toString()
    );
    await listing.save();

    res.send(rating);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch('/ratings/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['stars', 'review'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {
    const rating = await Rating.findOne({ _id: req.params.id });

    if (!rating) {
      return res.status(404).send();
    }

    updates.forEach(update => rating[update] = req.body[update]);
    await rating.save();
    res.send(rating);
  } catch (error) {

  }
});

module.exports = router;