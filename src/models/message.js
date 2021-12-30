const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Conversation'
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  text: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  video: {
    type: String,
    default: ''
  }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;