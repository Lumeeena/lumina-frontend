/**
 * Skip link for keyboard accessibility.
 *
 * Allows keyboard users to skip directly to main content without tabbing through
 * navigation. Visible only on focus to avoid cluttering the visual design.
 */
export default function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-[#7c3aed] focus:text-white focus:px-4 focus:py-2 focus:rounded focus:font-semibold"
    >
      Skip to main content
    </a>
  );
}
