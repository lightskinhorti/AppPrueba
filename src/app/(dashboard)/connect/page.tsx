'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Link2, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

export default function ConnectPage() {
  const [apiKey, setApiKey] = useState('');
  const [validating, setValidating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    accountName?: string;
    error?: string;
  } | null>(null);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    customers?: number;
    subscriptions?: number;
    events?: number;
    error?: string;
  } | null>(null);
  const [connection, setConnection] = useState<{
    stripe_account_name: string | null;
    last_sync_at: string | null;
    last_sync_status: string;
    customer_count: number;
  } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('stripe_connections')
      .select('stripe_account_name, last_sync_at, last_sync_status, customer_count')
      .single()
      .then(({ data }) => {
        if (data) setConnection(data);
      });
  }, [syncResult]);

  async function handleValidate() {
    setValidating(true);
    setValidationResult(null);

    try {
      const res = await fetch('/api/connect/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      const json = await res.json();
      setValidationResult(json);
    } catch {
      setValidationResult({ valid: false, error: 'Failed to validate' });
    } finally {
      setValidating(false);
    }
  }

  async function handleSync(fullSync: boolean = false) {
    setSyncing(true);
    setSyncResult(null);

    try {
      const body: Record<string, unknown> = { fullSync };
      if (apiKey && !connection) {
        body.apiKey = apiKey;
      }

      const res = await fetch('/api/connect/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (json.success) {
        setSyncResult({
          success: true,
          customers: json.synced.customers,
          subscriptions: json.synced.subscriptions,
          events: json.synced.events,
        });
      } else {
        setSyncResult({ success: false, error: json.error });
      }
    } catch {
      setSyncResult({ success: false, error: 'Sync failed' });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Connect Stripe</h1>
        <p className="mt-1 text-sm text-gray-500">
          Connect your Stripe account to analyze your subscription data.
        </p>
      </div>

      {connection && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-800">Stripe Connected</span>
          </div>
          <div className="text-sm text-green-700 space-y-1">
            {connection.stripe_account_name && (
              <p>Account: {connection.stripe_account_name}</p>
            )}
            <p>Customers synced: {connection.customer_count}</p>
            <p>Last sync: {connection.last_sync_at
              ? new Date(connection.last_sync_at).toLocaleString()
              : 'Never'
            }</p>
            <p>Status: {connection.last_sync_status}</p>
          </div>
          <button
            onClick={() => handleSync(false)}
            disabled={syncing}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      )}

      {!connection && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-2 text-gray-700">
            <Link2 className="w-5 h-5" />
            <h2 className="font-medium">Enter your Stripe API key</h2>
          </div>

          <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-600">
            <p className="font-medium mb-1">How to get your API key:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to your Stripe Dashboard</li>
              <li>Navigate to Developers &gt; API keys</li>
              <li>Create a restricted key with <strong>read-only</strong> access</li>
              <li>Copy the key and paste it below</li>
            </ol>
          </div>

          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
              Restricted API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setValidationResult(null);
              }}
              placeholder="rk_live_..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {validationResult && (
            <div
              className={`p-3 rounded-md text-sm ${
                validationResult.valid
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {validationResult.valid ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Valid key. Account: {validationResult.accountName}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{validationResult.error}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleValidate}
              disabled={!apiKey || validating}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {validating ? 'Validating...' : 'Validate Key'}
            </button>

            <button
              onClick={() => handleSync(true)}
              disabled={!apiKey || !validationResult?.valid || syncing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                'Connect & Sync'
              )}
            </button>
          </div>
        </div>
      )}

      {syncResult && (
        <div
          className={`p-4 rounded-lg text-sm ${
            syncResult.success
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {syncResult.success ? (
            <div>
              <p className="font-medium">Sync completed successfully!</p>
              <p className="mt-1">
                Synced {syncResult.customers} customers, {syncResult.subscriptions} subscriptions,
                and {syncResult.events} events.
              </p>
            </div>
          ) : (
            <div>
              <p className="font-medium">Sync failed</p>
              <p className="mt-1">{syncResult.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
