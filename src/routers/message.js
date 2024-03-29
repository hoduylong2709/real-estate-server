const express = require('express');
const Message = require('../models/message');
const Conversation = require('../models/conversation');
const router = new express.Router();
const auth = require('../middleware/auth');

// Get all messages
// /messages/:convId?limit=10&oldest=abcxyz
router.get('/messages/:convId', auth, async (req, res) => {
  let oldestMessage = null;

  if (req.query.oldest) {
    oldestMessage = await Message.findOne({ _id: req.query.oldest });
  }

  try {
    const messages = await Message.find({
      conversationId: req.params.convId,
      deletes: { $nin: [req.user._id] },
      createdAt: {
        $lt: oldestMessage ? oldestMessage.createdAt : new Date()
      }
    }, null, {
      limit: req.query.limit && parseInt(req.query.limit),
      sort: { createdAt: -1 }
    }).populate('senderId');
    res.send(messages);
  } catch (error) {
    res.status(500).send();
  }
});

// Get message by clientId
router.get('/messages/message/:clientId', auth, async (req, res) => {
  try {
    const message = await Message.findOne({ clientId: req.params.clientId });

    if (!message) {
      return res.status(404).send();
    }

    res.send(message);
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

// Set message read
router.patch('/messages/read/:id', auth, async (req, res) => {
  try {
    const message = await Message.findOne({ _id: req.params.id });

    if (!message) {
      return res.status(404).send();
    }

    message.isRead = true;
    await message.save();
    res.send(message);
  } catch (error) {
    res.status(500).send();
  }
});

module.exports = router;