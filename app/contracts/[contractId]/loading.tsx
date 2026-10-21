export default function Loading() {
  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <div className="h-8 w-48 bg-[var(--color-bg-subtle)] rounded mb-4 animate-pulse" />
      <div className="h-4 w-64 bg-[var(--color-bg-subtle)] rounded mb-8 animate-pulse" />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] rounded-xl p-4 animate-pulse h-24" />
      </div>

      <div className="h-6 w-40 bg-[var(--color-bg-subtle)] rounded mb-3 animate-pulse" />
      <div className="rounded-xl border border-[var(--color-border-default)] overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-start text-[11px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] px-3 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]">
                Key
              </th>
              <th className="text-start text-[11px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] px-3 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]">
                Durability
              </th>
              <th className="text-start text-[11px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] px-3 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]">
                Value
              </th>
              <th className="text-start text-[11px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] px-3 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]">
                Last Modified
              </th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b border-[var(--color-bg-overlay)]">
                <td className="py-2.5 px-3">
                  <div className="h-4 bg-[var(--color-bg-subtle)] rounded animate-pulse" />
                </td>
                <td className="py-2.5 px-3">
                  <div className="h-4 bg-[var(--color-bg-subtle)] rounded animate-pulse w-20" />
                </td>
                <td className="py-2.5 px-3">
                  <div className="h-4 bg-[var(--color-bg-subtle)] rounded animate-pulse w-32" />
                </td>
                <td className="py-2.5 px-3">
                  <div className="h-4 bg-[var(--color-bg-subtle)] rounded animate-pulse w-16" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
