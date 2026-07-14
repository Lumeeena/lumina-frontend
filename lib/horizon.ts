// Stellar public Horizon instance — swap for testnet: https://horizon-testnet.stellar.org
const HORIZON = "https://horizon.stellar.org";

export interface HorizonTransaction {
  id: string;
  hash: string;
  ledger: number;
  created_at: string;
  source_account: string;
  fee_charged: string;
  operation_count: number;
  successful: boolean;
  memo_type: string;
  memo?: string;
}

export interface HorizonOperation {
  id: string;
  type: string;
  created_at: string;
  transaction_hash: string;
  source_account: string;
  [key: string]: unknown;
}

export interface Balance {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
  limit?: string;
}

export interface HorizonAccount {
  id: string;
  account_id: string;
  sequence: string;
  subentry_count: number;
  last_modified_ledger: number;
  num_sponsored: number;
  num_sponsoring: number;
  balances: Balance[];
  thresholds: { low_threshold: number; med_threshold: number; high_threshold: number };
  flags: { auth_required: boolean; auth_revocable: boolean; auth_immutable: boolean };
}

export interface LedgerStats {
  sequence: number;
  closed_at: string;
  successful_transaction_count: number;
  failed_transaction_count: number;
  operation_count: number;
}

async function safeGet<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 10 } }); // 10-second cache for SSR pages
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getRecentTransactions(limit = 20): Promise<HorizonTransaction[]> {
  type Response = { _embedded: { records: HorizonTransaction[] } };
  const data = await safeGet<Response>(`${HORIZON}/transactions?order=desc&limit=${limit}`);
  return data?._embedded?.records ?? [];
}

export async function getAccount(address: string): Promise<HorizonAccount | null> {
  return safeGet<HorizonAccount>(`${HORIZON}/accounts/${address}`);
}

export async function getAccountTransactions(address: string, limit = 10): Promise<HorizonTransaction[]> {
  type Response = { _embedded: { records: HorizonTransaction[] } };
  const data = await safeGet<Response>(`${HORIZON}/accounts/${address}/transactions?order=desc&limit=${limit}`);
  return data?._embedded?.records ?? [];
}

export async function getAccountOperations(address: string, limit = 10): Promise<HorizonOperation[]> {
  type Response = { _embedded: { records: HorizonOperation[] } };
  const data = await safeGet<Response>(`${HORIZON}/accounts/${address}/operations?order=desc&limit=${limit}`);
  return data?._embedded?.records ?? [];
}

export async function getLatestLedger(): Promise<LedgerStats | null> {
  type Response = { _embedded: { records: LedgerStats[] } };
  const data = await safeGet<Response>(`${HORIZON}/ledgers?order=desc&limit=1`);
  return data?._embedded?.records?.[0] ?? null;
}
