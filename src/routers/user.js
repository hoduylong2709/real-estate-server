const express = require('express');
const User = require('../models/user');
const router = new express.Router();
const { sendMail } = require('../utils/mailer');
const { generateVerifyCode } = require('../utils/generateVerifyCode');

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

module.exports = router;