import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseCSV(text: string) {
  // expects header: email,firstName,lastName  (case-insensitive)
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return [];
  const cols = lines[0].split(",").map(c => c.trim().toLowerCase());
  const idx = {
    email: cols.indexOf("email"),
    firstName: cols.indexOf("firstname"),
    lastName: cols.indexOf("lastname"),
  };
  const rows: { email: string; firstName?: string; lastName?: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",").map(x => x.trim());
    const email = (parts[idx.email] || "").toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
    rows.push({
      email,
      firstName: idx.firstName >= 0 ? parts[idx.firstName] : undefined,
      lastName: idx.lastName >= 0 ? parts[idx.lastName] : undefined,
    });
  }
  return rows;
}

export async function POST(req: Request) {
  const text = await req.text(); // Content-Type: text/csv
  const rows = parseCSV(text);

  const results = await Promise.allSettled(
    rows.map(r =>
      prisma.recipient.upsert({
        where: { email: r.email },
        update: { firstName: r.firstName, lastName: r.lastName },
        create: { email: r.email, firstName: r.firstName, lastName: r.lastName },
      })
    )
  );

  const ok = results.filter(r => r.status === "fulfilled").length;
  const failed = results.length - ok;
  return NextResponse.json({ ok, failed, total: results.length });
}
