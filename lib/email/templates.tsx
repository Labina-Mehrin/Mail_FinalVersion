import React from 'react';

// Email template types
export enum EmailTemplateType {
  ORDER_CONFIRMATION = 'ORDER_CONFIRMATION',
  ORDER_SHIPPED = 'ORDER_SHIPPED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  SALES_ANNOUNCEMENT = 'SALES_ANNOUNCEMENT',
  SPECIAL_OFFER = 'SPECIAL_OFFER',
  NEW_PRODUCT = 'NEW_PRODUCT',
  PROMOTIONAL = 'PROMOTIONAL',
  WELCOME = 'WELCOME',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

interface EmailTemplateData {
  userName: string;
  [key: string]: any;
}

// Base email wrapper with TareqsDrip branding
const EmailWrapper = ({ children, previewText }: { children: React.ReactNode; previewText: string }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TareqsDrip</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      color: #ffffff;
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .content {
      padding: 40px 30px;
      color: #333333;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      margin: 20px 0;
      font-weight: 600;
    }
    .footer {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      color: #6c757d;
      font-size: 14px;
    }
    .preview {
      display: none;
      max-height: 0px;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <div class="preview">${previewText}</div>
  <div class="container">
    <div class="header">
      <div class="logo">TareqsDrip</div>
    </div>
    <div class="content">
      ${children}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TareqsDrip - Futuristic Fashion</p>
      <p>You're receiving this because you have an account with us.</p>
      <p><a href="{{unsubscribe_url}}" style="color: #667eea;">Manage email preferences</a></p>
    </div>
  </div>
</body>
</html>
`;

// Order Confirmation Email
export const orderConfirmationTemplate = (data: {
  userName?: string;
  orderNumber?: string;
  orderTotal?: string;
  items?: Array<{ name: string; quantity: number; price: string }>;
  shippingAddress?: string;
  estimatedDelivery?: string;
  imageUrl?: string;
}) => {
  const userName = data.userName ?? 'there';
  const orderNumber = data.orderNumber ?? '—';
  const orderTotal = data.orderTotal ?? '$0.00';
  const items = data.items ?? [];
  const shippingAddress = data.shippingAddress ?? 'Address on file';
  const estimatedDelivery = data.estimatedDelivery ?? 'TBD';
  const img = data.imageUrl;

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e9ecef;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e9ecef; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e9ecef; text-align: right;">${item.price}</td>
    </tr>
  `).join('');

  return EmailWrapper({
    previewText: `Order ${orderNumber} confirmed - Thank you for your purchase!`,
    children: `
      
      
      <h1 style="color: #667eea; margin-bottom: 10px;">Order Confirmed! 🎉</h1>
      <p>Hi ${userName},</p>
      <p>Thank you for your order! We've received your purchase and are getting it ready.</p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order #${orderNumber}</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #e9ecef;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 15px 10px; font-weight: bold;">Total</td>
              <td style="padding: 15px 10px; text-align: right; font-weight: bold; color: #667eea;">${orderTotal}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p><strong>Shipping Address:</strong><br>${shippingAddress}</p>
      <p><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>

      <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderNumber}" class="button">Track Your Order</a>

      <p>If you have any questions, feel free to contact our support team.</p>
    `
  });
};

// Order Shipped Email
export const orderShippedTemplate = (data: {
  userName?: string;
  orderNumber?: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  imageUrl?: string;
}) => {
  const userName = data.userName ?? 'there';
  const orderNumber = data.orderNumber ?? '—';
  const trackingNumber = data.trackingNumber ?? '—';
  const carrier = data.carrier ?? 'Carrier';
  const estimatedDelivery = data.estimatedDelivery ?? 'TBD';
  const img = data.imageUrl;

  return EmailWrapper({
    previewText: `Your order ${orderNumber} has shipped!`,
    children: `
      
      
      <h1 style="color: #667eea; margin-bottom: 10px;">Your Order is on the Way! 🚚</h1>
      <p>Hi ${userName},</p>
      <p>Great news! Your order has been shipped and is heading your way.</p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Order Number:</strong> #${orderNumber}</p>
        <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
        <p><strong>Carrier:</strong> ${carrier}</p>
        <p><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>
      </div>

      <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderNumber}" class="button">Track Shipment</a>

      <p>You'll receive another email once your package is delivered.</p>
    `
  });
};

// Order Delivered Email
export const orderDeliveredTemplate = (data: {
  userName?: string;
  orderNumber?: string;
  deliveryDate?: string;
  imageUrl?: string;
}) => {
  const userName = data.userName ?? 'there';
  const orderNumber = data.orderNumber ?? '—';
  const deliveryDate = data.deliveryDate ?? 'today';
  const img = data.imageUrl;

  return EmailWrapper({
    previewText: `Your order ${orderNumber} has been delivered!`,
    children: `
      
      
      <h1 style="color: #667eea; margin-bottom: 10px;">Your Order Has Arrived! 📦</h1>
      <p>Hi ${userName},</p>
      <p>Your order has been successfully delivered on ${deliveryDate}.</p>
      
      <p>We hope you love your new items! If you have a moment, we'd appreciate it if you could leave a review.</p>

      <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderNumber}/review" class="button">Leave a Review</a>

      <p>If there are any issues with your order, please contact us immediately.</p>
    `
  });
};

// Sales Announcement Email
export const salesAnnouncementTemplate = (data: {
  userName?: string;
  saleTitle?: string;
  saleDescription?: string;
  discountPercentage?: number;
  startDate?: string;
  endDate?: string;
  imageUrl?: string;
}) => {
  const userName = data.userName ?? 'there';
  const saleTitle = data.saleTitle ?? 'Big Sale';
  const saleDescription = data.saleDescription ?? 'Don\'t miss our latest offers.';
  const discount = data.discountPercentage ?? 10;
  const start = data.startDate ?? 'TBD';
  const end = data.endDate ?? 'TBD';
  const img = data.imageUrl;

  return EmailWrapper({
    previewText: `${saleTitle} - Up to ${discount}% off!`,
    children: `
      <h1 style="color: #667eea; margin-bottom: 10px;">🔥 ${saleTitle}</h1>
      <p>Hi ${userName},</p>
      
      ${img ? `<img src="${img}" alt="${saleTitle}" style="width: 100%; max-width: 540px; border-radius: 8px; margin: 20px 0;" />` : ''}
      
      <p style="font-size: 18px; font-weight: 600; color: #667eea;">Save up to ${discount}% on futuristic fashion!</p>
      
      <p>${saleDescription}</p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Sale Period:</strong> ${start} - ${end}</p>
      </div>

      <a href="${process.env.NEXT_PUBLIC_APP_URL}/sales" class="button">Shop Now</a>

      <p>Don't miss out on these incredible deals. Limited time only!</p>
    `
  });
};

// Special Offer Email
export const specialOfferTemplate = (data: {
  userName?: string;
  offerTitle?: string;
  offerDescription?: string;
  couponCode?: string;
  expiryDate?: string;
  imageUrl?: string;
}) => {
  const userName = data.userName ?? 'there';
  const offerTitle = data.offerTitle ?? 'Special Offer';
  const offerDescription = data.offerDescription ?? 'Check out this exclusive deal!';
  const expiryDate = data.expiryDate ?? 'Limited time';
  const img = data.imageUrl;

  return EmailWrapper({
    previewText: `Exclusive offer just for you: ${offerTitle}`,
    children: `
      <h1 style="color: #667eea; margin-bottom: 10px;">✨ Exclusive Offer for You!</h1>
      <p>Hi ${userName},</p>
      
      ${img ? `<img src="${img}" alt="${offerTitle}" style="width: 100%; max-width: 540px; border-radius: 8px; margin: 20px 0;" />` : ''}
      
      <h2 style="color: #333;">${offerTitle}</h2>
      <p>${offerDescription}</p>
      
      ${data.couponCode ? `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="color: white; margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Use Coupon Code</p>
          <p style="color: white; margin: 10px 0 0 0; font-size: 28px; font-weight: bold; letter-spacing: 2px;">${data.couponCode}</p>
        </div>
      ` : ''}
      
      <p><strong>Offer expires:</strong> ${expiryDate}</p>

      <a href="${process.env.NEXT_PUBLIC_APP_URL}/shop" class="button">Start Shopping</a>

      <p>This is a limited-time exclusive offer. Act fast!</p>
    `
  });
};

// New Product Launch Email
export const newProductTemplate = (data: {
  userName?: string;
  productName?: string;
  productDescription?: string;
  price?: string;
  productUrl?: string;
  imageUrl?: string;
}) => {
  const userName = data.userName ?? 'there';
  const productName = data.productName ?? 'New Product';
  const productDescription = data.productDescription ?? 'Check out our latest arrival!';
  const price = data.price ?? 'See pricing';
  const productUrl = data.productUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/shop`;
  const img = data.imageUrl;

  return EmailWrapper({
    previewText: `New arrival: ${productName} is here!`,
    children: `
      <h1 style="color: #667eea; margin-bottom: 10px;">🚀 New Arrival!</h1>
      <p>Hi ${userName},</p>
      
      <p>Check out the latest addition to our futuristic fashion collection:</p>
      
      ${img ? `<img src="${img}" alt="${productName}" style="width: 100%; max-width: 540px; border-radius: 8px; margin: 20px 0;" />` : ''}
      
      <h2 style="color: #333;">${productName}</h2>
      <p>${productDescription}</p>
      
      <p style="font-size: 24px; font-weight: bold; color: #667eea; margin: 20px 0;">${price}</p>

      <a href="${productUrl}" class="button">View Product</a>

      <p>Be among the first to own this exclusive piece!</p>
    `
  });
};

// Welcome Email
export const welcomeTemplate = (data: {
  userName?: string;
  firstName?: string;
  imageUrl?: string;
}) => {
  const firstName = data.firstName ?? data.userName ?? 'there';
  const img = data.imageUrl;
  return EmailWrapper({
    previewText: `Welcome to TareqsDrip, ${firstName}!`,
    children: `
      <h1 style="color: #667eea; margin-bottom: 10px;">Welcome to TareqsDrip! 🎉</h1>
      
      
      
      <p>Hi ${firstName},</p>
      
      <p>We're thrilled to have you join our community of futuristic fashion enthusiasts!</p>
      
      <p>At TareqsDrip, we're redefining fashion with cutting-edge designs from top vendors around the world. Get ready to explore:</p>
      
      <ul style="line-height: 2;">
        <li>Exclusive futuristic fashion collections</li>
        <li>Limited edition drops from verified vendors</li>
        <li>Special member-only offers and sales</li>
        <li>Fast and reliable shipping</li>
      </ul>

      <a href="${process.env.NEXT_PUBLIC_APP_URL}/shop" class="button">Start Shopping</a>

      <p>Follow us on social media to stay updated on the latest trends and exclusive releases!</p>
      
      <p>Welcome aboard,<br>The TareqsDrip Team</p>
    `
  });
};

// Template factory function
export const getEmailTemplate = (type: EmailTemplateType, data: any): string => {
  switch (type) {
    case EmailTemplateType.ORDER_CONFIRMATION:
      return orderConfirmationTemplate(data);
    case EmailTemplateType.ORDER_SHIPPED:
      return orderShippedTemplate(data);
    case EmailTemplateType.ORDER_DELIVERED:
      return orderDeliveredTemplate(data);
    case EmailTemplateType.SALES_ANNOUNCEMENT:
      return salesAnnouncementTemplate(data);
    case EmailTemplateType.SPECIAL_OFFER:
      return specialOfferTemplate(data);
    case EmailTemplateType.NEW_PRODUCT:
      return newProductTemplate(data);
    case EmailTemplateType.WELCOME:
      return welcomeTemplate(data);
    default:
      throw new Error(`Unknown email template type: ${type}`);
  }
};
