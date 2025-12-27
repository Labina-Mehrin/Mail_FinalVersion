// lib/audience.any.ts
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

let clerkClient: any = null;
try {
  // Load Clerk only if installed/configured
  const mod = await import("@clerk/nextjs/server");
  clerkClient = mod.clerkClient;
} catch {
  // Clerk not installed – that's fine. We'll just use Recipients.
}

export type AudienceRecipient = { email: string; userId: string; data: any };

function syntheticIdFromEmail(email: string) {
  const hex = createHash("sha1").update(email.trim().toLowerCase()).digest("hex");
  return "email_" + hex.slice(0, 16);
}

/**
 * Returns a deduped list of recipients shaped for sendBulkEmails:
 *   { email, userId, data: { firstName, lastName } }
 * Combines Clerk users (if available) + your Recipient table.
 */
export async function getAudienceAll(): Promise<AudienceRecipient[]> {
  const out: AudienceRecipient[] = [];
  const seen = new Set<string>();

  // 1) Clerk users (optional)
  if (clerkClient) {
    const limit = 100;
    let offset = 0;
    for (;;) {
      const res = await clerkClient.users.getUserList({ offset, limit });
      if (!res?.data?.length) break;

      for (const u of res.data) {
        const primary = u.primaryEmailAddressId
          ? u.emailAddresses.find((e: any) => e.id === u.primaryEmailAddressId)
          : undefined;
        const email =
          (primary?.emailAddress || u.emailAddresses?.[0]?.emailAddress || "").toLowerCase();
        if (!email || seen.has(email)) continue;
        seen.add(email);

        out.push({
          email,
          userId: u.id, // real Clerk ID
          data: { firstName: u.firstName || "there", lastName: u.lastName || "" },
        });
      }

      if (res.data.length < limit) break;
      offset += limit;
    }
  }

  // 2) Manual recipients
  const recipients = await prisma.recipient.findMany({
    select: { email: true, firstName: true, lastName: true },
  });

  for (const r of recipients) {
    const email = r.email.toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);

    out.push({
      email,
      userId: syntheticIdFromEmail(email), // stable synthetic ID for non-Clerk
      data: { firstName: r.firstName || "there", lastName: r.lastName || "" },
    });
  }

  return out;
}
