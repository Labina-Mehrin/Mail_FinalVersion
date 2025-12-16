import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/email/settings
 * Get global email settings (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check here
    // const user = await clerkClient.users.getUser(userId);
    // if (!user.publicMetadata?.role === 'admin') {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    let settings = await prisma.emailSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = await prisma.emailSettings.create({
        data: {
          enableSalesEmails: true,
          enableOfferEmails: true,
          enableNewProductEmails: true,
          enableOrderEmails: true,
          fromEmail: 'noreply@tareqsdrip.com',
          fromName: 'TareqsDrip',
          maxEmailsPerDay: 5,
          updatedBy: userId,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching email settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/email/settings
 * Update global email settings (admin only)
 */
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check here

    const body = await req.json();
    const {
      enableSalesEmails,
      enableOfferEmails,
      enableNewProductEmails,
      enableOrderEmails,
      fromEmail,
      fromName,
      replyTo,
      maxEmailsPerDay,
    } = body;

    // Get current settings or create new
    const currentSettings = await prisma.emailSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    let settings;
    if (currentSettings) {
      settings = await prisma.emailSettings.update({
        where: { id: currentSettings.id },
        data: {
          enableSalesEmails,
          enableOfferEmails,
          enableNewProductEmails,
          enableOrderEmails,
          fromEmail,
          fromName,
          replyTo,
          maxEmailsPerDay,
          updatedBy: userId,
        },
      });
    } else {
      settings = await prisma.emailSettings.create({
        data: {
          enableSalesEmails,
          enableOfferEmails,
          enableNewProductEmails,
          enableOrderEmails,
          fromEmail,
          fromName,
          replyTo,
          maxEmailsPerDay,
          updatedBy: userId,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating email settings:', error);
    return NextResponse.json(
      { error: 'Failed to update email settings' },
      { status: 500 }
    );
  }
}
