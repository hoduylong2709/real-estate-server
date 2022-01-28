const express = require('express');
const Listing = require('../models/listing');
const User = require('../models/user');
const { compareView } = require('../utils/compare');
const router = new express.Router();
const auth = require('../middleware/auth');
const { cloudinary } = require('../utils/getCloudinaryConfig');

// GET /listings?sold=true
// GET /listings?limit=10&skip=20
// GET /listings?sortBy=createdAt:desc
router.get('/listings/me', auth, async (req, res) => {
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
      },
      populate: {
        path: 'ratings owner'
      }
    });
    res.send(req.user.listings);
  } catch (error) {
    res.status(500).send();
  }
});

// GET /listings?limit=10&skip=20
router.get('/listings', auth, async (req, res) => {
  try {
    const allListings = await Listing.find(
      { owner: { $ne: req.user._id } },
      null,
      {
        limit: req.query.limit && parseInt(req.query.limit),
        skip: req.query.skip && parseInt(req.query.skip),
        sort: { createdAt: -1 }
      }
    )
      .populate('ratings owner');
    res.send(allListings);
  } catch (error) {
    res.status(500).send();
  }
});

router.get('/listings/popular', auth, async (req, res) => {
  try {
    const allListings = await Listing.find({}).populate('ratings owner');
    const viewBasedSortedListings = allListings.filter(
      listing => listing.owner._id.toString() !== req.user._id.toString()
    ).sort(compareView).slice(0, 3);
    res.send(viewBasedSortedListings);
  } catch (error) {
    res.status(500).send();
  }
});

router.get('/listings/:userId', auth, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.userId });

    if (!user) {
      return res.status(404).send();
    }

    await user.populate({
      path: 'listings'
    });
    res.send(user.listings);
  } catch (error) {
    res.status(500).send();
  }
});

router.get('/listings/favorite/:userId', auth, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.userId });

    if (!user) {
      return res.status(404).send();
    }

    await user.populate({
      path: 'favoriteListings',
      populate: 'owner'
    });
    res.send(user.favoriteListings);
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

router.delete('/listings/:id', auth, async (req, res) => {
  try {
    const listing = await Listing.findOne({ _id: req.params.id, owner: req.user._id });

    if (!listing) {
      return res.status(404).send();
    }

    for (let i = 0; i < listing.photos.length; i++) {
      await cloudinary.uploader.destroy(listing.photos[i].publicId);
    }

    await listing.remove();
    res.send(listing);
  } catch (error) {
    res.status(500).send();
  }
});

router.patch('/listings/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = [
    'title',
    'description',
    'location',
    'isSold'
  ];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {
    const listing = await Listing.findOne({ _id: req.params.id, owner: req.user._id });

    if (!listing) {
      return res.status(404).send();
    }

    updates.forEach(update => listing[update] = req.body[update]);
    await listing.save();
    res.send(listing);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Update photos of listing
router.patch('/listings/photos/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['deleted', 'new'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {
    const listing = await Listing.findOne({ _id: req.params.id, owner: req.user._id });

    if (!listing) {
      return res.status(404).send();
    }

    if (req.body.new) {
      listing.photos = listing.photos.concat(req.body.new);
    }

    if (req.body.deleted) {
      console.log('here');
      listing.photos = listing.photos.filter(
        photo => !req.body.deleted.some(deletedOne => deletedOne.publicId === photo.publicId)
      );
      for (let i = 0; i < req.body.deleted.length; i++) {
        await cloudinary.uploader.destroy(req.body.deleted[i].publicId);
      }
    }

    listing.markModified('photos');
    await listing.save();
    res.send(listing.price);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Update price of listing
router.patch('/listings/price/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['value', 'currency'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {
    const listing = await Listing.findOne({ _id: req.params.id, owner: req.user._id });

    if (!listing) {
      return res.status(404).send();
    }

    updates.forEach(update => listing.price[update] = req.body[update]);
    listing.markModified('price');
    await listing.save();
    res.send(listing.price);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Update category info of listing
router.patch('/listings/category/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = [
    'rentOrBuy',
    'squareFeet',
    'bedrooms',
    'baths',
    'newConstruction',
    'yearBuilt',
    'closeToPublicTransportation'
  ];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {
    const listing = await Listing.findOne({ _id: req.params.id, owner: req.user._id });

    if (!listing) {
      return res.status(404).send();
    }

    updates.forEach(update => listing.category[update] = req.body[update]);
    listing.markModified('category');
    await listing.save();
    res.send(listing.category);
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;