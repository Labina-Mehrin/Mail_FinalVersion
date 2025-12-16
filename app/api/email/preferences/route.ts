import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/email/preferences
 * Get user email preferences
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let preferences = await prisma.emailPreference.findUnique({
      where: { userId },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.emailPreference.create({
        data: {
          userId,
          salesEmails: true,
          offerEmails: true,
          newProductEmails: true,
          orderConfirmation: true,
          orderUpdates: true,
          emailVerified: false,
          unsubscribedAll: false,
        },
      });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching email preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email preferences' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/email/preferences
 * Update user email preferences
 */
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      salesEmails,
      offerEmails,
      newProductEmails,
      orderConfirmation,
      orderUpdates,
      unsubscribedAll,
    } = body;

    const preferences = await prisma.emailPreference.upsert({
      where: { userId },
      update: {
        salesEmails,
        offerEmails,
        newProductEmails,
        orderConfirmation,
        orderUpdates,
        unsubscribedAll,
      },
      create: {
        userId,
        salesEmails,
        offerEmails,
        newProductEmails,
        orderConfirmation,
        orderUpdates,
        unsubscribedAll,
      },
    });

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error updating email preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update email preferences' },
      { status: 500 }
    );
  }
}
