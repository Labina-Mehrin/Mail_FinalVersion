# Setup Guide: New Device / New Email Setup

## Prerequisites
- Node.js 18+ installed
- Git installed
- Gmail account (or other SMTP provider)
- PostgreSQL database (Neon, Railway, or local)

## Step 1: Clone & Install

```bash
git clone <your-repo-url>
cd Mail
npm install
```

## Step 2: Gmail SMTP Setup (New Email)

### If using Gmail:

1. **Enable 2-Factor Authentication:**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password

3. **Save these credentials:**
   - Email: `yournewemail@gmail.com`
   - App Password: `xxxx xxxx xxxx xxxx`

### Alternative SMTP Providers:
- **SendGrid**: Use API key as password
- **Mailgun**: Use SMTP credentials from dashboard
- **Custom SMTP**: Get host, port, username, password from provider

## Step 3: Environment Variables

1. **Create `.env` file** (copy from .env.example):

```bash
cp .env.example .env
```

2. **Edit `.env` and fill in ALL values:**

```env
# ===== SMTP Configuration (Your New Email) =====
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yournewemail@gmail.com
SMTP_PASS=your_16_char_app_password
SMTP_FROM_EMAIL=yournewemail@gmail.com
SMTP_FROM_NAME=YourAppName

# ===== Database (PostgreSQL) =====
# Get from: https://console.neon.tech or your DB provider
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require

# ===== Clerk Authentication =====
# Create project at: https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# ===== App URL =====
# Development
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Production (update when deployed)
# NEXT_PUBLIC_APP_URL=https://yourdomain.com

# ===== Inngest (Background Jobs) =====
# Local dev - use test keys
INNGEST_EVENT_KEY=test_event_key_local_dev
INNGEST_SIGNING_KEY=test_signing_key_local_dev
# Production - get from: https://app.inngest.com
# INNGEST_EVENT_KEY=your_prod_event_key
# INNGEST_SIGNING_KEY=your_prod_signing_key
```

## Step 4: Database Setup

```bash
# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate

# (Optional) Open Prisma Studio to verify
npx prisma studio
```

## Step 5: Add Test Recipients

```bash
# Create a script or use Prisma Studio to add recipients
node scripts/add-recipients.mjs
```

Or manually add via API:

```bash
# Start dev server first
npm run dev

# Then in another terminal:
curl -X POST http://localhost:3000/api/recipients \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","firstName":"Test","lastName":"User"}'
```

## Step 6: Test SMTP Connection

```bash
# Verify Gmail SMTP works
node smtp-test.mjs
```

Expected output:
```
Email sent: <message-id>
```

Check your Gmail inbox for the test email.

## Step 7: Start Development

```bash
npm run dev
```

Visit http://localhost:3000

## Step 8: Production DNS Setup (Optional but Recommended)

### For Production Email Deliverability:

1. **SPF Record** (authorizes your domain to send via Gmail/SMTP):
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:_spf.google.com ~all
   ```

2. **DKIM** (signs your emails):
   - Go to Google Admin Console (if using Google Workspace)
   - Or use your SMTP provider's DKIM setup
   - Add the CNAME record they provide

3. **DMARC** (tells servers what to do with failed auth):
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
   ```

## Common Issues & Fixes

### "Authentication failed" SMTP error:
- ✓ Verify 2FA is enabled on Gmail
- ✓ Use App Password, not your Gmail password
- ✓ Check SMTP_USER matches the Gmail account
- ✓ Remove spaces from App Password in .env

### "Database connection failed":
- ✓ Verify DATABASE_URL is correct
- ✓ Check database is accessible from your IP
- ✓ For Neon: ensure connection string includes `?sslmode=require`

### "Clerk authentication error":
- ✓ Verify CLERK_SECRET_KEY starts with `sk_`
- ✓ Check NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY starts with `pk_`
- ✓ Ensure keys match your Clerk project

### TypeScript errors for `prisma.recipient`:
- ✓ Run `npx prisma generate` again
- ✓ Restart VS Code
- ✓ Code will run fine despite editor errors

### Emails go to spam:
- ✓ Set up SPF/DKIM/DMARC records
- ✓ Start with small send volumes
- ✓ Warm up your domain (gradually increase volume)
- ✓ Ensure unsubscribe headers are present

## Quick Start Checklist

- [ ] Node.js 18+ installed
- [ ] Repository cloned
- [ ] `npm install` completed
- [ ] Gmail 2FA enabled
- [ ] Gmail App Password generated
- [ ] `.env` file created and filled
- [ ] Database created (Neon/Railway/etc)
- [ ] `npx prisma db push` completed
- [ ] `npx prisma generate` completed
- [ ] Test SMTP: `node smtp-test.mjs` ✓
- [ ] Dev server running: `npm run dev`
- [ ] Test recipients added
- [ ] Campaign sent and received ✓

## File Structure Reference

```
.env                    # Your environment variables (NEVER commit!)
smtp-test.mjs          # Test SMTP connection
lib/
  email/
    config.ts          # SMTP transporter config
    service.ts         # Email sending logic
    templates.tsx      # Email HTML templates
  audience.any.ts      # Recipient fetching (Clerk + manual)
app/
  api/
    recipients/        # Add/import recipients
    admin/email/
      campaigns/       # Campaign management
prisma/
  schema.prisma        # Database schema
scripts/
  add-recipients.mjs   # Bulk add recipients
```

## Support & Debugging

If emails aren't sending:
1. Check `npm run dev` console for errors
2. Review email logs in Prisma Studio
3. Verify SMTP credentials with `node smtp-test.mjs`
4. Check Gmail "Sent" folder
5. Review recipient spam folders

For TypeScript errors that don't affect runtime:
- These are usually language server cache issues
- Restart VS Code
- Code will execute correctly despite red squiggles
