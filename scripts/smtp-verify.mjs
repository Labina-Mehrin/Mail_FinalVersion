import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

// Load .env manually (no dotenv dependency)
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, 'utf8');
  raw.split(/\r?\n/).forEach((line) => {
    if (!line || line.trim().startsWith('#')) return;
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) {
      let val = m[2];
      // Strip surrounding quotes if present
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(m[1] in process.env)) {
        process.env[m[1]] = val;
      }
    }
  });
}

const host = process.env.SMTP_HOST || 'smtp.gmail.com';
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: false,
  auth: { user, pass },
});

try {
  const ok = await transporter.verify();
  console.log('Server ready to take our messages');
  console.log('Connection OK');
} catch (err) {
  console.error('SMTP verify failed:', err && err.message ? err.message : err);
  process.exitCode = 1;
}
