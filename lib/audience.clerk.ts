// lib/audience.clerk.ts
import { clerkClient } from '@clerk/nextjs/server';

export type AudienceRecipient = {
  email: string;
  userId: string;
  data: Record<string, any>;
};

/**
 * Pulls all users from Clerk, returns { email, userId, data } for sendBulkEmails
 * - Only includes users with an email address
 * - Prefers primary email; falls back to first email
 * - Adds simple template data (firstName)
 */
export async function getAllClerkUsersAudience(): Promise<AudienceRecipient[]> {
  const pageSize = 100;
  let offset = 0;
  const recipients: AudienceRecipient[] = [];

  // Clerk pagination: offset + limit
  // Stop when fewer than pageSize returned
  for (;;) {
    const res = await clerkClient.users.getUserList({ offset, limit: pageSize });
    if (!res || res.data.length === 0) break;

    for (const u of res.data) {
      const primary = u.primaryEmailAddressId
        ? u.emailAddresses.find(e => e.id === u.primaryEmailAddressId)
        : undefined;
      const first = u.emailAddresses[0];
      const email = primary?.emailAddress || first?.emailAddress;

      if (!email) continue; // skip users with no email

      recipients.push({
        email,
        userId: u.id,
        data: {
          firstName: u.firstName || 'there',
          lastName: u.lastName || '',
        },
      });
    }

    if (res.data.length < pageSize) break;
    offset += pageSize;
  }

  return recipients;
}
