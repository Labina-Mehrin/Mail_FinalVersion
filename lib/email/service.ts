import crypto from 'crypto';
import transporter from './config';
import { emailConfig } from './config';
import { EmailTemplateType, getEmailTemplate } from './templates';
import { prisma } from '@/lib/prisma';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  templateType: EmailTemplateType;
  userId: string;
  campaignId?: string;
  metadata?: Record<string, any>;
}

export interface BulkEmailOptions {
  recipients: Array<{ email: string; userId: string; data: any }>;
  subject: string;
  templateType: EmailTemplateType;
  campaignId?: string;
}

/**
 * Check if user has opted in for a specific email type
 */
export async function canSendEmail(
  userId: string | null,
  templateType: EmailTemplateType,
  recipientEmail?: string
): Promise<boolean> {
  try {
    // 1) Existing userId-based check (as you already have)
    if (userId) {
      const preferences = await prisma.emailPreference.findUnique({ 
        where: { userId } 
      });
      
      if (preferences) {
        if (preferences.unsubscribedAll) {
          return [
            EmailTemplateType.ORDER_CONFIRMATION,
            EmailTemplateType.ORDER_SHIPPED,
            EmailTemplateType.ORDER_DELIVERED,
          ].includes(templateType);
        }
        
        switch (templateType) {
          case EmailTemplateType.SALES_ANNOUNCEMENT:
            return preferences.salesEmails;
          case EmailTemplateType.SPECIAL_OFFER:
          case EmailTemplateType.PROMOTIONAL:
            return preferences.offerEmails;
          case EmailTemplateType.NEW_PRODUCT:
            return preferences.newProductEmails;
          case EmailTemplateType.ORDER_CONFIRMATION:
          case EmailTemplateType.ORDER_SHIPPED:
          case EmailTemplateType.ORDER_DELIVERED:
            return preferences.orderUpdates;
          case EmailTemplateType.WELCOME:
            return true;
          default:
            return false;
        }
      }
    }

    // 2) Fallback by email for non-Clerk recipients
    if (recipientEmail) {
      const rec = await prisma.recipient.findUnique({
        where: { email: recipientEmail.toLowerCase() },
      });
      
      if (rec?.unsubscribedAll) {
        // Block everything if recipient unsubscribed
        return [
          EmailTemplateType.ORDER_CONFIRMATION,
          EmailTemplateType.ORDER_SHIPPED,
          EmailTemplateType.ORDER_DELIVERED,
        ].includes(templateType);
      }

      // No explicit unsubscribe: allow both transactional and marketing
      switch (templateType) {
        case EmailTemplateType.ORDER_CONFIRMATION:
        case EmailTemplateType.ORDER_SHIPPED:
        case EmailTemplateType.ORDER_DELIVERED:
        case EmailTemplateType.WELCOME:
        case EmailTemplateType.SALES_ANNOUNCEMENT:
        case EmailTemplateType.SPECIAL_OFFER:
        case EmailTemplateType.PROMOTIONAL:
        case EmailTemplateType.NEW_PRODUCT:
          return true;
        default:
          return false;
      }
    }

    // 3) No prefs and no email record — keep your original defaults
    const transactionalTypes = [
      EmailTemplateType.ORDER_CONFIRMATION,
      EmailTemplateType.ORDER_SHIPPED,
      EmailTemplateType.ORDER_DELIVERED,
      EmailTemplateType.WELCOME,
    ];
    return transactionalTypes.includes(templateType);
  } catch (error) {
    return false;
  }
}

/**
 * Check if email type is enabled globally by admin
 */
export async function isEmailTypeEnabled(
  templateType: EmailTemplateType
): Promise<boolean> {
  try {
    // Get latest email settings (there should only be one record)
    const settings = await prisma.emailSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!settings) {
      return true; // Default to enabled if no settings exist
    }

    switch (templateType) {
      case EmailTemplateType.SALES_ANNOUNCEMENT:
        return settings.enableSalesEmails;
      case EmailTemplateType.SPECIAL_OFFER:
      case EmailTemplateType.PROMOTIONAL:
        return settings.enableOfferEmails;
      case EmailTemplateType.NEW_PRODUCT:
        return settings.enableNewProductEmails;
      case EmailTemplateType.ORDER_CONFIRMATION:
      case EmailTemplateType.ORDER_SHIPPED:
      case EmailTemplateType.ORDER_DELIVERED:
        return settings.enableOrderEmails;
      default:
        return true;
    }
  } catch (error) {
    return true; // Default to enabled on error
  }
}

/**
 * Send a single email
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    // Check if email type is enabled globally
    const isEnabled = await isEmailTypeEnabled(options.templateType);
    if (!isEnabled) {
      return false;
    }

    // Check user preferences
    const canSend = await canSendEmail(options.userId, options.templateType, options.to);
    if (!canSend) {
      // Log as skipped
      await prisma.emailLog.create({
        data: {
          userId: options.userId,
          email: options.to,
          type: options.templateType,
          subject: options.subject,
          status: 'SKIPPED',
          campaignId: options.campaignId,
          metadata: { reason: 'User opted out', ...options.metadata },
        },
      });
      
      return false;
    }

    // Plain-text fallback from HTML
    const textFallback = options.html
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Basic anti-spam headers
    const headers: Record<string, string> = {
      "X-Entity-Ref-ID": crypto.randomUUID(),
      "X-Mailer": "Next.js-Mailer",
    };

    // Add List-Unsubscribe for marketing templates
    const marketingTypes = [
      EmailTemplateType.SALES_ANNOUNCEMENT,
      EmailTemplateType.SPECIAL_OFFER,
      EmailTemplateType.PROMOTIONAL,
      EmailTemplateType.NEW_PRODUCT,
    ];

    if (marketingTypes.includes(options.templateType)) {
      const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/email/unsubscribe?u=${options.userId}`;
      headers["List-Unsubscribe"] = `<${unsubscribeUrl}>, <mailto:unsubscribe@${emailConfig.from.email.split("@")[1]}>`;
      headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
    }

    const mailOptions = {
      from: `${emailConfig.from.name} <${emailConfig.from.email}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: textFallback,
      headers,
    };

    const info = await transporter.sendMail(mailOptions);

    // Log successful send
    await prisma.emailLog.create({
      data: {
        userId: options.userId,
        email: options.to,
        type: options.templateType,
        subject: options.subject,
        status: 'SENT',
        messageId: info.messageId,
        sentAt: new Date(),
        campaignId: options.campaignId,
        metadata: options.metadata,
      },
    });

    return true;
  } catch (error: any) {
    // Log failed send
    await prisma.emailLog.create({
      data: {
        userId: options.userId,
        email: options.to,
        type: options.templateType,
        subject: options.subject,
        status: 'FAILED',
        error: error.message || 'Unknown error',
        campaignId: options.campaignId,
        metadata: options.metadata,
      },
    });

    return false;
  }
}

/**
 * Send bulk emails (e.g., for campaigns)
 */
export async function sendBulkEmails(options: BulkEmailOptions): Promise<{
  success: number;
  failed: number;
  skipped: number;
}> {
  let success = 0;
  let failed = 0;
  let skipped = 0;

  // Check if email type is enabled globally
  const isEnabled = await isEmailTypeEnabled(options.templateType);
  if (!isEnabled) {
    return { success: 0, failed: 0, skipped: options.recipients.length };
  }

  // Process emails in batches to avoid overwhelming SendGrid
  const BATCH_SIZE = 100;
  
  for (let i = 0; i < options.recipients.length; i += BATCH_SIZE) {
    const batch = options.recipients.slice(i, i + BATCH_SIZE);
    
    // Process batch
    const results = await Promise.allSettled(
      batch.map(async (recipient) => {
        const html = getEmailTemplate(options.templateType, recipient.data);
        
        return sendEmail({
          to: recipient.email,
          subject: options.subject,
          html,
          templateType: options.templateType,
          userId: recipient.userId,
          campaignId: options.campaignId,
        });
      })
    );

    // Count results
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        if (result.value) {
          success++;
        } else {
          skipped++;
        }
      } else {
        failed++;
      }
    });

    // Add delay between batches to respect rate limits
    if (i + BATCH_SIZE < options.recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return { success, failed, skipped };
}

/**
 * Helper function to send order confirmation email
 */
export async function sendOrderConfirmationEmail(
  userId: string,
  email: string,
  orderData: any
) {
  const html = getEmailTemplate(EmailTemplateType.ORDER_CONFIRMATION, orderData);
  
  return sendEmail({
    to: email,
    subject: `Order Confirmed - #${orderData.orderNumber}`,
    html,
    templateType: EmailTemplateType.ORDER_CONFIRMATION,
    userId,
    metadata: { orderNumber: orderData.orderNumber },
  });
}

/**
 * Helper function to send order shipped email
 */
export async function sendOrderShippedEmail(
  userId: string,
  email: string,
  orderData: any
) {
  const html = getEmailTemplate(EmailTemplateType.ORDER_SHIPPED, orderData);
  
  return sendEmail({
    to: email,
    subject: `Your Order Has Shipped - #${orderData.orderNumber}`,
    html,
    templateType: EmailTemplateType.ORDER_SHIPPED,
    userId,
    metadata: { orderNumber: orderData.orderNumber, trackingNumber: orderData.trackingNumber },
  });
}

/**
 * Helper function to send order delivered email
 */
export async function sendOrderDeliveredEmail(
  userId: string,
  email: string,
  orderData: any
) {
  const html = getEmailTemplate(EmailTemplateType.ORDER_DELIVERED, orderData);
  
  return sendEmail({
    to: email,
    subject: `Your Order Has Been Delivered - #${orderData.orderNumber}`,
    html,
    templateType: EmailTemplateType.ORDER_DELIVERED,
    userId,
    metadata: { orderNumber: orderData.orderNumber },
  });
}

/**
 * Helper function to send welcome email
 */
export async function sendWelcomeEmail(
  userId: string,
  email: string,
  userData: { userName: string; firstName: string }
) {
  const html = getEmailTemplate(EmailTemplateType.WELCOME, userData);
  
  return sendEmail({
    to: email,
    subject: 'Welcome to TareqsDrip - Your Fashion Journey Begins!',
    html,
    templateType: EmailTemplateType.WELCOME,
    userId,
  });
}
