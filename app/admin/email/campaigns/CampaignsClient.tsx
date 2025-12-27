'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  subject: string;
  description?: string;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  targetAll: boolean;
}

interface Stats {
  totalCampaigns: number;
  activeCampaigns: number;
  emailsSent: number;
  failedEmails: number;
}

export default function CampaignsClient() {
  const { user } = useUser();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [globalEmailEnabled, setGlobalEmailEnabled] = useState(true);

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [campaignsRes, settingsRes] = await Promise.all([
        fetch(
          `/api/admin/email/campaigns${
            statusFilter !== 'all' ? `?status=${statusFilter}` : ''
          }`,
          { credentials: 'include' }
        ),
        fetch('/api/admin/email/settings', { credentials: 'include' }),
      ]);

      if (campaignsRes.ok) {
        const data = await campaignsRes.json();
        setCampaigns(data.campaigns || []);
        
        // Calculate stats from campaigns
        const total = data.campaigns?.length || 0;
        const active = data.campaigns?.filter((c: Campaign) =>
          ['DRAFT', 'SCHEDULED', 'SENDING'].includes(c.status)
        ).length || 0;
        const sent = data.campaigns?.reduce((sum: number, c: Campaign) => sum + c.successCount, 0) || 0;
        const failed = data.campaigns?.reduce((sum: number, c: Campaign) => sum + c.failureCount, 0) || 0;
        
        setStats({
          totalCampaigns: total,
          activeCampaigns: active,
          emailsSent: sent,
          failedEmails: failed,
        });
      }

      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        setGlobalEmailEnabled(settings.emailSystemEnabled);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const res = await fetch(`/api/admin/email/campaigns/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        alert('Campaign deleted successfully');
        fetchData();
      } else {
        alert('Failed to delete campaign');
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Failed to delete campaign');
    }
  };

  const handleSend = async (id: string) => {
    if (!confirm('Send this campaign to all recipients? This will send emails to real users.')) return;

    try {
      const res = await fetch(`/api/admin/email/campaigns/${id}/send`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await res.json();
      
      if (res.ok) {
        const msg = `Campaign sent!\nSuccess: ${data.results?.success || 0}\nSkipped: ${data.results?.skipped || 0}\nFailed: ${data.results?.failed || 0}`;
        alert(msg);
        fetchData();
      } else {
        alert(data?.error || 'Failed to send campaign');
      }
    } catch (error) {
      console.error('Error sending campaign:', error);
      alert('Failed to send campaign');
    }
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-indigo-950 to-purple-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500" />
                <div className="text-lg tracking-wide text-white">
                  TAREQS<span className="text-purple-300">DRIP</span>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/email/settings"
                className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white/80 hover:bg-white/10 transition"
              >
                Settings
              </Link>
              <Link
                href="/admin/logs"
                className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white/80 hover:bg-white/10 transition"
              >
                Logs
              </Link>
              <div className="h-9 w-9 rounded-full bg-white/10 grid place-items-center text-sm text-white">
                {user?.firstName?.[0] || user?.username?.[0] || 'A'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Email Campaigns</h1>
            <p className="text-white/60">
              Create, schedule, send, and track bulk email campaigns.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!globalEmailEnabled}
            className={`px-6 py-3 rounded-lg font-semibold text-sm transition shadow-lg ${
              globalEmailEnabled
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
            title={!globalEmailEnabled ? 'Email system is disabled in settings' : ''}
          >
            Create Campaign
          </button>
        </div>

        {!globalEmailEnabled && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300">
            ⚠️ Email system is currently disabled. Enable it in Settings to create campaigns.
          </div>
        )}

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 animate-pulse"
              >
                <div className="h-4 bg-white/10 rounded w-24 mb-2" />
                <div className="h-8 bg-white/10 rounded w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard label="Total Campaigns" value={stats?.totalCampaigns || 0} />
            <StatCard
              label="Active Campaigns"
              value={stats?.activeCampaigns || 0}
              color="blue"
            />
            <StatCard
              label="Emails Sent"
              value={stats?.emailsSent || 0}
              color="green"
            />
            <StatCard
              label="Failed Emails"
              value={stats?.failedEmails || 0}
              color="red"
            />
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex items-center gap-3">
          <span className="text-white/60 text-sm">Filter by status:</span>
          <div className="flex gap-2">
            {['all', 'DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  statusFilter === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>
        </div>

        {/* Campaigns Table/List */}
        {loading ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-white/10 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
            <p className="text-white/60 text-lg mb-4">
              {statusFilter === 'all'
                ? 'No campaigns yet'
                : `No ${statusFilter} campaigns`}
            </p>
            {statusFilter === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={!globalEmailEnabled}
                className="text-purple-400 hover:text-purple-300 font-medium"
              >
                Create your first campaign
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-6 py-4 text-white/80 text-sm font-medium">
                      Campaign
                    </th>
                    <th className="text-left px-6 py-4 text-white/80 text-sm font-medium">
                      Type
                    </th>
                    <th className="text-left px-6 py-4 text-white/80 text-sm font-medium">
                      Status
                    </th>
                    <th className="text-left px-6 py-4 text-white/80 text-sm font-medium">
                      Audience
                    </th>
                    <th className="text-left px-6 py-4 text-white/80 text-sm font-medium">
                      Progress
                    </th>
                    <th className="text-left px-6 py-4 text-white/80 text-sm font-medium">
                      Created
                    </th>
                    <th className="text-right px-6 py-4 text-white/80 text-sm font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <CampaignTableRow
                      key={campaign.id}
                      campaign={campaign}
                      onDelete={handleDelete}
                      onSend={handleSend}
                      getRelativeTime={getRelativeTime}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-white/10">
              {campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onDelete={handleDelete}
                  onSend={handleSend}
                  getRelativeTime={getRelativeTime}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <CreateCampaignModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  color = 'purple',
}: {
  label: string;
  value: number;
  color?: 'purple' | 'blue' | 'green' | 'red';
}) {
  const colorClasses = {
    purple: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30',
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    red: 'from-red-500/20 to-rose-500/20 border-red-500/30',
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-xl border rounded-2xl p-6`}
    >
      <div className="text-white/60 text-sm mb-2">{label}</div>
      <div className="text-3xl font-bold text-white">{value.toLocaleString()}</div>
    </div>
  );
}

// Campaign Table Row Component
function CampaignTableRow({
  campaign,
  onDelete,
  onSend,
  getRelativeTime,
}: {
  campaign: Campaign;
  onDelete: (id: string) => void;
  onSend: (id: string) => void;
  getRelativeTime: (date: string) => string;
}) {
  const statusConfig = {
    DRAFT: { bg: 'bg-gray-500/20', text: 'text-gray-300', border: 'border-gray-500/30' },
    SCHEDULED: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' },
    SENDING: {
      bg: 'bg-purple-500/20',
      text: 'text-purple-300',
      border: 'border-purple-500/30',
    },
    SENT: { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30' },
    FAILED: { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30' },
  };

  const status = statusConfig[campaign.status as keyof typeof statusConfig] || statusConfig.DRAFT;

  return (
    <tr className="border-b border-white/10 hover:bg-white/5 transition">
      <td className="px-6 py-4">
        <Link
          href={`/admin/email/campaigns/${campaign.id}`}
          className="hover:text-purple-400 transition"
        >
          <div className="font-medium text-white">{campaign.name}</div>
          <div className="text-sm text-white/60 mt-1">{campaign.subject}</div>
        </Link>
      </td>
      <td className="px-6 py-4">
        <div className="text-white/80 text-sm">{campaign.type}</div>
      </td>
      <td className="px-6 py-4">
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.text} ${status.border}`}
        >
          {campaign.status}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="text-white/80 text-sm">
          {campaign.targetAll ? 'All users' : 'Custom segment'}
        </div>
      </td>
      <td className="px-6 py-4">
        {campaign.totalRecipients > 0 ? (
          <div>
            <div className="text-white/80 text-sm">
              {campaign.successCount} / {campaign.totalRecipients}
            </div>
            {campaign.status === 'SENDING' && (
              <div className="mt-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${(campaign.successCount / campaign.totalRecipients) * 100}%`,
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <span className="text-white/40 text-sm">—</span>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="text-white/60 text-sm">{getRelativeTime(campaign.createdAt)}</div>
      </td>
      <td className="px-6 py-4">
        <div className="flex justify-end gap-2">
          <Link
            href={`/admin/email/campaigns/${campaign.id}`}
            className="px-3 py-1.5 rounded-lg border border-white/20 bg-white/5 text-white/80 hover:bg-white/10 transition text-xs"
          >
            View
          </Link>
          {campaign.status === 'DRAFT' && (
            <>
              <button
                onClick={() => onSend(campaign.id)}
                className="px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition text-xs"
              >
                Send to All
              </button>
              <button
                onClick={() => onDelete(campaign.id)}
                className="px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition text-xs"
              >
                Delete
              </button>
            </>
          )}
          {campaign.status === 'SCHEDULED' && (
            <button
              onClick={() => onDelete(campaign.id)}
              className="px-3 py-1.5 rounded-lg border border-yellow-500/20 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20 transition text-xs"
            >
              Cancel
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// Campaign Card Component (Mobile)
function CampaignCard({
  campaign,
  onDelete,
  onSend,
  getRelativeTime,
}: {
  campaign: Campaign;
  onDelete: (id: string) => void;
  onSend: (id: string) => void;
  getRelativeTime: (date: string) => string;
}) {
  const statusConfig = {
    DRAFT: { bg: 'bg-gray-500/20', text: 'text-gray-300', border: 'border-gray-500/30' },
    SCHEDULED: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' },
    SENDING: {
      bg: 'bg-purple-500/20',
      text: 'text-purple-300',
      border: 'border-purple-500/30',
    },
    SENT: { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30' },
    FAILED: { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30' },
  };

  const status = statusConfig[campaign.status as keyof typeof statusConfig] || statusConfig.DRAFT;

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-3">
        <Link href={`/admin/email/campaigns/${campaign.id}`} className="flex-1">
          <h3 className="text-white font-medium mb-1">{campaign.name}</h3>
          <p className="text-white/60 text-sm">{campaign.subject}</p>
        </Link>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.text} ${status.border}`}
        >
          {campaign.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div>
          <span className="text-white/40">Type:</span>{' '}
          <span className="text-white/80">{campaign.type}</span>
        </div>
        <div>
          <span className="text-white/40">Audience:</span>{' '}
          <span className="text-white/80">
            {campaign.targetAll ? 'All users' : 'Custom'}
          </span>
        </div>
        {campaign.totalRecipients > 0 && (
          <>
            <div>
              <span className="text-white/40">Sent:</span>{' '}
              <span className="text-white/80">
                {campaign.successCount} / {campaign.totalRecipients}
              </span>
            </div>
            <div>
              <span className="text-white/40">Created:</span>{' '}
              <span className="text-white/80">{getRelativeTime(campaign.createdAt)}</span>
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <Link
          href={`/admin/email/campaigns/${campaign.id}`}
          className="flex-1 px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white/80 hover:bg-white/10 transition text-sm text-center"
        >
          View Details
        </Link>
        {campaign.status === 'DRAFT' && (
          <button
            onClick={() => onSend(campaign.id)}
            className="flex-1 px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition text-sm"
          >
            Send to All
          </button>
        )}
      </div>
    </div>
  );
}

// Create Campaign Modal
function CreateCampaignModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  type CreateCampaignForm = {
    name: string;
    description: string;
    type: string;
    subject: string;
    templateData: Record<string, any>;
    targetAll: boolean;
    targetUserIds: string[];
    startDate: string;
    endDate: string;
    discount: number | null;
    imageUrl: string;
  };
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CreateCampaignForm>({
    name: '',
    description: '',
    type: 'SALES_ANNOUNCEMENT',
    subject: '',
    templateData: {},
    targetAll: true,
    targetUserIds: [],
    startDate: '',
    endDate: '',
    discount: null,
    imageUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/admin/email/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const body = await res.text();
        console.error('Failed to create campaign', res.status, body);
        alert('Failed to create campaign');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Create Email Campaign</h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white/80 text-sm mb-2">Campaign Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Summer Sale 2025"
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
                placeholder="Brief description"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/80 text-sm mb-2">Email Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="SALES_ANNOUNCEMENT">Sales Announcement</option>
                  <option value="SPECIAL_OFFER">Special Offer</option>
                  <option value="NEW_PRODUCT">New Product</option>
                  <option value="NEWSLETTER">Newsletter</option>
                </select>
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-2">Audience *</label>
                <select
                  value={formData.targetAll ? 'all' : 'custom'}
                  onChange={(e) =>
                    setFormData({ ...formData, targetAll: e.target.value === 'all' })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Users</option>
                  <option value="custom">Custom Segment</option>
                </select>
              </div>
            </div>

            {!formData.targetAll && (
              <div>
                <label className="block text-white/80 text-sm mb-2">Target User IDs (comma-separated)</label>
                <textarea
                  value={(formData.targetUserIds as string[]).join(',')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targetUserIds: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter((s) => s.length > 0),
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="user_123, user_456"
                />
                <p className="mt-2 text-xs text-white/50">Paste Clerk user IDs of recipients. Preferences and admin rules are enforced on send.</p>
              </div>
            )}

            <div>
              <label className="block text-white/80 text-sm mb-2">Email Subject *</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Get 50% off this summer!"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/80 text-sm mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/80 text-sm mb-2">Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount ?? ''}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="20"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-2">Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-yellow-300 text-sm">
                ⚠️ This campaign will be created as a DRAFT. You can edit and send it later.
              </p>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-lg border border-white/20 bg-white/5 text-white/80 hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {saving ? 'Creating...' : 'Create Campaign'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
