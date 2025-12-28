import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getAudienceAll } from '@/lib/audience.any';
import { sendBulkEmails } from '@/lib/email/service';
import { EmailTemplateType } from '@/lib/email/templates';
export const runtime = "nodejs";

/**
 * POST /api/admin/email/campaigns/[id]/send
 * Send a campaign immediately to all recipients (admin only)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: params.id },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.status === 'SENT') {
      return NextResponse.json(
        { error: 'Campaign already sent' },
        { status: 400 }
      );
    }

    // Update status to SENDING
    await prisma.emailCampaign.update({
      where: { id: params.id },
      data: {
        status: 'SENDING',
        sentAt: new Date(),
      },
    });

    // Get all recipients (Clerk + manual)
    const recipients = await getAudienceAll();

    // Helper functions for data formatting
    function nameFrom(rec: { email: string; data?: any }) {
      return rec.data?.firstName || rec.data?.userName || rec.email.split('@')[0];
    }

    function fmt(d?: Date | string | null) {
      if (!d) return undefined;
      const dd = typeof d === 'string' ? new Date(d) : d;
      return dd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // Build template data from campaign
    const campaignData = campaign.templateData as any || {};
    const templateData = {
      // Sales/Special Offer fields
      saleTitle: campaign.name ?? campaignData.saleTitle ?? 'Exclusive Sale',
      saleDescription: campaign.description ?? campaignData.saleDescription ?? 'Fresh drops and limited offers.',
      discountPercentage: campaign.discount ?? campaignData.discountPercentage ?? campaignData.discount ?? 20,
      startDate: fmt(campaign.startDate) ?? fmt(campaignData.startDate) ?? 'Coming Soon',
      endDate: fmt(campaign.endDate) ?? fmt(campaignData.endDate) ?? 'Coming Soon',
      
      // Special Offer fields
      offerTitle: campaign.name ?? campaignData.offerTitle,
      offerDescription: campaign.description ?? campaignData.offerDescription,
      couponCode: campaignData.couponCode,
      expiryDate: fmt(campaign.endDate) ?? fmt(campaignData.expiryDate) ?? fmt(campaignData.endDate),
      
      // New Product fields
      productName: campaignData.productName ?? campaign.name,
      productDescription: campaignData.productDescription ?? campaign.description,
      price: campaignData.price,
      productUrl: campaignData.productUrl,
      
      // Image
      imageUrl: campaign.imageUrl ?? campaignData.imageUrl ?? undefined,
    };

    // Merge per-recipient info with campaign data
    const recipientsWithData = recipients.map(r => ({
      ...r,
      data: {
        ...r.data,
        userName: nameFrom(r),
        ...templateData,
      },
    }));

    // Send bulk emails
    const results = await sendBulkEmails({
      recipients: recipientsWithData,
      subject: campaign.subject,
      templateType: campaign.type as EmailTemplateType,
      campaignId: campaign.id,
    });

    // Update campaign with results
    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        status: 'SENT',
        totalRecipients: results.success + results.failed + results.skipped,
        successCount: results.success,
        failureCount: results.failed,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Campaign sent',
      results,
    });
  } catch (error) {
    // Update campaign status to FAILED
    if (params.id) {
      await prisma.emailCampaign.update({
        where: { id: params.id },
        data: { status: 'FAILED' },
      }).catch(() => {});
    }
    
    return NextResponse.json(
      { error: 'Failed to send campaign' },
      { status: 500 }
    );
  }
}
