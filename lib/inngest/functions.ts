import { inngest } from './client';
import { prisma } from '@/lib/prisma';
import {
  sendBulkEmails,
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendWelcomeEmail,
} from '@/lib/email/service';
import { getEmailTemplate, EmailTemplateType } from '@/lib/email/templates';
import { clerkClient } from '@clerk/nextjs/server';

/**
 * Send Email Campaign
 * Triggered when an admin sends a campaign
 */
export const sendEmailCampaign = inngest.createFunction(
  { id: 'email-campaign-send', name: 'Send Email Campaign' },
  { event: 'email/campaign.send' },
  async ({ event, step }) => {
    const { campaignId } = event.data;

    // Get campaign details
    const campaign = await step.run('fetch-campaign', async () => {
      return prisma.emailCampaign.findUnique({
        where: { id: campaignId },
      });
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Get recipients
    const recipients = await step.run('fetch-recipients', async () => {
      if (campaign.targetAll) {
        // Get all users with email preferences
        const preferences = await prisma.emailPreference.findMany({
          where: {
            unsubscribedAll: false,
          },
        });

        // Fetch user emails from Clerk
        const userIds = preferences.map((p: any) => p.userId);
        const users = await Promise.all(
          userIds.map(async (userId: string) => {
            try {
              const user = await clerkClient.users.getUser(userId);
              return {
                userId,
                email: user.emailAddresses[0]?.emailAddress,
                data: {
                  ...campaign.templateData,
                  userName:
                    user.firstName || user.username || user.emailAddresses[0]?.emailAddress,
                },
              };
            } catch (error) {
              return null;
            }
          }))
        );

        return users.filter((u: any) => u !== null && u.email);ail);
      } else {
        // Get specific users
        const users = await Promise.all(
          campaign.targetUserIds.map(async (userId: string) => {
            try {
              const user = await clerkClient.users.getUser(userId);
              return {
                userId,
                email: user.emailAddresses[0]?.emailAddress,
                data: {
                  ...campaign.templateData,
                  userName:
                    user.firstName || user.username || user.emailAddresses[0]?.emailAddress,
                },
              };
            } catch (error) {
              return null;
            }
          })
        );

        return users.filter((u) => u !== null && u.email);
      }
    });

    // Send emails in batches
    const result = await step.run('send-emails', async () => {
      return sendBulkEmails({
        recipients: recipients as any[],
        subject: campaign.subject,
        templateType: campaign.type as EmailTemplateType,
        campaignId: campaign.id,
      });
    });

    // Update campaign status
    await step.run('update-campaign', async () => {
      return prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          totalRecipients: recipients.length,
          successCount: result.success,
          failureCount: result.failed,
        },
      });
    });

    return {
      campaignId,
      totalRecipients: recipients.length,
      success: result.success,
      failed: result.failed,
      skipped: result.skipped,
    };
  }
);

/**
 * Send Order Confirmation Email
 * Triggered when an order is created
 */
export const sendOrderConfirmation = inngest.createFunction(
  { id: 'order-confirmation-email', name: 'Send Order Confirmation Email' },
  { event: 'order/created' },
  async ({ event, step }) => {
    const { orderId, userId, email } = event.data;

    // Fetch order details
    const order = await step.run('fetch-order', async () => {
      return prisma.order.findUnique({
        where: { id: orderId },
      });
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Get user details from Clerk
    const user = await step.run('fetch-user', async () => {
      return clerkClient.users.getUser(userId);
    });

    // Send email
    await step.run('send-email', async () => {
      return sendOrderConfirmationEmail(userId, email, {
        userName: user.firstName || user.username || email,
        orderNumber: order.orderNumber,
        orderTotal: `$${order.total}`,
        items: (order.items as any[]) || [],
        shippingAddress: JSON.stringify(order.shippingAddress),
        estimatedDelivery: order.estimatedDelivery?.toLocaleDateString() || 'TBD',
      });
    });

    return { orderId, email, sent: true };
  }
);

/**
 * Send Order Shipped Email
 * Triggered when an order is shipped
 */
export const sendOrderShipped = inngest.createFunction(
  { id: 'order-shipped-email', name: 'Send Order Shipped Email' },
  { event: 'order/shipped' },
  async ({ event, step }) => {
    const { orderId, userId, email } = event.data;

    const order = await step.run('fetch-order', async () => {
      return prisma.order.findUnique({
        where: { id: orderId },
      });
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const user = await step.run('fetch-user', async () => {
      return clerkClient.users.getUser(userId);
    });

    await step.run('send-email', async () => {
      return sendOrderShippedEmail(userId, email, {
        userName: user.firstName || user.username || email,
        orderNumber: order.orderNumber,
        trackingNumber: order.trackingNumber || 'N/A',
        carrier: order.carrier || 'N/A',
        estimatedDelivery: order.estimatedDelivery?.toLocaleDateString() || 'TBD',
      });
    });

    return { orderId, email, sent: true };
  }
);

/**
 * Send Order Delivered Email
 * Triggered when an order is delivered
 */
export const sendOrderDelivered = inngest.createFunction(
  { id: 'order-delivered-email', name: 'Send Order Delivered Email' },
  { event: 'order/delivered' },
  async ({ event, step }) => {
    const { orderId, userId, email } = event.data;

    const order = await step.run('fetch-order', async () => {
      return prisma.order.findUnique({
        where: { id: orderId },
      });
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const user = await step.run('fetch-user', async () => {
      return clerkClient.users.getUser(userId);
    });

    await step.run('send-email', async () => {
      return sendOrderDeliveredEmail(userId, email, {
        userName: user.firstName || user.username || email,
        orderNumber: order.orderNumber,
        deliveryDate: order.deliveredAt?.toLocaleDateString() || new Date().toLocaleDateString(),
      });
    });

    return { orderId, email, sent: true };
  }
);

/**
 * Send Welcome Email
 * Triggered when a new user signs up via Clerk webhook
 */
export const sendWelcome = inngest.createFunction(
  { id: 'welcome-email', name: 'Send Welcome Email' },
  { event: 'user/created' },
  async ({ event, step }) => {
    const { userId, email, firstName } = event.data;

    await step.run('send-email', async () => {
      return sendWelcomeEmail(userId, email, {
        userName: firstName || email,
        firstName: firstName || 'there',
      });
    });

    return { userId, email, sent: true };
  }
);

/**
 * Sync User from Clerk
 * Create email preferences when user signs up
 */
export const syncUserFromClerk = inngest.createFunction(
  { id: 'sync-user-from-clerk', name: 'Sync User from Clerk' },
  { event: 'user/created' },
  async ({ event, step }) => {
    const { userId, email } = event.data;

    await step.run('create-email-preferences', async () => {
      return prisma.emailPreference.upsert({
        where: { userId },
        create: {
          userId,
          salesEmails: true,
          offerEmails: true,
          newProductEmails: true,
          orderConfirmation: true,
          orderUpdates: true,
          emailVerified: true,
          unsubscribedAll: false,
        },
        update: {},
      });
    });

    return { userId, email, synced: true };
  }
);
