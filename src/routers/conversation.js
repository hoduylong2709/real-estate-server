const express = require('express');
const Conversation = require('../models/conversation');
const Message = require('../models/message');
const router = new express.Router();
const auth = require('../middleware/auth');
const { getPublicId } = require('../utils/getPublicIdFromUrl');
const { cloudinary } = require('../utils/getCloudinaryConfig');

// Get conversations
router.get('/conversations/:userId', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      members: { $in: [req.params.userId] },
      deletes: { $nin: [req.params.userId] }
    }).populate('members lastMessage');
    res.send(conversations);
  } catch (error) {
    res.status(500).send();
  }
});

// Create conversations
router.post('/conversations', auth, async (req, res) => {
  try {
    const existence = await Conversation.findOne({
      members: [req.user._id, req.body.receiverId]
    });

    if (existence) {
      existence.deletes = [];
      existence.markModified('deletes');
      await existence.save();
      res.send(existence);
    } else {
      const conversation = new Conversation({
        members: [req.user._id, req.body.receiverId]
      });
      await conversation.save();
      res.status(201).send(conversation);
    }
  } catch (error) {
    res.status(500).send();
  }
});

// Delete conversation
router.delete('/conversations/:id', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.id });

    if (!conversation) {
      return res.status(404).send();
    }

    if (conversation.deletes.length === 0) {
      conversation.deletes.push(req.user._id);
      conversation.markModified('deletes');
      await conversation.save();

      const messages = await Message.find({
        conversationId: req.params.id
      });

      for (let i = 0; i < messages.length; i++) {
        if (messages[i].deletes.length === 0) {
          messages[i].deletes.addToSet(req.user._id);
          messages[i].markModified('deletes');
          await messages[i].save();
        } else {
          if (messages[i].image) {
            const publicId = getPublicId(messages[i].image);
            await cloudinary.uploader.destroy(publicId);
          }
          await messages[i].remove();
        }
      }
    } else {
      await conversation.remove();
    }

    res.send(conversation);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;