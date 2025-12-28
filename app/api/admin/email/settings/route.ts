import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
export const runtime = "nodejs";

/**
 * GET /api/admin/email/settings
 * Get global email settings (admin only)
 */
export async function GET(_req: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let settings = await prisma.emailSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    // Create default settings if they don't exist
    if (!settings) {
      const user = await currentUser();
      const userName = user?.firstName || user?.username || 'Admin';
      
      settings = await prisma.emailSettings.create({
        data: {
          emailSystemEnabled: true,
          maintenanceMode: false,
          enableSalesEmails: true,
          enableOfferEmails: true,
          enableNewProductEmails: true,
          enableOrderEmails: true,
          fromEmail: 'noreply@tareqsdrip.com',
          fromName: 'TareqsDrip',
          maxEmailsPerDay: 5,
          updatedBy: userId,
          updatedByName: userName,
        } as any,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
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
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    const userName = user?.firstName || user?.username || 'Admin';

    const body = await req.json();
    const {
      emailSystemEnabled,
      maintenanceMode,
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
          emailSystemEnabled,
          maintenanceMode,
          enableSalesEmails,
          enableOfferEmails,
          enableNewProductEmails,
          enableOrderEmails,
          fromEmail,
          fromName,
          replyTo,
          maxEmailsPerDay,
          updatedBy: userId,
          updatedByName: userName,
        } as any,
      });
    } else {
      settings = await prisma.emailSettings.create({
        data: {
          emailSystemEnabled,
          maintenanceMode,
          enableSalesEmails,
          enableOfferEmails,
          enableNewProductEmails,
          enableOrderEmails,
          fromEmail,
          fromName,
          replyTo,
          maxEmailsPerDay,
          updatedBy: userId,
          updatedByName: userName,
        } as any,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update email settings' },
      { status: 500 }
    );
  }
}
