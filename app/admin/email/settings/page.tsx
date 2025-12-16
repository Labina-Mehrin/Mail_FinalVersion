'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

interface EmailSettings {
  id: string;
  enableSalesEmails: boolean;
  enableOfferEmails: boolean;
  enableNewProductEmails: boolean;
  enableOrderEmails: boolean;
  fromEmail: string;
  fromName: string;
  replyTo: string | null;
  maxEmailsPerDay: number;
}

export default function AdminEmailSettings() {
  const { getToken } = useAuth();
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/admin/email/settings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setMessage('');

    try {
      const token = await getToken();
      const response = await fetch('/api/admin/email/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage('Settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!settings) {
    return <div className="p-8">Failed to load settings</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Email Settings
          </h1>
          <p className="text-gray-600 mb-8">
            Control which automated emails are sent to users
          </p>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.includes('success')
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {message}
            </div>
          )}

          <div className="space-y-8">
            {/* Email Type Toggles */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Email Types
              </h2>
              <div className="space-y-4">
                <ToggleField
                  label="Sales Announcements"
                  description="Send emails about sales and special promotions"
                  checked={settings.enableSalesEmails}
                  onChange={(checked) =>
                    setSettings({ ...settings, enableSalesEmails: checked })
                  }
                />
                <ToggleField
                  label="Special Offers"
                  description="Send exclusive offers and coupon codes"
                  checked={settings.enableOfferEmails}
                  onChange={(checked) =>
                    setSettings({ ...settings, enableOfferEmails: checked })
                  }
                />
                <ToggleField
                  label="New Products"
                  description="Send notifications about new product launches"
                  checked={settings.enableNewProductEmails}
                  onChange={(checked) =>
                    setSettings({ ...settings, enableNewProductEmails: checked })
                  }
                />
                <ToggleField
                  label="Order Emails"
                  description="Send order confirmations, shipping updates, and delivery notifications"
                  checked={settings.enableOrderEmails}
                  onChange={(checked) =>
                    setSettings({ ...settings, enableOrderEmails: checked })
                  }
                />
              </div>
            </div>

            {/* Sender Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Sender Information
              </h2>
              <div className="space-y-4">
                <InputField
                  label="From Email"
                  value={settings.fromEmail}
                  onChange={(value) =>
                    setSettings({ ...settings, fromEmail: value })
                  }
                  placeholder="noreply@tareqsdrip.com"
                />
                <InputField
                  label="From Name"
                  value={settings.fromName}
                  onChange={(value) =>
                    setSettings({ ...settings, fromName: value })
                  }
                  placeholder="TareqsDrip"
                />
                <InputField
                  label="Reply To (Optional)"
                  value={settings.replyTo || ''}
                  onChange={(value) =>
                    setSettings({ ...settings, replyTo: value || null })
                  }
                  placeholder="support@tareqsdrip.com"
                />
              </div>
            </div>

            {/* Rate Limiting */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Rate Limiting
              </h2>
              <InputField
                label="Max Marketing Emails Per User Per Day"
                type="number"
                value={settings.maxEmailsPerDay.toString()}
                onChange={(value) =>
                  setSettings({
                    ...settings,
                    maxEmailsPerDay: parseInt(value) || 5,
                  })
                }
                placeholder="5"
              />
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <label className="font-medium text-gray-900 block">{label}</label>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 ${
          checked ? 'bg-purple-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block font-medium text-gray-900 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
      />
    </div>
  );
}
