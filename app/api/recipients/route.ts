import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: Request) {
  const { email, firstName, lastName } = await req.json();

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const recipient = await prisma.recipient.upsert({
    where: { email: email.toLowerCase() },
    update: { firstName, lastName },
    create: {
      email: email.toLowerCase(),
      firstName: firstName || null,
      lastName: lastName || null,
    },
  });

  return NextResponse.json({ ok: true, recipient });
}
