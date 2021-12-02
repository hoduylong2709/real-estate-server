const express = require('express');
const cloudinary = require('cloudinary').v2;
const Listing = require('../models/listing');
const { compareView } = require('../utils/compare');
const router = new express.Router();
const auth = require('../middleware/auth');

// GET /listings?sold=true
// GET /listings?limit=10&skip=20
// GET /listings?sortBy=createdAt:desc
router.get('/listings', auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(':');
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
  }

  if (req.query.sold) {
    match.sold = req.query.sold === 'true';
  }

  try {
    await req.user.populate({
      path: 'listings',
      match,
      options: {
        limit: req.query.limit && parseInt(req.query.limit),
        skip: req.query.skip && parseInt(req.query.skip),
        sort
      }
    });
    res.send(req.user.listings);
  } catch (error) {
    res.status(500).send();
  }
});

router.get('/listings/popular', auth, async (req, res) => {
  try {
    const allListings = await Listing.find({});
    const viewBasedSortedListings = allListings.filter(
      listing => listing.owner.toString() !== req.user._id.toString()
    ).sort(compareView).slice(0, 3);
    res.send(viewBasedSortedListings);
  } catch (error) {
    res.status(500).send();
  }
});

router.get('/listings/:id', auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const listing = await Listing.findOne({ _id });
    if (!listing) {
      return res.status(404).send();
    }
    res.send(listing);
  } catch (error) {
    res.status(500).send();
  }
});

router.post('/listings/views/:id', auth, async (req, res) => {
  try {
    const listing = await Listing.findOne({ _id: req.params.id });

    if (listing.owner.toString() !== req.user._id.toString()) {
      listing.views += 1;
    }

    await listing.save();
    res.send();
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/listings', auth, async (req, res) => {
  const listing = new Listing({ ...req.body, owner: req.user._id });

  try {
    await listing.save();
    res.status(201).send({ listing });
  } catch (error) {
    res.status(400).send(error);
  }
});

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

router.delete('/listings/cloudinary', auth, async (req, res) => {
  const publicId = req.body.publicId;
  await cloudinary.uploader.destroy(publicId);
  res.send();
});

router.post('/listings/favorite/:id', auth, async (req, res) => {
  try {
    const listing = await Listing.findOne({ _id: req.params.id });

    if (!listing) {
      return res.status(404).send();
    }

    listing.favoriteUsers.addToSet(req.user._id);
    await listing.save();
    res.send(listing);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.delete('/listings/favorite/:id', auth, async (req, res) => {
  const _id = req.params.id;
  const userId = req.user._id;

  try {
    const listing = await Listing.findOne({ _id });
    const updatedFavoriteUsers = listing.favoriteUsers.filter(id => id.toString() !== userId.toString());
    listing.favoriteUsers = updatedFavoriteUsers;
    await listing.save();
    res.send(listing);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/listings/rating/:id', auth, async (req, res) => {
  const _id = req.params.id;
  const rating = {
    ...req.body,
    owner: {
      id: req.user._id,
      fullname: `${req.user.firstName} ${req.user.lastName}`,
      avatar: req.user.avatar
    }
  };

  try {
    const listing = await Listing.findOne({ _id });

    if (!listing) {
      return res.status(404).send();
    }

    listing.ratings.push(rating);
    await listing.save();
    res.send(rating);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/listings/ratings/:id', auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const listing = await Listing.findOne({ _id });

    if (!listing) {
      return res.status(404).send();
    }

    let yourRating = null;
    let otherRatings = [];
    let returnRatings = [];

    listing.ratings.forEach(rating => {
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

router.delete('/listings/ratings/:id', auth, async (req, res) => {
  const ratingId = req.params.id;
  const listingId = req.body.listingId;

  try {
    const listing = await Listing.findOne({ _id: listingId });

    if (!listing) {
      return res.status(404).send({ error: 'Listing does not exist!' });
    }

    listing.ratings = listing.ratings.filter(rating => rating._id.toString() !== ratingId);
    await listing.save();
    res.send();
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch('/listings/ratings/:id', auth, async (req, res) => {
  const keyArray = Object.keys(req.body);
  const updates = keyArray.filter(key => key !== 'listingId');
  const allowedUpdates = ['stars', 'review'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {
    const listing = await Listing.findOne({ _id: req.body.listingId });

    if (!listing) {
      return res.status(404).send({ error: 'Listing does not exist!' });
    }

    const rating = listing.ratings.find(rating => rating._id.toString() === req.params.id);

    updates.forEach(update => rating[update] = req.body[update]);
    listing.ratings.splice(
      listing.ratings.findIndex(rating => rating._id.toString() === req.params.id),
      1,
      rating
    );
    await listing.save();
    res.send();
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;