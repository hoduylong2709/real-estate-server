const crypto = require('crypto');

const generateVerifyCode = () => {
  return crypto.randomInt(10000, 99999);
};

module.exports = { generateVerifyCode };