const nodeMailer = require('nodemailer');
const { renderMailConfirmationHtml } = require('./renderTemplate');

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

const mailHost = 'smtp.gmail.com';
const mailPort = 587;

const sendMail = (to, username, verifyCode) => {
  const mailConfirmationHtml = renderMailConfirmationHtml(
    verifyCode,
    username
  );

  const transporter = nodeMailer.createTransport({
    host: mailHost,
    port: mailPort,
    secure: false,
    auth: {
      user: adminEmail,
      pass: adminPassword
    }
  });

  const options = {
    from: adminEmail,
    to,
    subject: 'Confirmation Email',
    html: mailConfirmationHtml
  };

  // sendMail() returns a promise
  return transporter.sendMail(options);
};

module.exports = { sendMail };