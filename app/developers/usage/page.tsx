'use client';

import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const usageData = [
  { date: 'Mon', requests: 240 },
  { date: 'Tue', requests: 1398 },
  { date: 'Wed', requests: 9800 },
  { date: 'Thu', requests: 3908 },
  { date: 'Fri', requests: 4800 },
  { date: 'Sat', requests: 3800 },
  { date: 'Sun', requests: 4300 },
];

const keyUsageData = [
  { name: 'Production Key', usage: 8500, limit: 10000 },
  { name: 'Testing Key', usage: 2100, limit: 10000 },
  { name: 'Development Key', usage: 1450, limit: 10000 },
];

export default function UsageDashboardPage() {
  const totalRequests = usageData.reduce((sum, day) => sum + day.requests, 0);
  const maxRequests = Math.max(...usageData.map(d => d.requests));
  const quotaLimit = 50000;
  const quotaUsed = totalRequests;
  const quotaPercentage = Math.round((quotaUsed / quotaLimit) * 100);

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-4">
          Usage Dashboard
        </h1>
        <p className="text-lg text-[var(--color-text-secondary)]">
          Monitor your API key usage and quota consumption. Includes historical trends
          and per-key breakdowns.
        </p>
      </div>

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
        <p className="text-sm text-[var(--color-text-muted)] mt-4">
          This chart shows your total API requests for each day over the past week.
        </p>
      </div>

      {/* Per-Key Usage Chart */}
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
        <p className="text-sm text-[var(--color-text-muted)] mt-4">
          Each bar shows your usage (blue) versus quota limit (gray) for each API key.
        </p>
      </div>

      {/* Key Details Table */}
      <div className="p-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-raised)]">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">
          API Key Details
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-default)]">
                <th className="text-left py-3 px-4 font-semibold text-[var(--color-text-primary)]">
                  Key Name
                </th>
                <th className="text-left py-3 px-4 font-semibold text-[var(--color-text-primary)]">
                  Created
                </th>
                <th className="text-left py-3 px-4 font-semibold text-[var(--color-text-primary)]">
                  Last Used
                </th>
                <th className="text-right py-3 px-4 font-semibold text-[var(--color-text-primary)]">
                  Usage
                </th>
                <th className="text-right py-3 px-4 font-semibold text-[var(--color-text-primary)]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {keyUsageData.map((key) => {
                const percentage = (key.usage / key.limit) * 100;
                const statusColor =
                  percentage > 80
                    ? 'text-red-600'
                    : percentage > 60
                    ? 'text-amber-600'
                    : 'text-green-600';

                return (
                  <tr
                    key={key.name}
                    className="border-b border-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-subtle)] transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-[var(--color-text-primary)]">
                      {key.name}
                    </td>
                    <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                      Sep 1, 2026
                    </td>
                    <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                      Today, 2:30 PM
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="text-[var(--color-text-primary)] font-semibold">
                        {key.usage.toLocaleString()} / {key.limit.toLocaleString()}
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)] mt-1">
                        {percentage.toFixed(1)}% used
                      </div>
                    </td>
                    <td className={`py-3 px-4 text-right font-semibold ${statusColor}`}>
                      {percentage > 80
                        ? 'Warning'
                        : percentage > 60
                        ? 'Moderate'
                        : 'Healthy'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Information Box */}
      <div className="mt-8 p-6 rounded-lg border border-[var(--color-accent-fill)]/20 bg-[var(--color-bg-subtle)]">
        <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">
          About Quota Limits
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-3">
          Your quota resets monthly. You can view your current plan details in your account settings.
        </p>
        <ul className="text-sm text-[var(--color-text-secondary)] space-y-1 ml-4">
          <li>• Free tier: 10,000 requests/month</li>
          <li>• Pro tier: 1,000,000 requests/month</li>
          <li>• Contact us for enterprise pricing</li>
        </ul>
      </div>
    </div>
  );
}
