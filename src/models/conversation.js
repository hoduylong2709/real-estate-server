const mongoose = require('mongoose');
const Message = require('./message');

const conversationSchema = new mongoose.Schema({
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  deletes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: []
    }
  ],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
}, { timestamps: true });

conversationSchema.virtual('messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'conversationId'
});

// Delete messages when conversation is removed
conversationSchema.pre('remove', async function (next) {
  const conversation = this;
  const messages = await Message.find({ conversationId: conversation._id });
  for (let i = 0; i < messages.length; i++) {
    await messages[i].remove();
  }
  next();
});

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;