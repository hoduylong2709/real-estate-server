const mongoose = require('mongoose');
const Message = require('./message');

const conversationSchema = new mongoose.Schema({
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
}, { timestamps: true });

conversationSchema.virtual('messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'conversationId'
});

// Delete messages when conversation is removed
conversationSchema.pre('remove', async function (next) {
  const conversation = this;
  await Message.deleteMany({ conversationId: conversation._id });
  next();
});

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;