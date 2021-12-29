const express = require('express');
const Conversation = require('../models/conversation');
const router = new express.Router();
const auth = require('../middleware/auth');

// Get conversations
router.get('/conversations/:userId', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      members: { $in: [req.params.userId] }
    }).populate('members');
    res.send(conversations);
  } catch (error) {
    res.status(500).send();
  }
});

// Create conversations
router.post('/conversations', auth, async (req, res) => {
  const conversation = new Conversation({
    members: [req.body.senderId, req.body.receiverId]
  });

  try {
    await conversation.save();
    res.status(201).send(conversation);
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;