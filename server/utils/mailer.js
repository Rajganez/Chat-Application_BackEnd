import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail.com",
  auth: {
    user: "rajganez24@gmail.com",
    pass: process.env.MAIL_PASSWORD,
  },
});

const mailOptions = {
  from: "rajganez24@gmail.com",
  to: [],
  subject: "Hi! Buddy Your Password Reset Link",
};

export { mailOptions, transporter }