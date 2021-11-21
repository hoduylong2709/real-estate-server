const express = require('express');
const cloudinary = require('cloudinary').v2;
const User = require('../models/user');
const router = new express.Router();
const { sendMail } = require('../utils/mailer');
const { generateVerifyCode } = require('../utils/generateVerifyCode');
const auth = require('../middleware/auth');

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
    sendMail(user.email, user.firstName, verifyCode);
    res.status(201).send({ user });
  } catch (error) {
    res.status(400).send(error);
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
      return res.status(404).send()
    }

    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

router.delete('/users/me/avatar', auth, async (req, res) => {
  const publicIdCloudinary = req.body.public_id;
  req.user.avatar = undefined;
  req.user.publicIdCloudinary = undefined;
  await req.user.save();
  await cloudinary.uploader.destroy(publicIdCloudinary);
  res.send();
});

module.exports = router;