import { getLocale } from "@/lib/i18n";

/**
 * Truncate a blockchain address/hash for display.
 *
 * If the address is short (less than `chars*2 + 3` characters), it is returned
 * unchanged. Otherwise it is shown as `prefix...suffix` with `chars+1` leading
 * chars and `chars` trailing chars.
 *
 * @param address - Full address/string to truncate.
 * @param chars - Number of trailing characters to preserve (default: 4). Leading preserved is `chars+1`.
 * @returns Truncated string or original if too short.
 */
export function truncateAddress(address: string, chars = 4): string {
  if (!address || address.length < chars * 2 + 3) return address;
  return `${address.slice(0, chars + 1)}...${address.slice(-chars)}`;
}

/**
 * Format an ISO timestamp as a short relative time string (e.g. "2h ago", "in 3d").
 *
 * Uses `Intl.RelativeTimeFormat` with the app locale from {@link getLocale} and
 * style `"short"`, numeric `"auto"`. Chooses the largest unit (seconds/minutes/hours/days)
 * based on elapsed time from `Date.now()`.
 *
 * @param isoString - ISO 8601 timestamp string.
 * @returns Localized short relative time string.
 */
export function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  const locale = getLocale();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });

  if (seconds < 60) return rtf.format(-seconds, "second");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.floor(hours / 24);
  return rtf.format(-days, "day");
}

/**
 * Format an ISO timestamp as an absolute localized date/time string.
 *
 * Uses `Intl.DateTimeFormat` with the app locale from {@link getLocale},
 * including year, month (short), day, hour/minute/second (2-digit), and
 * short time zone name.
 *
 * @param isoString - ISO 8601 timestamp string.
 * @returns Localized absolute date/time string.
 */
export function absoluteTime(isoString: string): string {
  return new Intl.DateTimeFormat(getLocale(), {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).format(new Date(isoString));
}

/**
 * Format an XLM amount (as a decimal string) for display.
 *
 * Parses with `parseFloat` and formats with `Intl.NumberFormat` using the app
 * locale. Uses minimum 2 fractional digits and maximum 7 fractional digits.
 * If parsing fails (returns `NaN`), the original `amount` string is returned
 * unchanged as a fallback.
 *
 * @param amount - String representation of the amount in XLM.
 * @returns Localized formatted amount string, or original string if unparseable.
 */
export function formatXLM(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return new Intl.NumberFormat(getLocale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 7,
  }).format(num);
}

/**
 * Format an amount given in the stake token's smallest unit (stroops — XLM has
 * 7 decimals) as a grouped decimal string.
 *
 * Registry stake and slash amounts are i128 on-chain, which JSON cannot carry
 * exactly as a number, so they arrive as bigint/number/string of stroops.
 * Staking is configured by governance with a SEP-41 token — native XLM via its
 * Stellar Asset Contract is the expected one, hence 7 decimals.
 *
 * Converts via `BigInt`, handles negative values, groups the whole part with
 * locale-aware thousand separators, and trims trailing zeros from the fractional
 * part (omitting the decimal point if the fractional part becomes empty).
 *
 * @param stroops - Amount in stroops (smallest unit), as `bigint`, `number`, or decimal string.
 * @returns Formatted string with up to 7 decimal places, trimmed.
 */
export function formatStroops(stroops: bigint | number | string): string {
  const value = BigInt(stroops);
  // BigInt literals need an ES2020 target; this project builds for ES2017.
  const zero = BigInt(0);
  const one = BigInt(10_000_000);
  const negative = value < zero;
  const abs = negative ? -value : value;
  const whole = abs / one;
  const frac = (abs % one).toString().padStart(7, "0").replace(/0+$/, "");
  const wholeFormatted = new Intl.NumberFormat(getLocale()).format(Number(whole));
  return `${negative ? "-" : ""}${wholeFormatted}${frac ? `.${frac}` : ""}`;
}

/**
 * Format an operation type name for display.
 *
 * Splits on underscores and capitalizes each word (e.g. `"path_payment_strict_send"`
 * becomes `"Path Payment Strict Send"`).
 *
 * @param type - Operation type identifier (snake_case).
 * @returns Human-readable formatted operation type.
 */
export function formatOperationType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const opColors: Record<string, string> = {
  payment: "text-green-400",
  create_account: "text-blue-400",
  path_payment_strict_send: "text-purple-400",
  path_payment_strict_receive: "text-purple-400",
  manage_sell_offer: "text-amber-400",
  manage_buy_offer: "text-amber-400",
  change_trust: "text-cyan-400",
  invoke_host_function: "text-pink-400",
  set_options: "text-slate-400",
};

/**
 * Get the Tailwind CSS color class for an operation type.
 *
 * Looks up the type in a predefined mapping; unknown types fall back to
 * `"text-slate-400"`.
 *
 * @param type - Operation type identifier.
 * @returns Tailwind CSS color class string.
 */
export function getOperationColor(type: string): string {
  return opColors[type] ?? "text-slate-400";
}
