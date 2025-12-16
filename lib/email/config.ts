import nodemailer from 'nodemailer';

// Initialize Mailtrap with API token
if (!process.env.MAILTRAP_API_TOKEN) {
  throw new Error('MAILTRAP_API_TOKEN is not defined in environment variables');
}

// Create Mailtrap transporter
export const transporter = nodemailer.createTransport({
  host: 'send.api.mailtrap.io',
  port: 587,
  secure: false, // use TLS
  auth: {
    user: 'api',
    pass: process.env.MAILTRAP_API_TOKEN,
  },
});

export const emailConfig = {
  from: {
    email: process.env.MAILTRAP_FROM_EMAIL || 'hello@demomailtrap.com',
    name: process.env.MAILTRAP_FROM_NAME || 'TareqsDrip',
  },
};

export default transporter;
