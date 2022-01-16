const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const { googleLoginSchema } = require('./googleLogin');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error('Email is invalid!');
      }
    }
  },
  phoneNumber: {
    type: Number,
    trim: true,
    default: null
  },
  password: {
    type: String,
    trim: true
  },
  avatar: {
    type: String
  },
  favoriteListings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing'
    }
  ],
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  verifyCode: {
    type: Number
  },
  isGoogleAccount: {
    type: Boolean,
    default: false
  },
  googleLogin: [googleLoginSchema],
  publicIdCloudinary: {
    type: String
  }
}, { timestamps: true });

userSchema.virtual('listings', {
  ref: 'Listing',
  localField: '_id',
  foreignField: 'owner'
});

userSchema.virtual('ratings', {
  ref: 'Rating',
  localField: '_id',
  foreignField: 'owner'
});

userSchema.methods.generateAuthToken = async function () {
  const user = this;

  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
};

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;
  delete userObject.googleLogin;

  return userObject;
};

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error('Unable to login!');
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error('Unable to login');
  }

  return user;
};

userSchema.statics.verifyUser = async (id, verifyCode) => {
  const user = await User.findById(id);

  if (!user) {
    throw new Error('Unable to verify!');
  }

  const isMatch = parseInt(verifyCode) === user.verifyCode;

  if (!isMatch) {
    throw new Error('Unable to verify!');
  }

  user.isVerified = true;
  await user.save();

  return user;
};

// Hash the plain text password before saving
userSchema.pre('save', async function (next) {
  const user = this;

  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;