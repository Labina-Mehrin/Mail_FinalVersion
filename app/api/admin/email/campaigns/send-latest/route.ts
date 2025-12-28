import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAudienceAll } from '@/lib/audience.any';
import { sendBulkEmails } from '@/lib/email/service';
import { EmailTemplateType } from '@/lib/email/templates';

export async function POST() {
  try {
    const campaign = await prisma.emailCampaign.findFirst({
      orderBy: { createdAt: 'desc' },
      where: { status: { in: ['DRAFT', 'SCHEDULED'] } },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'No draft campaign found' }, { status: 404 });
    }

    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: { status: 'SENDING', sentAt: new Date() },
    });

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
    const camp = campaign as any; // Type assertion for new fields
    const templateData = {
      // Sales/Special Offer fields
      saleTitle: campaign.name ?? campaignData.saleTitle ?? 'Exclusive Sale',
      saleDescription: campaign.description ?? campaignData.saleDescription ?? 'Fresh drops and limited offers.',
      discountPercentage: camp.discount ?? campaignData.discountPercentage ?? campaignData.discount ?? 20,
      startDate: fmt(camp.startDate) ?? fmt(campaignData.startDate) ?? 'Coming Soon',
      endDate: fmt(camp.endDate) ?? fmt(campaignData.endDate) ?? 'Coming Soon',
      
      // Special Offer fields
      offerTitle: campaign.name ?? campaignData.offerTitle,
      offerDescription: campaign.description ?? campaignData.offerDescription,
      couponCode: campaignData.couponCode,
      expiryDate: fmt(camp.endDate) ?? fmt(campaignData.expiryDate) ?? fmt(campaignData.endDate),
      
      // New Product fields
      productName: campaignData.productName ?? campaign.name,
      productDescription: campaignData.productDescription ?? campaign.description,
      price: campaignData.price,
      productUrl: campaignData.productUrl,
      
      // Image
      imageUrl: camp.imageUrl ?? campaignData.imageUrl ?? undefined,
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

    const results = await sendBulkEmails({
      recipients: recipientsWithData,
      subject: campaign.subject,
      templateType: campaign.type as EmailTemplateType,
      campaignId: campaign.id,
    });

    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        status: 'SENT',
        templateData: { ...(campaign.templateData as any), results },
      },
    });

    return NextResponse.json({ ok: true, results, campaignId: campaign.id });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send campaign' },
      { status: 500 }
    );
  }
}
