const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const Listing = require('../models/listing');
const { base64ArrayBuffer } = require('../utils/convertArrayBufferToBase64String');
const router = new express.Router();
const auth = require('../middleware/auth');

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
    fileSize: 1000000
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
    const buffer = await sharp(photo.buffer).resize({ width: 150, height: 150 }).png().toBuffer();
    return buffer;
  }))

  const base64Photos = bufferPhotos.map(bufferPhoto => base64ArrayBuffer(bufferPhoto));

  try {
    const listing = await Listing.findOne({ _id: req.params.id, owner: req.user._id });

    if (!listing) {
      return res.status(404).send();
    }

    listing.photos = base64Photos;
    await listing.save();
    res.send(listing);
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;