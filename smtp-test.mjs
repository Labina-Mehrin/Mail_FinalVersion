import 'dotenv/config';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const mailOptions = {
  from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
  to: process.env.SMTP_USER, // send it to yourself first
  subject: 'SMTP Gmail test from Next.js app',
  text: 'This is a plain-text test email sent via Gmail SMTP.',
  html: '<p>This is a <strong>HTML test email</strong> sent via Gmail SMTP.</p>',
};

try {
  const info = await transporter.sendMail(mailOptions);
  console.log('Email sent:', info.messageId);
} catch (err) {
  console.error('Error sending email:', err);
}
