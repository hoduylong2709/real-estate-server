const express = require('express');
const Category = require('../models/category');
const router = new express.Router();
const auth = require('../middleware/auth');

/* 
  Admin route, Add auth middleware later
*/
router.post('/categories', async (req, res) => {
  const category = new Category(req.body);
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