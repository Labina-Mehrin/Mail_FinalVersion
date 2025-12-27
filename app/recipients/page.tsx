'use client';

import { useEffect, useState } from 'react';

type Recipient = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

export default function RecipientsAdminPage() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<Recipient[]>([]);

  async function refreshRecent() {
    try {
      const res = await fetch('/api/recipients/list?limit=50');
      if (res.ok) {
        const data = await res.json();
        setRecent(data.recipients || []);
      }
    } catch {}
  }

  useEffect(() => {
    refreshRecent();
  }, []);

  async function onAddOne(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, lastName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to add recipient');
      setMessage(`Added: ${data.recipient.email}`);
      setEmail(''); setFirstName(''); setLastName('');
      refreshRecent();
    } catch (err: any) {
      setMessage(err.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function onImportCsv(e: React.FormEvent) {
    e.preventDefault();
    if (!csvFile) { setMessage('Choose a CSV first'); return; }
    setLoading(true);
    setMessage('');
    try {
      const text = await csvFile.text();
      const res = await fetch('/api/recipients/import', {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: text,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Import failed');
      setMessage(`Imported OK: ${data.ok}, failed: ${data.failed}, total: ${data.total}`);
      setCsvFile(null);
      const input = document.getElementById('csv-input') as HTMLInputElement;
      if (input) input.value = '';
      refreshRecent();
    } catch (err: any) {
      setMessage(err.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Recipients</h1>

      {/* Add one */}
      <div className="rounded-2xl border p-6 shadow-sm">
        <h2 className="text-xl mb-4">Add a single recipient</h2>
        <form onSubmit={onAddOne} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="email"
            required
            placeholder="email@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded-lg p-2"
          />
          <input
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="border rounded-lg p-2"
          />
          <input
            type="text"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="border rounded-lg p-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-black text-white px-4 py-2"
          >
            {loading ? 'Saving…' : 'Add'}
          </button>
        </form>
      </div>

      {/* Import CSV */}
      <div className="rounded-2xl border p-6 shadow-sm">
        <h2 className="text-xl mb-4">Import CSV</h2>
        <p className="text-sm text-gray-600 mb-3">
          CSV headers: email,firstName,lastName
        </p>
        <form onSubmit={onImportCsv} className="flex items-center gap-3">
          <input
            id="csv-input"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            className="border rounded-lg p-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-black text-white px-4 py-2"
          >
            {loading ? 'Uploading…' : 'Import'}
          </button>
        </form>
      </div>

      {message && (
        <div className="rounded-lg border p-3 text-sm">{message}</div>
      )}

      {/* Recent list */}
      <div className="rounded-2xl border p-6 shadow-sm">
        <h2 className="text-xl mb-4">Recent recipients</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">First</th>
                <th className="py-2 pr-4">Last</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.email} className="border-b last:border-0">
                  <td className="py-2 pr-4">{r.email}</td>
                  <td className="py-2 pr-4">{r.firstName || ''}</td>
                  <td className="py-2 pr-4">{r.lastName || ''}</td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td className="py-2 pr-4" colSpan={3}>No recipients yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
