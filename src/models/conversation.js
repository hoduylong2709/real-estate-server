const mongoose = require('mongoose');

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

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;