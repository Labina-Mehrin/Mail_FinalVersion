import { auth, currentUser } from "@clerk/nextjs/server";
import { GlassCard, FeatureCard, StatTile } from "@/app/components/dashboard-ui";

export const dynamic = "force-dynamic";

type Stats = {
  totalEmailsSent: number;
  templatesCount: number;
  activeCampaigns: number;
  successRate: number;
};

async function getStats(): Promise<Stats> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${baseUrl}/api/stats`, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!res.ok) {
      return { totalEmailsSent: 0, templatesCount: 0, activeCampaigns: 0, successRate: 0 };
    }

    return await res.json();
  } catch (err) {
    console.error("Stats fetch failed:", err);
    return { totalEmailsSent: 0, templatesCount: 0, activeCampaigns: 0, successRate: 0 };
  } finally {
    clearTimeout(timeout);
  }
}

export default async function HomePage() {
  auth(); // ensures Clerk context is available
  const user = await currentUser();
  const stats = await getStats();

  const avatarText =
    (user?.firstName?.[0] ||
      user?.username?.[0] ||
      user?.emailAddresses?.[0]?.emailAddress?.[0] ||
      "U").toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-indigo-950 to-purple-900 text-white">
      {/* Tailwind v4 Test */}
      <div className="p-10 text-3xl text-white bg-black">
        Tailwind is working
      </div>
      
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500" />
            <div className="text-lg tracking-wide">
              TAREQS<span className="text-purple-300">DRIP</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
              {stats.totalEmailsSent.toLocaleString()} emails sent
            </div>

            <div className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-sm">
              {avatarText}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="max-w-3xl">
          <div className="text-4xl md:text-5xl text-white/95">
            Complete Email Management System
          </div>
          <div className="mt-3 text-base md:text-lg text-white/60">
            Automate emails for your e-commerce platform. Control campaigns, track engagement, and manage user preferences.
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            href="/admin/email/settings"
            title="Admin Settings"
            description="Control global email features, sender info, and rate limits."
            accent="purple"
            icon={
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M19.4 15a8.3 8.3 0 0 0 .1-6l-2.1-.6a6.6 6.6 0 0 0-1.2-2.1l.8-2a8.5 8.5 0 0 0-5.2-2.2l-1 1.9a6.8 6.8 0 0 0-2.4 0L7.4 2a8.5 8.5 0 0 0-5.2 2.2l.8 2a6.6 6.6 0 0 0-1.2 2.1L.7 9a8.3 8.3 0 0 0 .1 6l2.1.6a6.6 6.6 0 0 0 1.2 2.1l-.8 2a8.5 8.5 0 0 0 5.2 2.2l1-1.9a6.8 6.8 0 0 0 2.4 0l1 1.9a8.5 8.5 0 0 0 5.2-2.2l-.8-2a6.6 6.6 0 0 0 1.2-2.1l2.1-.6Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            }
          />

          <FeatureCard
            href="/admin/email/campaigns"
            title="Email Campaigns"
            description="Create and send bulk marketing emails with tracking."
            accent="pink"
            icon={
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 6h16v12H4V6Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="m4 7 8 6 8-6"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            }
          />

          <FeatureCard
            href="/recipients"
            title="Recipients"
            description="Add single recipients or import CSV files to manage your audience."
            accent="green"
            icon={
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none">
                <path
                  d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle
                  cx="9"
                  cy="7"
                  r="4"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            }
          />

          <FeatureCard
            href="/settings/email"
            title="User Preferences"
            description="Manage personal subscriptions and order notifications."
            accent="blue"
            icon={
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M20 20a8 8 0 1 0-16 0"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            }
          />
        </div>

        {/* Stats + How it works */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl text-white/95">How It Works</div>
                <div className="mt-1 text-sm text-white/60">Interactive flow (hover each step)</div>
              </div>
              <a
                href="/docs"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                View Full Documentation
              </a>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                {
                  title: "Trigger event",
                  tooltip: "An action occurs that makes an email eligible to send, such as a user placing an order, signing up, or an admin launching a campaign."
                },
                {
                  title: "Start background job",
                  tooltip: "The email process runs in the background so the app stays fast and reliable, even during high traffic or bulk sends."
                },
                {
                  title: "Check admin settings",
                  tooltip: "Global email rules are applied here. If this email type is disabled, rate-limited, or misconfigured by admins, it will not be sent."
                },
                {
                  title: "Check user preferences",
                  tooltip: "The system verifies the user's email preferences and unsubscribe status to ensure emails are sent only with consent."
                },
                {
                  title: "Generate branded email",
                  tooltip: "A personalized, branded email is generated using templates, dynamic data, and your company's visual identity."
                },
                {
                  title: "Send email",
                  tooltip: "The email is delivered through the configured email provider, with automatic handling for retries and delivery errors."
                },
                {
                  title: "Log result",
                  tooltip: "The final outcome is recorded for reporting, analytics, and troubleshooting, including sent, skipped, or failed emails."
                },
              ].map((step) => (
                <div
                  key={step.title}
                  className="group relative rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                  title={step.tooltip}
                >
                  {step.title}
                  
                  {/* Tooltip on hover */}
                  <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 hidden w-64 -translate-x-1/2 rounded-lg border border-white/20 bg-gray-900/95 px-3 py-2 text-xs text-white/90 shadow-xl backdrop-blur-sm group-hover:block">
                    <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-l border-t border-white/20 bg-gray-900/95"></div>
                    {step.tooltip}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="text-xl text-white/95">Stats Overview</div>
            <div className="mt-1 text-sm text-white/60">Values are dynamic from API</div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <StatTile label="Email Templates" value={stats.templatesCount.toLocaleString()} />
              <StatTile label="Active Campaigns" value={stats.activeCampaigns.toLocaleString()} />
              <StatTile label="Total Emails Sent" value={stats.totalEmailsSent.toLocaleString()} />
              <StatTile label="Delivery Success Rate" value={`${Math.round(stats.successRate)}%`} />
            </div>

            <a
              href="/docs"
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              View Full Documentation
            </a>
          </GlassCard>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-white/40">
          Powered by Next.js, Mailtrap, Inngest, and Prisma
        </div>
      </div>
    </div>
  );
}
