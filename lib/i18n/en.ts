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

  // ── Account activity feed ─────────────────────────────────────────────
  "accountActivity.liveActivity": "Live Activity",
  "accountActivity.waitingForActivity": "Waiting for new activity on this account\u2026",
  "accountActivity.latestActivity": "Latest account activity",
  "accountActivity.viewTransactionLabel": "View {type} transaction {hash} on Stellar Expert (opens in a new tab)",

  // ── Account trustline timeline ────────────────────────────────────────
  "trustline.removed": "Removed",
  "trustline.set": "Set",
  "trustline.unknown": "Unknown",
  "trustline.couldNotLoadMore": "Could not load more trustline history.",
  "trustline.noChanges": "No trustline changes recorded for this account.",
  "trustline.showingRecent": "Showing {count} of recent trustline changes",
  "trustline.allChanges": "All {count} trustline {count, plural, one {change} other {changes}}",
  "trustline.limit": "Limit",
  "trustline.onStellarExpert": "on stellar.expert (opens in new tab)",
  "trustline.endOfHistory": "End of trustline history",

  // ── Account portfolio ─────────────────────────────────────────────────
  "portfolio.heading": "Portfolio Activity",
  "portfolio.selectAsset": "Select asset to view",
  "portfolio.couldNotLoad": "Could not load activity data.",
  "portfolio.noActivity": "No activity in the last 30 days",
  "portfolio.noActivityDescription": "Transfer volume for {asset} will appear here once this account sends or receives a payment.",
  "portfolio.transferVolume": "{asset} transfer volume",
  "portfolio.transferVolumeDescription": "Daily transfer volume for {asset} over the last 30 days, measured in {asset}.",
  "portfolio.caption": "Transfer volume (sent + received) per day \u00b7 last 30 days \u00b7 daily buckets",
  "portfolio.showLess": "Show less",
  "portfolio.showMore": "+{count} more",
  "portfolio.loadingVolume": "Loading transfer volume",

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
  "shortcuts.sequence": "{start} then {key}",
  "shortcuts.route.home": "Home",
  "shortcuts.route.explorer": "Explorer",
  "shortcuts.route.transactions": "Transactions",
  "shortcuts.route.events": "Contract Events",
  "shortcuts.route.graphql": "GraphQL",
  "shortcuts.route.registry": "Registry",
  "shortcuts.route.stats": "Stats",

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
  "registry.loading": "Loading registry\u2026",
  "registry.sessionRestoreFailed": "Your saved wallet session could not be restored.",
  "registry.networkMismatchTitle": "Network Mismatch",
  "registry.networkMismatch": "Your wallet is on {walletNetwork}, but this app uses {appNetwork}. Switch your wallet to the Stellar testnet before trying again.",
  "registry.connectFailed": "Could not connect to your wallet.",
  "registry.disconnectFailed": "Could not disconnect your wallet. Disconnect in the wallet extension, then refresh this page.",
  "registry.walletRetry": "{error} Open your wallet and choose Connect Wallet to try again.",
  "registry.category.DeFi": "DeFi",
  "registry.category.Nft": "NFT",
  "registry.category.Gaming": "Gaming",
  "registry.category.Identity": "Identity",
  "registry.category.Infrastructure": "Infrastructure",
  "registry.category.Payments": "Payments",
  "registry.category.Oracle": "Oracle",
  "registry.category.Dao": "DAO",
  "registry.category.Other": "Other",
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
  "searchBar.placeholder": "Search an account, transaction, contract or memo\u2026",
  "searchBar.searchKindAccount": "Account",
  "searchBar.searchKindContract": "Contract",
  "searchBar.searchKindMuxed": "Muxed account",
  "searchBar.searchKindTransaction": "Transaction",
  "searchBar.searchKindMemo": "Memo search",

  // ── Breadcrumbs ───────────────────────────────────────────────────────
  "breadcrumbs.ariaLabel": "Breadcrumb",

  // ── AddressLabelManager ───────────────────────────────────────────────
  "addressLabelManager.labels": "Labels",
  "addressLabelManager.manageLabels": "Manage address labels",
  "addressLabelManager.title": "Address Labels",
  "addressLabelManager.addNewLabel": "Add New Label",
  "addressLabelManager.addressPlaceholder": "Stellar address",
  "addressLabelManager.labelPlaceholder": "Label",
  "addressLabelManager.addLabel": "Add Label",
  "addressLabelManager.yourLabels": "Your Labels",
  "addressLabelManager.save": "Save",
  "addressLabelManager.edit": "Edit",
  "addressLabelManager.deleteLabel": "Delete label",
  "addressLabelManager.invalidFormat": "Invalid label format",
  "addressLabelManager.failedToRead": "Failed to read file",
  "addressLabelManager.export": "Export",
  "addressLabelManager.import": "Import",
  "addressLabelManager.exportTitle": "Export labels as JSON",
  "addressLabelManager.importTitle": "Import labels from JSON",
  "addressLabelManager.importFile": "Import labels file",

  // ── PushOptIn ─────────────────────────────────────────────────────────
  "pushOptIn.unsupported": "This browser cannot deliver notifications for watched activity. The in-app alerts still work.",
  "pushOptIn.denied": "Notifications are blocked for this site. Re-enable them in your browser's site settings to get alerts while this tab is in the background. The in-app alerts are unaffected.",
  "pushOptIn.subscribed": "Browser notifications are on. You will be notified when a watched address is active and this tab is in the background.",
  "pushOptIn.turnOff": "Turn off",
  "pushOptIn.description": "Get a browser notification when a watched address is active and this tab is in the background.",
  "pushOptIn.noVapidKey": "Browser notifications need a VAPID public key. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY to enable them — the in-app alerts work without it.",
  "pushOptIn.enable": "Enable notifications",
  "pushOptIn.enabling": "Enabling…",
};

export default en;
