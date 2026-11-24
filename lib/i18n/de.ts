import type { MessageCatalogue } from "./types";

const de: MessageCatalogue = {
  // ── Route errors ──────────────────────────────────────────────────────
  "error.failedToLoadRoute": "Fehler beim Laden von {route}",
  "error.routeRecoveryHint":
    "Dies ist in der Regel ein vorübergehendes Problem beim Erreichen des Stellar-Netzwerks. Der Rest der App ist weiterhin verfügbar.",
  "error.tryAgain": "Erneut versuchen",
  "error.errorDigest": "Fehlerzusammenfassung: {digest}",

  // ── Backend unavailable ───────────────────────────────────────────────
  "error.backendUnavailableTitle":
    "Lumina-Daten sind vorübergehend nicht verfügbar",
  "error.backendUnavailableBody":
    "Wir konnten den Indexer nicht erreichen. Überprüfen Sie Ihre Verbindung oder versuchen Sie es in einem Moment erneut; Ihre Anfrage ging nicht verloren.",
  "error.retry": "Erneut versuchen",
  "error.retrying": "Wird erneut versucht\u2026",

  // ── Network status ────────────────────────────────────────────────────
  "status.offline":
    "Sie sind offline. Es werden bereits geladene Daten angezeigt; Lumina aktualisiert sich, wenn Sie sich erneut verbinden.",

  // ── 404 ───────────────────────────────────────────────────────────────
  "notFound.code": "404",
  "notFound.title": "Seite nicht gefunden",
  "notFound.body":
    "Diese Adresse, dieser Hash oder diese Route existiert nicht. Überprüfen Sie die URL oder verwenden Sie den Explorer, um ein Konto oder eine Transaktion zu suchen.",
  "notFound.openExplorer": "Explorer öffnen",
  "notFound.orGoTo": "Oder gehen Sie zu",

  // ── Connection indicator ──────────────────────────────────────────────
  "connection.idle": "INAKTIV",
  "connection.connecting": "VERBINDEN",
  "connection.live": "AKTIV",
  "connection.reconnecting": "NEU VERBINDEN",
  "connection.polling": "ABFRAGE",
  "connection.explainIdle":
    "Der Feed wartet auf eine Verbindung. Die angezeigten Daten sind möglicherweise noch nicht aktuell.",
  "connection.explainConnecting":
    "Eine Live-Verbindung wird geöffnet. Der Feed zeigt die zuletzt geladenen Daten, bis sie sich verbindet.",
  "connection.explainConnected":
    "Transaktionen werden angezeigt, sobald der Server sie veröffentlicht, sodass der Feed aktuell bleibt.",
  "connection.explainReconnecting":
    "Die Live-Verbindung wurde unterbrochen. Bestehende Daten bleiben sichtbar, während Lumina sich erneut verbindet.",
  "connection.explainDisconnected":
    "Live-Updates sind nicht verfügbar. Der Feed wird alle 30 Sekunden aktualisiert, sodass die Daten bis zu 30 Sekunden alt sein können.",
  "connection.explainUnsupported":
    "Dieser Browser kann keine Live-Updates empfangen. Der Feed wird alle 30 Sekunden aktualisiert, sodass die Daten bis zu 30 Sekunden alt sein können.",
  "connection.reasonUnsupported": "Live-Updates werden hier nicht unterstützt",
  "connection.reasonUnreachable": "Server nicht erreichbar",
  "connection.reasonRefused": "Server hat die Verbindung abgelehnt",
  "connection.whatDoesMean": "Was bedeutet {label}?",

  // ── Transaction explorer ──────────────────────────────────────────────
  "explorer.couldNotLoad":
    "Weitere Transaktionen konnten nicht geladen werden.",
  "explorer.noTransactionsYet": "Noch keine Transaktionen indexiert.",
  "explorer.noMatchingFilters": "Keine Transaktionen passen zu diesen Filtern.",
  "explorer.filteredCount": "{filtered} von {total} geladen",
  "explorer.loadedCount": "{count} geladen",
  "explorer.loading": "Laden\u2026",
  "explorer.loadMore": "Mehr laden",
  "explorer.endOfResults": "Ende der Ergebnisse",

  // ── Live feed ─────────────────────────────────────────────────────────
  "liveFeed.fetching": "Live-Daten werden abgerufen...",
  "liveFeed.noTransactions": "Keine Transaktionen gefunden.",
  "liveFeed.updated": "Aktualisiert {time}",
  "liveFeed.pauseFeed": "Feed pausieren",
  "liveFeed.resumeFeed": "Feed fortsetzen",
  "liveFeed.resumeFeedCount": "Feed fortsetzen ({count})",
  "liveFeed.updatesWaiting":
    "{count} {count, plural, one {Aktualisierung wartet} other {Aktualisierungen warten}}",
  "liveFeed.updatesArrived":
    "{count} {count, plural, one {Aktualisierung ist während der Pause eingetroffen} other {Aktualisierungen sind während der Pause eingetroffen}}",
  "liveFeed.newTransactions":
    "{count} neue {count, plural, one {Transaktion} other {Transaktionen}}",

  // ── Account operations ────────────────────────────────────────────────
  "accountOps.noOperations": "Noch keine Operationen.",
  "accountOps.showingRecent": "Zeige {count} Ihrer letzten Operationen",
  "accountOps.allOperations": "Alle {count} Operationen",
  "accountOps.couldNotLoad":
    "Weitere Operationen konnten nicht geladen werden.",
  "accountOps.endOfResults": "Ende der Ergebnisse",

  // ── Account transactions ──────────────────────────────────────────────
  "accountTxs.noTransactions": "Noch keine Transaktionen.",
  "accountTxs.showingRecent": "Zeige die {count} neuesten Transaktionen",
  "accountTxs.allTransactions": "Alle {count} Transaktionen",
  "accountTxs.couldNotLoad":
    "Weitere Transaktionen konnten nicht geladen werden.",
  "accountTxs.endOfResults": "Ende der Ergebnisse",

  // ── Account detail page ───────────────────────────────────────────────
  "account.breadcrumbExplorer": "Explorer",
  "account.breadcrumbAccounts": "Konten",
  "account.notFoundTitle": "Konto nicht gefunden",
  "account.notFoundBody":
    "Die Adresse {address} existiert nicht im Stellar-Mainnet oder wurde noch nie aufgeladen. Überprüfen Sie die Adresse und das Netzwerk oder laden Sie das Konto auf, bevor Sie es erneut aufrufen.",
  "account.merged": "Zusammengeführt",
  "account.lastModifiedLedger": "Zuletzt geändert bei Ledger {ledger}",
  "account.statSequence": "Sequenz",
  "account.statSubentries": "Unterpositionen",
  "account.statSponsoring": "Sponsoring",
  "account.statSponsored": "Gesponsert",
  "account.flagAuthRequired": "Authentifizierung erforderlich",
  "account.flagAuthRevocable": "Authentifizierung widerrufbar",
  "account.flagAuthImmutable": "Authentifizierung unveränderlich",
  "account.flagAuthClawbackEnabled": "Clawback aktiviert",
  "account.flagNone": "Keine besonderen Flags",
  "account.balancesTitle": "Guthaben",
  "account.balancesAriaLabel": "Kontoguthaben",
  "account.balanceAsset": "Vermögenswert",
  "account.balanceIssuer": "Emittent",
  "account.balanceBalance": "Saldo",
  "account.balanceLimit": "Limit",
  "account.recentTransactions": "Letzte Transaktionen",
  "account.tradesTitle": "Handel",
  "account.tradesUnavailable":
    "Handelsverlauf ist nicht verfügbar. Überprüfen Sie Ihre Verbindung und aktualisieren Sie diese Seite, um es erneut zu versuchen.",
  "account.recentOperations": "Letzte Operationen",
  "account.trustlinesTitle": "Trustline-Verlauf",
  "account.trustlinesUnavailable":
    "Trustline-Verlauf ist nicht verfügbar. Überprüfen Sie Ihre Verbindung und aktualisieren Sie diese Seite, um es erneut zu versuchen.",

  // ── Assets ────────────────────────────────────────────────────────────
  "assets.noAssetsYet":
    "Noch keine Assets indexiert. Sobald der Indexer einen Salzo oder eine Überweisung für ein Asset sieht, erscheint es hier.",
  "assets.searchPlaceholder": "Geladene Assets nach Code oder Ausgeber suchen",
  "assets.orderBy": "Sortieren nach",
  "assets.holders": "Inhaber",
  "assets.volume": "Volumen",
  "assets.couldNotLoad": "Weitere Assets konnten nicht geladen werden.",
  "assets.noMatch": "Kein geladenes Asset entspricht \u201e{query}\u201c.",
  "assets.searchCoversLoaded":
    "Die Suche umfasst die bisher geladenen {count} {noun}. Laden Sie mehr, um sie zu erweitern.",
  "assets.endOfAssets": "Ende der Assets",
  "assets.thAsset": "Asset",
  "assets.thIssuer": "Ausgeber",
  "assets.thSupply": "Angebot",
  "assets.thHolders": "Inhaber",

  // ── Copy button ───────────────────────────────────────────────────────
  "copy.copy": "Kopieren",
  "copy.copied": "Kopiert!",
  "copy.failed": "Fehlgeschlagen",
  "copy.copyAddress": "Adresse in die Zwischenablage kopieren",
  "copy.copiedAddress": "Adresse in die Zwischenablage kopiert",
  "copy.copyHash": "Transaktionshash in die Zwischenablage kopieren",
  "copy.copiedHash": "Transaktionshash in die Zwischenablage kopiert",

  // ── Load more footer ──────────────────────────────────────────────────
  "loadMore.loadMore": "Mehr laden",
  "loadMore.loading": "Laden\u2026",
  "loadMore.retry": "Erneut versuchen",

  // ── Watch feed ────────────────────────────────────────────────────────
  "watch.liveActivity": "Live-Aktivität",
  "watch.emptyTitle": "Sie beobachten noch keine Adressen",
  "watch.emptyBody":
    "Verwenden Sie das Lesezeichen neben jeder Adresse, um ihre Aktivität hier zu verfolgen und einen Benachrichtigung zu erhalten, wenn etwas passiert.",
  "watch.waiting": "Warten auf Aktivität auf Ihren beobachteten Adressen\u2026",
  "watch.watchedAddresses":
    "{count} beobachtete {count, plural, one {Adresse} other {Adressen}}",
  "watch.matchingAlerts":
    "{count} passende {count, plural, one {Benachrichtigung} other {Benachrichtigungen}} in dieser Sitzung",
  "watch.alert": "Benachrichtigung",

  // ── Register contract form ────────────────────────────────────────────
  "register.contractId": "Vertrags-ID",
  "register.projectName": "Projektname",
  "register.description": "Beschreibung",
  "register.categoriesLabel": "Kategorien",
  "register.categoriesHint": "(mindestens eine auswählen)",
  "register.selectCategory": "Wählen Sie mindestens eine Kategorie.",
  "register.registerContract": "Vertrag registrieren",
  "register.preparingTransaction": "Transaktion vorbereiten\u2026",
  "register.approveInWallet": "In Ihrem Wallet genehmigen\u2026",
  "register.submitting": "Senden\u2026",
  "register.confirming": "Bestätigen\u2026",
  "register.successMessage":
    "{name} registriert \u2014 Lumina beginnt in Kürze mit der Indizierung.",
  "register.registrationFailed": "Registrierung fehlgeschlagen.",
  "register.estimatedFee": "Geschätzte Gebühr: {fee} XLM",

  // ── Owner contracts ───────────────────────────────────────────────────
  "owner.loadingContracts": "Ihre Verträge werden geladen\u2026",
  "owner.noContracts": "Sie haben noch keine Verträge registriert.",
  "owner.noContractsHint":
    "Registrieren Sie einen mit dem Formular, um ihn in die Lumina-Indizierung aufzunehmen.",
  "owner.deactivate": "Deaktivieren",
  "owner.preparing": "Vorbereiten\u2026",
  "owner.approveInWallet": "Im Wallet genehmigen\u2026",
  "owner.active": "Aktiv",
  "owner.deactivated": "Deaktiviert",
  "owner.staking": "Staking\u2026",
  "owner.stake": "Staken",
  "owner.stakeAnyway": "Trotzdem staken",
  "owner.reserveWarningTitle":
    "Dieses Staking würde dein Konto unter sein Mindestguthaben bringen.",
  "owner.reserveExplanation":
    "Stellar hält in jedem Konto ein Mindestguthaben in XLM, die Reserve. Sie beträgt 1 XLM für ein Konto ohne weitere Einträge, plus 0,5 XLM für jede Trustline, jedes Angebot oder anderen Eintrag, den es besitzt. Dieser Teil kann nicht ausgegeben werden. Nach diesem Staking hätte dein Konto {remaining} XLM, unter der Reserve von {minimum} XLM. Ein Konto unter seiner Reserve kann weiterhin XLM empfangen, aber keine Transaktionen senden, bis es wieder aufgefüllt wurde.",
  "owner.withdrawing": "Abheben\u2026",
  "owner.withdrawStake": "Einsatz abheben",
  "owner.stakeAmountLabel": "Einsatzbetrag für {name}",
  "owner.stakeAmountPlaceholder": "Betrag (Basiseinheiten)",
  "owner.invalidStakeAmount":
    "Geben Sie einen ganzen Betrag größer als Null in den Basiseinheiten des Staking-Tokens ein.",
  "owner.stakingFailed": "Staking fehlgeschlagen.",
  "owner.withdrawalFailed": "Abhebung fehlgeschlagen.",
  "owner.deactivationFailed": "Deaktivierung fehlgeschlagen.",
  "owner.hideHistory": "Verlauf ausblenden",
  "owner.historyCount": "Verlauf ({count})",
  "owner.noRegistryEvents":
    "Für diesen Vertrag wurden noch keine Registry-Ereignisse indexiert.",
  "owner.slashHistory": "Slash-Verlauf",
  "owner.lifetimeSlashed": "Lebenszeit geslashed: {amount} XLM",
  "owner.loadingSlashHistory": "Slash-Verlauf wird geladen\u2026",
  "owner.couldNotLoadSlashHistory":
    "Slash-Verlauf konnte nicht geladen werden.",
  "owner.noSlashes": "Keine Slashes aufgezeichnet.",
  "owner.withdrawBlockerActive":
    "Deaktivieren Sie zuerst diese Registrierung; der Einsatz kann erst nach der Deaktivierung abgehoben werden.",
  "owner.withdrawBlockerLocked":
    "Ein Slash ist kürzlich gelandet, daher ist die Auszahlung bis zu Ledger {until} gesperrt (aktuell {current}, noch {remaining}).",
  "owner.withdrawBlockerNoStake": "Es gibt keinen Einsatz zum Abheben.",
  "owner.staked": "Eingesetzt",
  "owner.ledgerPrefix": "Ledger",
  "owner.slashHistoryRetryHint":
    "Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.",
  "owner.retrySlashHistory": "Slash-Verlauf erneut laden",

  // ── Registry event labels ─────────────────────────────────────────────
  "registryEvent.registered": "Registriert",
  "registryEvent.deactivated": "Deaktiviert",
  "registryEvent.metadataUpdated": "Metadaten aktualisiert",
  "registryEvent.ownershipTransferred": "Eigentum übertragen",
  "registryEvent.unknown": "Registry-Ereignis",

  // ── Soroban transaction pipeline ──────────────────────────────────────
  "soroban.couldNotPrepare": "Die Transaktion konnte nicht vorbereitet werden.",
  "soroban.signatureDeclined": "Die Signatur wurde in Ihrem Wallet abgelehnt.",
  "soroban.couldNotSign":
    "Die Transaktion konnte nicht signiert werden. Prüfen Sie Ihr Wallet und versuchen Sie es erneut.",
  "soroban.retrySignature": "Signatur erneut anfordern",
  "soroban.prepareAgain":
    "Die gespeicherte Transaktion ist nicht mehr gültig. Senden Sie erneut, um eine neue Transaktion vorzubereiten; Ihre Eingaben bleiben erhalten.",
  "soroban.rejectionPreserved":
    "Signatur abgelehnt. Ihre Eingaben und die vorbereitete Transaktion bleiben gespeichert. Sie können es erneut versuchen, sobald Sie bereit sind.",
  "soroban.networkRejected": "Das Netzwerk hat die Transaktion abgelehnt.",
  "soroban.pendingConfirmation":
    "Die Transaktion wurde gesendet, aber noch nicht bestätigt. Versuchen Sie es in einem Moment erneut.",
  "soroban.transactionFailed":
    "Die Transaktion war nicht erfolgreich (Status: {status}).",

  // ── Pending transactions ──────────────────────────────────────────────
  "pending.title": "Transaktionen",
  "pending.register": "Vertrag {name} registrieren",
  "pending.deactivate": "Vertrag {contract} deaktivieren",
  "pending.stake": "Auf Vertrag {contract} staken",
  "pending.withdraw": "Einsatz von Vertrag {contract} abheben",
  "pending.building": "Wird vorbereitet",
  "pending.awaitingSignature": "Warten auf Ihr Wallet",
  "pending.submitting": "Wird gesendet",
  "pending.confirming": "Wird im Netzwerk bestätigt",
  "pending.succeeded": "Bestätigt",
  "pending.failed": "Fehlgeschlagen",
  "pending.failedFallback": "Die Transaktion wurde nicht abgeschlossen.",
  "pending.dismiss": "Schließen",

  // ── Stats ─────────────────────────────────────────────────────────────
  "stats.noOperationsYet": "Noch keine Operationen indexiert.",

  // ── Events ────────────────────────────────────────────────────────────
  "events.noEventsYet":
    "Für diesen Vertrag wurden noch keine Ereignisse indexiert. Die Ereignisindizierung ist im Indexer optional (INDEXED_CONTRACT_IDS/REGISTRY_CONTRACT_ID) \u2014 siehe das lumina-backend README.",

  // ── Search ────────────────────────────────────────────────────────────
  "search.noMemoMatch":
    "Keine Transaktionen tragen etwas wie dieses Memo. Memo-Suche findet Bestellreferenzen und Kurzcodes \u2014 versuchen Sie ein paar Zeichen davon.",

  // ── Activity labels ───────────────────────────────────────────────────
  "activity.indexed": "Indexierte Aktivität",
  "activity.noEvents": "Noch keine Ereignisse",
  "activity.unknown": "Aktivität unbekannt",

  // ── Table headers ─────────────────────────────────────────────────────
  "table.hash": "Hash",
  "table.ledger": "Ledger",
  "table.ops": "Ops",
  "table.time": "Zeit",
  "table.type": "Typ",
  "table.transaction": "Transaktion",
  "table.detail": "Detail",
  "table.source": "Quelle",
  "table.operations": "Operationen",
  "table.fee": "Gebühr",
  "table.contract": "Vertrag",
  "table.topic": "Thema",
  "table.value": "Wert",

  // ── Common UI ─────────────────────────────────────────────────────────
  "common.search": "Suchen",
  "common.close": "Schließen",
  "common.clear": "Löschen",
  "common.save": "Speichern",
  "common.cancel": "Abbrechen",
  "common.loading": "Laden\u2026",
  "common.error": "Fehler",
  "common.retry": "Erneut versuchen",
  "common.connect": "Wallet verbinden",
  "common.disconnect": "Trennen",
  "common.copy": "Kopieren",
  "common.copied": "Kopiert!",
  "common.xlm": "XLM",

  // ── Skip link ─────────────────────────────────────────────────────────
  "skipLink.skipToMain": "Zum Hauptinhalt springen",

  // ── Theme toggle ──────────────────────────────────────────────────────
  "theme.system": "Systemthema",
  "theme.light": "Helles Thema",
  "theme.dark": "Dunkles Thema",

  // ── Keyboard shortcuts ────────────────────────────────────────────────
  "shortcuts.title": "Tastaturkürzel",
  "shortcuts.search": "Suchen",
  "shortcuts.showList": "Diese Liste anzeigen",
  "shortcuts.description":
    "Tastaturkürzel verwenden nie Ctrl, Cmd oder Alt und werden ignoriert, während Sie in einem Feld tippen.",
  "shortcuts.enable": "Tastaturkürzel aktivieren",
  "shortcuts.sequence": "{start}, danach {key}",
  "shortcuts.route.home": "Startseite",
  "shortcuts.route.explorer": "Explorer",
  "shortcuts.route.transactions": "Transaktionen",
  "shortcuts.route.events": "Vertragsereignisse",
  "shortcuts.route.graphql": "GraphQL",
  "shortcuts.route.registry": "Registry",
  "shortcuts.route.stats": "Statistiken",

  // ── Search page ───────────────────────────────────────────────────────
  "search.heading": "Suche",
  "search.description":
    "Ein Feld für alles im Netzwerk. Geben Sie ein, was Sie haben \u2014 Sie müssen nicht sagen, was es ist.",
  "search.accountAddress": "Kontoadresse",
  "search.contractId": "Vertrags-ID \u2014 dessen Ereignisse",
  "search.transactionHash": "Transaktionshash",
  "search.memoSearch": "Memo-Suche, sortiert nach Relevanz",
  "search.searching": "Index wird durchsucht\u2026",
  "search.resultsCount":
    "{count} Transaktion{count, plural, one {} other {en}} gefunden",
  "search.rankedByMemo": ", sortiert nach Memo-Relevanz.",
  "search.helpText":
    "Suchen Sie ein Konto oder einen Vertrag? Fügen Sie die volle Adresse ein \u2014 der Explorer bringt Sie direkt dorthin.",

  // ── Transactions page ─────────────────────────────────────────────────
  "transactions.heading": "Transaktionen",
  "transactions.loading": "Transaktionen werden geladen\u2026",

  // ── Transaction detail page ───────────────────────────────────────────
  "transaction.backToTransactions": "\u2190 Zurück zu Transaktionen",
  "transaction.notFoundTitle": "Transaktion nicht gefunden",
  "transaction.notFoundBody":
    "Die Transaktion {hash} ist nicht im Index \u2014 sie ist möglicherweise zu neu oder wurde nie in einen Ledger aufgenommen. Überprüfen Sie den Hash und das Netzwerk und suchen Sie erneut, nachdem die Transaktion bestätigt wurde.",
  "transaction.includedInLedger": "Enthalten in Ledger {ledger}",
  "transaction.statStatus": "Status",
  "transaction.statFee": "Gebühr",
  "transaction.statOperations": "Operationen",
  "transaction.statTime": "Zeit",
  "transaction.statusSuccessful": "Erfolgreich",
  "transaction.statusFailed": "Fehlgeschlagen",
  "transaction.detailsHeading": "Details",
  "transaction.sourceAccount": "Quellkonto",
  "transaction.viewSourceAtLedger": "Quellkonto bei Ledger {ledger} anzeigen",
  "transaction.memoType": "Memo-Typ",
  "transaction.memoTypeNone": "keiner",
  "transaction.memo": "Memo",
  "transaction.preconditionsHeading": "Vorbedingungen",
  "transaction.operationsHeading": "Operationen",
  "transaction.operationsCaption": "Transaktionsoperationen",
  "transaction.opColType": "Typ",
  "transaction.opColFrom": "Von",
  "transaction.opColTo": "An",
  "transaction.opColAmount": "Betrag",
  "transaction.opColTime": "Zeit",
  "transaction.noOperations":
    "Für diese Transaktion wurden keine Operationen indexiert.",

  // ── Stats page ────────────────────────────────────────────────────────
  "stats.heading": "Netzwerk-Statistiken",
  "stats.description":
    "Indexer-Gesundheit und Stellar-Netzwerk-Durchsatz auf einen Blick.",
  "stats.latestLedger": "Neuester Ledger",
  "stats.stellarMainnet": "Stellar Mainnet",
  "stats.txsLastLedger": "Txs (letzter Ledger)",
  "stats.successfulFailed": "Erfolgreich + fehlgeschlagen",
  "stats.contractsRegistered": "Registrierte Verträge",
  "stats.viaLumina": "Über Lumina Registry",
  "stats.avgLedgerTime": "Durchschn. Ledger-Zeit",
  "stats.protocolTarget": "~5s",
  "stats.protocolTargetHint": "Protokoll-Ziel, kein Live-Durchschnitt",
  "stats.operationBreakdown": "Aufschlüsselung nach Operationstyp",
  "stats.basedOnRecent":
    "Basierend auf den {count} neuesten indexierten Operationen.",

  // ── Registry page ─────────────────────────────────────────────────────
  "registry.loading": "Registry wird geladen\u2026",
  "registry.sessionRestoreFailed": "Ihre gespeicherte Wallet-Sitzung konnte nicht wiederhergestellt werden.",
  "registry.networkMismatchTitle": "Falsches Netzwerk",
  "registry.networkMismatch": "Ihr Wallet verwendet {walletNetwork}, diese App jedoch {appNetwork}. Wechseln Sie in Ihrem Wallet zum Stellar-Testnetz und versuchen Sie es erneut.",
  "registry.connectFailed": "Verbindung mit Ihrem Wallet konnte nicht hergestellt werden.",
  "registry.disconnectFailed": "Ihr Wallet konnte nicht getrennt werden. Trennen Sie die Verbindung in der Wallet-Erweiterung und laden Sie diese Seite neu.",
  "registry.walletRetry": "{error} \u00d6ffnen Sie Ihr Wallet und w\u00e4hlen Sie \u201eWallet verbinden\u201c, um es erneut zu versuchen.",
  "registry.category.DeFi": "DeFi",
  "registry.category.Nft": "NFT",
  "registry.category.Gaming": "Spiele",
  "registry.category.Identity": "Identit\u00e4t",
  "registry.category.Infrastructure": "Infrastruktur",
  "registry.category.Payments": "Zahlungen",
  "registry.category.Oracle": "Orakel",
  "registry.category.Dao": "DAO",
  "registry.category.Other": "Sonstiges",
  "registry.heading": "Lumina Registry",
  "registry.description":
    "Ein on-chain Soroban-Manifest der Verträge, die Lumina indexiert. Registrieren Sie Ihren Vertrag, um in die priorisierte Indizierung aufgenommen zu werden \u2014 permissionslos, auf Stellar/Soroban Testnet.",
  "registry.registerContract": "Vertrag registrieren",
  "registry.connecting": "Verbinden\u2026",
  "registry.connectPrompt":
    "Verbinden Sie ein Wallet, um Verträge zu registrieren und zu verwalten.",
  "registry.walletLocked": "Ihr Wallet ist gesperrt",
  "registry.unlockHint":
    "Entsperren Sie Ihre Wallet-Erweiterung und versuchen Sie es erneut.",
  "registry.myContracts": "Meine Verträge",
  "registry.recentlyRegistered": "Kürzlich registriert",
  "registry.all": "Alle",
  "registry.filterByCategory": "Nach Kategorie filtern",
  "registry.connectToSee":
    "Verbinden Sie ein Wallet, um die von Ihnen registrierten Verträge zu sehen.",
  "registry.loadingEntries": "Registry-Einträge werden geladen\u2026",
  "registry.noActiveContracts": "Keine aktiven {category}-Verträge.",
  "registry.noContractsYet": "Noch keine Verträge registriert.",
  "registry.couldNotReach": "Registry-Vertrag konnte nicht erreicht werden.",

  // ── GraphQL page ──────────────────────────────────────────────────────
  "graphql.heading": "GraphQL Playground",
  "graphql.endpoint": "Lumina GraphQL-Endpunkt:",
  "graphql.queryExamples": "Abfrage-Beispiele",
  "graphql.recentQueries": "Letzte Abfragen",
  "graphql.noHistory": "Bearbeitete Abfragen erscheinen hier.",
  "graphql.queryEditor": "Abfrage-Editor",
  "graphql.running": "Wird ausgeführt\u2026",
  "graphql.runQuery": "Abfrage ausführen",
  "graphql.response": "Antwort",
  "graphql.clickToRun":
    "Klicken Sie auf \u201eAbfrage ausführen\u201c, um die Antwort zu sehen.",

  // ── Explorer page ─────────────────────────────────────────────────────
  "explorer.heading": "Explorer",
  "explorer.description":
    "Durchsuchen Sie jedes Stellar-Konto oder blättern Sie durch aktuelle Transaktionen in Echtzeit.",
  "explorer.searchPlaceholder":
    "Konto, Transaktion, Vertrag oder Memo suchen\u2026",
  "explorer.recentTransactions": "Aktuelle Transaktionen",

  // ── Events page ───────────────────────────────────────────────────────
  "events.heading": "Vertrags-Ereignisse",
  "events.description":
    "Soroban-Vertrags-Ereignisse, indexiert über RPC, neueste zuerst.",
  "events.contractIdPlaceholder": "Vertrags-ID (C...)",
  "events.filter": "Filtern",

  // ── Assets page ───────────────────────────────────────────────────────
  "assets.heading": "Assets",
  "assets.description":
    "Jedes Asset, das Lumina indexiert, mit Angebot und Inhaberzahlen.",

  // ── Asset detail page ─────────────────────────────────────────────────
  "assetDetail.backToAssets": "\u2190 Zurück zu Assets",
  "assetDetail.eyebrow": "Asset",
  "assetDetail.nativeAsset": "Nativer Asset",
  "assetDetail.customAsset": "Benutzerdefinierter Asset",
  "assetDetail.nativeStellarAsset": "Nativer Stellar-Asset",
  "assetDetail.statSupply": "Angebot",
  "assetDetail.statHolders": "Inhaber",
  "assetDetail.stat30dVolume": "30-Tage-Volumen",
  "assetDetail.detailsAriaLabel": "Asset-Details",
  "assetDetail.rowAssetCode": "Asset-Code",
  "assetDetail.rowIssuer": "Emittent",
  "assetDetail.transferVolumeHeading": "Überweisungsvolumen",
  "assetDetail.noActivityTitle": "Keine Aktivität in den letzten 30 Tagen",
  "assetDetail.noActivityBody":
    "Das Überweisungsvolumen für {asset} wird hier angezeigt, sobald dieser Asset gesendet oder empfangen wurde.",
  "assetDetail.chartTitle": "{asset} Überweisungsvolumen",
  "assetDetail.chartDescription":
    "Tägliches Überweisungsvolumen für {asset} in den letzten 30 Tagen.",
  "assetDetail.chartCaption":
    "Überweisungsvolumen (gesendet + empfangen) pro Tag \u00b7 letzte 30 Tage \u00b7 Tages-Buckets",

  // ── Watch page ────────────────────────────────────────────────────────
  "watch.backgroundNotifications": "Hintergrund-Benachrichtigungen",
  "watch.notificationDescription":
    "In-App-Alerts funktionieren überall in Lumina. Dies ist die separate Opt-in-Option für eine Betriebssystembenachrichtigung, wenn der Tab nicht im Vordergrund ist.",

  // ── Footer ────────────────────────────────────────────────────────────
  "footer.version": "Lumina Frontend v{version}",
  "footer.copyVersion": "Version für Fehlerberichte kopieren",

  // ── SearchBar ─────────────────────────────────────────────────────────
  "searchBar.placeholder": "Konto, Transaktion, Vertrag oder Memo suchen\u2026",

  // ── Developer portal ──────────────────────────────────────────────────
  "devPortal.heading": "Lumina Developer Portal",
  "devPortal.description":
    "Alles, was Sie brauchen, um die Stellar-API von Lumina in Ihre Anwendung zu integrieren. Von Ihrer ersten Abfrage bis zum Produktions-Monitoring.",
  "devPortal.gettingStarted.title": "Erste Schritte",
  "devPortal.gettingStarted.description":
    "Schritt-für-Schritt-Anleitung für Ihre erste API-Anfrage. Lernen Sie Authentifizierung, Paginierung und Fehlerbehandlung mit Copy-Paste-Codebeispielen.",
  "devPortal.gettingStarted.cta": "Loslegen →",
  "devPortal.apiDocs.title": "API-Dokumentation",
  "devPortal.apiDocs.description":
    "Entdecken Sie das GraphQL-Schema mit ausgearbeiteten Beispielen, die Sie live ausführen können. Verstehen Sie Paginierungsmuster und Fehlerbehandlung im Detail.",
  "devPortal.apiDocs.cta": "Docs erkunden →",
  "devPortal.playground.title": "Abfrage-Playground",
  "devPortal.playground.description":
    "Schreiben Sie GraphQL-Abfragen und generieren Sie Client-Code in JavaScript und Python. Testen Sie Ihre Abfragen live gegen die echte API.",
  "devPortal.playground.cta": "Playground öffnen →",
  "devPortal.usage.title": "Nutzungs-Dashboard",
  "devPortal.usage.description":
    "Überwachen Sie die Nutzung Ihrer API-Schlüssel und Ihres Kontingents. Sehen Sie Anfragezahlen und Trends im Zeitverlauf.",
  "devPortal.usage.cta": "Dashboard ansehen →",
  "devPortal.webhooks.title": "Webhooks",
  "devPortal.webhooks.description":
    "Registrieren Sie Webhooks für Echtzeit-Ereignisbenachrichtigungen. Überwachen Sie Zustellversuche und testen Sie Ihre Endpunkte.",
  "devPortal.webhooks.cta": "Webhooks verwalten →",
  "devPortal.quickStart.title": "Schnellstart",
  "devPortal.quickStart.before": "Neu bei Lumina? Schauen Sie sich unseren",
  "devPortal.quickStart.link": "Erste-Schritte-Leitfaden",
  "devPortal.quickStart.after":
    "an, um die Grundlagen zu lernen. In wenigen Minuten führen Sie Abfragen auf der Stellar-Blockchain aus.",
  "devPortal.step1.action": "Stellen Sie eine Anfrage",
  "devPortal.step1.rest":
    "mit unserem Playground oder Ihrer bevorzugten Sprache",
  "devPortal.step2.action": "Generieren Sie Code",
  "devPortal.step2.rest": "in JavaScript oder Python für Ihre Anwendung",
  "devPortal.step3.action": "Überwachen Sie die Nutzung",
  "devPortal.step3.rest": "in Ihrem Dashboard",

  // ── Getting started guide ─────────────────────────────────────────────
  "guide.heading": "Erste Schritte mit Lumina",
  "guide.subtitle":
    "Erfahren Sie, wie Sie in nur wenigen Minuten Ihre erste GraphQL-Abfrage stellen.",
  "guide.step1.title": "Stellen Sie Ihre erste Anfrage",
  "guide.step1.before": "Die Lumina GraphQL-API ist verfügbar unter",
  "guide.step1.after":
    ". Beginnen Sie mit dieser einfachen Abfrage, die den neuesten Ledger abruft:",
  "guide.step1.hint":
    "Kopieren Sie den obigen Code und führen Sie ihn in Ihrem Terminal aus. Sie sollten die neuesten Stellar-Ledger-Informationen sehen.",
  "guide.example.firstRequest": "Erste Anfrage",
  "guide.example.pagination": "Abfrage mit Paginierung",
  "guide.step2.title": "Mit Paginierung arbeiten",
  "guide.step2.intro":
    "Bei Abfragen, die mehrere Einträge zurückgeben, verwenden wir cursor-basierte Paginierung.",
  "guide.step2.response":
    "Die Antwort enthält ein pageInfo-Objekt mit den Feldern hasNextPage und cursor:",
  "guide.step2.nextTitle": "So laden Sie die nächste Seite:",
  "guide.step2.nextBefore":
    "Um die nächste Ergebnisseite zu erhalten, übergeben Sie den",
  "guide.step2.nextAfter": "aus der vorherigen Antwort an die nächste Abfrage:",
  "guide.step3.title": "Fehler abfangen",
  "guide.step3.before":
    "Die GraphQL-API gibt auch bei Fehlern HTTP 200 zurück — prüfen Sie das",
  "guide.step3.after": "Array in der Antwort:",
  "guide.errors.title": "Häufige Fehler:",
  "guide.errors.invalidQuery": "Ungültige Abfrage",
  "guide.errors.invalidQueryBefore":
    "Ihre GraphQL-Syntax ist ungültig. Prüfen Sie den",
  "guide.errors.invalidQueryLink": "Playground",
  "guide.errors.invalidQueryAfter": "für das korrekte Schema.",
  "guide.errors.notFound": "Nicht gefunden",
  "guide.errors.notFoundDesc":
    "Die Ressource existiert nicht (z. B. ein Konto, das auf Stellar noch nicht aufgeladen wurde).",
  "guide.errors.serverError": "Serverfehler",
  "guide.errors.serverErrorDesc":
    "Unser Backend ist vorübergehend nicht verfügbar. Wiederholen Sie es mit exponentiellem Backoff.",
  "guide.errorHandling.title": "Muster zur Fehlerbehandlung",
  "guide.step4.title": "Das Schema erkunden",
  "guide.step4.before": "Besuchen Sie den",
  "guide.step4.link": "GraphQL Playground",
  "guide.step4.after":
    ", um alle verfügbaren Abfragen und Datentypen zu erkunden. Der Playground enthält ausgearbeitete Beispiele, die Sie live gegen die API ausführen können.",
  "guide.step4.popularLabel": "Beliebte Abfragen:",
  "guide.step4.popularItems":
    "Letzte Transaktionen, Kontostände, Vertragsereignisse, Asset-Informationen, Zahlungsverlauf",
  "guide.next.title": "Wie geht es weiter?",
  "guide.next.tryPlayground.label": "Playground ausprobieren:",
  "guide.next.tryPlayground.link": "Live-Abfragen ausführen",
  "guide.next.readDocs.label": "Docs lesen:",
  "guide.next.readDocs.link":
    "Tauchen Sie tiefer in Paginierung und Fehlerbehandlung ein",
  "guide.next.generateCode.label": "Code generieren:",
  "guide.next.generateCode.text":
    "Verwenden Sie den Playground, um eine Abfrage zu schreiben, und generieren Sie dann produktionsreifen Code in JavaScript oder Python",
  "guide.next.monitorUsage.label": "Nutzung überwachen:",
  "guide.next.monitorUsage.link": "Verfolgen Sie Ihren API-Verbrauch",

  // ── API documentation ─────────────────────────────────────────────────
  "apiDocs.heading": "API-Dokumentation",
  "apiDocs.subtitleBefore":
    "Entdecken Sie das GraphQL-Schema mit ausgearbeiteten Beispielen, die Sie live gegen die API ausführen können. Alle folgenden Beispiele sind im",
  "apiDocs.subtitleLink": "GraphQL Playground",
  "apiDocs.pagination.title": "Paginierungsleitfaden",
  "apiDocs.pagination.intro":
    "Alle Listenabfragen in Lumina verwenden cursor-basierte Paginierung. Dieser Ansatz ist für große Datensätze ideal, weil er:",
  "apiDocs.pagination.bulletScalable.label": "Skalierbar:",
  "apiDocs.pagination.bulletScalable.desc":
    "Cursor erfordern keine Offset-Berechnungen",
  "apiDocs.pagination.bulletStable.label": "Stabil:",
  "apiDocs.pagination.bulletStable.desc":
    "Ergebnisse verschieben sich nicht, wenn Einträge hinzugefügt oder entfernt werden",
  "apiDocs.pagination.bulletEfficient.label": "Effizient:",
  "apiDocs.pagination.bulletEfficient.desc":
    "Es ist nicht nötig, frühere Einträge abzurufen und zu überspringen",
  "apiDocs.pagination.returns": "Jede Listenabfrage gibt Folgendes zurück:",
  "apiDocs.pagination.next":
    "Um die nächste Seite zu laden, übergeben Sie den Cursor aus der vorherigen Antwort:",
  "apiDocs.errors.title": "Fehlerbehandlung",
  "apiDocs.errors.before": "GraphQL gibt immer HTTP 200 zurück. Prüfen Sie das",
  "apiDocs.errors.after": "Array auf Probleme:",
  "apiDocs.errors.success": "Erfolgreiche Antwort",
  "apiDocs.errors.error": "Fehlerantwort",
  "apiDocs.errors.checkBefore": "Prüfen Sie immer",
  "apiDocs.errors.checkMiddle": "bevor Sie auf",
  "apiDocs.errors.checkAfter": " zugreifen.",
  "apiDocs.examples.title": "Ausgearbeitete Beispiele",
  "apiDocs.example.recentTransactions.name": "Letzte Transaktionen",
  "apiDocs.example.recentTransactions.description":
    "Ruft die letzten 5 Transaktionen im Netzwerk ab",
  "apiDocs.example.accountBalances.name": "Kontostände",
  "apiDocs.example.accountBalances.description":
    "Ruft alle Asset-Guthaben eines Kontos ab (Adresse unten bearbeiten)",
  "apiDocs.example.paymentHistory.name": "Zahlungsverlauf",
  "apiDocs.example.paymentHistory.description":
    "Ruft Zahlungsoperationen eines Kontos ab (Adresse unten bearbeiten)",
  "apiDocs.example.contractEvents.name": "Vertragsereignisse",
  "apiDocs.example.contractEvents.description":
    "Fragt Soroban-Vertragsereignisse nach Vertragsadresse ab (Vertrags-ID unten bearbeiten)",
  "apiDocs.tryInPlayground": "Im Playground ausprobieren",
  "apiDocs.viewDocs": "Docs ansehen",
  "apiDocs.next.title": "Nächste Schritte",
  "apiDocs.next.runExample.label": "Beispiel ausführen:",
  "apiDocs.next.runExample.text":
    'Klicken Sie auf "{button}", um eines der obigen Beispiele gegen die Live-API auszuführen',
  "apiDocs.next.modify.label": "Bearbeiten und testen:",
  "apiDocs.next.modify.text":
    "Bearbeiten Sie die Abfrage im Playground, um verschiedene Felder und Filter zu erkunden",
  "apiDocs.next.generate.label": "Code generieren:",
  "apiDocs.next.generate.text":
    "Sobald Ihre Abfrage funktioniert, generieren Sie JavaScript- oder Python-Code zur Integration in Ihre App",

  // ── Usage dashboard ───────────────────────────────────────────────────
  "usage.heading": "Nutzungs-Dashboard",
  "usage.subtitle":
    "Überwachen Sie die Nutzung Ihrer API-Schlüssel und Ihres Kontingents, geschützt durch Wallet-Eigentum.",
  "usage.connectedOwner": "Verbundenes Eigentümerkonto",
  "usage.walletRequired.title": "Wallet-Eigentum erforderlich",
  "usage.walletRequired.body":
    "Die Schlüsselverwaltung ist strikt an den Besitz einer Wallet gebunden. Verbinden Sie Ihre Stellar-Wallet, um Ihre privaten API-Schlüssel anzuzeigen, zu erstellen und zu verwalten.",
  "usage.connecting": "Wallet wird verbunden…",
  "usage.connectCta": "Wallet verbinden, um auf Schlüssel zuzugreifen",
  "usage.requestsThisWeek": "Anfragen diese Woche",
  "usage.peakDay": "Spitzentag: {count} Anfragen",
  "usage.quotaRemaining": "Verbleibendes Kontingent",
  "usage.quotaOfTotal": "von {total} insgesamt",
  "usage.quotaUsage": "Kontingentnutzung",
  "usage.warning": "Warnung",
  "usage.requestsOverTime": "Anfragen im Zeitverlauf (letzte 7 Tage)",
  "usage.byApiKey": "Nutzung nach API-Schlüssel",
  "usage.keyManagement": "API-Schlüssel-Verwaltung",
  "usage.keyNamePlaceholder": "Schlüsselname (z. B. Staging-Schlüssel)",
  "usage.createKey": "API-Schlüssel erstellen",
  "usage.thKeyName": "Schlüsselname",
  "usage.thApiKey": "API-Schlüssel",
  "usage.thCreated": "Erstellt",
  "usage.thUsage": "Nutzung",
  "usage.thAction": "Aktion",
  "usage.percentUsed": "{percent} % verbraucht",
  "usage.revoke": "Widerrufen",
  "usage.aboutKeys.title": "Über wallet-geschützte Schlüssel",
  "usage.aboutKeys.body":
    "API-Schlüssel sind 1:1 mit Ihrer Wallet-Adresse als Ihrer Identität verknüpft. Das Trennen Ihrer Wallet schützt Ihre Schlüssel vor der Anzeige, ohne sie zu löschen.",

  // ── Code snippet ──────────────────────────────────────────────────────
  "codeSnippet.copy": "Kopieren",
  "codeSnippet.copied": "✓ Kopiert",
  "codeSnippet.copiedAria": "Code kopiert",
  "codeSnippet.copiedStatus": "Code in die Zwischenablage kopiert",
  "codeSnippet.copyError":
    "Zwischenablagenzugriff fehlgeschlagen. Markieren Sie den Code und kopieren Sie ihn manuell.",

  // ── CommandPalette ────────────────────────────────────────────────────
  "commandPalette.placeholder": "Routen und Aktionen suchen...",
  "commandPalette.noResults": "Keine Ergebnisse gefunden",
  "commandPalette.selectHint": "Auswählen",
  "commandPalette.navigateHint": "Navigieren",
  "commandPalette.searchAction": "Suchen",
  "commandPalette.searchActionDescription":
    "Stellar-Adressen und -Transaktionen suchen",
  "commandPalette.route.explorer.label": "Explorer",
  "commandPalette.route.explorer.description":
    "Durchsuchen Sie jedes Stellar-Konto oder blättern Sie durch aktuelle Transaktionen, live aktualisiert über ein GraphQL-Abonnement.",
  "commandPalette.route.transactions.label": "Transaktionen",
  "commandPalette.route.transactions.description":
    "Jede indexierte Stellar-Transaktion, mit Filtern, gespeicherten Vorlagen und Cursor-Paginierung.",
  "commandPalette.route.ledgers.label": "Ledgers",
  "commandPalette.route.ledgers.description":
    "Indexierte Stellar-Ledgers, neueste zuerst: Abschlusszeit, Transaktions- und Operationsanzahl sowie Lücken im Index.",
  "commandPalette.route.search.label": "Suche",
  "commandPalette.route.search.description":
    "Memo-Suche über alle indexierten Transaktionen — Bestellreferenzen und Kurzcodes, sortiert nach der Trigramm-Ähnlichkeit des Backends.",
  "commandPalette.route.events.label": "Vertragsereignisse",
  "commandPalette.route.events.description":
    "Von Lumina indexierte Soroban-Vertragsereignisse, filterbar nach Vertrags-ID.",
  "commandPalette.route.assets.label": "Assets",
  "commandPalette.route.assets.description":
    "Jedes von Lumina indexierte Stellar-Asset — Angebots- und Inhaberzahlen, sortiert nach Inhabern oder Überweisungsvolumen.",
  "commandPalette.route.graphql.label": "GraphQL",
  "commandPalette.route.graphql.description":
    "Führen Sie Abfragen gegen die Lumina GraphQL-API direkt im Browser aus, mit ausgearbeiteten Beispielen.",
  "commandPalette.route.developers.label": "Entwickler",
  "commandPalette.route.developers.description":
    "API-Dokumentation, Getting-Started-Guide und Nutzungs-Dashboard für Entwickler, die mit Lumina arbeiten.",
  "commandPalette.route.registry.label": "Registry",
  "commandPalette.route.registry.description":
    "Ein on-chain Soroban-Manifest der Verträge, die Lumina indexiert — registrieren Sie einen Vertrag, um in die Indizierung aufgenommen zu werden.",
  "commandPalette.route.stats.label": "Statistiken",
  "commandPalette.route.stats.description":
    "Indexer-Status und Stellar-Netzwerk-Durchsatz: neuester Ledger, Transaktionsvolumen und die Mischung der Operationstypen.",
  "commandPalette.route.watch.label": "Watchlist",
  "commandPalette.route.watch.description":
    "Verfolgen Sie Stellar-Adressen: ein Live-Feed der Aktivität über alles, was Sie beobachten, mit Alarmfiltern pro Adresse.",

  // ── AddressLabelManager ───────────────────────────────────────────────
  "addressLabelManager.labels": "Labels",
  "addressLabelManager.manageLabels": "Adressen-Labels verwalten",
  "addressLabelManager.title": "Adressen-Labels",
  "addressLabelManager.addNewLabel": "Neues Label hinzufügen",
  "addressLabelManager.addressPlaceholder": "Stellar-Adresse",
  "addressLabelManager.labelPlaceholder": "Label",
  "addressLabelManager.addLabel": "Label hinzufügen",
  "addressLabelManager.yourLabels": "Ihre Labels",
  "addressLabelManager.save": "Speichern",
  "addressLabelManager.edit": "Bearbeiten",
  "addressLabelManager.deleteLabel": "Label löschen",
  "addressLabelManager.invalidFormat": "Ungültiges Label-Format",
  "addressLabelManager.failedToRead": "Datei konnte nicht gelesen werden",
  "addressLabelManager.export": "Exportieren",
  "addressLabelManager.import": "Importieren",
  "addressLabelManager.exportTitle": "Labels als JSON exportieren",
  "addressLabelManager.importTitle": "Labels aus JSON importieren",
  "addressLabelManager.importFile": "Label-Datei importieren",

  // ── accountActivity ──
  "accountActivity.liveActivity": "Live-Aktivität",
  "accountActivity.waitingForActivity": "Warten auf neue Aktivität auf diesem Konto\u2026",
  "accountActivity.latestActivity": "Neueste Kontoaktivität",
  "accountActivity.viewTransactionLabel": "{type}-Transaktion {hash} auf Stellar Expert anzeigen (öffnet in einem neuen Tab)",
  // ── trustline ──
  "trustline.removed": "Entfernt",
  "trustline.set": "Gesetzt",
  "trustline.unknown": "Unbekannt",
  "trustline.couldNotLoadMore": "Weitere Trustline-Historie konnte nicht geladen werden.",
  "trustline.noChanges": "Keine Trustline-Änderungen für dieses Konto aufgezeichnet.",
  "trustline.showingRecent": "Zeige {count} der letzten Trustline-Änderungen",
  "trustline.allChanges": "Alle {count} Trustline-{count, plural, one {Änderung} other {Änderungen}}",
  "trustline.limit": "Limit",
  "trustline.onStellarExpert": "auf stellar.expert (öffnet in neuem Tab)",
  "trustline.endOfHistory": "Ende der Trustline-Historie",
  // ── portfolio ──
  "portfolio.heading": "Portfolio-Aktivität",
  "portfolio.selectAsset": "Asset zum Anzeigen auswählen",
  "portfolio.couldNotLoad": "Aktivitätsdaten konnten nicht geladen werden.",
  "portfolio.noActivity": "Keine Aktivität in den letzten 30 Tagen",
  "portfolio.noActivityDescription": "Transfervolumen für {asset} erscheint hier, sobald dieses Konto eine Zahlung sendet oder empfängt.",
  "portfolio.transferVolume": "{asset} Transfervolumen",
  "portfolio.transferVolumeDescription": "Tägliches Transfervolumen für {asset} über die letzten 30 Tage, gemessen in {asset}.",
  "portfolio.caption": "Transfervolumen (gesendet + empfangen) pro Tag \u00b7 letzte 30 Tage \u00b7 tägliche Buckets",
  "portfolio.showLess": "Weniger anzeigen",
  "portfolio.showMore": "+{count} weitere",
  "portfolio.loadingVolume": "Transfervolumen wird geladen",
  // ── footer ──
  "footer.copied": "Kopiert!",
  "footer.copy": "Kopieren",
  "footer.reportProblem": "Problem melden",
  "footer.statusChangelog": "Status & Änderungsprotokoll",
  // ── watchAlertSettings ──
  "watchAlertSettings.alertFilter": "Benachrichtigungsfilter für {address}",
  "watchAlertSettings.operation": "Operation",
  "watchAlertSettings.anyOperation": "Jede Operation",
  "watchAlertSettings.minimumAmount": "Mindestbetrag",
  "watchAlertSettings.any": "Beliebig",
  "watchAlertSettings.asset": "Asset",
  "watchAlertSettings.noFilter": "Kein Filter — jede Operation löst eine Benachrichtigung aus.",
  "watchAlertSettings.filtersActive": "{count} {count, plural, one {Filter} other {Filter}} aktiv.",
  "watchAlertSettings.resetDefault": "Auf Standard zurücksetzen",
  // ── registrySlashHistory ──
  "registrySlashHistory.slashHistory": "Slash-Verlauf",
  "registrySlashHistory.hideSlashHistory": "Slash-Verlauf ausblenden",
  "registrySlashHistory.loadingSlashHistory": "Slash-Verlauf wird geladen…",
  "registrySlashHistory.couldNotReadHistory": "Slash-Verlauf konnte nicht gelesen werden. Schließen und erneut öffnen, um es zu wiederholen.",
  "registrySlashHistory.noSlashes": "Keine Slashes aufgezeichnet.",
  "registrySlashHistory.ledger": "Ledger {ledger}",
  // ── registryEntryCard ──
  "registryEntryCard.categories": "Kategorien",
  "registryEntryCard.hideSlashHistory": "Slash-Verlauf ausblenden",
  "registryEntryCard.slashHistory": "Slash-Verlauf",
  "registryEntryCard.loadingSlashHistory": "Slash-Verlauf wird geladen…",
  "registryEntryCard.couldNotReadHistory": "Slash-Verlauf konnte nicht gelesen werden. Überprüfen Sie Ihre Verbindung und versuchen Sie es erneut.",
  "registryEntryCard.retryHistory": "Verlauf erneut versuchen",
  "registryEntryCard.noSlashes": "Keine Slashes aufgezeichnet.",
  "registryEntryCard.ledger": "Ledger {ledger}",
  // ── searchBar ──
  "searchBar.searchKindAccount": "Konto",
  "searchBar.searchKindContract": "Vertrag",
  "searchBar.searchKindMuxed": "Gemuxtes Konto",
  "searchBar.searchKindTransaction": "Transaktion",
  "searchBar.searchKindMemo": "Memo-Suche",
  // ── breadcrumbs ──
  "breadcrumbs.ariaLabel": "Breadcrumb",
  // ── pushOptIn ──
  "pushOptIn.unsupported": "Dieser Browser kann keine Benachrichtigungen für beobachtete Aktivitäten übermitteln. Die In-App-Benachrichtigungen funktionieren weiterhin.",
  "pushOptIn.denied": "Benachrichtigungen sind für diese Website blockiert. Aktivieren Sie sie in den Website-Einstellungen Ihres Browsers erneut, um Benachrichtigungen zu erhalten, während dieser Tab im Hintergrund ist. Die In-App-Benachrichtigungen sind nicht betroffen.",
  "pushOptIn.subscribed": "Browser-Benachrichtigungen sind aktiviert. Sie werden benachrichtigt, wenn eine beobachtete Adresse aktiv ist und dieser Tab im Hintergrund ist.",
  "pushOptIn.turnOff": "Ausschalten",
  "pushOptIn.description": "Erhalten Sie eine Browser-Benachrichtigung, wenn eine beobachtete Adresse aktiv ist und dieser Tab im Hintergrund ist.",
  "pushOptIn.noVapidKey": "Browser-Benachrichtigungen benötigen einen öffentlichen VAPID-Schlüssel. Setzen Sie NEXT_PUBLIC_VAPID_PUBLIC_KEY, um sie zu aktivieren — die In-App-Benachrichtigungen funktionieren ohne ihn.",
  "pushOptIn.enable": "Benachrichtigungen aktivieren",
  "pushOptIn.enabling": "Wird aktiviert\u2026",
  // ── navbar ──
  "navbar.home": "Lumina-Startseite",
  "navbar.mainNav": "Hauptnavigation",
  // ── networkStats ──
  "networkStats.activeAccounts": "Aktive Konten",
  "networkStats.inSampledData": "In den Stichprobendaten",
  "networkStats.inSampledTransactions": "In den Stichproben-Transaktionen",
  "networkStats.mostRecent": "Neueste",
  "networkStats.noOperationData": "Keine Operationsdaten verfügbar",
  "networkStats.noTransactionData": "Keine Transaktionsdaten verfügbar",
  "networkStats.operationsCaption": "Basierend auf den neuesten indizierten Operationen",
  "networkStats.operationsDescription": "Stündliches Operationsvolumen aus aktuellen indizierten Daten",
  "networkStats.operationsOverTime": "Operationen im Zeitverlauf",
  "networkStats.operationsUnit": " Ops",
  "networkStats.sampledOperations": "Stichprobenartige Operationen",
  "networkStats.sampledTransactions": "Stichprobenartige Transaktionen",
  "networkStats.successRate": "Erfolgsquote",
  "networkStats.transactionsCaption": "Basierend auf den neuesten indizierten Transaktionen",
  "networkStats.transactionsDescription": "Stündliches Transaktionsvolumen aus aktuellen indizierten Daten",
  "networkStats.transactionsOverTime": "Transaktionen im Zeitverlauf",
  "networkStats.transactionsUnit": " Tx",
  // ── onTour ──
  "onTour.closeTour": "Tour schließen",
  "onTour.done": "Fertig",
  "onTour.next": "Weiter",
  "onTour.skip": "Überspringen",
  "onTour.stepPosition": "{current} von {total}",
  "onTour.welcomeSubtitle": "Entdecken wir, was Lumina einzigartig macht",
  "onTour.welcomeTitle": "Willkommen bei Lumina",
  // ── search ──
  "search.explorerLink": "dem Explorer",
  "search.helpTextAfterLink": " führt Sie direkt dorthin.",
  "search.helpTextBeforeLink": "Suchen Sie ein Konto oder einen Vertrag? Fügen Sie die vollständige Adresse ein – ",
  // ── transactionFilters ──
  "transactionFilters.applyPreset": "Voreinstellung {name} anwenden",
  "transactionFilters.clearFilters": "Filter zurücksetzen ({count})",
  "transactionFilters.deletePreset": "Voreinstellung {name} löschen",
  "transactionFilters.from": "Von",
  "transactionFilters.maxFee": "Max. Gebühr (XLM)",
  "transactionFilters.minOperations": "Min. Operationen",
  "transactionFilters.presetNameLabel": "Name der Voreinstellung",
  "transactionFilters.presetNamePlaceholder": "Diesen Filter benennen",
  "transactionFilters.savePreset": "Voreinstellung speichern",
  "transactionFilters.savedPresets": "Gespeicherte Filter-Voreinstellungen",
  "transactionFilters.sourceAccount": "Quellkonto",
  "transactionFilters.statusFilter": "Filter für den Transaktionsstatus",
  "transactionFilters.to": "Bis",
  // ── walletInfo ──
  "walletInfo.disconnect": "Trennen",
  "walletInfo.disconnectLabel": "Wallet trennen",
  "walletInfo.disconnecting": "Wird getrennt…",
  // ── watchList ──
  "watchList.addWatch": "Beobachtung hinzufügen",
  "watchList.addressLabel": "Zu beobachtende Stellar-Adresse",
  "watchList.cancel": "Abbrechen",
  "watchList.confirmImport": "Import bestätigen",
  "watchList.emptyState":
    "Noch nichts beobachtet. Fügen Sie oben eine Adresse hinzu oder verwenden Sie das Lesezeichen-Symbol neben einem Konto auf der Website.",
  "watchList.errorDuplicate":
    "Diese Adresse steht bereits auf Ihrer Watchlist. Wählen Sie eine andere Adresse oder entfernen Sie zuerst die vorhandene.",
  "watchList.errorEmpty": "Geben Sie eine zu beobachtende Adresse ein.",
  "watchList.errorInvalid": "Das ist keine Stellar-Konto-ID: {hint}.",
  "watchList.exportList": "Liste exportieren",
  "watchList.filtersCount":
    "{count} {count, plural, one {Filter} other {Filter}}",
  "watchList.heading": "Beobachtete Adressen",
  "watchList.importFailed":
    "{error} Überprüfen Sie das Dateiformat und wählen Sie eine gültige Watchlist, um es erneut zu versuchen.",
  "watchList.importFailedFallback": "Import der Watchlist fehlgeschlagen.",
  "watchList.importFileLabel": "Watchlist-Datei importieren",
  "watchList.importList": "Liste importieren",
  "watchList.importPrompt":
    "Wählen Sie, wie die importierten Adressen auf Ihre aktuelle Watchlist angewendet werden:",
  "watchList.importTitle": "Watchlist importieren",
  "watchList.listFull":
    "Die Liste ist auf {count} Adressen begrenzt. Entfernen Sie eine, um eine andere hinzuzufügen.",
  "watchList.mergeOption": "Zusammenführen (mit bestehenden kombinieren)",
  "watchList.remove": "Entfernen",
  "watchList.replaceOption": "Ersetzen (aktuelle Liste überschreiben)",
  "watchList.unwatch": "{address} nicht mehr beobachten",
};

export default de;
