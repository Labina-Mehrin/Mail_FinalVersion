import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { EmailTemplateType } from '@/lib/email/templates';
export const runtime = "nodejs";

/**
 * GET /api/admin/email/campaigns
 * Get all email campaigns (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [campaigns, total] = await Promise.all([
      prisma.emailCampaign.findMany({
        where,
        include: {
          _count: {
            select: { logs: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.emailCampaign.count({ where }),
    ]);

    return NextResponse.json({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/email/campaigns
 * Create a new email campaign (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check

    const body = await req.json();
    const {
      name,
      description,
      type,
      subject,
      templateData,
      scheduledAt,
      targetAll,
      targetUserIds,
      startDate,
      endDate,
      discount,
      imageUrl,
    } = body;

    // Validate template type
    if (!Object.values(EmailTemplateType).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid email template type' },
        { status: 400 }
      );
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        name,
        description,
        type,
        subject,
        templateData,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        discount: discount ?? null,
        imageUrl: imageUrl ?? null,
        targetAll,
        targetUserIds: targetUserIds || [],
        createdBy: userId,
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
