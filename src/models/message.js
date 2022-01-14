const mongoose = require('mongoose');
const { getPublicId } = require('../utils/getPublicIdFromUrl');
const { cloudinary } = require('../utils/getCloudinaryConfig');

const messageSchema = new mongoose.Schema({
  clientId: {
    type: String,
    required: true
  },
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
  ],
  isRead: {
    type: Boolean,
    default: false
  }
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