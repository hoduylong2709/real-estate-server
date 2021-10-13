const express = require('express');
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
    req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

module.exports = router;