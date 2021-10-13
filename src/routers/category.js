const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const Category = require('../models/category');
const { base64ArrayBuffer } = require('../utils/convertArrayBufferToBase64String');
const router = new express.Router();
const auth = require('../middleware/auth');

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

/* 
  Admin route, Add auth middleware later
*/
router.post('/categories', upload.single('categoryImage'), async (req, res) => {
  const category = new Category(req.body);
  const buffer = await sharp(req.file.buffer).resize({ width: 150, height: 150 }).png().toBuffer();
  const base64String = base64ArrayBuffer(buffer);
  category.image = base64String;

  try {
    await category.save();
    res.status(201).send({ category });
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/categories', auth, async (req, res) => {
  try {
    const categories = await Category.find({});
    res.send(categories);
  } catch (error) {
    res.status(500).send();
  }
});

module.exports = router;