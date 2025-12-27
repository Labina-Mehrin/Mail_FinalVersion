-- CreateTable
CREATE TABLE "email_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "salesEmails" BOOLEAN NOT NULL DEFAULT true,
    "offerEmails" BOOLEAN NOT NULL DEFAULT true,
    "newProductEmails" BOOLEAN NOT NULL DEFAULT true,
    "orderConfirmation" BOOLEAN NOT NULL DEFAULT true,
    "orderUpdates" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "unsubscribedAll" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_settings" (
    "id" TEXT NOT NULL,
    "emailSystemEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "enableSalesEmails" BOOLEAN NOT NULL DEFAULT true,
    "enableOfferEmails" BOOLEAN NOT NULL DEFAULT true,
    "enableNewProductEmails" BOOLEAN NOT NULL DEFAULT true,
    "enableOrderEmails" BOOLEAN NOT NULL DEFAULT true,
    "fromEmail" TEXT NOT NULL DEFAULT 'noreply@tareqsdrip.com',
    "fromName" TEXT NOT NULL DEFAULT 'TareqsDrip',
    "replyTo" TEXT,
    "maxEmailsPerDay" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "updatedByName" TEXT,

    CONSTRAINT "email_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "templateData" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "discount" INTEGER,
    "imageUrl" TEXT,
    "targetAll" BOOLEAN NOT NULL DEFAULT false,
    "targetUserIds" TEXT[],
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "messageId" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "shippingAddress" JSONB NOT NULL,
    "trackingNumber" TEXT,
    "carrier" TEXT,
    "estimatedDelivery" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "items" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipients" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "unsubscribedAll" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_preferences_userId_key" ON "email_preferences"("userId");

-- CreateIndex
CREATE INDEX "email_logs_userId_idx" ON "email_logs"("userId");

-- CreateIndex
CREATE INDEX "email_logs_campaignId_idx" ON "email_logs"("campaignId");

-- CreateIndex
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");

-- CreateIndex
CREATE INDEX "email_logs_createdAt_idx" ON "email_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_userId_idx" ON "orders"("userId");

-- CreateIndex
CREATE INDEX "orders_orderNumber_idx" ON "orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "recipients_email_key" ON "recipients"("email");

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "email_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
