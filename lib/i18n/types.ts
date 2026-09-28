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
}

export type MessageKey = keyof MessageCatalogue;
