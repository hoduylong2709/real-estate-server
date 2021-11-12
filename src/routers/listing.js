const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const Listing = require('../models/listing');
const { base64ArrayBuffer } = require('../utils/convertArrayBufferToBase64String');
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
    const listing = await Listing.findOne({ _id, owner: req.user._id });
    if (!listing) {
      return res.status(404).send();
    }
    res.send(listing);
  } catch (error) {
    res.status(500).send();
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

const upload = multer({
  limits: {
    fileSize: 5242800
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload an image'));
    }
    cb(undefined, true);
  }
});

router.post('/listings/photos/:id', auth, upload.array('photos', 10), async (req, res) => {
  const bufferPhotos = await Promise.all(req.files.map(async (photo) => {
    const buffer = await sharp(photo.buffer).png().toBuffer();
    return buffer;
  }));

  const base64Photos = bufferPhotos.map(bufferPhoto => base64ArrayBuffer(bufferPhoto));

  try {
    const listing = await Listing.findOne({ _id: req.params.id, owner: req.user._id });

    if (!listing) {
      return res.status(404).send();
    }

    listing.photos = base64Photos;
    await listing.save();
    res.send(listing.photos);
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;