import type { MessageCatalogue } from "./types";

const en: MessageCatalogue = {
  // ── Route errors ──────────────────────────────────────────────────────
  "error.failedToLoadRoute": "Failed to load {route}",
  "error.routeRecoveryHint":
    "This is usually a temporary issue reaching the Stellar network. The rest of the app is still available.",
  "error.tryAgain": "Try again",
  "error.errorDigest": "Error digest: {digest}",

  // ── Backend unavailable ───────────────────────────────────────────────
  "error.backendUnavailableTitle": "Lumina data is temporarily unavailable",
  "error.backendUnavailableBody":
    "We couldn't reach the indexer. Check your connection or try again in a moment; your request has not been lost.",
  "error.retry": "Retry",
  "error.retrying": "Retrying\u2026",

  // ── Network status ────────────────────────────────────────────────────
  "status.offline":
    "You're offline. Showing already-loaded data; Lumina will refresh when you reconnect.",

  // ── 404 ───────────────────────────────────────────────────────────────
  "notFound.code": "404",
  "notFound.title": "Page not found",
  "notFound.body":
    "That address, hash, or route doesn't exist. Double-check the URL or use the Explorer to look up an account or transaction.",
  "notFound.openExplorer": "Open Explorer",
  "notFound.orGoTo": "Or go to",

  // ── Connection indicator ──────────────────────────────────────────────
  "connection.idle": "IDLE",
  "connection.connecting": "CONNECTING",
  "connection.live": "LIVE",
  "connection.reconnecting": "RECONNECTING",
  "connection.polling": "POLLING",
  "connection.explainIdle":
    "The feed is waiting to connect. The displayed data may not be current yet.",
  "connection.explainConnecting":
    "A live connection is opening. The feed shows the most recently loaded data until it connects.",
  "connection.explainConnected":
    "Transactions arrive as soon as the server publishes them, so the feed stays current.",
  "connection.explainReconnecting":
    "The live connection was interrupted. Existing data remains visible while Lumina reconnects.",
  "connection.explainDisconnected":
    "Live updates are unavailable. The feed refreshes every 30 seconds, so data may be up to 30 seconds old.",
  "connection.explainUnsupported":
    "This browser cannot receive live updates. The feed refreshes every 30 seconds, so data may be up to 30 seconds old.",
  "connection.reasonUnsupported": "live updates not supported here",
  "connection.reasonUnreachable": "server unreachable",
  "connection.reasonRefused": "server refused the connection",
  "connection.whatDoesMean": "What does {label} mean?",

  // ── Transaction explorer ──────────────────────────────────────────────
  "explorer.couldNotLoad": "Could not load more transactions.",
  "explorer.noTransactionsYet": "No transactions indexed yet.",
  "explorer.noMatchingFilters": "No transactions match these filters.",
  "explorer.filteredCount": "{filtered} of {total} loaded",
  "explorer.loadedCount": "{count} loaded",
  "explorer.loading": "Loading\u2026",
  "explorer.loadMore": "Load more",
  "explorer.endOfResults": "End of results",

  // ── Live feed ─────────────────────────────────────────────────────────
  "liveFeed.fetching": "Fetching live data...",
  "liveFeed.noTransactions": "No transactions found.",
  "liveFeed.updated": "Updated {time}",
  "liveFeed.pauseFeed": "Pause feed",
  "liveFeed.resumeFeed": "Resume feed",
  "liveFeed.resumeFeedCount": "Resume feed ({count})",
  "liveFeed.updatesWaiting":
    "{count} {count, plural, one {update} other {updates}} waiting",
  "liveFeed.updatesArrived":
    "{count} {count, plural, one {update} other {updates}} arrived while paused",
  "liveFeed.newTransactions":
    "{count} new {count, plural, one {transaction} other {transactions}}",

  // ── Account operations ────────────────────────────────────────────────
  "accountOps.noOperations": "No operations yet.",
  "accountOps.showingRecent": "Showing {count} of your recent operations",
  "accountOps.allOperations": "All {count} operations",
  "accountOps.couldNotLoad": "Could not load more operations.",
  "accountOps.endOfResults": "End of results",

  // ── Account transactions ──────────────────────────────────────────────
  "accountTxs.noTransactions": "No transactions yet.",
  "accountTxs.showingRecent": "Showing the {count} most recent transactions",
  "accountTxs.allTransactions": "All {count} transactions",
  "accountTxs.couldNotLoad": "Could not load more transactions.",
  "accountTxs.endOfResults": "End of results",

  // ── Account detail page ───────────────────────────────────────────────
  "account.breadcrumbExplorer": "Explorer",
  "account.breadcrumbAccounts": "Accounts",
  "account.notFoundTitle": "Account Not Found",
  "account.notFoundBody":
    "The address {address} does not exist on Stellar Mainnet, or has never been funded. Check the address and network, or fund the account before looking it up again.",
  "account.merged": "Merged",
  "account.lastModifiedLedger": "Last modified at ledger {ledger}",
  "account.statSequence": "Sequence",
  "account.statSubentries": "Subentries",
  "account.statSponsoring": "Sponsoring",
  "account.statSponsored": "Sponsored",
  "account.flagAuthRequired": "Auth Required",
  "account.flagAuthRevocable": "Auth Revocable",
  "account.flagAuthImmutable": "Auth Immutable",
  "account.flagAuthClawbackEnabled": "Clawback Enabled",
  "account.flagNone": "No Special Flags",
  "account.balancesTitle": "Balances",
  "account.balancesAriaLabel": "Account balances",
  "account.balanceAsset": "Asset",
  "account.balanceIssuer": "Issuer",
  "account.balanceBalance": "Balance",
  "account.balanceLimit": "Limit",
  "account.recentTransactions": "Recent Transactions",
  "account.tradesTitle": "Trades",
  "account.tradesUnavailable":
    "Trade history is unavailable. Check your connection and refresh this page to try again.",
  "account.recentOperations": "Recent Operations",
  "account.trustlinesTitle": "Trustline History",
  "account.trustlinesUnavailable":
    "Trustline history is unavailable. Check your connection and refresh this page to try again.",

  // ── Assets ────────────────────────────────────────────────────────────
  "assets.noAssetsYet":
    "No assets indexed yet. Once the indexer sees a balance or a transfer for an asset, it appears here.",
  "assets.searchPlaceholder": "Search loaded assets by code or issuer",
  "assets.orderBy": "Order by",
  "assets.holders": "Holders",
  "assets.volume": "Volume",
  "assets.couldNotLoad": "Could not load more assets.",
  "assets.noMatch": "No loaded asset matches \u201c{query}\u201d.",
  "assets.searchCoversLoaded":
    "That search covers the {count} {noun} loaded so far. Load more to widen it.",
  "assets.endOfAssets": "End of assets",
  "assets.thAsset": "Asset",
  "assets.thIssuer": "Issuer",
  "assets.thSupply": "Supply",
  "assets.thHolders": "Holders",

  // ── Copy button ───────────────────────────────────────────────────────
  "copy.copy": "Copy",
  "copy.copied": "Copied!",
  "copy.failed": "Failed",
  "copy.copyAddress": "Copy address to clipboard",
  "copy.copiedAddress": "Address copied to clipboard",
  "copy.copyHash": "Copy transaction hash to clipboard",
  "copy.copiedHash": "Transaction hash copied to clipboard",

  // ── Load more footer ──────────────────────────────────────────────────
  "loadMore.loadMore": "Load more",
  "loadMore.loading": "Loading\u2026",
  "loadMore.retry": "Retry",

  // ── Watch feed ────────────────────────────────────────────────────────
  "watch.liveActivity": "Live activity",
  "watch.emptyTitle": "You are not watching any addresses yet",
  "watch.emptyBody":
    "Use the bookmark next to any address to follow its activity here, and get an alert when something happens on it.",
  "watch.waiting": "Waiting for activity on your watched addresses\u2026",
  "watch.watchedAddresses":
    "{count} watched {count, plural, one {address} other {addresses}}",
  "watch.matchingAlerts":
    "{count} matching {count, plural, one {alert} other {alerts}} this session",
  "watch.alert": "alert",

  // ── Register contract form ────────────────────────────────────────────
  "register.contractId": "Contract ID",
  "register.projectName": "Project Name",
  "register.description": "Description",
  "register.categoriesLabel": "Categories",
  "register.categoriesHint": "(pick at least one)",
  "register.selectCategory": "Select at least one category.",
  "register.registerContract": "Register Contract",
  "register.preparingTransaction": "Preparing transaction\u2026",
  "register.approveInWallet": "Approve in your wallet\u2026",
  "register.submitting": "Submitting\u2026",
  "register.confirming": "Confirming\u2026",
  "register.successMessage":
    "{name} registered \u2014 Lumina will begin indexing shortly.",
  "register.registrationFailed": "Registration failed.",
  "register.estimatedFee": "Estimated fee: {fee} XLM",

  // ── Owner contracts ───────────────────────────────────────────────────
  "owner.loadingContracts": "Loading your contracts\u2026",
  "owner.noContracts": "You haven't registered any contracts yet.",
  "owner.noContractsHint":
    "Register one with the form to opt it into Lumina indexing.",
  "owner.deactivate": "Deactivate",
  "owner.preparing": "Preparing\u2026",
  "owner.approveInWallet": "Approve in wallet\u2026",
  "owner.active": "Active",
  "owner.deactivated": "Deactivated",
  "owner.staking": "Staking\u2026",
  "owner.stake": "Stake",
  "owner.stakeAnyway": "Stake anyway",
  "owner.reserveWarningTitle":
    "This stake would take your account below its minimum balance.",
  "owner.reserveExplanation":
    "Stellar keeps a minimum amount of XLM in every account, called the reserve. It is 1 XLM for an account with nothing else in it, plus 0.5 XLM for each trustline, offer or other entry it owns, and that part cannot be spent. After this stake your account would hold {remaining} XLM, below the {minimum} XLM reserve. An account under its reserve can still receive XLM but cannot send transactions until it is topped up.",
  "owner.withdrawing": "Withdrawing\u2026",
  "owner.withdrawStake": "Withdraw stake",
  "owner.stakeAmountLabel": "Stake amount for {name}",
  "owner.stakeAmountPlaceholder": "Amount (base units)",
  "owner.invalidStakeAmount":
    "Enter a whole amount greater than zero, in the stake token's base units.",
  "owner.stakingFailed": "Staking failed.",
  "owner.withdrawalFailed": "Withdrawal failed.",
  "owner.deactivationFailed": "Deactivation failed.",
  "owner.hideHistory": "Hide history",
  "owner.historyCount": "History ({count})",
  "owner.noRegistryEvents": "No registry events indexed for this contract yet.",
  "owner.slashHistory": "Slash history",
  "owner.lifetimeSlashed": "Lifetime slashed: {amount} XLM",
  "owner.loadingSlashHistory": "Loading slash history\u2026",
  "owner.couldNotLoadSlashHistory": "Could not load slash history.",
  "owner.noSlashes": "No slashes recorded.",
  "owner.withdrawBlockerActive":
    "Deactivate this registration first; stake can only be withdrawn once it is deactivated.",
  "owner.withdrawBlockerLocked":
    "A slash landed recently, so withdrawal is locked until ledger {until} (currently {current}, {remaining} to go).",
  "owner.withdrawBlockerNoStake": "There is no stake to withdraw.",
  "owner.staked": "Staked",
  "owner.ledgerPrefix": "ledger",
  "owner.slashHistoryRetryHint": "Check your connection, then retry.",
  "owner.retrySlashHistory": "Retry slash history",

  // ── Registry event labels ─────────────────────────────────────────────
  "registryEvent.registered": "Registered",
  "registryEvent.deactivated": "Deactivated",
  "registryEvent.metadataUpdated": "Metadata updated",
  "registryEvent.ownershipTransferred": "Ownership transferred",
  "registryEvent.unknown": "Registry event",

  // ── Soroban transaction pipeline ──────────────────────────────────────
  "soroban.couldNotPrepare": "Could not prepare the transaction.",
  "soroban.signatureDeclined": "Signature was declined in your wallet.",
  "soroban.couldNotSign":
    "Could not sign the transaction. Check your wallet and try again.",
  "soroban.retrySignature": "Retry signature",
  "soroban.prepareAgain":
    "The saved transaction is no longer usable. Submit again to prepare a fresh transaction; your inputs are saved.",
  "soroban.rejectionPreserved":
    "Signature declined. Your inputs and prepared transaction are saved. You can retry when ready.",
  "soroban.networkRejected": "The network rejected the transaction.",
  "soroban.pendingConfirmation":
    "The transaction was submitted but has not confirmed yet. Check again in a moment.",
  "soroban.transactionFailed":
    "The transaction did not succeed (status: {status}).",

  // ── Pending transactions ──────────────────────────────────────────────
  "pending.title": "Transactions",
  "pending.register": "Register {name}",
  "pending.deactivate": "Deactivate {contract}",
  "pending.stake": "Stake on {contract}",
  "pending.withdraw": "Withdraw stake from {contract}",
  "pending.building": "Preparing",
  "pending.awaitingSignature": "Waiting for your wallet",
  "pending.submitting": "Submitting",
  "pending.confirming": "Confirming on the network",
  "pending.succeeded": "Confirmed",
  "pending.failed": "Failed",
  "pending.failedFallback": "The transaction did not complete.",
  "pending.dismiss": "Dismiss",

  // ── Stats ─────────────────────────────────────────────────────────────
  "stats.noOperationsYet": "No operations indexed yet.",

  // ── Events ────────────────────────────────────────────────────────────
  "events.noEventsYet":
    "No events indexed for this contract yet. Event indexing is opt-in on the indexer (INDEXED_CONTRACT_IDS/REGISTRY_CONTRACT_ID) \u2014 see the lumina-backend README.",

  // ── Search ────────────────────────────────────────────────────────────
  "search.noMemoMatch":
    "No transactions carry anything like this memo. Memo search matches order references and short codes \u2014 try a few characters of it.",

  // ── Activity labels ───────────────────────────────────────────────────
  "activity.indexed": "Indexed activity",
  "activity.noEvents": "No events yet",
  "activity.unknown": "Activity unknown",

  // ── Table headers ─────────────────────────────────────────────────────
  "table.hash": "Hash",
  "table.ledger": "Ledger",
  "table.ops": "Ops",
  "table.time": "Time",
  "table.type": "Type",
  "table.transaction": "Transaction",
  "table.detail": "Detail",
  "table.source": "Source",
  "table.operations": "Operations",
  "table.fee": "Fee",
  "table.contract": "Contract",
  "table.topic": "Topic",
  "table.value": "Value",

  // ── Common UI ─────────────────────────────────────────────────────────
  "common.search": "Search",
  "common.close": "Close",
  "common.clear": "Clear",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.loading": "Loading\u2026",
  "common.error": "Error",
  "common.retry": "Retry",
  "common.connect": "Connect Wallet",
  "common.disconnect": "Disconnect",
  "common.copy": "Copy",
  "common.copied": "Copied!",
  "common.xlm": "XLM",

  // ── Skip link ─────────────────────────────────────────────────────────
  "skipLink.skipToMain": "Skip to main content",

  // ── Theme toggle ──────────────────────────────────────────────────────
  "theme.system": "System theme",
  "theme.light": "Light theme",
  "theme.dark": "Dark theme",

  // ── Keyboard shortcuts ────────────────────────────────────────────────
  "shortcuts.title": "Keyboard shortcuts",
  "shortcuts.search": "Search",
  "shortcuts.showList": "Show this list",
  "shortcuts.description":
    "Shortcuts never use Ctrl, Cmd or Alt and are ignored while you type in a field.",
  "shortcuts.enable": "Enable keyboard shortcuts",

  // ── Search page ───────────────────────────────────────────────────────
  "search.heading": "Search",
  "search.description":
    "One box for everything on the network. Type what you have \u2014 no need to say what it is.",
  "search.accountAddress": "Account address",
  "search.contractId": "Contract id \u2014 its events",
  "search.transactionHash": "Transaction hash",
  "search.memoSearch": "Memo search, ranked by the backend",
  "search.searching": "Searching the index\u2026",
  "search.resultsCount":
    "{count} transaction{count, plural, one {} other {s}} matching",
  "search.rankedByMemo": ", ranked by memo relevance.",
  "search.helpText":
    "Looking for an account or contract? Paste its full address \u2014 the explorer takes you straight there.",

  // ── Transactions page ─────────────────────────────────────────────────
  "transactions.heading": "Transactions",
  "transactions.loading": "Loading transactions\u2026",

  // ── Stats page ────────────────────────────────────────────────────────
  "stats.heading": "Network Stats",
  "stats.description":
    "Indexer health and Stellar network throughput at a glance.",
  "stats.latestLedger": "Latest Ledger",
  "stats.stellarMainnet": "Stellar Mainnet",
  "stats.txsLastLedger": "Txs (last ledger)",
  "stats.successfulFailed": "Successful + failed",
  "stats.contractsRegistered": "Contracts Registered",
  "stats.viaLumina": "Via Lumina Registry",
  "stats.avgLedgerTime": "Avg Ledger Time",
  "stats.protocolTarget": "~5s",
  "stats.protocolTargetHint": "Protocol target, not a live average",
  "stats.operationBreakdown": "Operation Type Breakdown",
  "stats.basedOnRecent": "Based on the most recent {count} indexed operations.",

  // ── Registry page ─────────────────────────────────────────────────────
  "registry.heading": "Lumina Registry",
  "registry.description":
    "An on-chain Soroban manifest of contracts Lumina indexes. Register your contract to opt into priority indexing \u2014 permissionless, on Stellar/Soroban testnet.",
  "registry.registerContract": "Register a Contract",
  "registry.connecting": "Connecting\u2026",
  "registry.connectPrompt":
    "Connect a wallet to register and manage contracts.",
  "registry.walletLocked": "Your wallet is locked",
  "registry.unlockHint": "Unlock your wallet extension and try again.",
  "registry.myContracts": "My Contracts",
  "registry.recentlyRegistered": "Recently Registered",
  "registry.all": "All",
  "registry.filterByCategory": "Filter by category",
  "registry.connectToSee":
    "Connect a wallet to see the contracts you registered.",
  "registry.loadingEntries": "Loading registry entries\u2026",
  "registry.noActiveContracts": "No active {category} contracts.",
  "registry.noContractsYet": "No contracts registered yet.",
  "registry.couldNotReach": "Couldn't reach the registry contract.",

  // ── GraphQL page ──────────────────────────────────────────────────────
  "graphql.heading": "GraphQL Playground",
  "graphql.endpoint": "Lumina GraphQL endpoint:",
  "graphql.queryExamples": "Query Examples",
  "graphql.recentQueries": "Recent Queries",
  "graphql.noHistory": "Edited queries will appear here.",
  "graphql.queryEditor": "Query Editor",
  "graphql.running": "Running\u2026",
  "graphql.runQuery": "Run Query",
  "graphql.response": "Response",
  "graphql.clickToRun": "Click \u201cRun Query\u201d to see the response.",

  // ── Explorer page ─────────────────────────────────────────────────────
  "explorer.heading": "Explorer",
  "explorer.description":
    "Search any Stellar account or browse recent transactions in real time.",
  "explorer.searchPlaceholder":
    "Search an account, transaction, contract or memo\u2026",
  "explorer.recentTransactions": "Recent Transactions",

  // ── Events page ───────────────────────────────────────────────────────
  "events.heading": "Contract Events",
  "events.description":
    "Soroban contract events indexed via RPC, newest first.",
  "events.contractIdPlaceholder": "Contract ID (C...)",
  "events.filter": "Filter",

  // ── Assets page ───────────────────────────────────────────────────────
  "assets.heading": "Assets",
  "assets.description":
    "Every asset Lumina indexes, with the supply and holder counts behind it.",

  // ── Watch page ────────────────────────────────────────────────────────
  "watch.backgroundNotifications": "Background notifications",
  "watch.notificationDescription":
    "In-app alerts work everywhere in Lumina. This is the separate opt-in for an operating-system notification when the tab is not in front of you.",

  // ── Footer ────────────────────────────────────────────────────────────
  "footer.version": "Lumina frontend v{version}",
  "footer.copyVersion": "Copy version for bug reports",
  "footer.copied": "Copied!",
  "footer.copy": "Copy",
  "footer.reportProblem": "Report a problem",
  "footer.statusChangelog": "Status & Changelog",

  // ── WatchAlertSettings ────────────────────────────────────────────────
  "watchAlertSettings.alertFilter": "Alert filter for {address}",
  "watchAlertSettings.operation": "Operation",
  "watchAlertSettings.anyOperation": "Any operation",
  "watchAlertSettings.minimumAmount": "Minimum amount",
  "watchAlertSettings.any": "Any",
  "watchAlertSettings.asset": "Asset",
  "watchAlertSettings.noFilter": "No filter — every operation alerts.",
  "watchAlertSettings.filtersActive": "{count} {count, plural, one {filter} other {filters}} active.",
  "watchAlertSettings.resetDefault": "Reset to default",

  // ── RegistrySlashHistory ──────────────────────────────────────────────
  "registrySlashHistory.slashHistory": "Slash history",
  "registrySlashHistory.hideSlashHistory": "Hide slash history",
  "registrySlashHistory.loadingSlashHistory": "Loading slash history…",
  "registrySlashHistory.couldNotReadHistory": "Couldn't read the slash history. Close and reopen to retry.",
  "registrySlashHistory.noSlashes": "No slashes recorded.",
  "registrySlashHistory.ledger": "ledger {ledger}",

  // ── RegistryEntryCard ─────────────────────────────────────────────────
  "registryEntryCard.categories": "Categories",
  "registryEntryCard.hideSlashHistory": "Hide slash history",
  "registryEntryCard.slashHistory": "Slash history",
  "registryEntryCard.loadingSlashHistory": "Loading slash history…",
  "registryEntryCard.couldNotReadHistory": "Couldn't read the slash history. Check your connection, then try again.",
  "registryEntryCard.retryHistory": "Retry history",
  "registryEntryCard.noSlashes": "No slashes recorded.",
  "registryEntryCard.ledger": "ledger {ledger}",

  // ── SearchBar ─────────────────────────────────────────────────────────
  "searchBar.placeholder":
    "Search an account, transaction, contract or memo\u2026",
  // ── Developer portal ──────────────────────────────────────────────────
  "devPortal.heading": "Lumina Developer Portal",
  "devPortal.description":
    "Everything you need to integrate Lumina's Stellar API into your application. From your first query to production monitoring.",
  "devPortal.gettingStarted.title": "Getting Started",
  "devPortal.gettingStarted.description":
    "Step-by-step guide to making your first API request. Learn about authentication, pagination, and error handling with copy-paste code examples.",
  "devPortal.gettingStarted.cta": "Get started →",
  "devPortal.apiDocs.title": "API Documentation",
  "devPortal.apiDocs.description":
    "Explore the GraphQL schema with worked examples you can run live. Understand pagination patterns and error handling in depth.",
  "devPortal.apiDocs.cta": "Explore docs →",
  "devPortal.playground.title": "Query Playground",
  "devPortal.playground.description":
    "Write GraphQL queries and generate client code in JavaScript and Python. Test your queries live against the real API.",
  "devPortal.playground.cta": "Open playground →",
  "devPortal.usage.title": "Usage Dashboard",
  "devPortal.usage.description":
    "Monitor your API key usage and quota consumption. See request counts and trends over time.",
  "devPortal.usage.cta": "View dashboard →",
  "devPortal.webhooks.title": "Webhooks",
  "devPortal.webhooks.description":
    "Register webhooks for real-time event notifications. Monitor delivery attempts and test your endpoints.",
  "devPortal.webhooks.cta": "Manage webhooks →",
  "devPortal.quickStart.title": "Quick Start",
  "devPortal.quickStart.before": "New to Lumina? Head over to our",
  "devPortal.quickStart.link": "getting started guide",
  "devPortal.quickStart.after":
    "to learn the basics. You'll be querying the Stellar blockchain in minutes.",
  "devPortal.step1.action": "Make a request",
  "devPortal.step1.rest": "using our playground or your preferred language",
  "devPortal.step2.action": "Generate code",
  "devPortal.step2.rest": "in JavaScript or Python for your application",
  "devPortal.step3.action": "Monitor usage",
  "devPortal.step3.rest": "from your dashboard",

  // ── Getting started guide ─────────────────────────────────────────────
  "guide.heading": "Getting Started with Lumina",
  "guide.subtitle":
    "Learn how to make your first GraphQL query in just a few minutes.",
  "guide.step1.title": "Make Your First Request",
  "guide.step1.before": "The Lumina GraphQL API is available at",
  "guide.step1.after":
    ". Start with this simple query that fetches the latest ledger:",
  "guide.step1.hint":
    "Copy the code above and run it in your terminal. You should see the latest Stellar ledger information.",
  "guide.example.firstRequest": "First Request",
  "guide.example.pagination": "Query with Pagination",
  "guide.step2.title": "Work with Pagination",
  "guide.step2.intro":
    "For queries that return multiple items, we use cursor-based pagination.",
  "guide.step2.response":
    "The response includes a pageInfo object with hasNextPage and cursor fields:",
  "guide.step2.nextTitle": "How to fetch the next page:",
  "guide.step2.nextBefore": "To get the next page of results, pass the",
  "guide.step2.nextAfter": "from the previous response to the next query:",
  "guide.step3.title": "Handle Errors Gracefully",
  "guide.step3.before":
    "The GraphQL API returns HTTP 200 even when there are errors — check the",
  "guide.step3.after": "array in the response:",
  "guide.errors.title": "Common Errors:",
  "guide.errors.invalidQuery": "Invalid Query",
  "guide.errors.invalidQueryBefore":
    "Your GraphQL syntax is invalid. Check the",
  "guide.errors.invalidQueryLink": "playground",
  "guide.errors.invalidQueryAfter": "for the correct schema.",
  "guide.errors.notFound": "Not Found",
  "guide.errors.notFoundDesc":
    "The resource doesn't exist (e.g., an account that hasn't been funded on Stellar).",
  "guide.errors.serverError": "Server Error",
  "guide.errors.serverErrorDesc":
    "Our backend is temporarily unavailable. Retry with exponential backoff.",
  "guide.errorHandling.title": "Error Handling Pattern",
  "guide.step4.title": "Explore the Schema",
  "guide.step4.before": "Visit the",
  "guide.step4.link": "GraphQL Playground",
  "guide.step4.after":
    "to explore all available queries and data types. The playground includes worked examples you can run live against the API.",
  "guide.step4.popularLabel": "Popular queries:",
  "guide.step4.popularItems":
    "Recent transactions, Account balances, Contract events, Asset information, Payment history",
  "guide.next.title": "What's Next?",
  "guide.next.tryPlayground.label": "Try the playground:",
  "guide.next.tryPlayground.link": "Run live queries",
  "guide.next.readDocs.label": "Read the docs:",
  "guide.next.readDocs.link": "Dive deeper into pagination and error handling",
  "guide.next.generateCode.label": "Generate code:",
  "guide.next.generateCode.text":
    "Use the playground to write a query, then generate production-ready code in JavaScript or Python",
  "guide.next.monitorUsage.label": "Monitor usage:",
  "guide.next.monitorUsage.link": "Track your API consumption",

  // ── API documentation ─────────────────────────────────────────────────
  "apiDocs.heading": "API Documentation",
  "apiDocs.subtitleBefore":
    "Explore the GraphQL schema with worked examples you can run live against the API. All examples below are runnable in the",
  "apiDocs.subtitleLink": "GraphQL Playground",
  "apiDocs.pagination.title": "Pagination Guide",
  "apiDocs.pagination.intro":
    "All list queries in Lumina use cursor-based pagination. This approach is ideal for large datasets because it's:",
  "apiDocs.pagination.bulletScalable.label": "Scalable:",
  "apiDocs.pagination.bulletScalable.desc":
    "Cursors don't require offset calculations",
  "apiDocs.pagination.bulletStable.label": "Stable:",
  "apiDocs.pagination.bulletStable.desc":
    "Results don't shift if items are added/removed",
  "apiDocs.pagination.bulletEfficient.label": "Efficient:",
  "apiDocs.pagination.bulletEfficient.desc":
    "No need to fetch and skip earlier items",
  "apiDocs.pagination.returns": "Every list query returns:",
  "apiDocs.pagination.next":
    "To fetch the next page, pass the cursor from the previous response:",
  "apiDocs.errors.title": "Error Handling",
  "apiDocs.errors.before": "GraphQL always returns HTTP 200. Check the",
  "apiDocs.errors.after": "array for problems:",
  "apiDocs.errors.success": "Successful Response",
  "apiDocs.errors.error": "Error Response",
  "apiDocs.errors.checkBefore": "Always check for",
  "apiDocs.errors.checkMiddle": "before accessing",
  "apiDocs.errors.checkAfter": ".",
  "apiDocs.examples.title": "Worked Examples",
  "apiDocs.example.recentTransactions.name": "Recent Transactions",
  "apiDocs.example.recentTransactions.description":
    "Fetch the last 5 transactions on the network",
  "apiDocs.example.accountBalances.name": "Account Balances",
  "apiDocs.example.accountBalances.description":
    "Get all asset balances for an account (edit the address below)",
  "apiDocs.example.paymentHistory.name": "Payment History",
  "apiDocs.example.paymentHistory.description":
    "Fetch payment operations for an account (edit the address below)",
  "apiDocs.example.contractEvents.name": "Contract Events",
  "apiDocs.example.contractEvents.description":
    "Query Soroban contract events by contract address (edit the contract ID below)",
  "apiDocs.tryInPlayground": "Try in Playground",
  "apiDocs.viewDocs": "View Docs",
  "apiDocs.next.title": "Next Steps",
  "apiDocs.next.runExample.label": "Run an example:",
  "apiDocs.next.runExample.text":
    'Click "{button}" to run any of the examples above against the live API',
  "apiDocs.next.modify.label": "Modify and test:",
  "apiDocs.next.modify.text":
    "Edit the query in the playground to explore different fields and filters",
  "apiDocs.next.generate.label": "Generate code:",
  "apiDocs.next.generate.text":
    "Once your query works, generate JavaScript or Python code to integrate into your app",

  // ── Usage dashboard ───────────────────────────────────────────────────
  "usage.heading": "Usage Dashboard",
  "usage.subtitle":
    "Monitor your API key usage and quota consumption, protected by wallet ownership.",
  "usage.connectedOwner": "Connected Owner Account",
  "usage.walletRequired.title": "Wallet Ownership Required",
  "usage.walletRequired.body":
    "Key management is tied strictly to wallet ownership. Connect your Stellar wallet to view, create, and manage your private API keys.",
  "usage.connecting": "Connecting Wallet…",
  "usage.connectCta": "Connect Wallet to Access Keys",
  "usage.requestsThisWeek": "Requests This Week",
  "usage.peakDay": "Peak day: {count} requests",
  "usage.quotaRemaining": "Quota Remaining",
  "usage.quotaOfTotal": "of {total} total",
  "usage.quotaUsage": "Quota Usage",
  "usage.warning": "Warning",
  "usage.requestsOverTime": "Requests Over Time (Last 7 Days)",
  "usage.byApiKey": "Usage by API Key",
  "usage.keyManagement": "API Key Management",
  "usage.keyNamePlaceholder": "Key name (e.g. Staging Key)",
  "usage.createKey": "Create API Key",
  "usage.thKeyName": "Key Name",
  "usage.thApiKey": "API Key",
  "usage.thCreated": "Created",
  "usage.thUsage": "Usage",
  "usage.thAction": "Action",
  "usage.percentUsed": "{percent}% used",
  "usage.revoke": "Revoke",
  "usage.aboutKeys.title": "About Wallet-Protected Keys",
  "usage.aboutKeys.body":
    "API keys are associated 1:1 with your wallet address as your identity. Disconnecting your wallet protects your keys from display without deleting them.",

  // ── Code snippet ──────────────────────────────────────────────────────
  "codeSnippet.copy": "Copy",
  "codeSnippet.copied": "✓ Copied",
  "codeSnippet.copiedAria": "Code copied",
  "codeSnippet.copiedStatus": "Code copied to clipboard",
  "codeSnippet.copyError":
    "Clipboard access failed. Select the code and copy it manually.",
};

export default en;
