const express = require('express');
const Message = require('../models/message');
const Conversation = require('../models/conversation');
const router = new express.Router();
const auth = require('../middleware/auth');

// Get messages
// /messages/:convId?limit=10&skip=10
router.get('/messages/:convId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.convId,
      deletes: { $nin: [req.user._id] }
    }, null, {
      limit: req.query.limit && parseInt(req.query.limit),
      skip: req.query.skip && parseInt(req.query.skip),
      sort: { createdAt: -1 }
    }).populate('senderId');
    res.send(messages);
  } catch (error) {
    res.status(500).send();
  }
});

// Create message
router.post('/messages', auth, async (req, res) => {
  const message = new Message(req.body);

  try {
    await message.save();

    const conversation = await Conversation.findOne({ _id: req.body.conversationId });
    if (!conversation) {
      return res.status(404).send()
    }
    conversation.lastMessage = message._id;
    await conversation.save();

    res.status(201).send(message);
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;