# TareqsDrip - Automated Email System

This implementation provides a complete automated email system for TareqsDrip using SendGrid, with admin control over email features.

## Features Implemented

### 1. Email Types
- **Order Emails**: Confirmation, Shipped, Delivered
- **Marketing Emails**: Sales Announcements, Special Offers, New Products
- **Transactional**: Welcome emails

### 2. Admin Control Panel
- **Global Email Settings** (`/admin/email/settings`)
  - Toggle email types on/off globally
  - Configure sender information
  - Set rate limits
  
- **Campaign Management** (`/admin/email/campaigns`)
  - Create and manage email campaigns
  - Send bulk emails to users
  - Track campaign performance (sent, failed, opened, clicked)

### 3. User Preferences
- **Email Preferences Page** (`/settings/email`)
  - Users can opt in/out of specific email types
  - Marketing emails: Sales, Offers, New Products
  - Order updates: Confirmations, Shipping
  - Unsubscribe from all option

### 4. Background Jobs (Inngest)
- Order confirmation emails
- Order shipped/delivered emails
- Welcome emails for new users
- Bulk campaign sending
- User sync from Clerk

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @sendgrid/mail inngest @neondatabase/serverless @prisma/adapter-neon ws
```

### 2. Environment Variables

Add to your `.env` file:

```env
# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@tareqsdrip.com
SENDGRID_FROM_NAME=TareqsDrip

# Database (Neon PostgreSQL)
DATABASE_URL=your_neon_database_url_here

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Inngest
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
```

### 3. Setup SendGrid

1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create an API key with "Mail Send" permissions
3. Verify your sender email address/domain
4. Add the API key to your `.env` file

### 4. Database Migration

Run Prisma migration to create email tables:

```bash
npx prisma migrate dev --name add_email_system
npx prisma generate
```

### 5. Setup Inngest

1. Sign up at [Inngest](https://www.inngest.com/)
2. Create a new app
3. Get your event key and signing key
4. Add them to your `.env` file
5. Start Inngest dev server:

```bash
npx inngest-cli@latest dev
```

### 6. Trigger Events

#### Send Order Confirmation
```typescript
import { inngest } from '@/lib/inngest/client';

await inngest.send({
  name: 'order/created',
  data: {
    orderId: 'order_123',
    userId: 'user_456',
    email: 'customer@example.com',
  },
});
```

#### Send Welcome Email
```typescript
await inngest.send({
  name: 'user/created',
  data: {
    userId: 'user_123',
    email: 'newuser@example.com',
    firstName: 'John',
  },
});
```

#### Send Email Campaign
```typescript
await inngest.send({
  name: 'email/campaign.send',
  data: {
    campaignId: 'campaign_123',
  },
});
```

## File Structure

```
lib/
├── email/
│   ├── config.ts           # SendGrid configuration
│   ├── templates.tsx       # Email HTML templates
│   └── service.ts          # Email sending logic & preferences
├── inngest/
│   ├── client.ts           # Inngest client
│   └── functions.ts        # Background job functions
└── prisma.ts               # Prisma client with Neon adapter

prisma/
└── schema.prisma           # Database schema with email models

app/
├── api/
│   ├── email/
│   │   └── preferences/    # User email preferences API
│   ├── admin/
│   │   └── email/
│   │       ├── settings/   # Admin email settings API
│   │       └── campaigns/  # Campaign management API
│   └── inngest/
│       └── route.ts        # Inngest webhook endpoint
├── admin/
│   └── email/
│       ├── settings/       # Admin settings page
│       └── campaigns/      # Campaign management page
└── settings/
    └── email/              # User preferences page
```

## Database Models

### EmailPreference
- User-specific email preferences
- Controls what types of emails users receive
- Links to Clerk user ID

### EmailSettings
- Global admin-controlled settings
- Enable/disable email types platform-wide
- Sender configuration

### EmailCampaign
- Bulk email campaigns
- Targeting and scheduling
- Performance tracking

### EmailLog
- Tracks all sent emails
- Status monitoring
- SendGrid message IDs for tracking

## Email Templates

All templates use a consistent design with:
- TareqsDrip branding
- Gradient purple/indigo theme
- Responsive design
- Mobile-friendly
- Unsubscribe links

## Admin Features

Admins can:
1. **Toggle email types globally** - Turn features on/off for all users
2. **Create campaigns** - Send bulk marketing emails
3. **Track performance** - Monitor email delivery and engagement
4. **Configure sender** - Set from email, name, reply-to
5. **Set rate limits** - Control email frequency

## User Features

Users can:
1. **Manage preferences** - Choose which emails to receive
2. **Unsubscribe** - Opt out of marketing emails
3. **Still receive critical emails** - Order updates always delivered

## Integration Points

### Clerk Webhooks
Set up webhooks to trigger `user/created` events for welcome emails.

### Order Processing
Trigger events when:
- Order is created → Send confirmation
- Order is shipped → Send tracking info
- Order is delivered → Request review

### Campaign Sending
Admin dashboard triggers bulk email sending via Inngest for reliability and rate limiting.

## Testing

Test individual emails:
```typescript
import { sendWelcomeEmail } from '@/lib/email/service';

await sendWelcomeEmail('user_123', 'test@example.com', {
  userName: 'Test User',
  firstName: 'Test',
});
```

## Production Considerations

1. **Rate Limiting**: SendGrid has rate limits - the service batches emails
2. **Monitoring**: Check EmailLog table for failed sends
3. **Bounce Handling**: Set up SendGrid webhooks for bounces/spam reports
4. **Unsubscribe**: Implement unsubscribe URL handling
5. **Domain Authentication**: Set up SPF, DKIM, DMARC records
6. **Compliance**: Ensure GDPR/CAN-SPAM compliance

## Next Steps

1. Add email open/click tracking
2. Implement A/B testing for campaigns
3. Add email scheduling for optimal send times
4. Create more template variations
5. Build analytics dashboard for email performance
6. Add webhook handler for SendGrid events
