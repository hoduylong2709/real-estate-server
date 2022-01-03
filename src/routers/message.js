const express = require('express');
const Message = require('../models/message');
const router = new express.Router();
const auth = require('../middleware/auth');

// Get messages
router.get('/messages/:convId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.convId,
      deletes: { $nin: [req.user._id] }
    }).populate('senderId');
    res.send(messages.reverse());
  } catch (error) {
    res.status(500).send();
  }
});

// Create message
router.post('/messages', auth, async (req, res) => {
  const message = new Message(req.body);

  try {
    await message.save();
    res.status(201).send(message);
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;