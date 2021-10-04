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
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;