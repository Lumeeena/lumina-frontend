import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Getting Started — Lumina',
  description: 'Step-by-step guide to making your first Lumina GraphQL request, pagination, and error handling.',
};

export default function GettingStartedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="w-full max-w-full overflow-hidden sm:overflow-visible">{children}</div>;
}
