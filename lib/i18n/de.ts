import type { MessageCatalogue } from "./types";

const de: MessageCatalogue = {
  // ── Route errors ──────────────────────────────────────────────────────
  "error.failedToLoadRoute": "Fehler beim Laden von {route}",
  "error.routeRecoveryHint":
    "Dies ist in der Regel ein vorübergehendes Problem beim Erreichen des Stellar-Netzwerks. Der Rest der App ist weiterhin verfügbar.",
  "error.tryAgain": "Erneut versuchen",
  "error.errorDigest": "Fehlerzusammenfassung: {digest}",

  // ── Backend unavailable ───────────────────────────────────────────────
  "error.backendUnavailableTitle": "Lumina-Daten sind vorübergehend nicht verfügbar",
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
  "explorer.couldNotLoad": "Weitere Transaktionen konnten nicht geladen werden.",
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

  // ── Account operations ────────────────────────────────────────────────
  "accountOps.noOperations": "Noch keine Operationen.",
  "accountOps.showingRecent":
    "Zeige {count} Ihrer letzten Operationen",
  "accountOps.allOperations": "Alle {count} Operationen",
  "accountOps.couldNotLoad": "Weitere Operationen konnten nicht geladen werden.",
  "accountOps.endOfResults": "Ende der Ergebnisse",

  // ── Account transactions ──────────────────────────────────────────────
  "accountTxs.noTransactions": "Noch keine Transaktionen.",
  "accountTxs.showingRecent":
    "Zeige die {count} neuesten Transaktionen",
  "accountTxs.allTransactions": "Alle {count} Transaktionen",
  "accountTxs.couldNotLoad": "Weitere Transaktionen konnten nicht geladen werden.",
  "accountTxs.endOfResults": "Ende der Ergebnisse",

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
  "owner.couldNotLoadSlashHistory": "Slash-Verlauf konnte nicht geladen werden.",
  "owner.noSlashes": "Keine Slashes aufgezeichnet.",
  "owner.withdrawBlockerActive":
    "Deaktivieren Sie zuerst diese Registrierung; der Einsatz kann erst nach der Deaktivierung abgehoben werden.",
  "owner.withdrawBlockerLocked":
    "Ein Slash ist kürzlich gelandet, daher ist die Auszahlung bis zu Ledger {until} gesperrt (aktuell {current}, noch {remaining}).",
  "owner.withdrawBlockerNoStake": "Es gibt keinen Einsatz zum Abheben.",

  // ── Soroban transaction pipeline ──────────────────────────────────────
  "soroban.couldNotPrepare": "Die Transaktion konnte nicht vorbereitet werden.",
  "soroban.signatureDeclined": "Die Signatur wurde in Ihrem Wallet abgelehnt.",
  "soroban.networkRejected": "Das Netzwerk hat die Transaktion abgelehnt.",
  "soroban.pendingConfirmation":
    "Die Transaktion wurde gesendet, aber noch nicht bestätigt. Versuchen Sie es in einem Moment erneut.",
  "soroban.transactionFailed":
    "Die Transaktion war nicht erfolgreich (Status: {status}).",

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
  "shortcuts.description": "Tastaturkürzel verwenden nie Ctrl, Cmd oder Alt und werden ignoriert, während Sie in einem Feld tippen.",
  "shortcuts.enable": "Tastaturkürzel aktivieren",

  // ── Search page ───────────────────────────────────────────────────────
  "search.heading": "Suche",
  "search.description": "Ein Feld für alles im Netzwerk. Geben Sie ein, was Sie haben \u2014 Sie müssen nicht sagen, was es ist.",
  "search.accountAddress": "Kontoadresse",
  "search.contractId": "Vertrags-ID \u2014 dessen Ereignisse",
  "search.transactionHash": "Transaktionshash",
  "search.memoSearch": "Memo-Suche, sortiert nach Relevanz",
  "search.searching": "Index wird durchsucht\u2026",
  "search.resultsCount": "{count} Transaktion{count, plural, one {} other {en}} gefunden",
  "search.rankedByMemo": ", sortiert nach Memo-Relevanz.",
  "search.helpText": "Suchen Sie ein Konto oder einen Vertrag? Fügen Sie die volle Adresse ein \u2014 der Explorer bringt Sie direkt dorthin.",

  // ── Transactions page ─────────────────────────────────────────────────
  "transactions.heading": "Transaktionen",
  "transactions.loading": "Transaktionen werden geladen\u2026",

  // ── Stats page ────────────────────────────────────────────────────────
  "stats.heading": "Netzwerk-Statistiken",
  "stats.description": "Indexer-Gesundheit und Stellar-Netzwerk-Durchsatz auf einen Blick.",
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
  "stats.basedOnRecent": "Basierend auf den {count} neuesten indexierten Operationen.",

  // ── Registry page ─────────────────────────────────────────────────────
  "registry.heading": "Lumina Registry",
  "registry.description": "Ein on-chain Soroban-Manifest der Verträge, die Lumina indexiert. Registrieren Sie Ihren Vertrag, um in die priorisierte Indizierung aufgenommen zu werden \u2014 permissionslos, auf Stellar/Soroban Testnet.",
  "registry.registerContract": "Vertrag registrieren",
  "registry.connecting": "Verbinden\u2026",
  "registry.connectPrompt": "Verbinden Sie ein Wallet, um Verträge zu registrieren und zu verwalten.",
  "registry.walletLocked": "Ihr Wallet ist gesperrt",
  "registry.unlockHint": "Entsperren Sie Ihre Wallet-Erweiterung und versuchen Sie es erneut.",
  "registry.myContracts": "Meine Verträge",
  "registry.recentlyRegistered": "Kürzlich registriert",
  "registry.all": "Alle",
  "registry.filterByCategory": "Nach Kategorie filtern",
  "registry.connectToSee": "Verbinden Sie ein Wallet, um die von Ihnen registrierten Verträge zu sehen.",
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
  "graphql.clickToRun": "Klicken Sie auf \u201eAbfrage ausführen\u201c, um die Antwort zu sehen.",

  // ── Explorer page ─────────────────────────────────────────────────────
  "explorer.heading": "Explorer",
  "explorer.description": "Durchsuchen Sie jedes Stellar-Konto oder blättern Sie durch aktuelle Transaktionen in Echtzeit.",
  "explorer.searchPlaceholder": "Konto, Transaktion, Vertrag oder Memo suchen\u2026",
  "explorer.recentTransactions": "Aktuelle Transaktionen",

  // ── Events page ───────────────────────────────────────────────────────
  "events.heading": "Vertrags-Ereignisse",
  "events.description": "Soroban-Vertrags-Ereignisse, indexiert über RPC, neueste zuerst.",
  "events.contractIdPlaceholder": "Vertrags-ID (C...)",
  "events.filter": "Filtern",

  // ── Assets page ───────────────────────────────────────────────────────
  "assets.heading": "Assets",
  "assets.description": "Jedes Asset, das Lumina indexiert, mit Angebot und Inhaberzahlen.",

  // ── Watch page ────────────────────────────────────────────────────────
  "watch.backgroundNotifications": "Hintergrund-Benachrichtigungen",
  "watch.notificationDescription": "In-App-Alerts funktionieren überall in Lumina. Dies ist die separate Opt-in-Option für eine Betriebssystembenachrichtigung, wenn der Tab nicht im Vordergrund ist.",

  // ── Footer ────────────────────────────────────────────────────────────
  "footer.version": "Lumina Frontend v{version}",
  "footer.copyVersion": "Version für Fehlerberichte kopieren",

  // ── SearchBar ─────────────────────────────────────────────────────────
  "searchBar.placeholder": "Konto, Transaktion, Vertrag oder Memo suchen\u2026",
};

export default de;
