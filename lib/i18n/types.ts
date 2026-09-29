/** The shape every locale catalogue must match. */
export interface MessageCatalogue {
  // ── Route errors ──────────────────────────────────────────────────────
  "error.failedToLoadRoute": string;
  "error.routeRecoveryHint": string;
  "error.tryAgain": string;
  "error.errorDigest": string;

  // ── Backend unavailable ───────────────────────────────────────────────
  "error.backendUnavailableTitle": string;
  "error.backendUnavailableBody": string;
  "error.retry": string;
  "error.retrying": string;

  // ── Network status ────────────────────────────────────────────────────
  "status.offline": string;

  // ── 404 ───────────────────────────────────────────────────────────────
  "notFound.code": string;
  "notFound.title": string;
  "notFound.body": string;
  "notFound.openExplorer": string;
  "notFound.orGoTo": string;

  // ── Connection indicator ──────────────────────────────────────────────
  "connection.idle": string;
  "connection.connecting": string;
  "connection.live": string;
  "connection.reconnecting": string;
  "connection.polling": string;
  "connection.explainIdle": string;
  "connection.explainConnecting": string;
  "connection.explainConnected": string;
  "connection.explainReconnecting": string;
  "connection.explainDisconnected": string;
  "connection.explainUnsupported": string;
  "connection.reasonUnsupported": string;
  "connection.reasonUnreachable": string;
  "connection.reasonRefused": string;
  "connection.whatDoesMean": string;

  // ── Transaction explorer ──────────────────────────────────────────────
  "explorer.couldNotLoad": string;
  "explorer.noTransactionsYet": string;
  "explorer.noMatchingFilters": string;
  "explorer.filteredCount": string;
  "explorer.loadedCount": string;
  "explorer.loading": string;
  "explorer.loadMore": string;
  "explorer.endOfResults": string;

  // ── Live feed ─────────────────────────────────────────────────────────
  "liveFeed.fetching": string;
  "liveFeed.noTransactions": string;
  "liveFeed.updated": string;
  "liveFeed.pauseFeed": string;
  "liveFeed.resumeFeed": string;
  "liveFeed.resumeFeedCount": string;
  "liveFeed.updatesWaiting": string;
  "liveFeed.updatesArrived": string;
  "liveFeed.newTransactions": string;

  // ── Account operations ────────────────────────────────────────────────
  "accountOps.noOperations": string;
  "accountOps.showingRecent": string;
  "accountOps.allOperations": string;
  "accountOps.couldNotLoad": string;
  "accountOps.endOfResults": string;

  // ── Account transactions ──────────────────────────────────────────────
  "accountTxs.noTransactions": string;
  "accountTxs.showingRecent": string;
  "accountTxs.allTransactions": string;
  "accountTxs.couldNotLoad": string;
  "accountTxs.endOfResults": string;

  // ── Assets ────────────────────────────────────────────────────────────
  "assets.noAssetsYet": string;
  "assets.searchPlaceholder": string;
  "assets.orderBy": string;
  "assets.holders": string;
  "assets.volume": string;
  "assets.couldNotLoad": string;
  "assets.noMatch": string;
  "assets.searchCoversLoaded": string;
  "assets.endOfAssets": string;
  "assets.thAsset": string;
  "assets.thIssuer": string;
  "assets.thSupply": string;
  "assets.thHolders": string;

  // ── Copy button ───────────────────────────────────────────────────────
  "copy.copy": string;
  "copy.copied": string;
  "copy.failed": string;
  "copy.copyAddress": string;
  "copy.copiedAddress": string;
  "copy.copyHash": string;
  "copy.copiedHash": string;

  // ── Load more footer ──────────────────────────────────────────────────
  "loadMore.loadMore": string;
  "loadMore.loading": string;
  "loadMore.retry": string;

  // ── Watch feed ────────────────────────────────────────────────────────
  "watch.liveActivity": string;
  "watch.emptyTitle": string;
  "watch.emptyBody": string;
  "watch.waiting": string;
  "watch.watchedAddresses": string;
  "watch.matchingAlerts": string;
  "watch.alert": string;

  // ── Register contract form ────────────────────────────────────────────
  "register.contractId": string;
  "register.projectName": string;
  "register.description": string;
  "register.categoriesLabel": string;
  "register.categoriesHint": string;
  "register.selectCategory": string;
  "register.registerContract": string;
  "register.preparingTransaction": string;
  "register.approveInWallet": string;
  "register.submitting": string;
  "register.confirming": string;
  "register.successMessage": string;
  "register.registrationFailed": string;
  "register.estimatedFee": string;

  // ── Owner contracts ───────────────────────────────────────────────────
  "owner.loadingContracts": string;
  "owner.noContracts": string;
  "owner.noContractsHint": string;
  "owner.deactivate": string;
  "owner.preparing": string;
  "owner.approveInWallet": string;
  "owner.active": string;
  "owner.deactivated": string;
  "owner.staking": string;
  "owner.stake": string;
  "owner.withdrawing": string;
  "owner.withdrawStake": string;
  "owner.stakeAmountLabel": string;
  "owner.stakeAmountPlaceholder": string;
  "owner.invalidStakeAmount": string;
  "owner.stakingFailed": string;
  "owner.withdrawalFailed": string;
  "owner.deactivationFailed": string;
  "owner.hideHistory": string;
  "owner.historyCount": string;
  "owner.noRegistryEvents": string;
  "owner.slashHistory": string;
  "owner.lifetimeSlashed": string;
  "owner.loadingSlashHistory": string;
  "owner.couldNotLoadSlashHistory": string;
  "owner.noSlashes": string;
  "owner.withdrawBlockerActive": string;
  "owner.withdrawBlockerLocked": string;
  "owner.withdrawBlockerNoStake": string;

  // ── Soroban transaction pipeline ──────────────────────────────────────
  "soroban.couldNotPrepare": string;
  "soroban.signatureDeclined": string;
  "soroban.networkRejected": string;
  "soroban.pendingConfirmation": string;
  "soroban.transactionFailed": string;

  // ── Stats ─────────────────────────────────────────────────────────────
  "stats.noOperationsYet": string;

  // ── Events ────────────────────────────────────────────────────────────
  "events.noEventsYet": string;

  // ── Search ────────────────────────────────────────────────────────────
  "search.noMemoMatch": string;

  // ── Activity labels ───────────────────────────────────────────────────
  "activity.indexed": string;
  "activity.noEvents": string;
  "activity.unknown": string;

  // ── Table headers ─────────────────────────────────────────────────────
  "table.hash": string;
  "table.ledger": string;
  "table.ops": string;
  "table.time": string;
  "table.type": string;
  "table.transaction": string;
  "table.detail": string;
  "table.source": string;
  "table.operations": string;
  "table.fee": string;
  "table.contract": string;
  "table.topic": string;
  "table.value": string;

  // ── Common UI ─────────────────────────────────────────────────────────
  "common.search": string;
  "common.close": string;
  "common.clear": string;
  "common.save": string;
  "common.cancel": string;
  "common.loading": string;
  "common.error": string;
  "common.retry": string;
  "common.connect": string;
  "common.disconnect": string;
  "common.copy": string;
  "common.copied": string;
  "common.xlm": string;

  // ── Skip link ─────────────────────────────────────────────────────────
  "skipLink.skipToMain": string;

  // ── Theme toggle ──────────────────────────────────────────────────────
  "theme.system": string;
  "theme.light": string;
  "theme.dark": string;

  // ── Keyboard shortcuts ────────────────────────────────────────────────
  "shortcuts.title": string;
  "shortcuts.search": string;
  "shortcuts.showList": string;
  "shortcuts.description": string;
  "shortcuts.enable": string;

  // ── Search page ───────────────────────────────────────────────────────
  "search.heading": string;
  "search.description": string;
  "search.accountAddress": string;
  "search.contractId": string;
  "search.transactionHash": string;
  "search.memoSearch": string;
  "search.searching": string;
  "search.resultsCount": string;
  "search.rankedByMemo": string;
  "search.helpText": string;

  // ── Transactions page ─────────────────────────────────────────────────
  "transactions.heading": string;
  "transactions.loading": string;

  // ── Stats page ────────────────────────────────────────────────────────
  "stats.heading": string;
  "stats.description": string;
  "stats.latestLedger": string;
  "stats.stellarMainnet": string;
  "stats.txsLastLedger": string;
  "stats.successfulFailed": string;
  "stats.contractsRegistered": string;
  "stats.viaLumina": string;
  "stats.avgLedgerTime": string;
  "stats.protocolTarget": string;
  "stats.protocolTargetHint": string;
  "stats.operationBreakdown": string;
  "stats.basedOnRecent": string;

  // ── Registry page ─────────────────────────────────────────────────────
  "registry.heading": string;
  "registry.description": string;
  "registry.registerContract": string;
  "registry.connecting": string;
  "registry.connectPrompt": string;
  "registry.walletLocked": string;
  "registry.unlockHint": string;
  "registry.myContracts": string;
  "registry.recentlyRegistered": string;
  "registry.all": string;
  "registry.filterByCategory": string;
  "registry.connectToSee": string;
  "registry.loadingEntries": string;
  "registry.noActiveContracts": string;
  "registry.noContractsYet": string;
  "registry.couldNotReach": string;

  // ── GraphQL page ──────────────────────────────────────────────────────
  "graphql.heading": string;
  "graphql.endpoint": string;
  "graphql.queryExamples": string;
  "graphql.recentQueries": string;
  "graphql.noHistory": string;
  "graphql.queryEditor": string;
  "graphql.running": string;
  "graphql.runQuery": string;
  "graphql.response": string;
  "graphql.clickToRun": string;

  // ── Explorer page ─────────────────────────────────────────────────────
  "explorer.heading": string;
  "explorer.description": string;
  "explorer.searchPlaceholder": string;
  "explorer.recentTransactions": string;
  "explorer.loading": string;

  // ── Events page ───────────────────────────────────────────────────────
  "events.heading": string;
  "events.description": string;
  "events.contractIdPlaceholder": string;
  "events.filter": string;

  // ── Assets page ───────────────────────────────────────────────────────
  "assets.heading": string;
  "assets.description": string;

  // ── Watch page ────────────────────────────────────────────────────────
  "watch.backgroundNotifications": string;
  "watch.notificationDescription": string;

  // ── Footer ────────────────────────────────────────────────────────────
  "footer.version": string;
  "footer.copyVersion": string;

  // ── SearchBar ─────────────────────────────────────────────────────────
  "searchBar.placeholder": string;
}

export type MessageKey = keyof MessageCatalogue;
