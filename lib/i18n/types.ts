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

  // ── Account detail page ───────────────────────────────────────────────
  "account.breadcrumbExplorer": string;
  "account.breadcrumbAccounts": string;
  "account.notFoundTitle": string;
  "account.notFoundBody": string;
  "account.merged": string;
  "account.lastModifiedLedger": string;
  "account.statSequence": string;
  "account.statSubentries": string;
  "account.statSponsoring": string;
  "account.statSponsored": string;
  "account.flagAuthRequired": string;
  "account.flagAuthRevocable": string;
  "account.flagAuthImmutable": string;
  "account.flagAuthClawbackEnabled": string;
  "account.flagNone": string;
  "account.balancesTitle": string;
  "account.balancesAriaLabel": string;
  "account.balanceAsset": string;
  "account.balanceIssuer": string;
  "account.balanceBalance": string;
  "account.balanceLimit": string;
  "account.recentTransactions": string;
  "account.tradesTitle": string;
  "account.tradesUnavailable": string;
  "account.recentOperations": string;
  "account.trustlinesTitle": string;
  "account.trustlinesUnavailable": string;

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
  "owner.stakeAnyway": string;
  "owner.reserveWarningTitle": string;
  "owner.reserveExplanation": string;
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
  "owner.staked": string;
  "owner.ledgerPrefix": string;
  "owner.slashHistoryRetryHint": string;
  "owner.retrySlashHistory": string;

  // ── Registry event labels ─────────────────────────────────────────────
  "registryEvent.registered": string;
  "registryEvent.deactivated": string;
  "registryEvent.metadataUpdated": string;
  "registryEvent.ownershipTransferred": string;
  "registryEvent.unknown": string;

  // ── Soroban transaction pipeline ──────────────────────────────────────
  "soroban.couldNotPrepare": string;
  "soroban.signatureDeclined": string;
  "soroban.couldNotSign": string;
  "soroban.retrySignature": string;
  "soroban.prepareAgain": string;
  "soroban.rejectionPreserved": string;
  "soroban.networkRejected": string;
  "soroban.pendingConfirmation": string;
  "soroban.transactionFailed": string;

  // ── Pending transactions ──────────────────────────────────────────────
  "pending.title": string;
  "pending.register": string;
  "pending.deactivate": string;
  "pending.stake": string;
  "pending.withdraw": string;
  "pending.building": string;
  "pending.awaitingSignature": string;
  "pending.submitting": string;
  "pending.confirming": string;
  "pending.succeeded": string;
  "pending.failed": string;
  "pending.failedFallback": string;
  "pending.dismiss": string;

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
  "shortcuts.sequence": string;
  "shortcuts.route.home": string;
  "shortcuts.route.explorer": string;
  "shortcuts.route.transactions": string;
  "shortcuts.route.events": string;
  "shortcuts.route.graphql": string;
  "shortcuts.route.registry": string;
  "shortcuts.route.stats": string;

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
  "registry.loading": string;
  "registry.sessionRestoreFailed": string;
  "registry.networkMismatchTitle": string;
  "registry.networkMismatch": string;
  "registry.connectFailed": string;
  "registry.disconnectFailed": string;
  "registry.walletRetry": string;
  "registry.category.DeFi": string;
  "registry.category.Nft": string;
  "registry.category.Gaming": string;
  "registry.category.Identity": string;
  "registry.category.Infrastructure": string;
  "registry.category.Payments": string;
  "registry.category.Oracle": string;
  "registry.category.Dao": string;
  "registry.category.Other": string;
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

  // ── Developer portal ──────────────────────────────────────────────────
  "devPortal.heading": string;
  "devPortal.description": string;
  "devPortal.gettingStarted.title": string;
  "devPortal.gettingStarted.description": string;
  "devPortal.gettingStarted.cta": string;
  "devPortal.apiDocs.title": string;
  "devPortal.apiDocs.description": string;
  "devPortal.apiDocs.cta": string;
  "devPortal.playground.title": string;
  "devPortal.playground.description": string;
  "devPortal.playground.cta": string;
  "devPortal.usage.title": string;
  "devPortal.usage.description": string;
  "devPortal.usage.cta": string;
  "devPortal.webhooks.title": string;
  "devPortal.webhooks.description": string;
  "devPortal.webhooks.cta": string;
  "devPortal.quickStart.title": string;
  "devPortal.quickStart.before": string;
  "devPortal.quickStart.link": string;
  "devPortal.quickStart.after": string;
  "devPortal.step1.action": string;
  "devPortal.step1.rest": string;
  "devPortal.step2.action": string;
  "devPortal.step2.rest": string;
  "devPortal.step3.action": string;
  "devPortal.step3.rest": string;

  // ── Getting started guide ─────────────────────────────────────────────
  "guide.heading": string;
  "guide.subtitle": string;
  "guide.step1.title": string;
  "guide.step1.before": string;
  "guide.step1.after": string;
  "guide.step1.hint": string;
  "guide.example.firstRequest": string;
  "guide.example.pagination": string;
  "guide.step2.title": string;
  "guide.step2.intro": string;
  "guide.step2.response": string;
  "guide.step2.nextTitle": string;
  "guide.step2.nextBefore": string;
  "guide.step2.nextAfter": string;
  "guide.step3.title": string;
  "guide.step3.before": string;
  "guide.step3.after": string;
  "guide.errors.title": string;
  "guide.errors.invalidQuery": string;
  "guide.errors.invalidQueryBefore": string;
  "guide.errors.invalidQueryLink": string;
  "guide.errors.invalidQueryAfter": string;
  "guide.errors.notFound": string;
  "guide.errors.notFoundDesc": string;
  "guide.errors.serverError": string;
  "guide.errors.serverErrorDesc": string;
  "guide.errorHandling.title": string;
  "guide.step4.title": string;
  "guide.step4.before": string;
  "guide.step4.link": string;
  "guide.step4.after": string;
  "guide.step4.popularLabel": string;
  "guide.step4.popularItems": string;
  "guide.next.title": string;
  "guide.next.tryPlayground.label": string;
  "guide.next.tryPlayground.link": string;
  "guide.next.readDocs.label": string;
  "guide.next.readDocs.link": string;
  "guide.next.generateCode.label": string;
  "guide.next.generateCode.text": string;
  "guide.next.monitorUsage.label": string;
  "guide.next.monitorUsage.link": string;

  // ── API documentation ─────────────────────────────────────────────────
  "apiDocs.heading": string;
  "apiDocs.subtitleBefore": string;
  "apiDocs.subtitleLink": string;
  "apiDocs.pagination.title": string;
  "apiDocs.pagination.intro": string;
  "apiDocs.pagination.bulletScalable.label": string;
  "apiDocs.pagination.bulletScalable.desc": string;
  "apiDocs.pagination.bulletStable.label": string;
  "apiDocs.pagination.bulletStable.desc": string;
  "apiDocs.pagination.bulletEfficient.label": string;
  "apiDocs.pagination.bulletEfficient.desc": string;
  "apiDocs.pagination.returns": string;
  "apiDocs.pagination.next": string;
  "apiDocs.errors.title": string;
  "apiDocs.errors.before": string;
  "apiDocs.errors.after": string;
  "apiDocs.errors.success": string;
  "apiDocs.errors.error": string;
  "apiDocs.errors.checkBefore": string;
  "apiDocs.errors.checkMiddle": string;
  "apiDocs.errors.checkAfter": string;
  "apiDocs.examples.title": string;
  "apiDocs.example.recentTransactions.name": string;
  "apiDocs.example.recentTransactions.description": string;
  "apiDocs.example.accountBalances.name": string;
  "apiDocs.example.accountBalances.description": string;
  "apiDocs.example.paymentHistory.name": string;
  "apiDocs.example.paymentHistory.description": string;
  "apiDocs.example.contractEvents.name": string;
  "apiDocs.example.contractEvents.description": string;
  "apiDocs.tryInPlayground": string;
  "apiDocs.viewDocs": string;
  "apiDocs.next.title": string;
  "apiDocs.next.runExample.label": string;
  "apiDocs.next.runExample.text": string;
  "apiDocs.next.modify.label": string;
  "apiDocs.next.modify.text": string;
  "apiDocs.next.generate.label": string;
  "apiDocs.next.generate.text": string;

  // ── Usage dashboard ───────────────────────────────────────────────────
  "usage.heading": string;
  "usage.subtitle": string;
  "usage.connectedOwner": string;
  "usage.walletRequired.title": string;
  "usage.walletRequired.body": string;
  "usage.connecting": string;
  "usage.connectCta": string;
  "usage.requestsThisWeek": string;
  "usage.peakDay": string;
  "usage.quotaRemaining": string;
  "usage.quotaOfTotal": string;
  "usage.quotaUsage": string;
  "usage.warning": string;
  "usage.requestsOverTime": string;
  "usage.byApiKey": string;
  "usage.keyManagement": string;
  "usage.keyNamePlaceholder": string;
  "usage.createKey": string;
  "usage.thKeyName": string;
  "usage.thApiKey": string;
  "usage.thCreated": string;
  "usage.thUsage": string;
  "usage.thAction": string;
  "usage.percentUsed": string;
  "usage.revoke": string;
  "usage.aboutKeys.title": string;
  "usage.aboutKeys.body": string;

  // ── Code snippet ──────────────────────────────────────────────────────
  "codeSnippet.copy": string;
  "codeSnippet.copied": string;
  "codeSnippet.copiedAria": string;
  "codeSnippet.copiedStatus": string;
  "codeSnippet.copyError": string;

  // ── CommandPalette ────────────────────────────────────────────────────
  "commandPalette.placeholder": string;
  "commandPalette.noResults": string;
  "commandPalette.selectHint": string;
  "commandPalette.navigateHint": string;
  "commandPalette.searchAction": string;
  "commandPalette.searchActionDescription": string;
  "commandPalette.route.explorer.label": string;
  "commandPalette.route.explorer.description": string;
  "commandPalette.route.transactions.label": string;
  "commandPalette.route.transactions.description": string;
  "commandPalette.route.ledgers.label": string;
  "commandPalette.route.ledgers.description": string;
  "commandPalette.route.search.label": string;
  "commandPalette.route.search.description": string;
  "commandPalette.route.events.label": string;
  "commandPalette.route.events.description": string;
  "commandPalette.route.assets.label": string;
  "commandPalette.route.assets.description": string;
  "commandPalette.route.graphql.label": string;
  "commandPalette.route.graphql.description": string;
  "commandPalette.route.developers.label": string;
  "commandPalette.route.developers.description": string;
  "commandPalette.route.registry.label": string;
  "commandPalette.route.registry.description": string;
  "commandPalette.route.stats.label": string;
  "commandPalette.route.stats.description": string;
  "commandPalette.route.watch.label": string;
  "commandPalette.route.watch.description": string;

  // ── AddressLabelManager ───────────────────────────────────────────────
  "addressLabelManager.labels": string;
  "addressLabelManager.manageLabels": string;
  "addressLabelManager.title": string;
  "addressLabelManager.addNewLabel": string;
  "addressLabelManager.addressPlaceholder": string;
  "addressLabelManager.labelPlaceholder": string;
  "addressLabelManager.addLabel": string;
  "addressLabelManager.yourLabels": string;
  "addressLabelManager.save": string;
  "addressLabelManager.edit": string;
  "addressLabelManager.deleteLabel": string;
  "addressLabelManager.invalidFormat": string;
  "addressLabelManager.failedToRead": string;
  "addressLabelManager.export": string;
  "addressLabelManager.import": string;
  "addressLabelManager.exportTitle": string;
  "addressLabelManager.importTitle": string;
  "addressLabelManager.importFile": string;
}

export type MessageKey = keyof MessageCatalogue;
