/** Plain-language next steps for failures shown to a user. */
export function transactionRecovery(message: string): string {
  if (/submitted|confirm|pending|timed? out/i.test(message)) {
    return "Check the transaction in your wallet or transaction history before submitting again; it may already be on the network.";
  }
  if (/unsupported|not implemented|forbidden|permission denied|unauthorized/i.test(message)) {
    return "This action cannot complete with the current wallet or network. Use a supported wallet and network before trying again.";
  }
  if (/declin|reject.*wallet|cancel/i.test(message)) {
    return "Approve the request in your wallet, then submit again when ready.";
  }
  if (/insufficient|balance|reserve|fee/i.test(message)) {
    return "Check your wallet balance and keep enough XLM for the network fee before trying again.";
  }
  if (/invalid|not found|unknown contract|simulation/i.test(message)) {
    return "Check the contract ID and transaction details, then correct them before submitting again.";
  }
  return "Check your wallet connection and transaction details, then try again.";
}

export function queryRecovery(message: string, throttled = false): string {
  if (throttled) return "Wait for the rate limit to reset before running the query again.";
  if (/syntax|validation|field|variable|parse/i.test(message)) {
    return "Check the query and variables, then run it again.";
  }
  return "Check your connection, then run the query again.";
}
