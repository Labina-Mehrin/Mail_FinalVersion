import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get('limit') || 50);

  const recipients = await prisma.recipient.findMany({
    orderBy: { createdAt: 'desc' },
    take: Math.min(limit, 200),
    select: { email: true, firstName: true, lastName: true },
  });

  return NextResponse.json({ recipients });
}
