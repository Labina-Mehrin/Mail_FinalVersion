import nodemailer from 'nodemailer';

if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  throw new Error('SMTP credentials are missing in environment variables');
}

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,          // smtp.gmail.com
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,                        // STARTTLS on 587
  auth: {
    user: process.env.SMTP_USER,        // youraddress@gmail.com
    pass: process.env.SMTP_PASS,        // the App Password
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  tls: { rejectUnauthorized: true },
});

export const emailConfig = {
  from: {
    email: process.env.SMTP_FROM_EMAIL || 'youraddress@gmail.com',
    name: process.env.SMTP_FROM_NAME || 'TareqsDrip',
  },
};

export default transporter;
