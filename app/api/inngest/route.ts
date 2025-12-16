import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import {
  sendEmailCampaign,
  sendOrderConfirmation,
  sendOrderShipped,
  sendOrderDelivered,
  sendWelcome,
  syncUserFromClerk,
} from '@/lib/inngest/functions';

// Register all Inngest functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    sendEmailCampaign,
    sendOrderConfirmation,
    sendOrderShipped,
    sendOrderDelivered,
    sendWelcome,
    syncUserFromClerk,
  ],
});
