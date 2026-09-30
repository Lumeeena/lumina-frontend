'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { readPersistedSession, connectWallet, disconnectWallet } from '@/lib/wallet';
import { loadKeysForWallet, createKeyForWallet, deleteKeyForWallet, type DeveloperKey } from '@/lib/developerKeys';
import { truncateAddress } from '@/lib/formatters';

const usageData = [
  { date: 'Mon', requests: 240 },
  { date: 'Tue', requests: 1398 },
  { date: 'Wed', requests: 9800 },
  { date: 'Thu', requests: 3908 },
  { date: 'Fri', requests: 4800 },
  { date: 'Sat', requests: 3800 },
  { date: 'Sun', requests: 4300 },
];

export default function UsageDashboardPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [keys, setKeys] = useState<DeveloperKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const session = readPersistedSession();
    if (session?.address) {
      setWalletAddress(session.address);
      setKeys(loadKeysForWallet(session.address));
    }
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    const result = await connectWallet();
    setConnecting(false);
    if ('address' in result && result.address) {
      setWalletAddress(result.address);
      setKeys(loadKeysForWallet(result.address));
    }
  };

  const handleDisconnect = async () => {
    await disconnectWallet();
    setWalletAddress(null);
    setKeys([]);
  };

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress || !newKeyName.trim()) return;
    const updated = createKeyForWallet(walletAddress, newKeyName.trim());
    setKeys(updated);
    setNewKeyName('');
  };

  const handleDeleteKey = (keyId: string) => {
    if (!walletAddress) return;
    const updated = deleteKeyForWallet(walletAddress, keyId);
    setKeys(updated);
  };

  const totalRequests = usageData.reduce((sum, day) => sum + day.requests, 0);
  const maxRequests = Math.max(...usageData.map(d => d.requests));
  const quotaLimit = keys.reduce((acc, k) => acc + k.limit, 50000);
  const quotaUsed = totalRequests;
  const quotaPercentage = Math.round((quotaUsed / quotaLimit) * 100);

  const keyUsageData = keys.map((k) => ({
    name: k.name,
    usage: k.usage,
    limit: k.limit,
  }));

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-3">
            Usage Dashboard
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)]">
            Monitor your API key usage and quota consumption, protected by wallet ownership.
          </p>
        </div>

        {walletAddress && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-raised)]">
            <div>
              <span className="block text-xs text-[var(--color-text-muted)] uppercase tracking-wide font-bold">
                Connected Owner
              </span>
              <span className="mono text-sm font-semibold text-[var(--color-accent-text)]" title={walletAddress}>
                {truncateAddress(walletAddress, 6)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleDisconnect}
              className="text-xs font-semibold text-[var(--color-error-text)] hover:underline px-2 py-1 rounded"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {!walletAddress ? (
        <div data-testid="wallet-protected-banner" className="p-8 rounded-xl border border-[var(--color-accent-fill)]/30 bg-[var(--color-bg-subtle)] text-center my-8">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            Wallet Ownership Required
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-lg mx-auto mb-6">
            Key management is tied strictly to wallet ownership. Connect your Stellar wallet to view, create, and manage your private API keys.
          </p>
          <button
            type="button"
            onClick={handleConnect}
            disabled={connecting}
            className="rounded-lg bg-[var(--color-accent-fill)] hover:bg-[var(--color-accent-fill-hover)] text-white font-bold text-sm px-6 py-2.5 transition-colors disabled:opacity-50"
          >
            {connecting ? 'Connecting Wallet…' : 'Connect Wallet to Access Keys'}
          </button>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="p-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-raised)]">
              <div className="text-sm font-semibold uppercase text-[var(--color-text-muted)] mb-2">
                Requests This Week
              </div>
              <div className="text-3xl font-bold text-[var(--color-text-primary)]">
                {totalRequests.toLocaleString()}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-2">
                Peak day: {maxRequests.toLocaleString()} requests
              </div>
            </div>

            <div className="p-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-raised)]">
              <div className="text-sm font-semibold uppercase text-[var(--color-text-muted)] mb-2">
                Quota Remaining
              </div>
              <div className="text-3xl font-bold text-[var(--color-text-primary)]">
                {(quotaLimit - quotaUsed).toLocaleString()}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-2">
                of {quotaLimit.toLocaleString()} total
              </div>
            </div>

            <div className="p-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-raised)]">
              <div className="text-sm font-semibold uppercase text-[var(--color-text-muted)] mb-2">
                Quota Usage
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-[var(--color-text-primary)]">
                  {quotaPercentage}%
                </div>
                {quotaPercentage > 80 && (
                  <div className="px-2 py-1 rounded bg-[#fee2e2] text-[#991b1b] text-xs font-semibold">
                    Warning
                  </div>
                )}
              </div>
              <div className="mt-3 w-full bg-[var(--color-bg-subtle)] rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-colors ${
                    quotaPercentage > 80
                      ? 'bg-[#dc2626]'
                      : quotaPercentage > 60
                      ? 'bg-[#f59e0b]'
                      : 'bg-[#10b981]'
                  }`}
                  style={{ width: `${quotaPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Usage Over Time Chart */}
          <div className="mb-8 p-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-raised)]">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">
              Requests Over Time (Last 7 Days)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                <XAxis dataKey="date" stroke="var(--color-text-muted)" />
                <YAxis stroke="var(--color-text-muted)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-subtle)',
                    border: '1px solid var(--color-border-default)',
                  }}
                  labelStyle={{ color: 'var(--color-text-primary)' }}
                />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="var(--color-accent-fill)"
                  fill="var(--color-accent-surface)"
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Per-Key Usage Chart */}
          {keyUsageData.length > 0 && (
            <div className="mb-8 p-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-raised)]">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">
                Usage by API Key
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={keyUsageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                  <XAxis dataKey="name" stroke="var(--color-text-muted)" />
                  <YAxis stroke="var(--color-text-muted)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-bg-subtle)',
                      border: '1px solid var(--color-border-default)',
                    }}
                    labelStyle={{ color: 'var(--color-text-primary)' }}
                  />
                  <Legend />
                  <Bar dataKey="usage" fill="var(--color-accent-fill)" />
                  <Bar dataKey="limit" fill="var(--color-border-default)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Key Management Section */}
          <div className="p-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] mb-8">
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                API Key Management
              </h2>
            </div>

            {/* Create key form */}
            <form onSubmit={handleCreateKey} className="flex gap-2 mb-6 items-center flex-wrap">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Key name (e.g. Staging Key)"
                className="flex-1 min-w-[14rem] rounded-lg border border-[var(--color-border-default)] px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded-lg bg-[var(--color-accent-fill)] hover:bg-[var(--color-accent-fill-hover)] text-white font-bold text-sm px-4 py-2 transition-colors"
              >
                Create API Key
              </button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="developer-keys-table">
                <thead>
                  <tr className="border-b border-[var(--color-border-default)]">
                    <th className="text-left py-3 px-4 font-semibold text-[var(--color-text-primary)]">
                      Key Name
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--color-text-primary)]">
                      API Key
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--color-text-primary)]">
                      Created
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-[var(--color-text-primary)]">
                      Usage
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-[var(--color-text-primary)]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((key) => {
                    const percentage = (key.usage / key.limit) * 100;
                    return (
                      <tr
                        key={key.id}
                        className="border-b border-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-subtle)] transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-[var(--color-text-primary)]">
                          {key.name}
                        </td>
                        <td className="py-3 px-4 mono text-xs text-[var(--color-text-secondary)]">
                          {key.key}
                        </td>
                        <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                          {key.created}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="text-[var(--color-text-primary)] font-semibold">
                            {key.usage.toLocaleString()} / {key.limit.toLocaleString()}
                          </div>
                          <div className="text-xs text-[var(--color-text-muted)] mt-1">
                            {percentage.toFixed(1)}% used
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteKey(key.id)}
                            className="text-xs font-semibold text-[var(--color-error-text)] hover:underline"
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Information Box */}
      <div className="mt-8 p-6 rounded-lg border border-[var(--color-accent-fill)]/20 bg-[var(--color-bg-subtle)]">
        <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">
          About Wallet-Protected Keys
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-3">
          API keys are associated 1:1 with your wallet address as your identity. Disconnecting your wallet protects your keys from display without deleting them.
        </p>
      </div>
    </div>
  );
}
