"use client";

import { useCallback, useState } from "react";
import { useSubscription } from "@/lib/useSubscription";
import type { Operation } from "@/lib/types";
import { truncateAddress, timeAgo } from "@/lib/formatters";
import ConnectionIndicator from "./ConnectionIndicator";

const ACCOUNT_ACTIVITY_SUBSCRIPTION = `
  subscription AccountActivity($address: String!) {
    accountActivity(address: $address) {
      id
      type
      createdAt
      transactionHash
      sourceAccount
      from
      to
      amount
      asset
    }
  }
`;

/** Cap, for the same reason `LiveFeed` has one: a long-lived tab. */
export const MAX_ACTIVITY_LENGTH = 25;

/**
 * Live operation stream for one account.
 *
 * The account page is a server component, so this is extracted as a client
 * subcomponent — the same split the page already uses for `CopyAddressButton`.
 * It renders nothing until the first operation arrives, so an account with no
 * activity does not get an empty box implying something failed.
 */
export default function AccountActivityFeed({ address }: { address: string }) {
  const [operations, setOperations] = useState<Operation[]>([]);

  const prepend = useCallback(
    (data: { accountActivity: Operation }) => {
      const operation = data?.accountActivity;
      if (!operation) return;
      // The server filters by address, but this section is labelled as being
      // about *this* account — so anything else is dropped rather than shown
      // under a heading that would make it wrong.
      if (operation.sourceAccount !== address && operation.from !== address && operation.to !== address) {
        return;
      }
      setOperations(current => {
        if (current.some(existing => existing.id === operation.id)) return current;
        return [operation, ...current].slice(0, MAX_ACTIVITY_LENGTH);
      });
    },
    [address],
  );

  const { state } = useSubscription<{ accountActivity: Operation }>(
    ACCOUNT_ACTIVITY_SUBSCRIPTION,
    { address },
    prepend,
  );

  // No live connection and nothing received: the section has nothing to say,
  // and the page's server-rendered transaction table already covers history.
  if (operations.length === 0 && (state === "disconnected" || state === "unsupported")) {
    return null;
  }

  return (
    <div className="mb-9" data-testid="account-activity">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-extrabold text-base text-[#0e0e12]">Live Activity</h2>
        <ConnectionIndicator state={state} />
      </div>

      <div className="rounded-xl border border-[#e5e3ea] overflow-hidden">
        {operations.length === 0 ? (
          <div className="p-6 text-center text-[#a6a3b0] text-sm">
            Waiting for new activity on this account&hellip;
          </div>
        ) : (
          operations.map(operation => (
            <div
              key={operation.id}
              className="flex items-center gap-3 px-4 py-2.5 border-b border-[#f0eff3] last:border-0"
            >
              <span className="text-[11px] font-semibold rounded-full bg-[#f3effe] text-[#6d28d9] px-2.5 py-0.5 shrink-0">
                {operation.type}
              </span>
              <a
                href={`https://stellar.expert/explorer/public/tx/${operation.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mono text-xs text-[#7c3aed] hover:text-[#6d28d9] hover:underline transition-colors"
              >
                {truncateAddress(operation.transactionHash, 5)}
              </a>
              {operation.amount && (
                <span className="mono text-xs text-[#0e0e12]">
                  {operation.amount} {operation.asset ?? "XLM"}
                </span>
              )}
              <span className="ml-auto text-[11px] text-[#c3c1cb]">{timeAgo(operation.createdAt)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
