/**
 * Registration history, derived from the Registry contract's own events.
 *
 * The contract stores current state only — `ContractEntry.active` is a boolean,
 * not a log — so "when was this deactivated?" cannot be answered by reading it.
 * But the contract emits `contract_registered`, `contract_deactivated`,
 * `metadata_updated` and `ownership_transferred` as it goes, and the backend
 * already indexes contract events. Querying those with
 * `contractId = <the registry itself>` gives the history back.
 *
 * The events are emitted *by* the registry and *about* a registered contract,
 * so every entry here carries a `subject`: the contract the event concerns,
 * which is not the same as `ContractEvent.contractId`.
 */
import type { ContractEvent } from "./types";

/**
 * Display categories produced by {@link parseRegistryEvents}: known registry
 * topics become their corresponding category, while missing or unrecognised
 * topics are retained as `unknown` rather than discarded.
 */
export type RegistryEventType =
  | "registered"
  | "deactivated"
  | "metadata-updated"
  | "ownership-transferred"
  | "unknown";

/**
 * A normalized registry event for history views. `subject` is the registered
 * contract the event concerns, not the registry contract that emitted it;
 * it is `null` when the payload does not identify a contract.
 */
export interface RegistryHistoryEntry {
  /** Backend event identifier. */
  id: string;
  /** Normalized event category, or `unknown` for an unrecognised topic. */
  type: RegistryEventType;
  /** The registered contract this event is about, or `null` if unavailable. */
  subject: string | null;
  /** Ledger in which the event was recorded. */
  ledger: number;
  /** Event creation timestamp as supplied by the backend. */
  createdAt: string;
  /** Best-effort decoded payload; malformed JSON is retained under `raw`. */
  detail: Record<string, unknown>;
}

const TOPIC_TO_TYPE: Record<string, RegistryEventType> = {
  contract_registered: "registered",
  contract_deactivated: "deactivated",
  metadata_updated: "metadata-updated",
  ownership_transferred: "ownership-transferred",
};

/**
 * Convert indexed events emitted by the Registry contract into history
 * entries, newest ledger first. Use this after fetching that contract's events
 * to build registry activity views; `subject` identifies the registered
 * contract affected by each event, not the event emitter.
 *
 * Tolerant by design: the `value` field arrives as a JSON string produced by
 * the indexer's ScVal decoding, and an event this version of the UI has never
 * seen must not break the page. Anything unrecognised becomes an `unknown`
 * entry rather than being dropped — a history with a gap in it is worse than
 * one with a row the UI renders plainly. Missing topics become `unknown`;
 * null values decode to an empty detail object, invalid JSON is kept as
 * `{ raw: value }`, and valid tuple payloads retain the tuple and expose its
 * first element as `contract_id`. A payload without a recognizable contract
 * identifier has a `null` subject.
 *
 * @param events Indexed contract events to normalize.
 * @returns One history entry per input event, sorted by descending ledger.
 */
export function parseRegistryEvents(
  events: ContractEvent[],
): RegistryHistoryEntry[] {
  return events.map(toHistoryEntry).sort((a, b) => b.ledger - a.ledger);
}

function toHistoryEntry(event: ContractEvent): RegistryHistoryEntry {
  const topic = event.topics?.[0] ?? "";
  const detail = decodeValue(event.value);

  return {
    id: event.id,
    type: TOPIC_TO_TYPE[stripSymbolQuotes(topic)] ?? "unknown",
    subject: subjectOf(detail),
    ledger: event.ledger,
    createdAt: event.createdAt,
    detail,
  };
}

/**
 * The indexer may hand topics back as bare symbols or as quoted/JSON-encoded
 * strings depending on how the ScVal was serialised. Normalise before matching
 * so a quoting change upstream doesn't silently turn every event into
 * `unknown`.
 */
function stripSymbolQuotes(topic: string): string {
  return topic.replace(/^"+|"+$/g, "").trim();
}

function decodeValue(value: string | null): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      // Events publish tuples; name the positions we know.
      return { tuple: parsed, contract_id: parsed[0] };
    }
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
    return { value: parsed };
  } catch {
    return { raw: value };
  }
}

function subjectOf(detail: Record<string, unknown>): string | null {
  for (const key of ["contract_id", "contractId", "contract"]) {
    const candidate = detail[key];
    if (typeof candidate === "string" && candidate) return candidate;
  }
  return null;
}

/**
 * Select the history entries concerning one registered contract. Matching is
 * exact on `subject`; the returned array preserves the input order (so parsed
 * history remains newest first), and is empty when no entries match.
 *
 * @param entries Normalized registry history entries to filter.
 * @param contractId Registered contract ID to match.
 * @returns A new array containing only entries whose subject equals `contractId`.
 */
export function historyFor(
  entries: RegistryHistoryEntry[],
  contractId: string,
): RegistryHistoryEntry[] {
  return entries.filter((entry) => entry.subject === contractId);
}

/**
 * Human-readable labels for each {@link RegistryEventType}, intended for
 * rendering event categories in registry history interfaces.
 */
export const REGISTRY_EVENT_LABELS: Record<RegistryEventType, string> = {
  registered: "Registered",
  deactivated: "Deactivated",
  "metadata-updated": "Metadata updated",
  "ownership-transferred": "Ownership transferred",
  unknown: "Registry event",
};
