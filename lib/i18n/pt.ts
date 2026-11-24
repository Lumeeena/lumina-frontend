import type { MessageCatalogue } from "./types";

// Portuguese (pt, Brazilian usage). Written from the English catalogue; a
// fluent reviewer should check wording in context before production use.
const pt: MessageCatalogue = {
  // ── Route errors ──────────────────────────────────────────────────────
  "error.failedToLoadRoute": "Falha ao carregar {route}",
  "error.routeRecoveryHint":
    "Geralmente é um problema temporário ao acessar a rede Stellar. O restante do aplicativo continua disponível.",
  "error.tryAgain": "Tentar novamente",
  "error.errorDigest": "Resumo do erro: {digest}",

  // ── Backend unavailable ───────────────────────────────────────────────
  "error.backendUnavailableTitle": "Os dados da Lumina estão temporariamente indisponíveis",
  "error.backendUnavailableBody":
    "Não conseguimos acessar o indexador. Verifique sua conexão ou tente novamente em instantes; sua solicitação não foi perdida.",
  "error.retry": "Tentar novamente",
  "error.retrying": "Tentando novamente…",

  // ── 404 ───────────────────────────────────────────────────────────────
  "notFound.code": "404",
  "notFound.title": "Página não encontrada",
  "notFound.body":
    "Esse endereço, hash ou rota não existe. Confira a URL ou use o Explorer para buscar uma conta ou transação.",
  "notFound.openExplorer": "Abrir o Explorer",
  "notFound.orGoTo": "Ou ir para",

  // ── Connection indicator ──────────────────────────────────────────────
  "connection.idle": "OCIOSO",
  "connection.connecting": "CONECTANDO",
  "connection.live": "AO VIVO",
  "connection.reconnecting": "RECONECTANDO",
  "connection.polling": "CONSULTANDO",
  "connection.explainIdle":
    "O feed está aguardando para conectar. Os dados exibidos podem ainda não estar atualizados.",
  "connection.explainConnecting":
    "Uma conexão ao vivo está sendo aberta. O feed mostra os dados carregados mais recentemente até conectar.",
  "connection.explainConnected":
    "As transações chegam assim que o servidor as publica, então o feed permanece atualizado.",
  "connection.explainReconnecting":
    "A conexão ao vivo foi interrompida. Os dados existentes continuam visíveis enquanto a Lumina reconecta.",
  "connection.explainDisconnected":
    "As atualizações ao vivo não estão disponíveis. O feed é atualizado a cada 30 segundos, então os dados podem ter até 30 segundos de atraso.",
  "connection.explainUnsupported":
    "Este navegador não pode receber atualizações ao vivo. O feed é atualizado a cada 30 segundos, então os dados podem ter até 30 segundos de atraso.",
  "connection.reasonUnsupported": "atualizações ao vivo não suportadas aqui",
  "connection.reasonUnreachable": "servidor inacessível",
  "connection.reasonRefused": "o servidor recusou a conexão",
  "connection.whatDoesMean": "O que significa {label}?",

  // ── Transaction explorer ──────────────────────────────────────────────
  "explorer.couldNotLoad": "Não foi possível carregar mais transações.",
  "explorer.noTransactionsYet": "Ainda não há transações indexadas.",
  "explorer.noMatchingFilters": "Nenhuma transação corresponde a estes filtros.",
  "explorer.filteredCount": "{filtered} de {total} carregadas",
  "explorer.loadedCount": "{count} carregadas",
  "explorer.loading": "Carregando…",
  "explorer.loadMore": "Carregar mais",
  "explorer.endOfResults": "Fim dos resultados",

  // ── Live feed ─────────────────────────────────────────────────────────
  "liveFeed.fetching": "Buscando dados ao vivo...",
  "liveFeed.noTransactions": "Nenhuma transação encontrada.",
  "liveFeed.updated": "Atualizado {time}",
  "liveFeed.pauseFeed": "Pausar feed",
  "liveFeed.resumeFeed": "Retomar feed",
  "liveFeed.resumeFeedCount": "Retomar feed ({count})",
  "liveFeed.updatesWaiting":
    "{count} {count, plural, one {atualização aguardando} other {atualizações aguardando}}",
  "liveFeed.updatesArrived":
    "{count} {count, plural, one {atualização chegou} other {atualizações chegaram}} enquanto estava pausado",
  "liveFeed.newTransactions":
    "{count} {count, plural, one {transação nova} other {transações novas}}",

  // ── Account operations ────────────────────────────────────────────────
  "accountOps.noOperations": "Ainda não há operações.",
  "accountOps.showingRecent": "Mostrando {count} das suas operações recentes",
  "accountOps.allOperations": "Todas as {count} operações",
  "accountOps.couldNotLoad": "Não foi possível carregar mais operações.",
  "accountOps.endOfResults": "Fim dos resultados",

  // ── Account transactions ──────────────────────────────────────────────
  "accountTxs.noTransactions": "Ainda não há transações.",
  "accountTxs.showingRecent": "Mostrando as {count} transações mais recentes",
  "accountTxs.allTransactions": "Todas as {count} transações",
  "accountTxs.couldNotLoad": "Não foi possível carregar mais transações.",
  "accountTxs.endOfResults": "Fim dos resultados",

  // ── Account detail page ───────────────────────────────────────────────
  "account.breadcrumbExplorer": "Explorer",
  "account.breadcrumbAccounts": "Contas",
  "account.notFoundTitle": "Conta não encontrada",
  "account.notFoundBody":
    "O endereço {address} não existe na Stellar Mainnet ou nunca recebeu fundos. Confira o endereço e a rede, ou financie a conta antes de pesquisar novamente.",
  "account.merged": "Mesclada",
  "account.lastModifiedLedger": "Última modificação no ledger {ledger}",
  "account.statSequence": "Sequência",
  "account.statSubentries": "Subentradas",
  "account.statSponsoring": "Patrocinando",
  "account.statSponsored": "Patrocinada",
  "account.flagAuthRequired": "Autorização necessária",
  "account.flagAuthRevocable": "Autorização revogável",
  "account.flagAuthImmutable": "Autorização imutável",
  "account.flagAuthClawbackEnabled": "Clawback habilitado",
  "account.flagNone": "Sem sinalizadores especiais",
  "account.balancesTitle": "Saldos",
  "account.balancesAriaLabel": "Saldos da conta",
  "account.balanceAsset": "Ativo",
  "account.balanceIssuer": "Emissor",
  "account.balanceBalance": "Saldo",
  "account.balanceLimit": "Limite",
  "account.recentTransactions": "Transações recentes",
  "account.tradesTitle": "Negociações",
  "account.tradesUnavailable":
    "O histórico de negociações não está disponível. Verifique sua conexão e atualize esta página para tentar novamente.",
  "account.recentOperations": "Operações recentes",
  "account.trustlinesTitle": "Histórico de trustlines",
  "account.trustlinesUnavailable":
    "O histórico de trustlines não está disponível. Verifique sua conexão e atualize esta página para tentar novamente.",

  // ── Assets ────────────────────────────────────────────────────────────
  "assets.noAssetsYet":
    "Ainda não há ativos indexados. Assim que o indexador encontrar um saldo ou uma transferência de um ativo, ele aparecerá aqui.",
  "assets.searchPlaceholder": "Pesquise os ativos carregados por código ou emissor",
  "assets.orderBy": "Ordenar por",
  "assets.holders": "Detentores",
  "assets.volume": "Volume",
  "assets.couldNotLoad": "Não foi possível carregar mais ativos.",
  "assets.noMatch": "Nenhum ativo carregado corresponde a «{query}».",
  "assets.searchCoversLoaded":
    "Essa pesquisa abrange os {count} {noun} carregados até agora. Carregue mais para ampliá-la.",
  "assets.endOfAssets": "Fim dos ativos",
  "assets.thAsset": "Ativo",
  "assets.thIssuer": "Emissor",
  "assets.thSupply": "Oferta",
  "assets.thHolders": "Detentores",

  // ── Copy button ───────────────────────────────────────────────────────
  "copy.copy": "Copiar",
  "copy.copied": "Copiado!",
  "copy.failed": "Falhou",
  "copy.copyAddress": "Copiar endereço para a área de transferência",
  "copy.copiedAddress": "Endereço copiado para a área de transferência",
  "copy.copyHash": "Copiar hash da transação para a área de transferência",
  "copy.copiedHash": "Hash da transação copiado para a área de transferência",

  // ── Load more footer ──────────────────────────────────────────────────
  "loadMore.loadMore": "Carregar mais",
  "loadMore.loading": "Carregando…",
  "loadMore.retry": "Tentar novamente",

  // ── Watch feed ────────────────────────────────────────────────────────
  "watch.liveActivity": "Atividade ao vivo",
  "watch.emptyTitle": "Você ainda não está acompanhando nenhum endereço",
  "watch.emptyBody":
    "Use o marcador ao lado de qualquer endereço para acompanhar a atividade dele aqui e receber um alerta quando algo acontecer.",
  "watch.waiting": "Aguardando atividade nos seus endereços acompanhados…",
  "watch.watchedAddresses":
    "{count} {count, plural, one {endereço acompanhado} other {endereços acompanhados}}",
  "watch.matchingAlerts":
    "{count} {count, plural, one {alerta correspondente} other {alertas correspondentes}} nesta sessão",
  "watch.alert": "alerta",

  // ── Register contract form ────────────────────────────────────────────
  "register.contractId": "ID do contrato",
  "register.projectName": "Nome do projeto",
  "register.description": "Descrição",
  "register.categoriesLabel": "Categorias",
  "register.categoriesHint": "(escolha pelo menos uma)",
  "register.selectCategory": "Selecione pelo menos uma categoria.",
  "register.registerContract": "Registrar contrato",
  "register.preparingTransaction": "Preparando a transação…",
  "register.approveInWallet": "Aprove na sua carteira…",
  "register.submitting": "Enviando…",
  "register.confirming": "Confirmando…",
  "register.successMessage":
    "{name} registrado: a Lumina começará a indexá-lo em breve.",
  "register.registrationFailed": "O registro falhou.",
  "register.estimatedFee": "Taxa estimada: {fee} XLM",

  // ── Owner contracts ───────────────────────────────────────────────────
  "owner.loadingContracts": "Carregando seus contratos…",
  "owner.noContracts": "Você ainda não registrou nenhum contrato.",
  "owner.noContractsHint":
    "Registre um pelo formulário para incluí-lo na indexação da Lumina.",
  "owner.deactivate": "Desativar",
  "owner.preparing": "Preparando…",
  "owner.approveInWallet": "Aprovar na carteira…",
  "owner.active": "Ativo",
  "owner.deactivated": "Desativado",
  "owner.staking": "Fazendo stake…",
  "owner.stake": "Stake",
  "owner.stakeAnyway": "Fazer stake mesmo assim",
  "owner.reserveWarningTitle":
    "Este stake deixaria sua conta abaixo do saldo mínimo.",
  "owner.reserveExplanation":
    "A Stellar mantém uma quantidade mínima de XLM em cada conta, chamada reserva. São 1 XLM para uma conta sem mais nada, mais 0,5 XLM por cada trustline, oferta ou outra entrada que ela possua, e essa parte não pode ser gasta. Após este stake, sua conta teria {remaining} XLM, abaixo da reserva de {minimum} XLM. Uma conta abaixo da reserva ainda pode receber XLM, mas não pode enviar transações até ser recarregada.",
  "owner.withdrawing": "Retirando…",
  "owner.withdrawStake": "Retirar stake",
  "owner.stakeAmountLabel": "Quantidade de stake para {name}",
  "owner.stakeAmountPlaceholder": "Quantidade (unidades básicas)",
  "owner.invalidStakeAmount":
    "Informe uma quantidade inteira maior que zero, nas unidades básicas do token de stake.",
  "owner.stakingFailed": "O stake falhou.",
  "owner.withdrawalFailed": "A retirada falhou.",
  "owner.deactivationFailed": "A desativação falhou.",
  "owner.hideHistory": "Ocultar histórico",
  "owner.historyCount": "Histórico ({count})",
  "owner.noRegistryEvents": "Ainda não há eventos de registro indexados para este contrato.",
  "owner.slashHistory": "Histórico de penalidades",
  "owner.lifetimeSlashed": "Total penalizado: {amount} XLM",
  "owner.loadingSlashHistory": "Carregando o histórico de penalidades…",
  "owner.couldNotLoadSlashHistory": "Não foi possível carregar o histórico de penalidades.",
  "owner.noSlashes": "Nenhuma penalidade registrada.",
  "owner.withdrawBlockerActive":
    "Desative este registro primeiro; o stake só pode ser retirado depois que ele estiver desativado.",
  "owner.withdrawBlockerLocked":
    "Uma penalidade foi aplicada recentemente, então a retirada está bloqueada até o ledger {until} (atualmente {current}, faltam {remaining}).",
  "owner.withdrawBlockerNoStake": "Não há stake para retirar.",
  "owner.staked": "Em stake",
  "owner.ledgerPrefix": "ledger",
  "owner.slashHistoryRetryHint": "Verifique sua conexão e tente novamente.",
  "owner.retrySlashHistory": "Tentar novamente o histórico de penalidades",

  // ── Registry event labels ─────────────────────────────────────────────
  "registryEvent.registered": "Registrado",
  "registryEvent.deactivated": "Desativado",
  "registryEvent.metadataUpdated": "Metadados atualizados",
  "registryEvent.ownershipTransferred": "Propriedade transferida",
  "registryEvent.unknown": "Evento de registro",

  // ── Soroban transaction pipeline ──────────────────────────────────────
  "soroban.couldNotPrepare": "Não foi possível preparar a transação.",
  "soroban.signatureDeclined": "A assinatura foi recusada na sua carteira.",
  "soroban.couldNotSign":
    "Não foi possível assinar a transação. Verifique sua carteira e tente novamente.",
  "soroban.retrySignature": "Tentar assinar novamente",
  "soroban.prepareAgain":
    "A transação salva não pode mais ser usada. Envie novamente para preparar uma nova; suas informações foram salvas.",
  "soroban.rejectionPreserved":
    "Assinatura recusada. Suas informações e a transação preparada foram salvas. Você pode tentar novamente quando quiser.",
  "soroban.networkRejected": "A rede rejeitou a transação.",
  "soroban.pendingConfirmation":
    "A transação foi enviada, mas ainda não foi confirmada. Verifique novamente em instantes.",
  "soroban.transactionFailed":
    "A transação não foi concluída (status: {status}).",

  // ── Pending transactions ──────────────────────────────────────────────
  "pending.title": "Transações",
  "pending.register": "Registrar {name}",
  "pending.deactivate": "Desativar {contract}",
  "pending.stake": "Fazer stake em {contract}",
  "pending.withdraw": "Retirar stake de {contract}",
  "pending.building": "Preparando",
  "pending.awaitingSignature": "Aguardando sua carteira",
  "pending.submitting": "Enviando",
  "pending.confirming": "Confirmando na rede",
  "pending.succeeded": "Confirmada",
  "pending.failed": "Falhou",
  "pending.failedFallback": "A transação não foi concluída.",
  "pending.dismiss": "Dispensar",

  // ── Stats ─────────────────────────────────────────────────────────────
  "stats.noOperationsYet": "Ainda não há operações indexadas.",

  // ── Events ────────────────────────────────────────────────────────────
  "events.noEventsYet":
    "Ainda não há eventos indexados para este contrato. A indexação de eventos é opcional no indexador (INDEXED_CONTRACT_IDS/REGISTRY_CONTRACT_ID): veja o README do lumina-backend.",

  // ── Search ────────────────────────────────────────────────────────────
  "search.noMemoMatch":
    "Nenhuma transação contém algo parecido com este memo. A busca por memo encontra referências de pedido e códigos curtos: tente alguns caracteres dele.",

  // ── Activity labels ───────────────────────────────────────────────────
  "activity.indexed": "Atividade indexada",
  "activity.noEvents": "Ainda não há eventos",
  "activity.unknown": "Atividade desconhecida",

  // ── Table headers ─────────────────────────────────────────────────────
  "table.hash": "Hash",
  "table.ledger": "Ledger",
  "table.ops": "Ops",
  "table.time": "Hora",
  "table.type": "Tipo",
  "table.transaction": "Transação",
  "table.detail": "Detalhe",
  "table.source": "Origem",
  "table.operations": "Operações",
  "table.fee": "Taxa",
  "table.contract": "Contrato",
  "table.topic": "Tópico",
  "table.value": "Valor",

  // ── Common UI ─────────────────────────────────────────────────────────
  "common.search": "Pesquisar",
  "common.close": "Fechar",
  "common.clear": "Limpar",
  "common.save": "Salvar",
  "common.cancel": "Cancelar",
  "common.loading": "Carregando…",
  "common.error": "Erro",
  "common.retry": "Tentar novamente",
  "common.connect": "Conectar carteira",
  "common.disconnect": "Desconectar",
  "common.copy": "Copiar",
  "common.copied": "Copiado!",
  "common.xlm": "XLM",

  // ── Skip link ─────────────────────────────────────────────────────────
  "skipLink.skipToMain": "Pular para o conteúdo principal",

  // ── Theme toggle ──────────────────────────────────────────────────────
  "theme.system": "Tema do sistema",
  "theme.light": "Tema claro",
  "theme.dark": "Tema escuro",

  // ── Keyboard shortcuts ────────────────────────────────────────────────
  "shortcuts.title": "Atalhos de teclado",
  "shortcuts.search": "Pesquisar",
  "shortcuts.showList": "Mostrar esta lista",
  "shortcuts.description":
    "Os atalhos nunca usam Ctrl, Cmd ou Alt e são ignorados enquanto você digita em um campo.",
  "shortcuts.enable": "Ativar atalhos de teclado",
  "shortcuts.sequence": "{start} e depois {key}",
  "shortcuts.route.home": "Início",
  "shortcuts.route.explorer": "Explorer",
  "shortcuts.route.transactions": "Transações",
  "shortcuts.route.events": "Eventos de contrato",
  "shortcuts.route.graphql": "GraphQL",
  "shortcuts.route.registry": "Registro",
  "shortcuts.route.stats": "Estatísticas",

  // ── Search page ───────────────────────────────────────────────────────
  "search.heading": "Pesquisar",
  "search.description":
    "Uma única caixa para tudo na rede. Digite o que você tem: não é preciso dizer o que é.",
  "search.accountAddress": "Endereço de conta",
  "search.contractId": "ID do contrato: seus eventos",
  "search.transactionHash": "Hash da transação",
  "search.memoSearch": "Busca por memo, ordenada pelo backend",
  "search.searching": "Pesquisando no índice…",
  "search.resultsCount":
    "{count} transaç{count, plural, one {ão} other {ões}} correspondente{count, plural, one {} other {s}}",
  "search.rankedByMemo": ", ordenadas pela relevância do memo.",
  "search.helpText":
    "Procurando uma conta ou um contrato? Cole o endereço completo — o Explorer leva você direto até ele.",

  // ── Transactions page ─────────────────────────────────────────────────
  "transactions.heading": "Transações",
  "transactions.loading": "Carregando transações…",

  // ── Transaction detail page ───────────────────────────────────────────
  "transaction.backToTransactions": "\u2190 Voltar para Transações",
  "transaction.notFoundTitle": "Transação não encontrada",
  "transaction.notFoundBody":
    "A transação {hash} não está no índice \u2014 pode ser recente demais ou nunca ter sido incluída em um ledger. Verifique o hash e a rede e procure novamente após a transação ter sido confirmada.",
  "transaction.includedInLedger": "Incluída no ledger {ledger}",
  "transaction.statStatus": "Status",
  "transaction.statFee": "Taxa",
  "transaction.statOperations": "Operações",
  "transaction.statTime": "Hora",
  "transaction.statusSuccessful": "Bem-sucedida",
  "transaction.statusFailed": "Falhou",
  "transaction.detailsHeading": "Detalhes",
  "transaction.sourceAccount": "Conta de origem",
  "transaction.viewSourceAtLedger": "Ver conta de origem no ledger {ledger}",
  "transaction.memoType": "Tipo de memo",
  "transaction.memoTypeNone": "nenhum",
  "transaction.memo": "Memo",
  "transaction.preconditionsHeading": "Pré-condições",
  "transaction.operationsHeading": "Operações",
  "transaction.operationsCaption": "Operações da transação",
  "transaction.opColType": "Tipo",
  "transaction.opColFrom": "De",
  "transaction.opColTo": "Para",
  "transaction.opColAmount": "Valor",
  "transaction.opColTime": "Hora",
  "transaction.noOperations":
    "Nenhuma operação foi indexada para esta transação.",

  // ── Stats page ────────────────────────────────────────────────────────
  "stats.heading": "Estatísticas da rede",
  "stats.description":
    "Saúde do indexador e throughput da rede Stellar de relance.",
  "stats.latestLedger": "Último ledger",
  "stats.stellarMainnet": "Stellar Mainnet",
  "stats.txsLastLedger": "Tx (último ledger)",
  "stats.successfulFailed": "Bem-sucedidas + falhas",
  "stats.contractsRegistered": "Contratos registrados",
  "stats.viaLumina": "Pelo registro da Lumina",
  "stats.avgLedgerTime": "Tempo médio por ledger",
  "stats.protocolTarget": "~5 s",
  "stats.protocolTargetHint": "Meta do protocolo, não uma média ao vivo",
  "stats.operationBreakdown": "Distribuição por tipo de operação",
  "stats.basedOnRecent": "Com base nas {count} operações indexadas mais recentes.",

  // ── Registry page ─────────────────────────────────────────────────────
  "registry.loading": "Carregando o registro…",
  "registry.sessionRestoreFailed": "Não foi possível restaurar sua sessão de carteira salva.",
  "registry.networkMismatchTitle": "Rede incompatível",
  "registry.networkMismatch":
    "Sua carteira está em {walletNetwork}, mas este aplicativo usa {appNetwork}. Mude sua carteira para a testnet da Stellar antes de tentar novamente.",
  "registry.connectFailed": "Não foi possível conectar à sua carteira.",
  "registry.disconnectFailed":
    "Não foi possível desconectar sua carteira. Desconecte-a na extensão e depois atualize esta página.",
  "registry.walletRetry":
    "{error} Abra sua carteira e escolha Conectar carteira para tentar novamente.",
  "registry.category.DeFi": "DeFi",
  "registry.category.Nft": "NFT",
  "registry.category.Gaming": "Jogos",
  "registry.category.Identity": "Identidade",
  "registry.category.Infrastructure": "Infraestrutura",
  "registry.category.Payments": "Pagamentos",
  "registry.category.Oracle": "Oráculo",
  "registry.category.Dao": "DAO",
  "registry.category.Other": "Outros",
  "registry.heading": "Registro da Lumina",
  "registry.description":
    "Um manifesto Soroban on-chain dos contratos que a Lumina indexa. Registre seu contrato para entrar na indexação prioritária: sem permissão, na testnet da Stellar/Soroban.",
  "registry.registerContract": "Registrar um contrato",
  "registry.connecting": "Conectando…",
  "registry.connectPrompt": "Conecte uma carteira para registrar e gerenciar contratos.",
  "registry.walletLocked": "Sua carteira está bloqueada",
  "registry.unlockHint": "Desbloqueie a extensão da sua carteira e tente novamente.",
  "registry.myContracts": "Meus contratos",
  "registry.recentlyRegistered": "Registrados recentemente",
  "registry.all": "Todos",
  "registry.filterByCategory": "Filtrar por categoria",
  "registry.connectToSee": "Conecte uma carteira para ver os contratos que você registrou.",
  "registry.loadingEntries": "Carregando entradas do registro…",
  "registry.noActiveContracts": "Nenhum contrato ativo de {category}.",
  "registry.noContractsYet": "Nenhum contrato registrado ainda.",
  "registry.couldNotReach": "Não foi possível acessar o contrato do registro.",

  // ── GraphQL page ──────────────────────────────────────────────────────
  "graphql.heading": "Playground GraphQL",
  "graphql.endpoint": "Endpoint GraphQL da Lumina:",
  "graphql.queryExamples": "Exemplos de consulta",
  "graphql.recentQueries": "Consultas recentes",
  "graphql.noHistory": "As consultas editadas aparecerão aqui.",
  "graphql.queryEditor": "Editor de consulta",
  "graphql.running": "Executando…",
  "graphql.runQuery": "Executar consulta",
  "graphql.response": "Resposta",
  "graphql.clickToRun": "Clique em «Executar consulta» para ver a resposta.",

  // ── Explorer page ─────────────────────────────────────────────────────
  "explorer.heading": "Explorer",
  "explorer.description":
    "Pesquise qualquer conta Stellar ou navegue pelas transações recentes em tempo real.",
  "explorer.searchPlaceholder": "Pesquise uma conta, transação, contrato ou memo…",
  "explorer.recentTransactions": "Transações recentes",

  // ── Events page ───────────────────────────────────────────────────────
  "events.heading": "Eventos de contrato",
  "events.description":
    "Eventos de contratos Soroban indexados via RPC, do mais recente para o mais antigo.",
  "events.contractIdPlaceholder": "ID do contrato (C...)",
  "events.filter": "Filtrar",

  // ── Assets page ───────────────────────────────────────────────────────
  "assets.heading": "Ativos",
  "assets.description":
    "Todos os ativos que a Lumina indexa, com a oferta e o número de detentores por trás deles.",

  // ── Asset detail page ─────────────────────────────────────────────────
  "assetDetail.backToAssets": "\u2190 Voltar para Ativos",
  "assetDetail.eyebrow": "Ativo",
  "assetDetail.nativeAsset": "Ativo nativo",
  "assetDetail.customAsset": "Ativo personalizado",
  "assetDetail.nativeStellarAsset": "Ativo nativo da Stellar",
  "assetDetail.statSupply": "Oferta",
  "assetDetail.statHolders": "Detentores",
  "assetDetail.stat30dVolume": "Volume 30d",
  "assetDetail.detailsAriaLabel": "Detalhes do ativo",
  "assetDetail.rowAssetCode": "Código do ativo",
  "assetDetail.rowIssuer": "Emissor",
  "assetDetail.transferVolumeHeading": "Volume de transferências",
  "assetDetail.noActivityTitle": "Sem atividade nos últimos 30 dias",
  "assetDetail.noActivityBody":
    "O volume de transferências de {asset} aparecerá aqui quando este ativo for enviado ou recebido.",
  "assetDetail.chartTitle": "Volume de transferências de {asset}",
  "assetDetail.chartDescription":
    "Volume de transferências diário de {asset} nos últimos 30 dias.",
  "assetDetail.chartCaption":
    "Volume de transferências (enviado + recebido) por dia \u00b7 últimos 30 dias \u00b7 buckets diários",

  // ── Watch page ────────────────────────────────────────────────────────
  "watch.backgroundNotifications": "Notificações em segundo plano",
  "watch.notificationDescription":
    "Os alertas no aplicativo funcionam em toda a Lumina. Esta é a opção separada para receber uma notificação do sistema operacional quando a aba não está em primeiro plano.",

  // ── Footer ────────────────────────────────────────────────────────────
  "footer.version": "Frontend da Lumina v{version}",
  "footer.copyVersion": "Copiar a versão para relatórios de erro",

  // ── SearchBar ─────────────────────────────────────────────────────────
  "searchBar.placeholder": "Pesquise uma conta, transação, contrato ou memo…",

  // ── Developer portal ──────────────────────────────────────────────────
  "devPortal.heading": "Portal do desenvolvedor da Lumina",
  "devPortal.description":
    "Tudo o que você precisa para integrar a API Stellar da Lumina ao seu aplicativo: da primeira consulta ao monitoramento em produção.",
  "devPortal.gettingStarted.title": "Primeiros passos",
  "devPortal.gettingStarted.description":
    "Guia passo a passo para fazer sua primeira requisição à API. Saiba sobre autenticação, paginação e tratamento de erros com exemplos de código para copiar e colar.",
  "devPortal.gettingStarted.cta": "Começar →",
  "devPortal.apiDocs.title": "Documentação da API",
  "devPortal.apiDocs.description":
    "Explore o schema GraphQL com exemplos práticos que você pode executar ao vivo. Entenda a fundo os padrões de paginação e o tratamento de erros.",
  "devPortal.apiDocs.cta": "Explorar a documentação →",
  "devPortal.playground.title": "Playground de consultas",
  "devPortal.playground.description":
    "Escreva consultas GraphQL e gere código cliente em JavaScript e Python. Teste suas consultas ao vivo na API real.",
  "devPortal.playground.cta": "Abrir o playground →",
  "devPortal.usage.title": "Painel de uso",
  "devPortal.usage.description":
    "Acompanhe o uso das suas chaves de API e o consumo da sua cota. Veja o número de requisições e as tendências ao longo do tempo.",
  "devPortal.usage.cta": "Ver o painel →",
  "devPortal.webhooks.title": "Webhooks",
  "devPortal.webhooks.description":
    "Registre webhooks para notificações de eventos em tempo real. Acompanhe as tentativas de entrega e teste seus endpoints.",
  "devPortal.webhooks.cta": "Gerenciar webhooks →",
  "devPortal.quickStart.title": "Início rápido",
  "devPortal.quickStart.before": "É novo na Lumina? Acesse nosso",
  "devPortal.quickStart.link": "guia de primeiros passos",
  "devPortal.quickStart.after":
    "para aprender o básico. Você estará consultando a blockchain da Stellar em minutos.",
  "devPortal.step1.action": "Faça uma requisição",
  "devPortal.step1.rest": "usando nosso playground ou a linguagem de sua preferência",
  "devPortal.step2.action": "Gere o código",
  "devPortal.step2.rest": "em JavaScript ou Python para o seu aplicativo",
  "devPortal.step3.action": "Acompanhe o uso",
  "devPortal.step3.rest": "pelo seu painel",

  // ── Getting started guide ─────────────────────────────────────────────
  "guide.heading": "Primeiros passos com a Lumina",
  "guide.subtitle":
    "Aprenda a fazer sua primeira consulta GraphQL em poucos minutos.",
  "guide.step1.title": "Faça sua primeira requisição",
  "guide.step1.before": "A API GraphQL da Lumina está disponível em",
  "guide.step1.after":
    ". Comece com esta consulta simples que busca o último ledger:",
  "guide.step1.hint":
    "Copie o código acima e execute-o no seu terminal. Você deverá ver as informações do último ledger da Stellar.",
  "guide.example.firstRequest": "Primeira requisição",
  "guide.example.pagination": "Consulta com paginação",
  "guide.step2.title": "Trabalhe com a paginação",
  "guide.step2.intro":
    "Para consultas que retornam vários itens, usamos paginação baseada em cursor.",
  "guide.step2.response":
    "A resposta inclui um objeto pageInfo com os campos hasNextPage e cursor:",
  "guide.step2.nextTitle": "Como buscar a próxima página:",
  "guide.step2.nextBefore": "Para obter a próxima página de resultados, passe o",
  "guide.step2.nextAfter": "da resposta anterior na próxima consulta:",
  "guide.step3.title": "Trate os erros com cuidado",
  "guide.step3.before":
    "A API GraphQL retorna HTTP 200 mesmo quando há erros: confira o",
  "guide.step3.after": "na resposta:",
  "guide.errors.title": "Erros comuns:",
  "guide.errors.invalidQuery": "Consulta inválida",
  "guide.errors.invalidQueryBefore":
    "A sintaxe do GraphQL é inválida. Confira o",
  "guide.errors.invalidQueryLink": "playground",
  "guide.errors.invalidQueryAfter": "para ver o schema correto.",
  "guide.errors.notFound": "Não encontrado",
  "guide.errors.notFoundDesc":
    "O recurso não existe (por exemplo, uma conta que ainda não recebeu fundos na Stellar).",
  "guide.errors.serverError": "Erro do servidor",
  "guide.errors.serverErrorDesc":
    "Nosso backend está temporariamente indisponível. Tente novamente com backoff exponencial.",
  "guide.errorHandling.title": "Padrão de tratamento de erros",
  "guide.step4.title": "Explore o schema",
  "guide.step4.before": "Visite o",
  "guide.step4.link": "Playground GraphQL",
  "guide.step4.after":
    "para explorar todas as consultas e tipos de dados disponíveis. O playground inclui exemplos práticos que você pode executar ao vivo na API.",
  "guide.step4.popularLabel": "Consultas populares:",
  "guide.step4.popularItems":
    "Transações recentes, saldos de contas, eventos de contratos, informações de ativos, histórico de pagamentos",
  "guide.next.title": "E agora?",
  "guide.next.tryPlayground.label": "Experimente o playground:",
  "guide.next.tryPlayground.link": "Execute consultas ao vivo",
  "guide.next.readDocs.label": "Leia a documentação:",
  "guide.next.readDocs.link": "Aprofunde-se em paginação e tratamento de erros",
  "guide.next.generateCode.label": "Gere código:",
  "guide.next.generateCode.text":
    "Use o playground para escrever uma consulta e depois gere código pronto para produção em JavaScript ou Python",
  "guide.next.monitorUsage.label": "Acompanhe o uso:",
  "guide.next.monitorUsage.link": "Monitore seu consumo da API",

  // ── API documentation ─────────────────────────────────────────────────
  "apiDocs.heading": "Documentação da API",
  "apiDocs.subtitleBefore":
    "Explore o schema GraphQL com exemplos práticos que você pode executar ao vivo na API. Todos os exemplos abaixo podem ser executados no",
  "apiDocs.subtitleLink": "Playground GraphQL",
  "apiDocs.pagination.title": "Guia de paginação",
  "apiDocs.pagination.intro":
    "Todas as consultas de lista na Lumina usam paginação baseada em cursor. Essa abordagem é ideal para grandes volumes de dados porque é:",
  "apiDocs.pagination.bulletScalable.label": "Escalável:",
  "apiDocs.pagination.bulletScalable.desc":
    "Os cursores não exigem cálculos de deslocamento",
  "apiDocs.pagination.bulletStable.label": "Estável:",
  "apiDocs.pagination.bulletStable.desc":
    "Os resultados não mudam quando itens são adicionados ou removidos",
  "apiDocs.pagination.bulletEfficient.label": "Eficiente:",
  "apiDocs.pagination.bulletEfficient.desc":
    "Não é preciso buscar e pular os itens anteriores",
  "apiDocs.pagination.returns": "Toda consulta de lista retorna:",
  "apiDocs.pagination.next":
    "Para buscar a próxima página, passe o cursor da resposta anterior:",
  "apiDocs.errors.title": "Tratamento de erros",
  "apiDocs.errors.before": "O GraphQL sempre retorna HTTP 200. Confira o",
  "apiDocs.errors.after": "para encontrar problemas:",
  "apiDocs.errors.success": "Resposta de sucesso",
  "apiDocs.errors.error": "Resposta de erro",
  "apiDocs.errors.checkBefore": "Verifique sempre se há",
  "apiDocs.errors.checkMiddle": "antes de acessar",
  "apiDocs.errors.checkAfter": ".",
  "apiDocs.examples.title": "Exemplos práticos",
  "apiDocs.example.recentTransactions.name": "Transações recentes",
  "apiDocs.example.recentTransactions.description":
    "Busca as últimas 5 transações da rede",
  "apiDocs.example.accountBalances.name": "Saldos da conta",
  "apiDocs.example.accountBalances.description":
    "Obtém todos os saldos de ativos de uma conta (edite o endereço abaixo)",
  "apiDocs.example.paymentHistory.name": "Histórico de pagamentos",
  "apiDocs.example.paymentHistory.description":
    "Busca as operações de pagamento de uma conta (edite o endereço abaixo)",
  "apiDocs.example.contractEvents.name": "Eventos de contrato",
  "apiDocs.example.contractEvents.description":
    "Consulta eventos de contratos Soroban pelo endereço do contrato (edite o ID do contrato abaixo)",
  "apiDocs.tryInPlayground": "Testar no playground",
  "apiDocs.viewDocs": "Ver documentação",
  "apiDocs.next.title": "Próximos passos",
  "apiDocs.next.runExample.label": "Execute um exemplo:",
  "apiDocs.next.runExample.text":
    "Clique em «{button}» para executar qualquer um dos exemplos acima na API ao vivo",
  "apiDocs.next.modify.label": "Modifique e teste:",
  "apiDocs.next.modify.text":
    "Edite a consulta no playground para explorar outros campos e filtros",
  "apiDocs.next.generate.label": "Gere código:",
  "apiDocs.next.generate.text":
    "Quando sua consulta funcionar, gere código em JavaScript ou Python para integrá-lo ao seu aplicativo",

  // ── Usage dashboard ───────────────────────────────────────────────────
  "usage.heading": "Painel de uso",
  "usage.subtitle":
    "Acompanhe o uso das suas chaves de API e o consumo da sua cota, protegido pela posse da sua carteira.",
  "usage.connectedOwner": "Conta proprietária conectada",
  "usage.walletRequired.title": "É necessário comprovar a posse da carteira",
  "usage.walletRequired.body":
    "O gerenciamento de chaves está diretamente ligado à posse da carteira. Conecte sua carteira Stellar para ver, criar e gerenciar suas chaves de API privadas.",
  "usage.connecting": "Conectando carteira…",
  "usage.connectCta": "Conecte sua carteira para acessar as chaves",
  "usage.requestsThisWeek": "Requisições nesta semana",
  "usage.peakDay": "Dia de pico: {count} requisições",
  "usage.quotaRemaining": "Cota restante",
  "usage.quotaOfTotal": "de {total} no total",
  "usage.quotaUsage": "Uso da cota",
  "usage.warning": "Aviso",
  "usage.requestsOverTime": "Requisições ao longo do tempo (últimos 7 dias)",
  "usage.byApiKey": "Uso por chave de API",
  "usage.keyManagement": "Gerenciamento de chaves de API",
  "usage.keyNamePlaceholder": "Nome da chave (ex.: Chave de staging)",
  "usage.createKey": "Criar chave de API",
  "usage.thKeyName": "Nome da chave",
  "usage.thApiKey": "Chave de API",
  "usage.thCreated": "Criada",
  "usage.thUsage": "Uso",
  "usage.thAction": "Ação",
  "usage.percentUsed": "{percent}% usado",
  "usage.revoke": "Revogar",
  "usage.aboutKeys.title": "Sobre as chaves protegidas pela carteira",
  "usage.aboutKeys.body":
    "As chaves de API ficam associadas 1:1 ao endereço da sua carteira, que é a sua identidade. Desconectar a carteira oculta suas chaves sem excluí-las.",

  // ── Code snippet ──────────────────────────────────────────────────────
  "codeSnippet.copy": "Copiar",
  "codeSnippet.copied": "✓ Copiado",
  "codeSnippet.copiedAria": "Código copiado",
  "codeSnippet.copiedStatus": "Código copiado para a área de transferência",
  "codeSnippet.copyError":
    "Não foi possível acessar a área de transferência. Selecione o código e copie manualmente.",

  // ── CommandPalette ────────────────────────────────────────────────────
  "commandPalette.placeholder": "Pesquisar rotas e ações...",
  "commandPalette.noResults": "Nenhum resultado encontrado",
  "commandPalette.selectHint": "Selecionar",
  "commandPalette.navigateHint": "Navegar",
  "commandPalette.searchAction": "Pesquisar",
  "commandPalette.searchActionDescription":
    "Pesquise endereços e transações da Stellar",
  "commandPalette.route.explorer.label": "Explorer",
  "commandPalette.route.explorer.description":
    "Pesquise qualquer conta Stellar ou navegue pelas transações recentes, atualizadas ao vivo por uma assinatura GraphQL.",
  "commandPalette.route.transactions.label": "Transações",
  "commandPalette.route.transactions.description":
    "Todas as transações Stellar indexadas, com filtros, predefinições salvas e paginação por cursor.",
  "commandPalette.route.ledgers.label": "Ledgers",
  "commandPalette.route.ledgers.description":
    "Ledgers Stellar indexados, do mais recente para o mais antigo: horário de fechamento, contagem de transações e operações, e lacunas no índice.",
  "commandPalette.route.search.label": "Pesquisar",
  "commandPalette.route.search.description":
    "Busca por memo em todas as transações indexadas: referências de pedido e códigos curtos, ordenados pela similaridade de trigramas do backend.",
  "commandPalette.route.events.label": "Eventos de contrato",
  "commandPalette.route.events.description":
    "Eventos de contratos Soroban indexados pela Lumina, filtráveis pelo ID do contrato.",
  "commandPalette.route.assets.label": "Ativos",
  "commandPalette.route.assets.description":
    "Todos os ativos Stellar que a Lumina indexa: oferta e número de detentores, ordenados por detentores ou por volume de transferências.",
  "commandPalette.route.graphql.label": "GraphQL",
  "commandPalette.route.graphql.description":
    "Execute consultas na API GraphQL da Lumina pelo navegador, com exemplos práticos.",
  "commandPalette.route.developers.label": "Desenvolvedores",
  "commandPalette.route.developers.description":
    "Documentação da API, guia de primeiros passos e painel de uso para desenvolvedores que usam a Lumina.",
  "commandPalette.route.registry.label": "Registro",
  "commandPalette.route.registry.description":
    "Um manifesto Soroban on-chain dos contratos que a Lumina indexa: registre um contrato para entrar na indexação.",
  "commandPalette.route.stats.label": "Estatísticas",
  "commandPalette.route.stats.description":
    "Saúde do indexador e throughput da rede Stellar: último ledger, volume de transações e tipos de operação.",
  "commandPalette.route.watch.label": "Acompanhar",
  "commandPalette.route.watch.description":
    "Acompanhe endereços Stellar: um único feed ao vivo da atividade de tudo o que você segue, com filtros de alerta por endereço.",

  // ── AddressLabelManager ───────────────────────────────────────────────
  "addressLabelManager.labels": "Rótulos",
  "addressLabelManager.manageLabels": "Gerenciar rótulos de endereços",
  "addressLabelManager.title": "Rótulos de endereços",
  "addressLabelManager.addNewLabel": "Adicionar novo rótulo",
  "addressLabelManager.addressPlaceholder": "Endereço Stellar",
  "addressLabelManager.labelPlaceholder": "Rótulo",
  "addressLabelManager.addLabel": "Adicionar rótulo",
  "addressLabelManager.yourLabels": "Seus rótulos",
  "addressLabelManager.save": "Salvar",
  "addressLabelManager.edit": "Editar",
  "addressLabelManager.deleteLabel": "Excluir rótulo",
  "addressLabelManager.invalidFormat": "Formato de rótulo inválido",
  "addressLabelManager.failedToRead": "Falha ao ler o arquivo",
  "addressLabelManager.export": "Exportar",
  "addressLabelManager.import": "Importar",
  "addressLabelManager.exportTitle": "Exportar rótulos como JSON",
  "addressLabelManager.importTitle": "Importar rótulos de JSON",
  "addressLabelManager.importFile": "Importar arquivo de rótulos",

  // ── accountActivity ──
  "accountActivity.liveActivity": "Atividade ao vivo",
  "accountActivity.waitingForActivity": "Aguardando nova atividade nesta conta…",
  "accountActivity.latestActivity": "Atividade mais recente da conta",
  "accountActivity.viewTransactionLabel":
    "Ver a transação do tipo {type} {hash} no Stellar Expert (abre em uma nova aba)",
  // ── trustline ──
  "trustline.removed": "Removida",
  "trustline.set": "Definida",
  "trustline.unknown": "Desconhecida",
  "trustline.couldNotLoadMore": "Não foi possível carregar mais histórico de trustlines.",
  "trustline.noChanges": "Nenhuma alteração de trustline registrada para esta conta.",
  "trustline.showingRecent": "Mostrando {count} alterações de trustline recentes",
  "trustline.allChanges":
    "Todas as {count} {count, plural, one {alteração de trustline} other {alterações de trustline}}",
  "trustline.limit": "Limite",
  "trustline.onStellarExpert": "no stellar.expert (abre em uma nova aba)",
  "trustline.endOfHistory": "Fim do histórico de trustlines",
  // ── portfolio ──
  "portfolio.heading": "Atividade da carteira",
  "portfolio.selectAsset": "Selecione um ativo para ver",
  "portfolio.couldNotLoad": "Não foi possível carregar os dados de atividade.",
  "portfolio.noActivity": "Nenhuma atividade nos últimos 30 dias",
  "portfolio.noActivityDescription":
    "O volume de transferências de {asset} aparecerá aqui assim que esta conta enviar ou receber um pagamento.",
  "portfolio.transferVolume": "Volume de transferências de {asset}",
  "portfolio.transferVolumeDescription":
    "Volume diário de transferências de {asset} nos últimos 30 dias, medido em {asset}.",
  "portfolio.caption":
    "Volume de transferências (enviado + recebido) por dia · últimos 30 dias · intervalos diários",
  "portfolio.showLess": "Mostrar menos",
  "portfolio.showMore": "+{count} mais",
  "portfolio.loadingVolume": "Carregando volume de transferências",
  // ── footer ──
  "footer.copied": "Copiado!",
  "footer.copy": "Copiar",
  "footer.reportProblem": "Relatar um problema",
  "footer.statusChangelog": "Status e changelog",
  // ── watchAlertSettings ──
  "watchAlertSettings.alertFilter": "Filtro de alertas para {address}",
  "watchAlertSettings.operation": "Operação",
  "watchAlertSettings.anyOperation": "Qualquer operação",
  "watchAlertSettings.minimumAmount": "Quantidade mínima",
  "watchAlertSettings.any": "Qualquer",
  "watchAlertSettings.asset": "Ativo",
  "watchAlertSettings.noFilter": "Sem filtro: toda operação gera um alerta.",
  "watchAlertSettings.filtersActive":
    "{count} {count, plural, one {filtro ativo} other {filtros ativos}}.",
  "watchAlertSettings.resetDefault": "Restaurar padrão",
  // ── registrySlashHistory ──
  "registrySlashHistory.slashHistory": "Histórico de penalidades",
  "registrySlashHistory.hideSlashHistory": "Ocultar histórico de penalidades",
  "registrySlashHistory.loadingSlashHistory": "Carregando histórico de penalidades…",
  "registrySlashHistory.couldNotReadHistory":
    "Não foi possível ler o histórico de penalidades. Feche e reabra para tentar novamente.",
  "registrySlashHistory.noSlashes": "Nenhuma penalidade registrada.",
  "registrySlashHistory.ledger": "ledger {ledger}",
  // ── registryEntryCard ──
  "registryEntryCard.categories": "Categorias",
  "registryEntryCard.hideSlashHistory": "Ocultar histórico de penalidades",
  "registryEntryCard.slashHistory": "Histórico de penalidades",
  "registryEntryCard.loadingSlashHistory": "Carregando histórico de penalidades…",
  "registryEntryCard.couldNotReadHistory":
    "Não foi possível ler o histórico de penalidades. Verifique sua conexão e tente novamente.",
  "registryEntryCard.retryHistory": "Tentar novamente o histórico",
  "registryEntryCard.noSlashes": "Nenhuma penalidade registrada.",
  "registryEntryCard.ledger": "ledger {ledger}",
  // ── searchBar ──
  "searchBar.searchKindAccount": "Conta",
  "searchBar.searchKindContract": "Contrato",
  "searchBar.searchKindMuxed": "Conta multiplexada",
  "searchBar.searchKindTransaction": "Transação",
  "searchBar.searchKindMemo": "Busca por memo",
  // ── breadcrumbs ──
  "breadcrumbs.ariaLabel": "Trilha de navegação",
  // ── pushOptIn ──
  "pushOptIn.unsupported":
    "Este navegador não pode exibir notificações da atividade acompanhada. Os alertas no aplicativo continuam funcionando.",
  "pushOptIn.denied":
    "As notificações estão bloqueadas para este site. Reative-as nas configurações de site do seu navegador para receber alertas enquanto esta aba está em segundo plano. Os alertas no aplicativo não são afetados.",
  "pushOptIn.subscribed":
    "As notificações do navegador estão ativadas. Você será avisado quando um endereço acompanhado tiver atividade e esta aba estiver em segundo plano.",
  "pushOptIn.turnOff": "Desativar",
  "pushOptIn.description":
    "Receba uma notificação do navegador quando um endereço acompanhado tiver atividade e esta aba estiver em segundo plano.",
  "pushOptIn.noVapidKey":
    "As notificações do navegador precisam de uma chave pública VAPID. Defina NEXT_PUBLIC_VAPID_PUBLIC_KEY para ativá-las; os alertas no aplicativo funcionam sem ela.",
  "pushOptIn.enable": "Ativar notificações",
  "pushOptIn.enabling": "Ativando…",
  // ── navbar ──
  "navbar.home": "Início da Lumina",
  "navbar.mainNav": "Navegação principal",
  // ── networkStats ──
  "networkStats.activeAccounts": "Contas ativas",
  "networkStats.inSampledData": "Nos dados de amostra",
  "networkStats.inSampledTransactions": "Nas transações de amostra",
  "networkStats.mostRecent": "Mais recente",
  "networkStats.noOperationData": "Não há dados de operações disponíveis",
  "networkStats.noTransactionData": "Não há dados de transações disponíveis",
  "networkStats.operationsCaption": "Com base nas operações indexadas mais recentes",
  "networkStats.operationsDescription":
    "Volume de operações por hora a partir de dados indexados recentes",
  "networkStats.operationsOverTime": "Operações ao longo do tempo",
  "networkStats.operationsUnit": " ops",
  "networkStats.sampledOperations": "Operações de amostra",
  "networkStats.sampledTransactions": "Transações de amostra",
  "networkStats.successRate": "Taxa de sucesso",
  "networkStats.transactionsCaption": "Com base nas transações indexadas mais recentes",
  "networkStats.transactionsDescription":
    "Volume de transações por hora a partir de dados indexados recentes",
  "networkStats.transactionsOverTime": "Transações ao longo do tempo",
  "networkStats.transactionsUnit": " tx",
  // ── onTour ──
  "onTour.closeTour": "Fechar tour",
  "onTour.done": "Concluir",
  "onTour.next": "Próximo",
  "onTour.skip": "Pular",
  "onTour.stepPosition": "{current} de {total}",
  "onTour.welcomeSubtitle": "Descubra o que torna a Lumina única",
  "onTour.welcomeTitle": "Bem-vindo à Lumina",
  // ── search ──
  "search.explorerLink": "o Explorer",
  "search.helpTextAfterLink": " leva você direto até ele.",
  "search.helpTextBeforeLink": "Procurando uma conta ou um contrato? Cole o endereço completo — ",
  // ── transactionFilters ──
  "transactionFilters.applyPreset": "Aplicar predefinição {name}",
  "transactionFilters.clearFilters": "Limpar filtros ({count})",
  "transactionFilters.deletePreset": "Excluir predefinição {name}",
  "transactionFilters.from": "De",
  "transactionFilters.maxFee": "Taxa máxima (XLM)",
  "transactionFilters.minOperations": "Mínimo de operações",
  "transactionFilters.presetNameLabel": "Nome da predefinição",
  "transactionFilters.presetNamePlaceholder": "Nomeie este filtro",
  "transactionFilters.savePreset": "Salvar predefinição",
  "transactionFilters.savedPresets": "Predefinições de filtro salvas",
  "transactionFilters.sourceAccount": "Conta de origem",
  "transactionFilters.statusFilter": "Filtro de status da transação",
  "transactionFilters.to": "Até",
  // ── walletInfo ──
  "walletInfo.disconnect": "Desconectar",
  "walletInfo.disconnectLabel": "Desconectar carteira",
  "walletInfo.disconnecting": "Desconectando…",
  // ── watchList ──
  "watchList.addWatch": "Adicionar acompanhamento",
  "watchList.addressLabel": "Endereço Stellar para acompanhar",
  "watchList.cancel": "Cancelar",
  "watchList.confirmImport": "Confirmar importação",
  "watchList.emptyState":
    "Nada acompanhado ainda. Adicione um endereço acima ou use o ícone de marcador ao lado de qualquer conta do site.",
  "watchList.errorDuplicate":
    "Esse endereço já está na sua lista de acompanhamento. Escolha outro endereço ou remova o existente primeiro.",
  "watchList.errorEmpty": "Informe um endereço para acompanhar.",
  "watchList.errorInvalid": "Isso não é um ID de conta Stellar: {hint}.",
  "watchList.exportList": "Exportar lista",
  "watchList.filtersCount":
    "{count} {count, plural, one {filtro} other {filtros}}",
  "watchList.heading": "Endereços acompanhados",
  "watchList.importFailed":
    "{error} Verifique o formato do arquivo e selecione uma lista de acompanhamento válida para tentar novamente.",
  "watchList.importFailedFallback": "Falha ao importar a lista de acompanhamento.",
  "watchList.importFileLabel": "Importar arquivo da lista de acompanhamento",
  "watchList.importList": "Importar lista",
  "watchList.importPrompt":
    "Escolha como aplicar os endereços importados à sua lista de acompanhamento atual:",
  "watchList.importTitle": "Importar lista de acompanhamento",
  "watchList.listFull":
    "A lista tem o limite de {count} endereços. Remova um para adicionar outro.",
  "watchList.mergeOption": "Mesclar (combinar com a lista existente)",
  "watchList.remove": "Remover",
  "watchList.replaceOption": "Substituir (sobrescrever a lista atual)",
  "watchList.unwatch": "Deixar de acompanhar {address}",
};

export default pt;
