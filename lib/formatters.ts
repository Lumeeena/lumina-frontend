export function truncateAddress(address: string, chars = 4): string {
  if (!address || address.length < chars * 2 + 3) return address;
  return `${address.slice(0, chars + 1)}...${address.slice(-chars)}`;
}

export function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function absoluteTime(isoString: string): string {
  return new Date(isoString).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

export function formatXLM(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 });
}

/**
 * Format an amount given in the stake token's smallest unit (stroops — XLM has
 * 7 decimals) as a grouped decimal string.
 *
 * Registry stake and slash amounts are i128 on-chain, which JSON cannot carry
 * exactly as a number, so they arrive as bigint/number/string of stroops.
 * Staking is configured by governance with a SEP-41 token — native XLM via its
 * Stellar Asset Contract is the expected one, hence 7 decimals.
 */
export function formatStroops(stroops: bigint | number | string): string {
  const value = BigInt(stroops);
  // BigInt literals need an ES2020 target; this project builds for ES2017.
  const zero = BigInt(0);
  const negative = value < zero;
  const abs = negative ? -value : value;
  const whole = abs / 10_000_000n;
  const frac = (abs % 10_000_000n).toString().padStart(7, "0").replace(/0+$/, "");
  const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}${grouped}${frac ? `.${frac}` : ""}`;
}

export function formatOperationType(type: string): string {
  return type
    .split("_")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
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

export function getOperationColor(type: string): string {
  return opColors[type] ?? "text-slate-400";
}
