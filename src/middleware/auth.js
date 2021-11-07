const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
  let user = null;

  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const preDecoded = jwt.decode(token);

    if (preDecoded.email_verified) {
      user = await User.findOne({ email: preDecoded.email });
    } else {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = await User.findOne({ _id: decoded._id, 'tokens.token': token });
    }

    if (!user) {
      throw new Error();
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

module.exports = auth;