'use client';

import { useEffect, useState } from "react";
import { Contract, nativeToScVal, rpc, TransactionBuilder } from "@stellar/stellar-sdk";
import { getActiveContracts, NETWORK_PASSPHRASE, REGISTRY_CONTRACT_ID, RegistryEntry, SOROBAN_RPC_URL } from "@/lib/registry";
import { connectWallet, getConnectedAddress, signWithWallet } from "@/lib/wallet";
import { truncateAddress } from "@/lib/formatters";

type SubmitState = "idle" | "building" | "awaiting-signature" | "submitting" | "success" | "error";

export default function RegistryPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [entries, setEntries] = useState<RegistryEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [entriesError, setEntriesError] = useState<string | null>(null);

  const [regContractId, setRegContractId] = useState("");
  const [regName, setRegName] = useState("");
  const [regDescription, setRegDescription] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  async function loadEntries() {
    setEntriesLoading(true);
    setEntriesError(null);
    try {
      const result = await getActiveContracts();
      setEntries(result);
    } catch (err) {
      setEntriesError(err instanceof Error ? err.message : "Couldn't reach the registry contract.");
    } finally {
      setEntriesLoading(false);
    }
  }

  useEffect(() => {
    loadEntries();
    getConnectedAddress().then(setWalletAddress);
  }, []);

  async function handleConnect() {
    setConnecting(true);
    setConnectError(null);
    const result = await connectWallet();
    if ("error" in result) {
      setConnectError(result.error);
    } else {
      setWalletAddress(result.address);
    }
    setConnecting(false);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!walletAddress || !regContractId || !regName) return;

    setSubmitState("building");
    setSubmitMessage("");
    try {
      const server = new rpc.Server(SOROBAN_RPC_URL);
      const account = await server.getAccount(walletAddress);
      const contract = new Contract(REGISTRY_CONTRACT_ID);
      const tx = new TransactionBuilder(account, { fee: "1000000", networkPassphrase: NETWORK_PASSPHRASE })
        .addOperation(
          contract.call(
            "register_contract",
            nativeToScVal(walletAddress, { type: "address" }),
            nativeToScVal(regContractId.trim(), { type: "address" }),
            nativeToScVal(regName.trim(), { type: "string" }),
            nativeToScVal(regDescription.trim() || "No description provided.", { type: "string" })
          )
        )
        .setTimeout(60)
        .build();

      const sim = await server.simulateTransaction(tx);
      if (rpc.Api.isSimulationError(sim)) {
        throw new Error(sim.error);
      }
      const prepared = rpc.assembleTransaction(tx, sim).build();

      setSubmitState("awaiting-signature");
      const { signedTxXdr } = await signWithWallet(prepared.toXDR(), {
        networkPassphrase: NETWORK_PASSPHRASE,
        address: walletAddress,
      });

      setSubmitState("submitting");
      const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
      const sendResult = await server.sendTransaction(signedTx);
      if (sendResult.status === "ERROR") {
        throw new Error("The network rejected the transaction.");
      }

      let status: string = sendResult.status;
      for (let i = 0; i < 15 && status === "PENDING"; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const polled = await server.getTransaction(sendResult.hash);
        status = polled.status;
      }
      if (status !== "SUCCESS") {
        throw new Error(`Transaction did not succeed (status: ${status}).`);
      }

      setSubmitState("success");
      setSubmitMessage(`${regName} registered — Lumina will begin indexing shortly.`);
      setRegContractId("");
      setRegName("");
      setRegDescription("");
      loadEntries();
    } catch (err) {
      setSubmitState("error");
      setSubmitMessage(err instanceof Error ? err.message : "Registration failed.");
    }
  }

  const submitting = submitState === "building" || submitState === "awaiting-signature" || submitState === "submitting";
  const submitLabel: Record<SubmitState, string> = {
    idle: "Register Contract",
    building: "Preparing transaction…",
    "awaiting-signature": "Approve in your wallet…",
    submitting: "Submitting…",
    success: "Register Contract",
    error: "Register Contract",
  };

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <h1 className="font-extrabold text-3xl mb-2 text-[#0e0e12]">Lumina Registry</h1>
      <p className="text-[#6b6975] mb-8 max-w-[70ch]">
        An on-chain Soroban manifest of contracts Lumina indexes. Register your contract to opt into priority indexing — permissionless, on Stellar/Soroban testnet.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 items-start">
        <div className="border border-[#e5e3ea] rounded-2xl p-6 bg-[#fafafa]">
          <h2 className="font-extrabold text-base mb-[18px] text-[#0e0e12]">Register a Contract</h2>

          {!walletAddress ? (
            <div className="flex flex-col gap-3">
              <p className="text-[13px] text-[#6b6975]">Connect a wallet to register a contract.</p>
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 text-white font-bold text-sm py-3 rounded-lg transition-colors"
              >
                {connecting ? "Connecting…" : "Connect Wallet"}
              </button>
              {connectError && <div className="text-xs text-[#dc2626] bg-[#fef2f2] rounded-lg px-3 py-2">{connectError}</div>}
            </div>
          ) : (
            <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
              <div className="text-xs text-[#6b6975] bg-white border border-[#e5e3ea] rounded-lg px-3 py-2 mono break-all">
                Connected: {truncateAddress(walletAddress, 6)}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6b6975] mb-1.5">Contract ID</label>
                <input
                  value={regContractId}
                  onChange={e => setRegContractId(e.target.value)}
                  placeholder="CABC...EXAMPLE"
                  className="w-full min-h-[42px] px-3 py-2 text-[13px] mono bg-white border border-[#e5e3ea] rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6b6975] mb-1.5">Project Name</label>
                <input
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="My Protocol"
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-white border border-[#e5e3ea] rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6b6975] mb-1.5">Description</label>
                <textarea
                  value={regDescription}
                  onChange={e => setRegDescription(e.target.value)}
                  rows={3}
                  placeholder="A DeFi protocol on Stellar"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#e5e3ea] rounded-lg resize-y"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 text-white font-bold text-sm py-3 rounded-lg mt-1 transition-colors"
              >
                {submitLabel[submitState]}
              </button>
              {submitState === "success" && (
                <div className="text-xs text-[#16a34a] bg-[#f0fdf4] rounded-lg px-3 py-2.5">{submitMessage}</div>
              )}
              {submitState === "error" && (
                <div className="text-xs text-[#dc2626] bg-[#fef2f2] rounded-lg px-3 py-2.5">{submitMessage}</div>
              )}
            </form>
          )}
        </div>

        <div>
          <h2 className="font-extrabold text-base mb-3.5 text-[#0e0e12]">Recently Registered</h2>
          {entriesLoading ? (
            <p className="text-sm text-[#a6a3b0]">Loading registry entries…</p>
          ) : entriesError ? (
            <p className="text-sm text-[#dc2626]">{entriesError}</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-[#a6a3b0]">No contracts registered yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {entries.map(entry => (
                <div key={entry.contractId} className="border border-[#e5e3ea] rounded-[10px] p-3.5 px-4">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-sm text-[#0e0e12]">{entry.name}</span>
                    <span className="mono text-[11px] text-[#a6a3b0]">{truncateAddress(entry.contractId, 5)}</span>
                  </div>
                  <p className="text-xs text-[#6b6975] m-0">{entry.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
