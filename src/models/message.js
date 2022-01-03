const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const { getPublicId } = require('../utils/getPublicIdFromUrl');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

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
  },
  deletes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: []
    }
  ]
}, { timestamps: true });

// Delete image at cloudinary when message is removed
messageSchema.pre('remove', async function (next) {
  const message = this;
  if (message.image) {
    const publicId = getPublicId(message.image);
    await cloudinary.uploader.destroy(publicId);
    next();
  }
  next();
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;