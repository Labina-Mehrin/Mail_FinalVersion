'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { EmailTemplateType } from '@/lib/email/templates';

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  subject: string;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

export default function AdminEmailCampaigns() {
  const { getToken } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/admin/email/campaigns', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to send this campaign?')) return;

    try {
      const token = await getToken();
      const response = await fetch(
        `/api/admin/email/campaigns/${campaignId}/send`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        alert('Campaign queued for sending!');
        fetchCampaigns();
      } else {
        alert('Failed to send campaign');
      }
    } catch (error) {
      console.error('Error sending campaign:', error);
      alert('Failed to send campaign');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Email Campaigns
              </h1>
              <p className="text-gray-600 mt-2">
                Create and manage email campaigns for your users
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Create Campaign
            </button>
          </div>

          {campaigns.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No campaigns yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
              >
                Create your first campaign
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onSend={handleSendCampaign}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateCampaignModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchCampaigns();
          }}
        />
      )}
    </div>
  );
}

function CampaignCard({
  campaign,
  onSend,
}: {
  campaign: Campaign;
  onSend: (id: string) => void;
}) {
  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    SCHEDULED: 'bg-blue-100 text-blue-800',
    SENDING: 'bg-yellow-100 text-yellow-800',
    SENT: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-gray-900">
              {campaign.name}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                statusColors[campaign.status as keyof typeof statusColors]
              }`}
            >
              {campaign.status}
            </span>
          </div>
          <p className="text-gray-600 mb-4">{campaign.subject}</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <div>
              <span className="font-medium">Type:</span> {campaign.type}
            </div>
            {campaign.totalRecipients > 0 && (
              <>
                <div>
                  <span className="font-medium">Recipients:</span>{' '}
                  {campaign.totalRecipients}
                </div>
                <div>
                  <span className="font-medium">Success:</span>{' '}
                  {campaign.successCount}
                </div>
                {campaign.failureCount > 0 && (
                  <div>
                    <span className="font-medium">Failed:</span>{' '}
                    {campaign.failureCount}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {(campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED') && (
            <button
              onClick={() => onSend(campaign.id)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              Send Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateCampaignModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { getToken } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: EmailTemplateType.SALES_ANNOUNCEMENT,
    subject: '',
    templateData: {},
    targetAll: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = await getToken();
      const response = await fetch('/api/admin/email/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
      } else {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Create Email Campaign
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block font-medium text-gray-900 mb-2">
                Campaign Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="Summer Sale 2025"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-900 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                rows={3}
                placeholder="Brief description of the campaign"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-900 mb-2">
                Email Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as EmailTemplateType,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                <option value={EmailTemplateType.SALES_ANNOUNCEMENT}>
                  Sales Announcement
                </option>
                <option value={EmailTemplateType.SPECIAL_OFFER}>
                  Special Offer
                </option>
                <option value={EmailTemplateType.NEW_PRODUCT}>
                  New Product
                </option>
                <option value={EmailTemplateType.PROMOTIONAL}>
                  Promotional
                </option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-gray-900 mb-2">
                Email Subject
              </label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="Get 50% off this summer!"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="targetAll"
                checked={formData.targetAll}
                onChange={(e) =>
                  setFormData({ ...formData, targetAll: e.target.checked })
                }
                className="h-4 w-4 text-purple-600 focus:ring-purple-600 border-gray-300 rounded"
              />
              <label htmlFor="targetAll" className="ml-2 text-gray-900">
                Send to all users
              </label>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
