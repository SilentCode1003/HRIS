const nodemailer = require("nodemailer");
const { Decrypter } = require("./cryptography");
require("dotenv").config();

let password = "";
Decrypter(`${process.env._EMAIL_PASSWORD}`, (err, encryted) => {
  if (err) console.error("Error: ", err);
  console.log(encryted);
  password = encryted;
});

// Create a Nodemailer transporter with custom SMTP settings
const transporter = nodemailer.createTransport({
  host: `${process.env._EMAIL_HOST}`, // Your mail server hostname or IP address
  port: `${process.env._EMAIL_PORT}`, // Your mail server port (587 is the default for secure SMTP)
  secure: false, // Set to true if your server uses SSL/TLS, otherwise false
  auth: {
    user: `${process.env._EMAIL_USER}`,
    pass: password,
  },
});

exports.SendEmail = (to, subject, text) => {
  // Email content

  const mailOptions = {
    from: process.env._EMAIL_FROM,
    to: to,
    subject: subject,
    html: text,
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(`Email Error: `, error);
    } else {
      // console.log(info);
      // console.log("Email sent: " + info.response);
      console.log("Email sent");
    }
  });
};
