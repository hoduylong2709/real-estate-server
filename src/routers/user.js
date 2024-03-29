const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const router = new express.Router();
const { sendMail } = require('../utils/mailer');
const { generateVerifyCode } = require('../utils/generateVerifyCode');
const auth = require('../middleware/auth');
const { cloudinary } = require('../utils/getCloudinaryConfig');

router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password);
    let token = null;
    if (user.isVerified) {
      token = await user.generateAuthToken();
    }
    res.send({ user, token });
  } catch (error) {
    res.status(400).send();
  }
});

router.post('/users/loginWithGoogle', async (req, res) => {
  const { firstName, lastName, email, userId, idToken, avatar } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user) {
      if (user.isGoogleAccount) {
        user.googleLogin = user.googleLogin.concat({ userId, idToken });
        await user.save();
        res.send({ user, idToken });
      } else {
        throw new Error('Email was used!');
      }
    } else {
      const newUser = new User({
        firstName,
        lastName,
        email,
        isVerified: true,
        isGoogleAccount: true,
        avatar
      });
      newUser.googleLogin = newUser.googleLogin.concat({ userId, idToken });
      await newUser.save();
      res.send({ newUser, idToken });
    }
  } catch (error) {
    res.status(400).send();
  }
});

router.post('/users', async (req, res) => {
  const user = new User(req.body);
  const verifyCode = generateVerifyCode();

  try {
    user.verifyCode = verifyCode;
    await user.save();
    sendMail(user.email, user.firstName, verifyCode, 0);
    res.status(201).send({ user });
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post('/users/forgot-password', async (req, res) => {
  const verifyCode = generateVerifyCode();

  try {
    const user = await User.findOne(req.body);

    if (!user) {
      return res.status(404).send();
    }

    user.verifyCode = verifyCode;
    await user.save();
    sendMail(user.email, user.firstName, verifyCode, 1);
    res.send({ verifyCode: user.verifyCode });
  } catch (error) {
    res.status(400).send(error);
  }

});

router.post('/users/forgot-password/verify', async (req, res) => {
  const { email, verifyCode } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send();
    }

    const isMatch = parseInt(verifyCode) === user.verifyCode;

    if (!isMatch) {
      return res.status(400).send();
    }

    res.send();
  } catch (error) {
    res.status(400).send();
  }
});

router.post('/users/verify/:id', async (req, res) => {
  try {
    const user = await User.verifyUser(req.params.id, req.body.verifyCode);
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (error) {
    res.status(400).send();
  }
});

router.post('/users/logout', auth, async (req, res) => {
  try {
    if (req.user.isGoogleAccount) {
      req.user.googleLogin = req.user.googleLogin.filter(loginData => loginData.idToken !== req.token);
    } else {
      req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
    }
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    if (req.user.isGoogleAccount) {
      req.user.googleLogin = [];
    } else {
      req.user.tokens = [];
    }

    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

router.get('/users/me', auth, async (req, res) => {
  res.send(req.user);
});

router.post('/users/me/avatar', auth, async (req, res) => {
  const imageUrl = req.body.imageUrl;
  const publicIdCloudinary = req.body.publicIdCloudinary;
  try {
    req.user.avatar = imageUrl;
    req.user.publicIdCloudinary = publicIdCloudinary;
    await req.user.save();
    res.send(req.user.avatar);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/users/:id', auth, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });

    if (!user) {
      return res.status(404).send();
    }

    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.delete('/users/me/avatar', auth, async (req, res) => {
  const publicIdCloudinary = req.body.public_id;
  req.user.avatar = undefined;
  req.user.publicIdCloudinary = undefined;
  await req.user.save();
  await cloudinary.uploader.destroy(publicIdCloudinary);
  res.send();
});

router.post('/users/me/favorite', auth, async (req, res) => {
  const listingId = req.body.listingId;

  try {
    req.user.favoriteListings.addToSet(listingId);
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send(error);
  }
});

router.delete('/users/me/favorite/:id', auth, async (req, res) => {
  const listingId = req.params.id;

  try {
    req.user.favoriteListings = req.user.favoriteListings.filter(
      id => id.toString() !== listingId
    );
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get('/users/me/favorite', auth, async (req, res) => {
  try {
    await req.user.populate({
      path: 'favoriteListings',
      populate: 'owner ratings'
    });
    res.send(req.user.favoriteListings);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch('/users/me', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['firstName', 'lastName', 'phoneNumber'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {
    updates.forEach(update => req.user[update] = req.body[update]);
    await req.user.save();
    res.send(req.user);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.patch('/users/me/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const isMatch = await bcrypt.compare(currentPassword, req.user.password);

    if (!isMatch) {
      return res.status(400).send();
    }

    req.user.password = newPassword;
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(400).send();
  }
});

router.patch('/users/change-password', async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send();
    }

    user.password = newPassword;
    await user.save();
    res.send();
  } catch (error) {
    res.status(400).send();
  }
});

module.exports = router;