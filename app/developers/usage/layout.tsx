import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Usage Dashboard — Lumina',
  description: 'Monitor your Lumina API key consumption, rate limits, and quota analytics.',
};

export default function UsageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="w-full max-w-full overflow-hidden sm:overflow-visible">{children}</div>;
}
