import type { MessageCatalogue } from "./types";

// Spanish (es). Written from the English catalogue; a fluent reviewer should
// check wording in context before this is relied on for production users.
const es: MessageCatalogue = {
  // ── Route errors ──────────────────────────────────────────────────────
  "error.failedToLoadRoute": "No se pudo cargar {route}",
  "error.routeRecoveryHint":
    "Suele ser un problema temporal al conectar con la red Stellar. El resto de la aplicación sigue disponible.",
  "error.tryAgain": "Intentar de nuevo",
  "error.errorDigest": "Resumen del error: {digest}",

  // ── Backend unavailable ───────────────────────────────────────────────
  "error.backendUnavailableTitle": "Los datos de Lumina no están disponibles temporalmente",
  "error.backendUnavailableBody":
    "No pudimos conectar con el indexador. Revisa tu conexión o inténtalo de nuevo en un momento; tu solicitud no se ha perdido.",
  "error.retry": "Reintentar",
  "error.retrying": "Reintentando…",

  // ── Network status ────────────────────────────────────────────────────
  "status.offline":
    "Estás sin conexión. Se muestran los datos ya cargados; Lumina se actualizará cuando vuelvas a conectarte.",

  // ── 404 ───────────────────────────────────────────────────────────────
  "notFound.code": "404",
  "notFound.title": "Página no encontrada",
  "notFound.body":
    "La dirección, el hash o la ruta no existen. Revisa la URL o usa el Explorador para buscar una cuenta o una transacción.",
  "notFound.openExplorer": "Abrir el Explorador",
  "notFound.orGoTo": "O ir a",

  // ── Connection indicator ──────────────────────────────────────────────
  "connection.idle": "INACTIVO",
  "connection.connecting": "CONECTANDO",
  "connection.live": "EN VIVO",
  "connection.reconnecting": "RECONECTANDO",
  "connection.polling": "SONDEO",
  "connection.explainIdle":
    "El feed está esperando para conectarse. Los datos mostrados pueden no estar actualizados todavía.",
  "connection.explainConnecting":
    "Se está abriendo una conexión en vivo. El feed muestra los datos cargados más recientemente hasta que se conecte.",
  "connection.explainConnected":
    "Las transacciones llegan en cuanto el servidor las publica, así que el feed se mantiene al día.",
  "connection.explainReconnecting":
    "La conexión en vivo se interrumpió. Los datos existentes siguen visibles mientras Lumina se reconecta.",
  "connection.explainDisconnected":
    "Las actualizaciones en vivo no están disponibles. El feed se actualiza cada 30 segundos, así que los datos pueden tener hasta 30 segundos de antigüedad.",
  "connection.explainUnsupported":
    "Este navegador no puede recibir actualizaciones en vivo. El feed se actualiza cada 30 segundos, así que los datos pueden tener hasta 30 segundos de antigüedad.",
  "connection.reasonUnsupported": "las actualizaciones en vivo no son compatibles aquí",
  "connection.reasonUnreachable": "servidor inaccesible",
  "connection.reasonRefused": "el servidor rechazó la conexión",
  "connection.whatDoesMean": "¿Qué significa {label}?",

  // ── Transaction explorer ──────────────────────────────────────────────
  "explorer.couldNotLoad": "No se pudieron cargar más transacciones.",
  "explorer.noTransactionsYet": "Todavía no hay transacciones indexadas.",
  "explorer.noMatchingFilters": "Ninguna transacción coincide con estos filtros.",
  "explorer.filteredCount": "{filtered} de {total} cargadas",
  "explorer.loadedCount": "{count} cargadas",
  "explorer.loading": "Cargando…",
  "explorer.loadMore": "Cargar más",
  "explorer.endOfResults": "Fin de los resultados",

  // ── Live feed ─────────────────────────────────────────────────────────
  "liveFeed.fetching": "Obteniendo datos en vivo...",
  "liveFeed.noTransactions": "No se encontraron transacciones.",
  "liveFeed.updated": "Actualizado {time}",
  "liveFeed.pauseFeed": "Pausar feed",
  "liveFeed.resumeFeed": "Reanudar feed",
  "liveFeed.resumeFeedCount": "Reanudar feed ({count})",
  "liveFeed.updatesWaiting":
    "{count} {count, plural, one {actualización} other {actualizaciones}} en espera",
  "liveFeed.updatesArrived":
    "{count} {count, plural, one {actualización recibida} other {actualizaciones recibidas}} mientras estaba en pausa",
  "liveFeed.newTransactions":
    "{count} {count, plural, one {transacción nueva} other {transacciones nuevas}}",

  // ── Account operations ────────────────────────────────────────────────
  "accountOps.noOperations": "Todavía no hay operaciones.",
  "accountOps.showingRecent": "Mostrando {count} de tus operaciones recientes",
  "accountOps.allOperations": "Todas las {count} operaciones",
  "accountOps.couldNotLoad": "No se pudieron cargar más operaciones.",
  "accountOps.endOfResults": "Fin de los resultados",

  // ── Account transactions ──────────────────────────────────────────────
  "accountTxs.noTransactions": "Todavía no hay transacciones.",
  "accountTxs.showingRecent": "Mostrando las {count} transacciones más recientes",
  "accountTxs.allTransactions": "Todas las {count} transacciones",
  "accountTxs.couldNotLoad": "No se pudieron cargar más transacciones.",
  "accountTxs.endOfResults": "Fin de los resultados",

  // ── Account detail page ───────────────────────────────────────────────
  "account.breadcrumbExplorer": "Explorador",
  "account.breadcrumbAccounts": "Cuentas",
  "account.notFoundTitle": "Cuenta no encontrada",
  "account.notFoundBody":
    "La dirección {address} no existe en Stellar Mainnet o nunca se ha financiado. Revisa la dirección y la red, o financia la cuenta antes de volver a buscarla.",
  "account.merged": "Fusionada",
  "account.lastModifiedLedger": "Última modificación en el ledger {ledger}",
  "account.statSequence": "Secuencia",
  "account.statSubentries": "Subentradas",
  "account.statSponsoring": "Patrocinando",
  "account.statSponsored": "Patrocinada",
  "account.flagAuthRequired": "Autorización requerida",
  "account.flagAuthRevocable": "Autorización revocable",
  "account.flagAuthImmutable": "Autorización inmutable",
  "account.flagAuthClawbackEnabled": "Clawback habilitado",
  "account.flagNone": "Sin indicadores especiales",
  "account.balancesTitle": "Saldos",
  "account.balancesAriaLabel": "Saldos de la cuenta",
  "account.balanceAsset": "Activo",
  "account.balanceIssuer": "Emisor",
  "account.balanceBalance": "Saldo",
  "account.balanceLimit": "Límite",
  "account.recentTransactions": "Transacciones recientes",
  "account.tradesTitle": "Operaciones de intercambio",
  "account.tradesUnavailable":
    "El historial de intercambios no está disponible. Revisa tu conexión y actualiza esta página para volver a intentarlo.",
  "account.recentOperations": "Operaciones recientes",
  "account.trustlinesTitle": "Historial de trustlines",
  "account.trustlinesUnavailable":
    "El historial de trustlines no está disponible. Revisa tu conexión y actualiza esta página para volver a intentarlo.",

  // ── Assets ────────────────────────────────────────────────────────────
  "assets.noAssetsYet":
    "Todavía no hay activos indexados. Cuando el indexador vea un saldo o una transferencia de un activo, aparecerá aquí.",
  "assets.searchPlaceholder": "Busca activos cargados por código o emisor",
  "assets.orderBy": "Ordenar por",
  "assets.holders": "Titulares",
  "assets.volume": "Volumen",
  "assets.couldNotLoad": "No se pudieron cargar más activos.",
  "assets.noMatch": "Ningún activo cargado coincide con «{query}».",
  "assets.searchCoversLoaded":
    "Esa búsqueda cubre los {count} {noun} cargados hasta ahora. Carga más para ampliarla.",
  "assets.endOfAssets": "Fin de los activos",
  "assets.thAsset": "Activo",
  "assets.thIssuer": "Emisor",
  "assets.thSupply": "Suministro",
  "assets.thHolders": "Titulares",

  // ── Copy button ───────────────────────────────────────────────────────
  "copy.copy": "Copiar",
  "copy.copied": "¡Copiado!",
  "copy.failed": "Error",
  "copy.copyAddress": "Copiar dirección al portapapeles",
  "copy.copiedAddress": "Dirección copiada al portapapeles",
  "copy.copyHash": "Copiar hash de la transacción al portapapeles",
  "copy.copiedHash": "Hash de la transacción copiado al portapapeles",

  // ── Load more footer ──────────────────────────────────────────────────
  "loadMore.loadMore": "Cargar más",
  "loadMore.loading": "Cargando…",
  "loadMore.retry": "Reintentar",

  // ── Watch feed ────────────────────────────────────────────────────────
  "watch.liveActivity": "Actividad en vivo",
  "watch.emptyTitle": "Todavía no sigues ninguna dirección",
  "watch.emptyBody":
    "Usa el marcador junto a cualquier dirección para seguir su actividad aquí y recibir una alerta cuando ocurra algo en ella.",
  "watch.waiting": "Esperando actividad en tus direcciones seguidas…",
  "watch.watchedAddresses":
    "{count} {count, plural, one {dirección seguida} other {direcciones seguidas}}",
  "watch.matchingAlerts":
    "{count} {count, plural, one {alerta coincidente} other {alertas coincidentes}} en esta sesión",
  "watch.alert": "alerta",

  // ── Register contract form ────────────────────────────────────────────
  "register.contractId": "ID del contrato",
  "register.projectName": "Nombre del proyecto",
  "register.description": "Descripción",
  "register.categoriesLabel": "Categorías",
  "register.categoriesHint": "(elige al menos una)",
  "register.selectCategory": "Selecciona al menos una categoría.",
  "register.registerContract": "Registrar contrato",
  "register.preparingTransaction": "Preparando la transacción…",
  "register.approveInWallet": "Apruébalo en tu billetera…",
  "register.submitting": "Enviando…",
  "register.confirming": "Confirmando…",
  "register.successMessage":
    "{name} registrado: Lumina empezará a indexarlo en breve.",
  "register.registrationFailed": "El registro falló.",
  "register.estimatedFee": "Comisión estimada: {fee} XLM",

  // ── Owner contracts ───────────────────────────────────────────────────
  "owner.loadingContracts": "Cargando tus contratos…",
  "owner.noContracts": "Todavía no has registrado ningún contrato.",
  "owner.noContractsHint":
    "Regístralo con el formulario para incluirlo en la indexación de Lumina.",
  "owner.deactivate": "Desactivar",
  "owner.preparing": "Preparando…",
  "owner.approveInWallet": "Aprobar en la billetera…",
  "owner.active": "Activo",
  "owner.deactivated": "Desactivado",
  "owner.staking": "Haciendo stake…",
  "owner.stake": "Stake",
  "owner.stakeAnyway": "Hacer stake de todos modos",
  "owner.reserveWarningTitle":
    "Este stake dejaría tu cuenta por debajo de su saldo mínimo.",
  "owner.reserveExplanation":
    "Stellar mantiene una cantidad mínima de XLM en cada cuenta, llamada reserva. Es 1 XLM para una cuenta sin nada más, más 0,5 XLM por cada trustline, oferta u otra entrada que posea, y esa parte no se puede gastar. Después de este stake, tu cuenta tendría {remaining} XLM, por debajo de la reserva de {minimum} XLM. Una cuenta por debajo de su reserva todavía puede recibir XLM, pero no puede enviar transacciones hasta que se recargue.",
  "owner.withdrawing": "Retirando…",
  "owner.withdrawStake": "Retirar stake",
  "owner.stakeAmountLabel": "Cantidad de stake para {name}",
  "owner.stakeAmountPlaceholder": "Cantidad (unidades base)",
  "owner.invalidStakeAmount":
    "Introduce una cantidad entera mayor que cero, en las unidades base del token de stake.",
  "owner.stakingFailed": "El stake falló.",
  "owner.withdrawalFailed": "El retiro falló.",
  "owner.deactivationFailed": "La desactivación falló.",
  "owner.hideHistory": "Ocultar historial",
  "owner.historyCount": "Historial ({count})",
  "owner.noRegistryEvents": "Todavía no hay eventos de registro indexados para este contrato.",
  "owner.slashHistory": "Historial de penalizaciones",
  "owner.lifetimeSlashed": "Total penalizado: {amount} XLM",
  "owner.loadingSlashHistory": "Cargando el historial de penalizaciones…",
  "owner.couldNotLoadSlashHistory": "No se pudo cargar el historial de penalizaciones.",
  "owner.noSlashes": "No se han registrado penalizaciones.",
  "owner.withdrawBlockerActive":
    "Desactiva primero este registro; el stake solo se puede retirar cuando esté desactivado.",
  "owner.withdrawBlockerLocked":
    "Hace poco se aplicó una penalización, así que el retiro está bloqueado hasta el ledger {until} (actualmente {current}, faltan {remaining}).",
  "owner.withdrawBlockerNoStake": "No hay stake que retirar.",
  "owner.staked": "En stake",
  "owner.ledgerPrefix": "ledger",
  "owner.slashHistoryRetryHint": "Revisa tu conexión y vuelve a intentarlo.",
  "owner.retrySlashHistory": "Reintentar historial de penalizaciones",

  // ── Registry event labels ─────────────────────────────────────────────
  "registryEvent.registered": "Registrado",
  "registryEvent.deactivated": "Desactivado",
  "registryEvent.metadataUpdated": "Metadatos actualizados",
  "registryEvent.ownershipTransferred": "Propiedad transferida",
  "registryEvent.unknown": "Evento de registro",

  // ── Soroban transaction pipeline ──────────────────────────────────────
  "soroban.couldNotPrepare": "No se pudo preparar la transacción.",
  "soroban.signatureDeclined": "Se rechazó la firma en tu billetera.",
  "soroban.couldNotSign":
    "No se pudo firmar la transacción. Revisa tu billetera e inténtalo de nuevo.",
  "soroban.retrySignature": "Reintentar firma",
  "soroban.prepareAgain":
    "La transacción guardada ya no se puede usar. Envíala de nuevo para preparar una nueva; tus datos están guardados.",
  "soroban.rejectionPreserved":
    "Firma rechazada. Tus datos y la transacción preparada están guardados. Puedes reintentarlo cuando quieras.",
  "soroban.networkRejected": "La red rechazó la transacción.",
  "soroban.pendingConfirmation":
    "La transacción se envió, pero todavía no se ha confirmado. Vuelve a comprobarlo en un momento.",
  "soroban.transactionFailed":
    "La transacción no se completó (estado: {status}).",

  // ── Pending transactions ──────────────────────────────────────────────
  "pending.title": "Transacciones",
  "pending.register": "Registrar {name}",
  "pending.deactivate": "Desactivar {contract}",
  "pending.stake": "Hacer stake en {contract}",
  "pending.withdraw": "Retirar stake de {contract}",
  "pending.building": "Preparando",
  "pending.awaitingSignature": "Esperando tu billetera",
  "pending.submitting": "Enviando",
  "pending.confirming": "Confirmando en la red",
  "pending.succeeded": "Confirmada",
  "pending.failed": "Fallida",
  "pending.failedFallback": "La transacción no se completó.",
  "pending.dismiss": "Descartar",

  // ── Stats ─────────────────────────────────────────────────────────────
  "stats.noOperationsYet": "Todavía no hay operaciones indexadas.",

  // ── Events ────────────────────────────────────────────────────────────
  "events.noEventsYet":
    "Todavía no hay eventos indexados para este contrato. La indexación de eventos es opcional en el indexador (INDEXED_CONTRACT_IDS/REGISTRY_CONTRACT_ID): consulta el README de lumina-backend.",

  // ── Search ────────────────────────────────────────────────────────────
  "search.noMemoMatch":
    "Ninguna transacción contiene nada parecido a este memo. La búsqueda por memo encuentra referencias de pedido y códigos cortos: prueba con unos pocos caracteres.",

  // ── Activity labels ───────────────────────────────────────────────────
  "activity.indexed": "Actividad indexada",
  "activity.noEvents": "Todavía no hay eventos",
  "activity.unknown": "Actividad desconocida",

  // ── Table headers ─────────────────────────────────────────────────────
  "table.hash": "Hash",
  "table.ledger": "Ledger",
  "table.ops": "Ops",
  "table.time": "Hora",
  "table.type": "Tipo",
  "table.transaction": "Transacción",
  "table.detail": "Detalle",
  "table.source": "Origen",
  "table.operations": "Operaciones",
  "table.fee": "Comisión",
  "table.contract": "Contrato",
  "table.topic": "Tema",
  "table.value": "Valor",

  // ── Common UI ─────────────────────────────────────────────────────────
  "common.search": "Buscar",
  "common.close": "Cerrar",
  "common.clear": "Borrar",
  "common.save": "Guardar",
  "common.cancel": "Cancelar",
  "common.loading": "Cargando…",
  "common.error": "Error",
  "common.retry": "Reintentar",
  "common.connect": "Conectar billetera",
  "common.disconnect": "Desconectar",
  "common.copy": "Copiar",
  "common.copied": "¡Copiado!",
  "common.xlm": "XLM",

  // ── Skip link ─────────────────────────────────────────────────────────
  "skipLink.skipToMain": "Saltar al contenido principal",

  // ── Theme toggle ──────────────────────────────────────────────────────
  "theme.system": "Tema del sistema",
  "theme.light": "Tema claro",
  "theme.dark": "Tema oscuro",

  // ── Keyboard shortcuts ────────────────────────────────────────────────
  "shortcuts.title": "Atajos de teclado",
  "shortcuts.search": "Buscar",
  "shortcuts.showList": "Mostrar esta lista",
  "shortcuts.description":
    "Los atajos nunca usan Ctrl, Cmd ni Alt y se ignoran mientras escribes en un campo.",
  "shortcuts.enable": "Activar atajos de teclado",
  "shortcuts.sequence": "{start} y luego {key}",
  "shortcuts.route.home": "Inicio",
  "shortcuts.route.explorer": "Explorador",
  "shortcuts.route.transactions": "Transacciones",
  "shortcuts.route.events": "Eventos de contrato",
  "shortcuts.route.graphql": "GraphQL",
  "shortcuts.route.registry": "Registro",
  "shortcuts.route.stats": "Estadísticas",

  // ── Search page ───────────────────────────────────────────────────────
  "search.heading": "Buscar",
  "search.description":
    "Un solo cuadro para todo lo que hay en la red. Escribe lo que tengas: no hace falta indicar qué es.",
  "search.accountAddress": "Dirección de cuenta",
  "search.contractId": "ID de contrato: sus eventos",
  "search.transactionHash": "Hash de transacción",
  "search.memoSearch": "Búsqueda por memo, ordenada por el backend",
  "search.searching": "Buscando en el índice…",
  "search.resultsCount":
    "{count} transacci{count, plural, one {ón} other {ones}} coincidente{count, plural, one {} other {s}}",
  "search.rankedByMemo": ", ordenadas por relevancia del memo.",
  "search.helpText":
    "¿Buscas una cuenta o un contrato? Pega su dirección completa: el explorador te lleva directamente allí.",

  // ── Transactions page ─────────────────────────────────────────────────
  "transactions.heading": "Transacciones",
  "transactions.loading": "Cargando transacciones…",

  // ── Transaction detail page ───────────────────────────────────────────
  "transaction.backToTransactions": "\u2190 Volver a Transacciones",
  "transaction.notFoundTitle": "Transacción no encontrada",
  "transaction.notFoundBody":
    "La transacción {hash} no está en el índice \u2014 puede ser demasiado reciente o nunca haber sido incluida en un ledger. Verifica el hash y la red, y búscala de nuevo después de que la transacción se haya confirmado.",
  "transaction.includedInLedger": "Incluida en el ledger {ledger}",
  "transaction.statStatus": "Estado",
  "transaction.statFee": "Tarifa",
  "transaction.statOperations": "Operaciones",
  "transaction.statTime": "Hora",
  "transaction.statusSuccessful": "Exitosa",
  "transaction.statusFailed": "Fallida",
  "transaction.detailsHeading": "Detalles",
  "transaction.sourceAccount": "Cuenta de origen",
  "transaction.viewSourceAtLedger": "Ver cuenta de origen en el ledger {ledger}",
  "transaction.memoType": "Tipo de memo",
  "transaction.memoTypeNone": "ninguno",
  "transaction.memo": "Memo",
  "transaction.preconditionsHeading": "Precondiciones",
  "transaction.operationsHeading": "Operaciones",
  "transaction.operationsCaption": "Operaciones de la transacción",
  "transaction.opColType": "Tipo",
  "transaction.opColFrom": "De",
  "transaction.opColTo": "Para",
  "transaction.opColAmount": "Cantidad",
  "transaction.opColTime": "Hora",
  "transaction.noOperations":
    "No se indexaron operaciones para esta transacción.",

  // ── Stats page ────────────────────────────────────────────────────────
  "stats.heading": "Estadísticas de la red",
  "stats.description":
    "Estado del indexador y rendimiento de la red Stellar de un vistazo.",
  "stats.latestLedger": "Último ledger",
  "stats.stellarMainnet": "Stellar Mainnet",
  "stats.txsLastLedger": "Tx (último ledger)",
  "stats.successfulFailed": "Exitosas + fallidas",
  "stats.contractsRegistered": "Contratos registrados",
  "stats.viaLumina": "Mediante el registro de Lumina",
  "stats.avgLedgerTime": "Tiempo medio por ledger",
  "stats.protocolTarget": "~5 s",
  "stats.protocolTargetHint": "Objetivo del protocolo, no un promedio en vivo",
  "stats.operationBreakdown": "Desglose por tipo de operación",
  "stats.basedOnRecent": "Basado en las {count} operaciones indexadas más recientes.",

  // ── Registry page ─────────────────────────────────────────────────────
  "registry.loading": "Cargando el registro…",
  "registry.sessionRestoreFailed": "No se pudo restaurar tu sesión de billetera guardada.",
  "registry.networkMismatchTitle": "La red no coincide",
  "registry.networkMismatch":
    "Tu billetera está en {walletNetwork}, pero esta aplicación usa {appNetwork}. Cambia tu billetera a la testnet de Stellar antes de volver a intentarlo.",
  "registry.connectFailed": "No se pudo conectar con tu billetera.",
  "registry.disconnectFailed":
    "No se pudo desconectar tu billetera. Desconéctala desde la extensión y luego actualiza esta página.",
  "registry.walletRetry":
    "{error} Abre tu billetera y elige Conectar billetera para intentarlo de nuevo.",
  "registry.category.DeFi": "DeFi",
  "registry.category.Nft": "NFT",
  "registry.category.Gaming": "Juegos",
  "registry.category.Identity": "Identidad",
  "registry.category.Infrastructure": "Infraestructura",
  "registry.category.Payments": "Pagos",
  "registry.category.Oracle": "Oráculo",
  "registry.category.Dao": "DAO",
  "registry.category.Other": "Otros",
  "registry.heading": "Registro de Lumina",
  "registry.description":
    "Un manifiesto Soroban en cadena de los contratos que indexa Lumina. Registra tu contrato para acceder a la indexación prioritaria: sin permisos, en la testnet de Stellar/Soroban.",
  "registry.registerContract": "Registrar un contrato",
  "registry.connecting": "Conectando…",
  "registry.connectPrompt":
    "Conecta una billetera para registrar y gestionar contratos.",
  "registry.walletLocked": "Tu billetera está bloqueada",
  "registry.unlockHint": "Desbloquea la extensión de tu billetera e inténtalo de nuevo.",
  "registry.myContracts": "Mis contratos",
  "registry.recentlyRegistered": "Registrados recientemente",
  "registry.all": "Todos",
  "registry.filterByCategory": "Filtrar por categoría",
  "registry.connectToSee":
    "Conecta una billetera para ver los contratos que registraste.",
  "registry.loadingEntries": "Cargando entradas del registro…",
  "registry.noActiveContracts": "No hay contratos activos de {category}.",
  "registry.noContractsYet": "Todavía no hay contratos registrados.",
  "registry.couldNotReach": "No se pudo acceder al contrato del registro.",

  // ── GraphQL page ──────────────────────────────────────────────────────
  "graphql.heading": "Playground de GraphQL",
  "graphql.endpoint": "Endpoint de GraphQL de Lumina:",
  "graphql.queryExamples": "Ejemplos de consultas",
  "graphql.recentQueries": "Consultas recientes",
  "graphql.noHistory": "Las consultas editadas aparecerán aquí.",
  "graphql.queryEditor": "Editor de consultas",
  "graphql.running": "Ejecutando…",
  "graphql.runQuery": "Ejecutar consulta",
  "graphql.response": "Respuesta",
  "graphql.clickToRun": "Haz clic en «Ejecutar consulta» para ver la respuesta.",

  // ── Explorer page ─────────────────────────────────────────────────────
  "explorer.heading": "Explorador",
  "explorer.description":
    "Busca cualquier cuenta de Stellar o explora las transacciones recientes en tiempo real.",
  "explorer.searchPlaceholder":
    "Busca una cuenta, transacción, contrato o memo…",
  "explorer.recentTransactions": "Transacciones recientes",

  // ── Events page ───────────────────────────────────────────────────────
  "events.heading": "Eventos de contrato",
  "events.description":
    "Eventos de contratos Soroban indexados mediante RPC, del más reciente al más antiguo.",
  "events.contractIdPlaceholder": "ID de contrato (C...)",
  "events.filter": "Filtrar",

  // ── Assets page ───────────────────────────────────────────────────────
  "assets.heading": "Activos",
  "assets.description":
    "Todos los activos que indexa Lumina, con el suministro y el número de titulares que hay detrás.",

  // ── Watch page ────────────────────────────────────────────────────────
  "watch.backgroundNotifications": "Notificaciones en segundo plano",
  "watch.notificationDescription":
    "Las alertas dentro de la aplicación funcionan en todo Lumina. Esta es la opción separada para recibir una notificación del sistema operativo cuando la pestaña no está en primer plano.",

  // ── Footer ────────────────────────────────────────────────────────────
  "footer.version": "Frontend de Lumina v{version}",
  "footer.copyVersion": "Copiar la versión para informes de errores",

  // ── SearchBar ─────────────────────────────────────────────────────────
  "searchBar.placeholder": "Busca una cuenta, transacción, contrato o memo…",

  // ── Developer portal ──────────────────────────────────────────────────
  "devPortal.heading": "Portal para desarrolladores de Lumina",
  "devPortal.description":
    "Todo lo que necesitas para integrar la API de Stellar de Lumina en tu aplicación: desde tu primera consulta hasta la monitorización en producción.",
  "devPortal.gettingStarted.title": "Primeros pasos",
  "devPortal.gettingStarted.description":
    "Guía paso a paso para hacer tu primera solicitud a la API. Aprende sobre autenticación, paginación y gestión de errores con ejemplos de código listos para copiar.",
  "devPortal.gettingStarted.cta": "Empieza →",
  "devPortal.apiDocs.title": "Documentación de la API",
  "devPortal.apiDocs.description":
    "Explora el esquema GraphQL con ejemplos prácticos que puedes ejecutar en vivo. Entiende a fondo los patrones de paginación y la gestión de errores.",
  "devPortal.apiDocs.cta": "Explorar la documentación →",
  "devPortal.playground.title": "Playground de consultas",
  "devPortal.playground.description":
    "Escribe consultas GraphQL y genera código cliente en JavaScript y Python. Prueba tus consultas en vivo contra la API real.",
  "devPortal.playground.cta": "Abrir el playground →",
  "devPortal.usage.title": "Panel de uso",
  "devPortal.usage.description":
    "Supervisa el uso de tus claves de API y el consumo de tu cuota. Consulta el número de solicitudes y su evolución en el tiempo.",
  "devPortal.usage.cta": "Ver el panel →",
  "devPortal.webhooks.title": "Webhooks",
  "devPortal.webhooks.description":
    "Registra webhooks para recibir notificaciones de eventos en tiempo real. Supervisa los intentos de entrega y prueba tus endpoints.",
  "devPortal.webhooks.cta": "Gestionar webhooks →",
  "devPortal.quickStart.title": "Inicio rápido",
  "devPortal.quickStart.before": "¿Nuevo en Lumina? Visita nuestra",
  "devPortal.quickStart.link": "guía de primeros pasos",
  "devPortal.quickStart.after":
    "para aprender lo básico. Estarás consultando la blockchain de Stellar en minutos.",
  "devPortal.step1.action": "Haz una solicitud",
  "devPortal.step1.rest": "usando nuestro playground o tu lenguaje preferido",
  "devPortal.step2.action": "Genera el código",
  "devPortal.step2.rest": "en JavaScript o Python para tu aplicación",
  "devPortal.step3.action": "Supervisa el uso",
  "devPortal.step3.rest": "desde tu panel",

  // ── Getting started guide ─────────────────────────────────────────────
  "guide.heading": "Primeros pasos con Lumina",
  "guide.subtitle":
    "Aprende a hacer tu primera consulta GraphQL en solo unos minutos.",
  "guide.step1.title": "Haz tu primera solicitud",
  "guide.step1.before": "La API GraphQL de Lumina está disponible en",
  "guide.step1.after":
    ". Empieza con esta consulta sencilla que obtiene el último ledger:",
  "guide.step1.hint":
    "Copia el código de arriba y ejecútalo en tu terminal. Deberías ver la información del último ledger de Stellar.",
  "guide.example.firstRequest": "Primera solicitud",
  "guide.example.pagination": "Consulta con paginación",
  "guide.step2.title": "Trabaja con la paginación",
  "guide.step2.intro":
    "Para las consultas que devuelven varios elementos usamos paginación basada en cursores.",
  "guide.step2.response":
    "La respuesta incluye un objeto pageInfo con los campos hasNextPage y cursor:",
  "guide.step2.nextTitle": "Cómo obtener la página siguiente:",
  "guide.step2.nextBefore": "Para obtener la página siguiente de resultados, pasa el",
  "guide.step2.nextAfter": "de la respuesta anterior en la siguiente consulta:",
  "guide.step3.title": "Gestiona los errores con cuidado",
  "guide.step3.before":
    "La API GraphQL devuelve HTTP 200 incluso cuando hay errores: revisa el",
  "guide.step3.after": "en la respuesta:",
  "guide.errors.title": "Errores comunes:",
  "guide.errors.invalidQuery": "Consulta no válida",
  "guide.errors.invalidQueryBefore":
    "La sintaxis de GraphQL no es válida. Revisa el",
  "guide.errors.invalidQueryLink": "playground",
  "guide.errors.invalidQueryAfter": "para ver el esquema correcto.",
  "guide.errors.notFound": "No encontrado",
  "guide.errors.notFoundDesc":
    "El recurso no existe (por ejemplo, una cuenta que no ha sido financiada en Stellar).",
  "guide.errors.serverError": "Error del servidor",
  "guide.errors.serverErrorDesc":
    "Nuestro backend no está disponible temporalmente. Reintenta con retroceso exponencial.",
  "guide.errorHandling.title": "Patrón de gestión de errores",
  "guide.step4.title": "Explora el esquema",
  "guide.step4.before": "Visita el",
  "guide.step4.link": "Playground de GraphQL",
  "guide.step4.after":
    "para explorar todas las consultas y tipos de datos disponibles. El playground incluye ejemplos prácticos que puedes ejecutar en vivo contra la API.",
  "guide.step4.popularLabel": "Consultas populares:",
  "guide.step4.popularItems":
    "Transacciones recientes, saldos de cuentas, eventos de contratos, información de activos, historial de pagos",
  "guide.next.title": "¿Y ahora qué?",
  "guide.next.tryPlayground.label": "Prueba el playground:",
  "guide.next.tryPlayground.link": "Ejecuta consultas en vivo",
  "guide.next.readDocs.label": "Lee la documentación:",
  "guide.next.readDocs.link": "Profundiza en la paginación y en la gestión de errores",
  "guide.next.generateCode.label": "Genera código:",
  "guide.next.generateCode.text":
    "Usa el playground para escribir una consulta y luego genera código listo para producción en JavaScript o Python",
  "guide.next.monitorUsage.label": "Supervisa el uso:",
  "guide.next.monitorUsage.link": "Controla tu consumo de la API",

  // ── API documentation ─────────────────────────────────────────────────
  "apiDocs.heading": "Documentación de la API",
  "apiDocs.subtitleBefore":
    "Explora el esquema GraphQL con ejemplos prácticos que puedes ejecutar en vivo contra la API. Todos los ejemplos siguientes se pueden ejecutar en el",
  "apiDocs.subtitleLink": "Playground de GraphQL",
  "apiDocs.pagination.title": "Guía de paginación",
  "apiDocs.pagination.intro":
    "Todas las consultas de listas en Lumina usan paginación basada en cursores. Este enfoque es ideal para conjuntos de datos grandes porque es:",
  "apiDocs.pagination.bulletScalable.label": "Escalable:",
  "apiDocs.pagination.bulletScalable.desc":
    "Los cursores no requieren cálculos de desplazamiento",
  "apiDocs.pagination.bulletStable.label": "Estable:",
  "apiDocs.pagination.bulletStable.desc":
    "Los resultados no cambian si se añaden o eliminan elementos",
  "apiDocs.pagination.bulletEfficient.label": "Eficiente:",
  "apiDocs.pagination.bulletEfficient.desc":
    "No hace falta obtener y omitir los elementos anteriores",
  "apiDocs.pagination.returns": "Cada consulta de lista devuelve:",
  "apiDocs.pagination.next":
    "Para obtener la página siguiente, pasa el cursor de la respuesta anterior:",
  "apiDocs.errors.title": "Gestión de errores",
  "apiDocs.errors.before": "GraphQL siempre devuelve HTTP 200. Revisa el",
  "apiDocs.errors.after": "para detectar problemas:",
  "apiDocs.errors.success": "Respuesta correcta",
  "apiDocs.errors.error": "Respuesta de error",
  "apiDocs.errors.checkBefore": "Comprueba siempre si hay",
  "apiDocs.errors.checkMiddle": "antes de acceder a",
  "apiDocs.errors.checkAfter": ".",
  "apiDocs.examples.title": "Ejemplos prácticos",
  "apiDocs.example.recentTransactions.name": "Transacciones recientes",
  "apiDocs.example.recentTransactions.description":
    "Obtiene las últimas 5 transacciones de la red",
  "apiDocs.example.accountBalances.name": "Saldos de cuenta",
  "apiDocs.example.accountBalances.description":
    "Obtiene todos los saldos de activos de una cuenta (edita la dirección abajo)",
  "apiDocs.example.paymentHistory.name": "Historial de pagos",
  "apiDocs.example.paymentHistory.description":
    "Obtiene las operaciones de pago de una cuenta (edita la dirección abajo)",
  "apiDocs.example.contractEvents.name": "Eventos de contrato",
  "apiDocs.example.contractEvents.description":
    "Consulta eventos de contratos Soroban por dirección de contrato (edita el ID del contrato abajo)",
  "apiDocs.tryInPlayground": "Probar en el playground",
  "apiDocs.viewDocs": "Ver documentación",
  "apiDocs.next.title": "Próximos pasos",
  "apiDocs.next.runExample.label": "Ejecuta un ejemplo:",
  "apiDocs.next.runExample.text":
    "Haz clic en «{button}» para ejecutar cualquiera de los ejemplos anteriores contra la API en vivo",
  "apiDocs.next.modify.label": "Modifica y prueba:",
  "apiDocs.next.modify.text":
    "Edita la consulta en el playground para explorar otros campos y filtros",
  "apiDocs.next.generate.label": "Genera código:",
  "apiDocs.next.generate.text":
    "Cuando tu consulta funcione, genera código JavaScript o Python para integrarlo en tu aplicación",

  // ── Usage dashboard ───────────────────────────────────────────────────
  "usage.heading": "Panel de uso",
  "usage.subtitle":
    "Supervisa el uso de tus claves de API y el consumo de tu cuota, protegido por la propiedad de tu billetera.",
  "usage.connectedOwner": "Cuenta propietaria conectada",
  "usage.walletRequired.title": "Se requiere la propiedad de la billetera",
  "usage.walletRequired.body":
    "La gestión de claves está vinculada estrictamente a la propiedad de la billetera. Conecta tu billetera de Stellar para ver, crear y gestionar tus claves de API privadas.",
  "usage.connecting": "Conectando billetera…",
  "usage.connectCta": "Conecta tu billetera para acceder a las claves",
  "usage.requestsThisWeek": "Solicitudes esta semana",
  "usage.peakDay": "Día pico: {count} solicitudes",
  "usage.quotaRemaining": "Cuota restante",
  "usage.quotaOfTotal": "de {total} en total",
  "usage.quotaUsage": "Uso de la cuota",
  "usage.warning": "Aviso",
  "usage.requestsOverTime": "Solicitudes en el tiempo (últimos 7 días)",
  "usage.byApiKey": "Uso por clave de API",
  "usage.keyManagement": "Gestión de claves de API",
  "usage.keyNamePlaceholder": "Nombre de la clave (p. ej., clave de staging)",
  "usage.createKey": "Crear clave de API",
  "usage.thKeyName": "Nombre de la clave",
  "usage.thApiKey": "Clave de API",
  "usage.thCreated": "Creada",
  "usage.thUsage": "Uso",
  "usage.thAction": "Acción",
  "usage.percentUsed": "{percent} % usado",
  "usage.revoke": "Revocar",
  "usage.aboutKeys.title": "Acerca de las claves protegidas por billetera",
  "usage.aboutKeys.body":
    "Las claves de API están asociadas 1:1 a la dirección de tu billetera como tu identidad. Desconectar tu billetera oculta tus claves sin eliminarlas.",

  // ── Code snippet ──────────────────────────────────────────────────────
  "codeSnippet.copy": "Copiar",
  "codeSnippet.copied": "✓ Copiado",
  "codeSnippet.copiedAria": "Código copiado",
  "codeSnippet.copiedStatus": "Código copiado al portapapeles",
  "codeSnippet.copyError":
    "No se pudo acceder al portapapeles. Selecciona el código y cópialo manualmente.",

  // ── CommandPalette ────────────────────────────────────────────────────
  "commandPalette.placeholder": "Busca rutas y acciones...",
  "commandPalette.noResults": "No se encontraron resultados",
  "commandPalette.selectHint": "Seleccionar",
  "commandPalette.navigateHint": "Navegar",
  "commandPalette.searchAction": "Buscar",
  "commandPalette.searchActionDescription":
    "Busca direcciones y transacciones de Stellar",
  "commandPalette.route.explorer.label": "Explorador",
  "commandPalette.route.explorer.description":
    "Busca cualquier cuenta de Stellar o explora las transacciones recientes, actualizadas en vivo mediante una suscripción GraphQL.",
  "commandPalette.route.transactions.label": "Transacciones",
  "commandPalette.route.transactions.description":
    "Todas las transacciones indexadas de Stellar, con filtros, preajustes guardados y paginación por cursor.",
  "commandPalette.route.ledgers.label": "Ledgers",
  "commandPalette.route.ledgers.description":
    "Ledgers indexados de Stellar, del más reciente al más antiguo: hora de cierre, número de transacciones y operaciones, y los huecos del índice.",
  "commandPalette.route.search.label": "Buscar",
  "commandPalette.route.search.description":
    "Búsqueda por memo en todas las transacciones indexadas: referencias de pedido y códigos cortos, ordenados por la similitud de trigramas del backend.",
  "commandPalette.route.events.label": "Eventos de contrato",
  "commandPalette.route.events.description":
    "Eventos de contratos Soroban indexados por Lumina, filtrables por ID de contrato.",
  "commandPalette.route.assets.label": "Activos",
  "commandPalette.route.assets.description":
    "Todos los activos de Stellar que indexa Lumina: suministro y número de titulares, ordenados por titulares o por volumen de transferencias.",
  "commandPalette.route.graphql.label": "GraphQL",
  "commandPalette.route.graphql.description":
    "Ejecuta consultas contra la API GraphQL de Lumina desde el navegador, con ejemplos prácticos.",
  "commandPalette.route.developers.label": "Desarrolladores",
  "commandPalette.route.developers.description":
    "Documentación de la API, guía de primeros pasos y panel de uso para desarrolladores que crean con Lumina.",
  "commandPalette.route.registry.label": "Registro",
  "commandPalette.route.registry.description":
    "Un manifiesto Soroban en cadena de los contratos que indexa Lumina: registra un contrato para incluirlo en la indexación.",
  "commandPalette.route.stats.label": "Estadísticas",
  "commandPalette.route.stats.description":
    "Estado del indexador y rendimiento de la red Stellar: último ledger, volumen de transacciones y tipos de operación.",
  "commandPalette.route.watch.label": "Seguimiento",
  "commandPalette.route.watch.description":
    "Sigue direcciones de Stellar: un único feed en vivo de la actividad de todo lo que sigues, con filtros de alerta por dirección.",

  // ── AddressLabelManager ───────────────────────────────────────────────
  "addressLabelManager.labels": "Etiquetas",
  "addressLabelManager.manageLabels": "Gestionar etiquetas de direcciones",
  "addressLabelManager.title": "Etiquetas de direcciones",
  "addressLabelManager.addNewLabel": "Añadir nueva etiqueta",
  "addressLabelManager.addressPlaceholder": "Dirección de Stellar",
  "addressLabelManager.labelPlaceholder": "Etiqueta",
  "addressLabelManager.addLabel": "Añadir etiqueta",
  "addressLabelManager.yourLabels": "Tus etiquetas",
  "addressLabelManager.save": "Guardar",
  "addressLabelManager.edit": "Editar",
  "addressLabelManager.deleteLabel": "Eliminar etiqueta",
  "addressLabelManager.invalidFormat": "Formato de etiqueta no válido",
  "addressLabelManager.failedToRead": "No se pudo leer el archivo",
  "addressLabelManager.export": "Exportar",
  "addressLabelManager.import": "Importar",
  "addressLabelManager.exportTitle": "Exportar etiquetas como JSON",
  "addressLabelManager.importTitle": "Importar etiquetas desde JSON",
  "addressLabelManager.importFile": "Importar archivo de etiquetas",

  // ── accountActivity ──
  "accountActivity.liveActivity": "Actividad en vivo",
  "accountActivity.waitingForActivity": "Esperando nueva actividad en esta cuenta…",
  "accountActivity.latestActivity": "Última actividad de la cuenta",
  "accountActivity.viewTransactionLabel":
    "Ver la transacción de tipo {type} {hash} en Stellar Expert (se abre en una pestaña nueva)",
  // ── trustline ──
  "trustline.removed": "Eliminada",
  "trustline.set": "Establecida",
  "trustline.unknown": "Desconocida",
  "trustline.couldNotLoadMore": "No se pudo cargar más historial de trustlines.",
  "trustline.noChanges": "No hay cambios de trustline registrados para esta cuenta.",
  "trustline.showingRecent": "Mostrando {count} cambios de trustline recientes",
  "trustline.allChanges":
    "Los {count} {count, plural, one {cambio de trustline} other {cambios de trustline}}",
  "trustline.limit": "Límite",
  "trustline.onStellarExpert": "en stellar.expert (se abre en una pestaña nueva)",
  "trustline.endOfHistory": "Fin del historial de trustlines",
  // ── portfolio ──
  "portfolio.heading": "Actividad de la cartera",
  "portfolio.selectAsset": "Selecciona un activo para verlo",
  "portfolio.couldNotLoad": "No se pudieron cargar los datos de actividad.",
  "portfolio.noActivity": "Sin actividad en los últimos 30 días",
  "portfolio.noActivityDescription":
    "El volumen de transferencias de {asset} aparecerá aquí cuando esta cuenta envíe o reciba un pago.",
  "portfolio.transferVolume": "Volumen de transferencias de {asset}",
  "portfolio.transferVolumeDescription":
    "Volumen diario de transferencias de {asset} en los últimos 30 días, medido en {asset}.",
  "portfolio.caption":
    "Volumen de transferencias (enviado + recibido) por día · últimos 30 días · cubos diarios",
  "portfolio.showLess": "Mostrar menos",
  "portfolio.showMore": "+{count} más",
  "portfolio.loadingVolume": "Cargando volumen de transferencias",
  // ── footer ──
  "footer.copied": "¡Copiado!",
  "footer.copy": "Copiar",
  "footer.reportProblem": "Informar de un problema",
  "footer.statusChangelog": "Estado y novedades",
  // ── watchAlertSettings ──
  "watchAlertSettings.alertFilter": "Filtro de alertas para {address}",
  "watchAlertSettings.operation": "Operación",
  "watchAlertSettings.anyOperation": "Cualquier operación",
  "watchAlertSettings.minimumAmount": "Cantidad mínima",
  "watchAlertSettings.any": "Cualquiera",
  "watchAlertSettings.asset": "Activo",
  "watchAlertSettings.noFilter": "Sin filtro: cada operación genera una alerta.",
  "watchAlertSettings.filtersActive":
    "{count} {count, plural, one {filtro activo} other {filtros activos}}.",
  "watchAlertSettings.resetDefault": "Restablecer valores por defecto",
  // ── registrySlashHistory ──
  "registrySlashHistory.slashHistory": "Historial de penalizaciones",
  "registrySlashHistory.hideSlashHistory": "Ocultar historial de penalizaciones",
  "registrySlashHistory.loadingSlashHistory": "Cargando historial de penalizaciones…",
  "registrySlashHistory.couldNotReadHistory":
    "No se pudo leer el historial de penalizaciones. Ciérralo y vuelve a abrirlo para reintentarlo.",
  "registrySlashHistory.noSlashes": "No se han registrado penalizaciones.",
  "registrySlashHistory.ledger": "ledger {ledger}",
  // ── registryEntryCard ──
  "registryEntryCard.categories": "Categorías",
  "registryEntryCard.hideSlashHistory": "Ocultar historial de penalizaciones",
  "registryEntryCard.slashHistory": "Historial de penalizaciones",
  "registryEntryCard.loadingSlashHistory": "Cargando historial de penalizaciones…",
  "registryEntryCard.couldNotReadHistory":
    "No se pudo leer el historial de penalizaciones. Revisa tu conexión y vuelve a intentarlo.",
  "registryEntryCard.retryHistory": "Reintentar historial",
  "registryEntryCard.noSlashes": "No se han registrado penalizaciones.",
  "registryEntryCard.ledger": "ledger {ledger}",
  // ── searchBar ──
  "searchBar.searchKindAccount": "Cuenta",
  "searchBar.searchKindContract": "Contrato",
  "searchBar.searchKindMuxed": "Cuenta multiplexada",
  "searchBar.searchKindTransaction": "Transacción",
  "searchBar.searchKindMemo": "Búsqueda por memo",
  // ── breadcrumbs ──
  "breadcrumbs.ariaLabel": "Ruta de navegación",
  // ── pushOptIn ──
  "pushOptIn.unsupported":
    "Este navegador no puede mostrar notificaciones de la actividad seguida. Las alertas dentro de la aplicación siguen funcionando.",
  "pushOptIn.denied":
    "Las notificaciones están bloqueadas para este sitio. Vuelve a activarlas en la configuración de sitios de tu navegador para recibir alertas cuando esta pestaña está en segundo plano. Las alertas dentro de la aplicación no se ven afectadas.",
  "pushOptIn.subscribed":
    "Las notificaciones del navegador están activadas. Se te avisará cuando una dirección seguida tenga actividad y esta pestaña esté en segundo plano.",
  "pushOptIn.turnOff": "Desactivar",
  "pushOptIn.description":
    "Recibe una notificación del navegador cuando una dirección seguida tenga actividad y esta pestaña esté en segundo plano.",
  "pushOptIn.noVapidKey":
    "Las notificaciones del navegador necesitan una clave pública VAPID. Define NEXT_PUBLIC_VAPID_PUBLIC_KEY para activarlas; las alertas dentro de la aplicación funcionan sin ella.",
  "pushOptIn.enable": "Activar notificaciones",
  "pushOptIn.enabling": "Activando…",
  // ── navbar ──
  "navbar.home": "Inicio de Lumina",
  "navbar.mainNav": "Navegación principal",
  // ── networkStats ──
  "networkStats.activeAccounts": "Cuentas activas",
  "networkStats.inSampledData": "En los datos de muestra",
  "networkStats.inSampledTransactions": "En las transacciones de muestra",
  "networkStats.mostRecent": "Más reciente",
  "networkStats.noOperationData": "No hay datos de operaciones disponibles",
  "networkStats.noTransactionData": "No hay datos de transacciones disponibles",
  "networkStats.operationsCaption": "Basado en las operaciones indexadas más recientes",
  "networkStats.operationsDescription":
    "Volumen de operaciones por hora a partir de datos indexados recientes",
  "networkStats.operationsOverTime": "Operaciones a lo largo del tiempo",
  "networkStats.operationsUnit": " ops",
  "networkStats.sampledOperations": "Operaciones de muestra",
  "networkStats.sampledTransactions": "Transacciones de muestra",
  "networkStats.successRate": "Tasa de éxito",
  "networkStats.transactionsCaption": "Basado en las transacciones indexadas más recientes",
  "networkStats.transactionsDescription":
    "Volumen de transacciones por hora a partir de datos indexados recientes",
  "networkStats.transactionsOverTime": "Transacciones a lo largo del tiempo",
  "networkStats.transactionsUnit": " tx",
  // ── onTour ──
  "onTour.closeTour": "Cerrar recorrido",
  "onTour.done": "Listo",
  "onTour.next": "Siguiente",
  "onTour.skip": "Omitir",
  "onTour.stepPosition": "{current} de {total}",
  "onTour.welcomeSubtitle": "Descubre lo que hace único a Lumina",
  "onTour.welcomeTitle": "Bienvenido a Lumina",
  // ── search ──
  "search.explorerLink": "el explorador",
  "search.helpTextAfterLink": " te lleva directamente allí.",
  "search.helpTextBeforeLink": "¿Buscas una cuenta o un contrato? Pega su dirección completa — ",
  // ── transactionFilters ──
  "transactionFilters.applyPreset": "Aplicar preajuste {name}",
  "transactionFilters.clearFilters": "Borrar filtros ({count})",
  "transactionFilters.deletePreset": "Eliminar preajuste {name}",
  "transactionFilters.from": "Desde",
  "transactionFilters.maxFee": "Comisión máxima (XLM)",
  "transactionFilters.minOperations": "Mínimo de operaciones",
  "transactionFilters.presetNameLabel": "Nombre del preajuste",
  "transactionFilters.presetNamePlaceholder": "Nombra este filtro",
  "transactionFilters.savePreset": "Guardar preajuste",
  "transactionFilters.savedPresets": "Preajustes de filtro guardados",
  "transactionFilters.sourceAccount": "Cuenta de origen",
  "transactionFilters.statusFilter": "Filtro de estado de la transacción",
  "transactionFilters.to": "Hasta",
  // ── walletInfo ──
  "walletInfo.disconnect": "Desconectar",
  "walletInfo.disconnectLabel": "Desconectar billetera",
  "walletInfo.disconnecting": "Desconectando…",
  // ── watchList ──
  "watchList.addWatch": "Añadir seguimiento",
  "watchList.addressLabel": "Dirección de Stellar a seguir",
  "watchList.cancel": "Cancelar",
  "watchList.confirmImport": "Confirmar importación",
  "watchList.emptyState":
    "Todavía no sigues nada. Añade una dirección arriba o usa el icono de marcador junto a cualquier cuenta del sitio.",
  "watchList.errorDuplicate":
    "Esa dirección ya está en tu lista de seguimiento. Elige otra dirección o elimina primero la existente.",
  "watchList.errorEmpty": "Introduce una dirección para seguir.",
  "watchList.errorInvalid": "Eso no es un ID de cuenta de Stellar: {hint}.",
  "watchList.exportList": "Exportar lista",
  "watchList.filtersCount":
    "{count} {count, plural, one {filtro} other {filtros}}",
  "watchList.heading": "Direcciones seguidas",
  "watchList.importFailed":
    "{error} Revisa el formato del archivo y selecciona una lista de seguimiento válida para intentarlo de nuevo.",
  "watchList.importFailedFallback": "No se pudo importar la lista de seguimiento.",
  "watchList.importFileLabel": "Importar archivo de lista de seguimiento",
  "watchList.importList": "Importar lista",
  "watchList.importPrompt":
    "Elige cómo aplicar las direcciones importadas a tu lista de seguimiento actual:",
  "watchList.importTitle": "Importar lista de seguimiento",
  "watchList.listFull":
    "La lista tiene un límite de {count} direcciones. Elimina una para añadir otra.",
  "watchList.mergeOption": "Combinar (unir con la existente)",
  "watchList.remove": "Eliminar",
  "watchList.replaceOption": "Reemplazar (sobrescribir la lista actual)",
  "watchList.unwatch": "Dejar de seguir {address}",
};

export default es;
