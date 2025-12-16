'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

interface EmailPreference {
  id: string;
  salesEmails: boolean;
  offerEmails: boolean;
  newProductEmails: boolean;
  orderConfirmation: boolean;
  orderUpdates: boolean;
  unsubscribedAll: boolean;
}

export default function UserEmailPreferences() {
  const { getToken } = useAuth();
  const [preferences, setPreferences] = useState<EmailPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/email/preferences', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    setSaving(true);
    setMessage('');

    try {
      const token = await getToken();
      const response = await fetch('/api/email/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        setMessage('Preferences saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('Failed to save preferences');
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

  if (!preferences) {
    return <div className="p-8">Failed to load preferences</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Email Preferences
          </h1>
          <p className="text-gray-600 mb-8">
            Choose which emails you want to receive from TareqsDrip
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

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-800">
                Marketing Emails
              </h2>
              <div className="space-y-3">
                <PreferenceToggle
                  label="Sales Announcements"
                  description="Get notified about sales and special promotions"
                  checked={preferences.salesEmails}
                  disabled={preferences.unsubscribedAll}
                  onChange={(checked) =>
                    setPreferences({ ...preferences, salesEmails: checked })
                  }
                />
                <PreferenceToggle
                  label="Special Offers"
                  description="Receive exclusive offers and coupon codes"
                  checked={preferences.offerEmails}
                  disabled={preferences.unsubscribedAll}
                  onChange={(checked) =>
                    setPreferences({ ...preferences, offerEmails: checked })
                  }
                />
                <PreferenceToggle
                  label="New Products"
                  description="Be the first to know about new arrivals"
                  checked={preferences.newProductEmails}
                  disabled={preferences.unsubscribedAll}
                  onChange={(checked) =>
                    setPreferences({ ...preferences, newProductEmails: checked })
                  }
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">
                Order Updates
              </h2>
              <div className="space-y-3">
                <PreferenceToggle
                  label="Order Confirmations"
                  description="Get confirmation when you place an order"
                  checked={preferences.orderConfirmation}
                  disabled={preferences.unsubscribedAll}
                  onChange={(checked) =>
                    setPreferences({ ...preferences, orderConfirmation: checked })
                  }
                />
                <PreferenceToggle
                  label="Shipping & Delivery"
                  description="Track your orders with shipping and delivery updates"
                  checked={preferences.orderUpdates}
                  disabled={preferences.unsubscribedAll}
                  onChange={(checked) =>
                    setPreferences({ ...preferences, orderUpdates: checked })
                  }
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <PreferenceToggle
                label="Unsubscribe from all emails"
                description="Stop receiving all marketing and promotional emails (you'll still get critical order updates)"
                checked={preferences.unsubscribedAll}
                onChange={(checked) =>
                  setPreferences({ ...preferences, unsubscribedAll: checked })
                }
              />
            </div>

            <div className="flex justify-end pt-6 border-t">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreferenceToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <label
          className={`font-medium block ${
            disabled ? 'text-gray-400' : 'text-gray-900'
          }`}
        >
          {label}
        </label>
        <p
          className={`text-sm mt-1 ${
            disabled ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          {description}
        </p>
      </div>
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 ${
          disabled
            ? 'bg-gray-300 cursor-not-allowed'
            : checked
            ? 'bg-purple-600'
            : 'bg-gray-300'
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
