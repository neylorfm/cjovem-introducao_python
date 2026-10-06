/**
 * ============================================================================
 * PYTHONLAB — PLATAFORMA DE ENSINO INTERATIVO DE PYTHON
 * Backend Google Apps Script (Code.gs)
 * ============================================================================
 * Arquitetura Híbrida:
 * - Google Sheets como banco de dados NoSQL/Relacional simplificado
 * - Google Apps Script (HtmlService) como servidor de API RPC e renderizador SPA
 * - Componentes modulares no frontend com suporte a visitantes, alunos e professores
 * ============================================================================
 */

// Configurações do Sistema
var CONFIG = {
  APP_NAME: 'PythonLab',
  VERSION: '1.2.0',
  SPREADSHEET_ID: '', // Preencha com o ID da planilha se o projeto Apps Script for Standalone (script.google.com)
  SHEET_USERS: 'Usuarios',
  SHEET_PROGRESS: 'Progresso',
  SHEET_CATALOG: 'Catalogo_Aulas',
  SHEET_IMAGES: 'Imagens_Exercicios',
  SHEET_AVALIACOES: 'Avaliacoes',
  SHEET_ENVIOS: 'Envios_Avaliacoes',
  SHEET_SORTEIOS: 'Sorteios_Historico',
  DEFAULT_XP_RESOLVIDO: 20,
  DEFAULT_XP_PROPOSTO: 35,
  DEFAULT_XP_DESAFIO: 50
};

/**
 * Ponto de entrada do Web App
 * Renderiza o shell unificado da aplicação SPA.
 */
function doGet(e) {
  // Auto-provisionamento: garante que a planilha e as abas estejam criadas automaticamente
  ensureDatabase();

  var template = HtmlService.createTemplateFromFile('Index');
  
  // Parâmetros de rota inicial opcionais via query string
  template.initialRoute = (e && e.parameter && e.parameter.page) ? e.parameter.page : 'dashboard';
  template.initialLessonId = (e && e.parameter && e.parameter.id) ? e.parameter.id : '';
  
  // Obtém identidade do usuário autenticado no Workspace/Gmail
  var activeEmail = '';
  try {
    activeEmail = Session.getActiveUser().getEmail() || '';
  } catch(errActive) {
    Logger.log('Aviso ao obter activeEmail no doGet: ' + errActive.message);
  }
  template.activeEmail = activeEmail;
  
  return template.evaluate()
    .setTitle('PythonLab — Reforço Didático Interativo')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * ETAPA 1: Diagnóstico da Sessão Google Apps Script
 * Permite inspecionar em tempo real qual conta o Google entrega via RPC (google.script.run)
 */
function getGoogleSessionDiagnostic() {
  var activeEmail = '';
  var effectiveEmail = '';
  try {
    activeEmail = Session.getActiveUser().getEmail() || '';
  } catch (e) {
    activeEmail = 'Erro: ' + e.message;
  }
  try {
    effectiveEmail = Session.getEffectiveUser().getEmail() || '';
  } catch (e) {
    effectiveEmail = 'Erro: ' + e.message;
  }
  return {
    activeEmail: activeEmail,
    effectiveEmail: effectiveEmail,
    timestamp: new Date().toISOString()
  };
}

/**
 * Formata um nome amigável a partir do identificador da conta institucional
 * Exemplo: 'ana.silva8872@aluno.ce.gov.br' -> 'Ana Silva'
 */
function formatarNomeDeEmail(email) {
  if (!email) return 'Estudante';
  var usuario = email.split('@')[0];
  usuario = usuario.replace(/\d+$/, ''); // Remove dígitos finais
  var partes = usuario.split(/[._-]/).filter(Boolean);
  if (!partes.length) return 'Estudante';
  return partes.map(function(p) {
    return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
  }).join(' ');
}

/**
 * Menu contextual criado automaticamente na interface do Google Sheets
 */
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('🐍 PythonLab')
      .addItem('⚙️ Inicializar / Reparar Banco de Dados', 'setupDatabase')
      .addItem('🔍 Testar Conexão com a Planilha', 'testarConexaoPlanilha')
      .addItem('📋 Testar Estrutura de Avaliações', 'testarEstruturaAbasAvaliacoes')
      .addItem('🧪 Testar Ciclo de Vida de Avaliações (Estágio 2)', 'testarCicloVidaAvaliacao')
      .addItem('🚀 Testar Envio e Substituição (Estágio 3)', 'testarEnvioSubstituicaoAluno')
      .addItem('🧹 Redefinir Catálogo para Aulas Existentes (Apenas Aula 1.2)', 'limparCatalogoParaAulasExistentes')
      .addToUi();
  } catch (e) {
    // Modo Web App pode ignorar UI se executado sem contexto de contêiner
  }
}

/**
 * Redefine a aba Catalogo_Aulas deixando apenas as aulas reais que possuem arquivo HTML
 */
function limparCatalogoParaAulasExistentes() {
  var ss = getSpreadsheet();
  if (!ss) return;
  var sheetCatalogo = ss.getSheetByName(CONFIG.SHEET_CATALOG);
  if (!sheetCatalogo) return;
  
  sheetCatalogo.clear();
  var headersCatalogo = ['id_aula', 'modulo', 'ordem_modulo', 'titulo', 'arquivo_html', 'ordem', 'status', 'xp_base', 'tempo_estimado', 'descricao'];
  sheetCatalogo.appendRow(headersCatalogo);
  sheetCatalogo.getRange(1, 1, 1, headersCatalogo.length)
    .setBackground('#006398')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
    
  // Registra as aulas reais desenvolvidas no projeto: Aula 1.2 e Aula 1.3
  sheetCatalogo.appendRow([
    'aula_1_2',
    'Módulo 1: Fundamentos de CPython',
    1,
    'Variáveis, Tipos de Dados e Entrada/Saída',
    'Aula1_2',
    2,
    'publicado',
    150,
    '45 min',
    'Ciclo elementar entrada/processamento/saída, tipos primitivos, Stack vs Heap, teste de mesa e Totem de Bilhetagem.'
  ]);
  sheetCatalogo.appendRow([
    'aula_1_3',
    'Módulo 1: Fundamentos de CPython',
    1,
    'Planejamento de Algoritmos, Operadores Aritméticos e Precedência',
    'Aula1_3',
    3,
    'publicado',
    180,
    '50 min',
    'Decomposição de algoritmos, operadores aritméticos (//, %, **), atribuição composta, hierarquia de precedência e simulador orçamentário.'
  ]);
  sheetCatalogo.appendRow([
    'aula_1_4',
    'Módulo 1: Fundamentos de CPython',
    1,
    'Estruturas Condicionais, Indentação e Operadores Lógicos',
    'Aula1_4',
    4,
    'publicado',
    200,
    '55 min',
    'Desvios if-elif-else, indentação PEP 8, avaliação de curto-circuito, operadores and, or, not e Sistema de Seleção de Monitoria.'
  ]);
  sheetCatalogo.appendRow([
    'aula_1_5',
    'Módulo 1: Fundamentos de CPython',
    1,
    'Estruturas de Repetição (While, For), Sequências e Controle de Fluxo',
    'Aula1_5',
    5,
    'publicado',
    220,
    '65 min',
    'Laços while e for, gerador range(), modificadores break, continue e else, rastreio de pilha e Heap e Totem do Refeitório.'
  ]);
  sheetCatalogo.appendRow([
    'aula_2_1',
    'Módulo 2: Estruturas de Dados e Coleções',
    2,
    'Introdução a Coleções, Tuplas e Funções Embutidas',
    'Aula2_1',
    1,
    'publicado',
    250,
    '65 min',
    'Coleções de dados, estrutura de tuplas imutáveis, indexação e desempacotamento, funções nativas (len, sum, max, min, abs) e auditoria de hardware.'
  ]);
  sheetCatalogo.setFrozenRows(1);
  try {
    SpreadsheetApp.getUi().alert('Catálogo redefinido com sucesso! Aulas 1.2, 1.3, 1.4, 1.5 e 2.1 estão ativas na planilha.');
  } catch (e) {}
}

/**
 * Utilitário de inclusão modular no template (estilo PHP include)
 * Permite separar Style.html, Script.html, Dashboard.html, etc.
 */
function include(filename) {
  try {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  } catch (err) {
    Logger.log('Erro ao incluir parcial ' + filename + ': ' + err.message);
    return '<!-- Erro ao carregar parcial: ' + filename + ' -->';
  }
}

/**
 * Sincroniza automaticamente aulas obrigatórias e arquivos desenvolvidos na aba Catalogo_Aulas.
 * Evita a necessidade de inserção manual de linhas pelo usuário na planilha.
 */
function sincronizarAulasPadraoNoCatalogo(sheetCat) {
  if (!sheetCat) return;
  try {
    var data = sheetCat.getDataRange().getValues();
    var idsExistentes = {};
    for (var i = 1; i < data.length; i++) {
      var idRow = data[i][0] ? data[i][0].toString().trim() : '';
      if (idRow) {
        idsExistentes[idRow] = true;
        // Auto-correção automática de numeração na planilha caso esteja divergente do id_aula
        if (idRow === 'aula_1_2' && Number(data[i][5]) !== 2) {
          sheetCat.getRange(i + 1, 6).setValue(2);
        }
        if (idRow === 'aula_1_3' && Number(data[i][5]) !== 3) {
          sheetCat.getRange(i + 1, 6).setValue(3);
        }
        if (idRow === 'aula_1_4' && Number(data[i][5]) !== 4) {
          sheetCat.getRange(i + 1, 6).setValue(4);
        }
        if (idRow === 'aula_1_5' && Number(data[i][5]) !== 5) {
          sheetCat.getRange(i + 1, 6).setValue(5);
        }
        if (idRow === 'aula_2_1' && Number(data[i][5]) !== 1) {
          sheetCat.getRange(i + 1, 6).setValue(1);
        }
      }
    }

    var aulasObrigatorias = [
      [
        'aula_1_2',
        'Módulo 1: Fundamentos de CPython',
        1,
        'Variáveis, Tipos de Dados e Entrada/Saída',
        'Aula1_2',
        2,
        'publicado',
        150,
        '45 min',
        'Ciclo elementar entrada/processamento/saída, tipos primitivos, Stack vs Heap, teste de mesa e Totem de Bilhetagem.'
      ],
      [
        'aula_1_3',
        'Módulo 1: Fundamentos de CPython',
        1,
        'Planejamento de Algoritmos, Operadores Aritméticos e Precedência',
        'Aula1_3',
        3,
        'publicado',
        180,
        '50 min',
        'Decomposição de algoritmos, operadores aritméticos (//, %, **), atribuição composta, hierarquia de precedência e simulador orçamentário.'
      ],
      [
        'aula_1_4',
        'Módulo 1: Fundamentos de CPython',
        1,
        'Estruturas Condicionais, Indentação e Operadores Lógicos',
        'Aula1_4',
        4,
        'publicado',
        200,
        '55 min',
        'Desvios if-elif-else, indentação PEP 8, avaliação de curto-circuito, operadores and, or, not e Sistema de Seleção de Monitoria.'
      ],
      [
        'aula_1_5',
        'Módulo 1: Fundamentos de CPython',
        1,
        'Estruturas de Repetição (While, For), Sequências e Controle de Fluxo',
        'Aula1_5',
        5,
        'publicado',
        220,
        '65 min',
        'Laços while e for, gerador range(), modificadores break, continue e else, rastreio de pilha e Heap e Totem do Refeitório.'
      ],
      [
        'aula_2_1',
        'Módulo 2: Estruturas de Dados e Coleções',
        2,
        'Introdução a Coleções, Tuplas e Funções Embutidas',
        'Aula2_1',
        1,
        'publicado',
        250,
        '65 min',
        'Coleções de dados, estrutura de tuplas imutáveis, indexação e desempacotamento, funções nativas (len, sum, max, min, abs) e auditoria de hardware.'
      ]
    ];

    for (var j = 0; j < aulasObrigatorias.length; j++) {
      var idAlvo = aulasObrigatorias[j][0];
      if (!idsExistentes[idAlvo]) {
        sheetCat.appendRow(aulasObrigatorias[j]);
        idsExistentes[idAlvo] = true;
        Logger.log('Aula sincronizada automaticamente no catálogo: ' + idAlvo);
      }
    }
  } catch (e) {
    Logger.log('Erro ao sincronizar aulas padrão no catálogo: ' + e.message);
  }
}

/**
 * Obtém a planilha do projeto (Container-bound ou Standalone via SPREADSHEET_ID)
 */
function getSpreadsheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
    
    // Se o script for Standalone (criado em script.google.com), abre pelo ID configurado
    if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID.trim().length > 10) {
      return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID.trim());
    }
    
    return null;
  } catch (e) {
    Logger.log('Aviso ao obter planilha: ' + e.message);
    if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID.trim().length > 10) {
      try {
        return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID.trim());
      } catch (e2) {
        Logger.log('Erro ao abrir planilha por ID: ' + e2.message);
      }
    }
    return null;
  }
}

/**
 * ============================================================================
 * TESTE DE CONEXÃO & DIAGNÓSTICO DO BANCO DE DADOS (GOOGLE SHEETS)
 * ============================================================================
 * Função oficial para testar a comunicação entre o Apps Script e o Sheets.
 * Como usar:
 * 1. No editor do Apps Script, selecione "testarConexaoPlanilha" no menu de funções.
 * 2. Clique no botão "Executar" (Run).
 * 3. Veja os resultados detalhados no "Registro de execução" (Execution Log).
 * ============================================================================
 */
function testarConexaoPlanilha() {
  var relatorio = {
    sucesso: false,
    timestamp: new Date().toISOString(),
    ambiente: '',
    planilhaNome: '',
    planilhaId: '',
    planilhaUrl: '',
    abasEncontradas: [],
    abasAusentes: [],
    detalhesAbas: {},
    aulasNoCatalogo: 0,
    usuariosCadastrados: 0,
    erros: []
  };

  Logger.log('=====================================================');
  Logger.log('🔍 [PYTHONLAB] INICIANDO TESTE DE CONEXÃO COM A PLANILHA');
  Logger.log('=====================================================');

  try {
    var ss = null;
    
    // 1. Tenta obter planilha ativa (Container-bound)
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet();
      if (ss) {
        relatorio.ambiente = 'Container-bound (Script associado à planilha via Extensões > Apps Script)';
      }
    } catch (eActive) {
      relatorio.erros.push('getActiveSpreadsheet: ' + eActive.message);
    }

    // 2. Se for Standalone, tenta abrir pelo ID
    if (!ss && CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID.trim().length > 10) {
      try {
        ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID.trim());
        if (ss) {
          relatorio.ambiente = 'Standalone (Conectado via CONFIG.SPREADSHEET_ID)';
        }
      } catch (eId) {
        relatorio.erros.push('openById(' + CONFIG.SPREADSHEET_ID + '): ' + eId.message);
      }
    }

    if (!ss) {
      Logger.log('❌ FALHA CRÍTICA: Nenhuma planilha foi encontrada!');
      Logger.log('👉 CENÁRIO A: Se este script foi criado diretamente pelo script.google.com (Standalone):');
      Logger.log('   Copie o ID da sua planilha no Google Sheets e cole no topo do Code.gs:');
      Logger.log('   CONFIG.SPREADSHEET_ID = "SEU_ID_AQUI";');
      Logger.log('👉 CENÁRIO B: Abra sua planilha no Google Sheets e acesse:');
      Logger.log('   Extensões ➔ Apps Script (para associá-la nativamente).');
      relatorio.sucesso = false;
      relatorio.mensagem = 'Planilha não encontrada. Verifique se o script está associado ao Google Sheets ou preencha CONFIG.SPREADSHEET_ID no Code.gs.';
      return relatorio;
    }

    // Informações da Planilha
    relatorio.sucesso = true;
    relatorio.planilhaNome = ss.getName();
    relatorio.planilhaId = ss.getId();
    relatorio.planilhaUrl = ss.getUrl();

    Logger.log('✅ Planilha Conectada com Sucesso!');
    Logger.log('   📄 Nome do Arquivo: ' + relatorio.planilhaNome);
    Logger.log('   🆔 ID da Planilha:  ' + relatorio.planilhaId);
    Logger.log('   🌐 Modo de Vínculo: ' + relatorio.ambiente);
    Logger.log('   🔗 Link de Acesso:  ' + relatorio.planilhaUrl);

    // 3. Verificação das Abas Obrigatórias
    var abasObrigatorias = [
      CONFIG.SHEET_USERS,
      CONFIG.SHEET_PROGRESS,
      CONFIG.SHEET_CATALOG,
      CONFIG.SHEET_IMAGES,
      CONFIG.SHEET_AVALIACOES,
      CONFIG.SHEET_ENVIOS
    ];

    var sheets = ss.getSheets();
    var nomesAbas = sheets.map(function(s) { return s.getName(); });
    relatorio.abasEncontradas = nomesAbas;

    Logger.log('-----------------------------------------------------');
    Logger.log('📋 VERIFICAÇÃO DAS ABAS DO BANCO DE DADOS:');

    abasObrigatorias.forEach(function(nomeAba) {
      var sheet = ss.getSheetByName(nomeAba);
      if (sheet) {
        var numLinhas = sheet.getLastRow();
        var numColunas = sheet.getLastColumn();
        relatorio.detalhesAbas[nomeAba] = {
          linhas: numLinhas,
          colunas: numColunas,
          status: 'OK'
        };
        Logger.log('   ✅ Aba [' + nomeAba + ']: ' + numLinhas + ' linhas, ' + numColunas + ' colunas');
      } else {
        relatorio.abasAusentes.push(nomeAba);
        relatorio.detalhesAbas[nomeAba] = { status: 'AUSENTE' };
        Logger.log('   ⚠️ Aba [' + nomeAba + ']: NÃO ENCONTRADA (será criada no auto-reparo)');
      }
    });

    // 4. Auto-reparo automático se houver abas ausentes
    if (relatorio.abasAusentes.length > 0) {
      Logger.log('-----------------------------------------------------');
      Logger.log('⚙️ Inicializando auto-reparo do banco de dados (setupDatabase)...');
      setupDatabase(false);
      Logger.log('✅ Auto-reparo concluído! Todas as abas essenciais foram criadas.');
    }

    // 5. Teste de Leitura do Catálogo
    var sheetCat = ss.getSheetByName(CONFIG.SHEET_CATALOG);
    if (sheetCat && sheetCat.getLastRow() > 1) {
      var totalAulas = sheetCat.getLastRow() - 1;
      relatorio.aulasNoCatalogo = totalAulas;
      Logger.log('-----------------------------------------------------');
      Logger.log('📚 AULAS ATIVAS NO CATÁLOGO (' + totalAulas + ' aulas cadastradas):');
      var dadosAulas = sheetCat.getRange(2, 1, totalAulas, 4).getValues();
      dadosAulas.forEach(function(a, idx) {
        Logger.log('   ' + (idx + 1) + '. ID: ' + a[0] + ' | Módulo: ' + a[1] + ' | Título: ' + a[3]);
      });
    }

    // 6. Teste de Leitura de Usuários
    var sheetUsers = ss.getSheetByName(CONFIG.SHEET_USERS);
    if (sheetUsers && sheetUsers.getLastRow() > 1) {
      relatorio.usuariosCadastrados = sheetUsers.getLastRow() - 1;
      Logger.log('👥 USUÁRIOS CADASTRADOS: ' + relatorio.usuariosCadastrados + ' pessoas.');
    }

    Logger.log('=====================================================');
    Logger.log('🎉 DIAGNÓSTICO FINAL: CONEXÃO COM A PLANILHA 100% OPERACIONAL!');
    Logger.log('=====================================================');

    relatorio.mensagem = 'Conexão estabelecida com sucesso com a planilha "' + relatorio.planilhaNome + '". ' +
      relatorio.aulasNoCatalogo + ' aulas encontradas no catálogo.';
    return relatorio;

  } catch (err) {
    Logger.log('❌ ERRO NO TESTE DE CONEXÃO: ' + err.message);
    relatorio.sucesso = false;
    relatorio.erros.push(err.message);
    relatorio.mensagem = 'Erro ao conectar com a planilha: ' + err.message;
    return relatorio;
  }
}

/**
 * ============================================================================
 * TESTE ESPECÍFICO: ESTRUTURA DAS ABAS DE AVALIAÇÕES E PROVAS PRÁTICAS
 * ============================================================================
 * Como executar:
 * 1. No Google Apps Script, selecione a função "testarEstruturaAbasAvaliacoes".
 * 2. Clique em "Executar".
 * 3. Analise o "Registro de execução" (Execution Log).
 * ============================================================================
 */
function testarEstruturaAbasAvaliacoes() {
  var relatorio = {
    sucesso: false,
    timestamp: new Date().toISOString(),
    planilhaNome: '',
    abaAvaliacoes: { existe: false, colunasEsperadas: 6, colunasEncontradas: 0, cabecalhosOk: false, detalhes: [] },
    abaEnvios: { existe: false, colunasEsperadas: 10, colunasEncontradas: 0, cabecalhosOk: false, detalhes: [] },
    erros: [],
    mensagens: []
  };

  Logger.log('=====================================================');
  Logger.log('🔍 [PYTHONLAB] TESTANDO ESTRUTURA DAS ABAS DE AVALIAÇÕES');
  Logger.log('=====================================================');

  try {
    var ss = ensureDatabase();
    if (!ss) {
      throw new Error('Não foi possível conectar à planilha. Verifique se o script está associado ao Sheets ou preencha CONFIG.SPREADSHEET_ID.');
    }

    relatorio.planilhaNome = ss.getName();
    Logger.log('📄 Planilha: ' + relatorio.planilhaNome);

    // 1. Verificação da aba 'Avaliacoes'
    var colunasEsperadasAvaliacoes = [
      'id_avaliacao',
      'nome',
      'status',
      'data_criacao',
      'criado_por',
      'pasta_drive_id'
    ];
    var sheetEval = ss.getSheetByName(CONFIG.SHEET_AVALIACOES);
    if (!sheetEval) {
      relatorio.erros.push('Aba "' + CONFIG.SHEET_AVALIACOES + '" não existe.');
      Logger.log('❌ Aba [' + CONFIG.SHEET_AVALIACOES + ']: NÃO ENCONTRADA');
    } else {
      relatorio.abaAvaliacoes.existe = true;
      var lastColEval = sheetEval.getLastColumn();
      var lastRowEval = sheetEval.getLastRow();
      relatorio.abaAvaliacoes.colunasEncontradas = lastColEval;
      
      var cabecalhosEval = lastColEval > 0 && lastRowEval > 0 
        ? sheetEval.getRange(1, 1, 1, lastColEval).getValues()[0] 
        : [];
      
      relatorio.abaAvaliacoes.detalhes = cabecalhosEval;
      var evalOk = (cabecalhosEval.length >= colunasEsperadasAvaliacoes.length);
      for (var i = 0; i < colunasEsperadasAvaliacoes.length; i++) {
        if (!cabecalhosEval[i] || cabecalhosEval[i].toString().trim() !== colunasEsperadasAvaliacoes[i]) {
          evalOk = false;
          relatorio.erros.push('Aba ' + CONFIG.SHEET_AVALIACOES + ': Coluna ' + (i + 1) + ' deveria ser "' + colunasEsperadasAvaliacoes[i] + '", mas é "' + (cabecalhosEval[i] || 'VAZIA') + '".');
        }
      }
      relatorio.abaAvaliacoes.cabecalhosOk = evalOk;
      if (evalOk) {
        Logger.log('✅ Aba [' + CONFIG.SHEET_AVALIACOES + ']: 100% OK! Cabeçalhos verificados (' + cabecalhosEval.join(', ') + ')');
      } else {
        Logger.log('⚠️ Aba [' + CONFIG.SHEET_AVALIACOES + ']: Divergência nos cabeçalhos.');
        Logger.log('⚙️ Auto-reparando cabeçalhos da aba [' + CONFIG.SHEET_AVALIACOES + '] para o padrão oficial...');
        sheetEval.getRange(1, 1, 1, colunasEsperadasAvaliacoes.length).setValues([colunasEsperadasAvaliacoes]);
        sheetEval.getRange(1, 1, 1, colunasEsperadasAvaliacoes.length)
          .setBackground('#0284c7')
          .setFontColor('#ffffff')
          .setFontWeight('bold');
        sheetEval.setFrozenRows(1);
        relatorio.abaAvaliacoes.cabecalhosOk = true;
        Logger.log('✅ Cabeçalhos da aba [' + CONFIG.SHEET_AVALIACOES + '] reparados com sucesso!');
      }
    }

    // 2. Verificação da aba 'Envios_Avaliacoes'
    var colunasEsperadasEnvios = [
      'id_envio',
      'id_avaliacao',
      'nome_avaliacao',
      'email_aluno',
      'nome_aluno',
      'nome_arquivo_drive',
      'drive_file_id',
      'drive_file_url',
      'data_envio',
      'tamanho_bytes'
    ];
    var sheetEnv = ss.getSheetByName(CONFIG.SHEET_ENVIOS);
    if (!sheetEnv) {
      relatorio.erros.push('Aba "' + CONFIG.SHEET_ENVIOS + '" não existe.');
      Logger.log('❌ Aba [' + CONFIG.SHEET_ENVIOS + ']: NÃO ENCONTRADA');
    } else {
      relatorio.abaEnvios.existe = true;
      var lastColEnv = sheetEnv.getLastColumn();
      var lastRowEnv = sheetEnv.getLastRow();
      relatorio.abaEnvios.colunasEncontradas = lastColEnv;
      
      var cabecalhosEnv = lastColEnv > 0 && lastRowEnv > 0 
        ? sheetEnv.getRange(1, 1, 1, lastColEnv).getValues()[0] 
        : [];
      
      relatorio.abaEnvios.detalhes = cabecalhosEnv;
      var envOk = (cabecalhosEnv.length >= colunasEsperadasEnvios.length);
      for (var j = 0; j < colunasEsperadasEnvios.length; j++) {
        if (!cabecalhosEnv[j] || cabecalhosEnv[j].toString().trim() !== colunasEsperadasEnvios[j]) {
          envOk = false;
          relatorio.erros.push('Aba ' + CONFIG.SHEET_ENVIOS + ': Coluna ' + (j + 1) + ' deveria ser "' + colunasEsperadasEnvios[j] + '", mas é "' + (cabecalhosEnv[j] || 'VAZIA') + '".');
        }
      }
      if (envOk) {
        relatorio.abaEnvios.cabecalhosOk = true;
        Logger.log('✅ Aba [' + CONFIG.SHEET_ENVIOS + ']: 100% OK! Cabeçalhos verificados (' + cabecalhosEnv.join(', ') + ')');
      } else {
        Logger.log('⚠️ Aba [' + CONFIG.SHEET_ENVIOS + ']: Divergência detectada.');
        Logger.log('⚙️ Auto-reparando cabeçalhos da linha 1 de [' + CONFIG.SHEET_ENVIOS + '] para o padrão oficial da especificação...');
        sheetEnv.getRange(1, 1, 1, colunasEsperadasEnvios.length).setValues([colunasEsperadasEnvios]);
        sheetEnv.getRange(1, 1, 1, colunasEsperadasEnvios.length)
          .setBackground('#0d9488')
          .setFontColor('#ffffff')
          .setFontWeight('bold');
        sheetEnv.setFrozenRows(1);
        relatorio.abaEnvios.cabecalhosOk = true;
        relatorio.erros = []; // Divergência resolvida pelo auto-reparo
        Logger.log('✅ Cabeçalhos de [' + CONFIG.SHEET_ENVIOS + '] reparados com sucesso! Linha 1 agora contém os 10 campos oficiais: (' + colunasEsperadasEnvios.join(', ') + ')');
      }
    }

    relatorio.sucesso = (relatorio.abaAvaliacoes.existe && relatorio.abaAvaliacoes.cabecalhosOk && 
                         relatorio.abaEnvios.existe && relatorio.abaEnvios.cabecalhosOk);

    Logger.log('-----------------------------------------------------');
    if (relatorio.sucesso) {
      Logger.log('🎉 SUCESSO: Estrutura das duas abas de Avaliações validada e 100% operacional!');
    } else {
      Logger.log('⚠️ AVISO: Foram encontrados problemas na validação: ' + relatorio.erros.join(' | '));
    }
    Logger.log('=====================================================');

    return relatorio;
  } catch (err) {
    Logger.log('❌ ERRO AO TESTAR ESTRUTURA: ' + err.message);
    relatorio.sucesso = false;
    relatorio.erros.push(err.message);
    return relatorio;
  }
}

/**
 * Garante que a estrutura do banco de dados (abas, cabeçalhos e configurações)
 * exista na planilha. Se alguma aba não existir, ela é criada automaticamente no primeiro acesso.
 * Também sincroniza novas aulas publicadas na aba Catalogo_Aulas sem apagar dados existentes.
 */
function ensureDatabase() {
  try {
    var ss = getSpreadsheet();
    if (!ss) return null;
    
    var sheetUsers = ss.getSheetByName(CONFIG.SHEET_USERS);
    var sheetCat = ss.getSheetByName(CONFIG.SHEET_CATALOG);
    var sheetProg = ss.getSheetByName(CONFIG.SHEET_PROGRESS);
    var sheetImg = ss.getSheetByName(CONFIG.SHEET_IMAGES);
    var sheetEval = ss.getSheetByName(CONFIG.SHEET_AVALIACOES);
    var sheetEnv = ss.getSheetByName(CONFIG.SHEET_ENVIOS);
    var sheetSorteios = ss.getSheetByName(CONFIG.SHEET_SORTEIOS);
    
    // Se qualquer uma das abas essenciais não existir, provisiona automaticamente
    if (!sheetUsers || !sheetCat || !sheetProg || !sheetImg || !sheetEval || !sheetEnv || !sheetSorteios) {
      setupDatabase(false);
      sheetCat = ss.getSheetByName(CONFIG.SHEET_CATALOG);
    }
    
    // Auto-sincronização de catálogo para novas aulas (ex: Aula 1.3)
    if (sheetCat && sheetCat.getLastRow() > 0) {
      sincronizarAulasPadraoNoCatalogo(sheetCat);
    }
    
    return ss;
  } catch (e) {
    Logger.log('Aviso em ensureDatabase: ' + e.message);
    return null;
  }
}

/**
 * ============================================================================
 * SETUP & INICIALIZAÇÃO DO BANCO DE DADOS (GOOGLE SHEETS)
 * Cria e formata as abas necessárias com dados iniciais de demonstração.
 * É chamada automaticamente no primeiro acesso ou manualmente pelo menu.
 * ============================================================================
 */
function setupDatabase(forcarRecriacao) {
  var ss = getSpreadsheet();
  if (!ss) return;
  
  // 1. Aba Usuarios
  var sheetUsuarios = ss.getSheetByName(CONFIG.SHEET_USERS);
  if (!sheetUsuarios) {
    sheetUsuarios = ss.insertSheet(CONFIG.SHEET_USERS);
  }
  if (forcarRecriacao || sheetUsuarios.getLastRow() === 0) {
    sheetUsuarios.clear();
    var headersUsuarios = ['email', 'nome', 'perfil', 'data_cadastro', 'xp_total', 'ultimo_acesso'];
    sheetUsuarios.appendRow(headersUsuarios);
    sheetUsuarios.getRange(1, 1, 1, headersUsuarios.length)
      .setBackground('#1e3a8a')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    
    // Semente de usuários iniciais
    var userAtual = Session.getActiveUser().getEmail() || 'professor@exemplo.com';
    sheetUsuarios.appendRow([
      userAtual,
      'Educador Responsável',
      'professor',
      new Date().toISOString(),
      2500,
      new Date().toISOString()
    ]);
    sheetUsuarios.appendRow([
      'marina.costa@aluno.com',
      'Marina Costa',
      'aluno',
      new Date().toISOString(),
      480,
      new Date().toISOString()
    ]);
    sheetUsuarios.appendRow([
      'carlos.edu@aluno.com',
      'Carlos Eduardo',
      'aluno',
      new Date().toISOString(),
      290,
      new Date().toISOString()
    ]);
    sheetUsuarios.setFrozenRows(1);
  }
  
  // 2. Aba Catalogo_Aulas
  var sheetCatalogo = ss.getSheetByName(CONFIG.SHEET_CATALOG);
  if (!sheetCatalogo) {
    sheetCatalogo = ss.insertSheet(CONFIG.SHEET_CATALOG);
  }
  if (forcarRecriacao || sheetCatalogo.getLastRow() === 0) {
    sheetCatalogo.clear();
    var headersCatalogo = ['id_aula', 'modulo', 'ordem_modulo', 'titulo', 'arquivo_html', 'ordem', 'status', 'xp_base', 'tempo_estimado', 'descricao'];
    sheetCatalogo.appendRow(headersCatalogo);
    sheetCatalogo.getRange(1, 1, 1, headersCatalogo.length)
      .setBackground('#006398')
      .setFontColor('#ffffff')
      .setFontWeight('bold');

    // Semente do catálogo de aulas: Aulas reais desenvolvidas no projeto (Aula 1.2 e Aula 1.3)
    var aulasSementes = [
      [
        'aula_1_2',
        'Módulo 1: Fundamentos de CPython',
        1,
        'Variáveis, Tipos de Dados e Entrada/Saída',
        'Aula1_2',
        2,
        'publicado',
        150,
        '45 min',
        'Ciclo elementar entrada/processamento/saída, tipos primitivos, Stack vs Heap, teste de mesa e Totem de Bilhetagem.'
      ],
      [
        'aula_1_3',
        'Módulo 1: Fundamentos de CPython',
        1,
        'Planejamento de Algoritmos, Operadores Aritméticos e Precedência',
        'Aula1_3',
        3,
        'publicado',
        180,
        '50 min',
        'Decomposição de algoritmos, operadores aritméticos (//, %, **), atribuição composta, hierarquia de precedência e simulador orçamentário.'
      ],
      [
        'aula_1_4',
        'Módulo 1: Fundamentos de CPython',
        1,
        'Estruturas Condicionais, Indentação e Operadores Lógicos',
        'Aula1_4',
        4,
        'publicado',
        200,
        '55 min',
        'Desvios if-elif-else, indentação PEP 8, avaliação de curto-circuito, operadores and, or, not e Sistema de Seleção de Monitoria.'
      ],
      [
        'aula_1_5',
        'Módulo 1: Fundamentos de CPython',
        1,
        'Estruturas de Repetição (While, For), Sequências e Controle de Fluxo',
        'Aula1_5',
        5,
        'publicado',
        220,
        '65 min',
        'Laços while e for, gerador range(), modificadores break, continue e else, rastreio de pilha e Heap e Totem do Refeitório.'
      ],
      [
        'aula_2_1',
        'Módulo 2: Estruturas de Dados e Coleções',
        2,
        'Introdução a Coleções, Tuplas e Funções Embutidas',
        'Aula2_1',
        1,
        'publicado',
        250,
        '65 min',
        'Coleções de dados, estrutura de tuplas imutáveis, indexação e desempacotamento, funções nativas (len, sum, max, min, abs) e auditoria de hardware.'
      ]
    ];
    for (var i = 0; i < aulasSementes.length; i++) {
      sheetCatalogo.appendRow(aulasSementes[i]);
    }
    sheetCatalogo.setFrozenRows(1);
  }

  // 3. Aba Progresso
  var sheetProgresso = ss.getSheetByName(CONFIG.SHEET_PROGRESS);
  if (!sheetProgresso) {
    sheetProgresso = ss.insertSheet(CONFIG.SHEET_PROGRESS);
  }
  if (forcarRecriacao || sheetProgresso.getLastRow() === 0) {
    sheetProgresso.clear();
    var headersProgresso = [
      'id_registro',
      'email_aluno',
      'id_aula',
      'id_topico',
      'status',
      'exercicio_resolvido_visto',
      'exercicio_proposto_concluido',
      'desafio_concluido',
      'xp_obtido',
      'data_conclusao',
      'anotacao_duvida'
    ];
    sheetProgresso.appendRow(headersProgresso);
    sheetProgresso.getRange(1, 1, 1, headersProgresso.length)
      .setBackground('#10b981')
      .setFontColor('#ffffff')
      .setFontWeight('bold');

    // Semente de progresso inicial
    sheetProgresso.appendRow([
      'marina.costa@aluno.com_aula_1_1_tipos',
      'marina.costa@aluno.com',
      'aula_1_1',
      'tipos_cpython',
      'concluido',
      true,
      true,
      true,
      100,
      new Date().toISOString(),
      ''
    ]);
    sheetProgresso.appendRow([
      'marina.costa@aluno.com_aula_1_2_memoria',
      'marina.costa@aluno.com',
      'aula_1_2',
      'stack_heap_casting',
      'concluido',
      true,
      true,
      false,
      80,
      new Date().toISOString(),
      'Dúvida sobre a divisão inteira // vs resto %'
    ]);
    sheetProgresso.setFrozenRows(1);
  }

  // 4. Aba Imagens_Exercicios
  var sheetImagens = ss.getSheetByName(CONFIG.SHEET_IMAGES);
  if (!sheetImagens) {
    sheetImagens = ss.insertSheet(CONFIG.SHEET_IMAGES);
  }
  if (forcarRecriacao || sheetImagens.getLastRow() === 0) {
    sheetImagens.clear();
    var headersImagens = [
      'id_imagem',
      'id_aula',
      'id_exercicio',
      'drive_file_id',
      'url_visualizacao',
      'legenda',
      'uploaded_by',
      'data_upload'
    ];
    sheetImagens.appendRow(headersImagens);
    sheetImagens.getRange(1, 1, 1, headersImagens.length)
      .setBackground('#7c3aed')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    sheetImagens.setFrozenRows(1);
  }

  // 5. Aba Avaliacoes
  var sheetAvaliacoes = ss.getSheetByName(CONFIG.SHEET_AVALIACOES);
  if (!sheetAvaliacoes) {
    sheetAvaliacoes = ss.insertSheet(CONFIG.SHEET_AVALIACOES);
  }
  if (forcarRecriacao || sheetAvaliacoes.getLastRow() === 0) {
    sheetAvaliacoes.clear();
    var headersAvaliacoes = [
      'id_avaliacao',
      'nome',
      'status',
      'data_criacao',
      'criado_por',
      'pasta_drive_id'
    ];
    sheetAvaliacoes.appendRow(headersAvaliacoes);
    sheetAvaliacoes.getRange(1, 1, 1, headersAvaliacoes.length)
      .setBackground('#0284c7')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    sheetAvaliacoes.setFrozenRows(1);
  }

  // 6. Aba Envios_Avaliacoes
  var sheetEnvios = ss.getSheetByName(CONFIG.SHEET_ENVIOS);
  if (!sheetEnvios) {
    sheetEnvios = ss.insertSheet(CONFIG.SHEET_ENVIOS);
  }
  if (forcarRecriacao || sheetEnvios.getLastRow() === 0) {
    sheetEnvios.clear();
    var headersEnvios = [
      'id_envio',
      'id_avaliacao',
      'nome_avaliacao',
      'email_aluno',
      'nome_aluno',
      'nome_arquivo_drive',
      'drive_file_id',
      'drive_file_url',
      'data_envio',
      'tamanho_bytes'
    ];
    sheetEnvios.appendRow(headersEnvios);
    sheetEnvios.getRange(1, 1, 1, headersEnvios.length)
      .setBackground('#0d9488')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    sheetEnvios.setFrozenRows(1);
  }

  // 7. Aba Sorteios_Historico
  var sheetSorteios = ss.getSheetByName(CONFIG.SHEET_SORTEIOS);
  if (!sheetSorteios) {
    sheetSorteios = ss.insertSheet(CONFIG.SHEET_SORTEIOS);
  }
  if (forcarRecriacao || sheetSorteios.getLastRow() === 0) {
    sheetSorteios.clear();
    var headersSorteios = [
      'id_sorteio',
      'email_aluno',
      'nome_aluno',
      'data_sorteio',
      'criado_por',
      'status_participacao'
    ];
    sheetSorteios.appendRow(headersSorteios);
    sheetSorteios.getRange(1, 1, 1, headersSorteios.length)
      .setBackground('#d97706')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    sheetSorteios.setFrozenRows(1);
  }

  // Remove aba padrão vazia ('Página1' ou 'Sheet1') se houver outras abas
  var defaultSheet = ss.getSheetByName('Página1') || ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1 && defaultSheet.getLastRow() === 0) {
    try {
      ss.deleteSheet(defaultSheet);
    } catch (e) {
      // Ignora se não for possível deletar
    }
  }

  return 'Banco de dados inicializado com sucesso em ' + ss.getName();
}

/**
 * ============================================================================
 * API RPC (SERVIÇOS INVOCADOS VIA google.script.run NO CLIENTE)
 * ============================================================================
 */

/**
 * Obtém os dados completos da sessão do usuário ativo:
 * - Identidade e papel (visitante, aluno, professor)
 * - Pontuação XP acumulada
 * - Lista de tópicos concluídos
 * - Permissões operacionais
 */
function getUserSessionData(emailParam) {
  try {
    var activeSessionEmail = '';
    try {
      activeSessionEmail = Session.getActiveUser().getEmail() || '';
    } catch(eSession) {
      Logger.log('Aviso ao consultar Session.getActiveUser: ' + eSession.message);
    }

    // A sessão Google da conta institucional é a prioridade máxima
    var email = (activeSessionEmail || (emailParam ? emailParam.toString().trim() : '')).toLowerCase();
    
    // Caso de Visitante sem e-mail ou não autenticado
    if (!email) {
      return {
        autenticado: false,
        email: null,
        nome: 'Visitante',
        perfil: 'visitante',
        xpTotal: 0,
        progressoIds: [],
        duvidasPendentes: [],
        ultimaAulaAcessada: 'aula_1_2',
        podeGravar: false,
        isProfessor: false
      };
    }
    
    var ss = ensureDatabase();
    var sheetUsers = ss ? ss.getSheetByName(CONFIG.SHEET_USERS) : null;
    var userData = null;
    var emailLower = email.toLowerCase();
    var isKnownTeacher = (
      emailLower.indexOf('@prof.ce.gov.br') !== -1 ||
      emailLower.indexOf('neylor') !== -1 ||
      emailLower.indexOf('prof') !== -1 ||
      emailLower.indexOf('admin') !== -1
    );
    
    if (sheetUsers) {
      var rows = sheetUsers.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        var rowEmail = rows[i][0] ? rows[i][0].toString().trim().toLowerCase() : '';
        if (rowEmail && rowEmail === emailLower) {
          var rowPerfil = rows[i][2] ? rows[i][2].toString().trim().toLowerCase() : 'aluno';
          // Se for conta de professor (@prof.ce.gov.br ou Neylor), garante perfil de professor
          if (isKnownTeacher && rowPerfil !== 'professor') {
            rowPerfil = 'professor';
            try {
              sheetUsers.getRange(i + 1, 3).setValue('professor');
            } catch(e) {}
          }
          var nomeBanco = rows[i][1] ? rows[i][1].toString().trim() : '';
          if (isKnownTeacher && (!nomeBanco || nomeBanco.toLowerCase().indexOf('aluno') !== -1)) {
            nomeBanco = 'Professor Neylor FM';
          }
          userData = {
            rowIndex: i + 1,
            email: rows[i][0].toString().trim(),
            nome: nomeBanco || (isKnownTeacher ? 'Professor Neylor FM' : formatarNomeDeEmail(email)),
            perfil: rowPerfil,
            dataCadastro: rows[i][3] || new Date().toISOString(),
            xpTotal: Number(rows[i][4]) || (isKnownTeacher ? 2500 : 0)
          };
          // Atualiza último acesso
          try {
            sheetUsers.getRange(i + 1, 6).setValue(new Date().toISOString());
          } catch(e) {}
          break;
        }
      }
    }
    
    // Se o usuário possui e-mail institucional mas ainda não consta na planilha, auto-cadastra com nome formatado
    if (!userData && sheetUsers) {
      var nomeExtraido = isKnownTeacher ? 'Professor Neylor FM' : formatarNomeDeEmail(email);
      var perfilNovo = isKnownTeacher ? 'professor' : 'aluno';
      var xpNovo = isKnownTeacher ? 2500 : 0;
      var agora = new Date().toISOString();
      
      try {
        sheetUsers.appendRow([email, nomeExtraido, perfilNovo, agora, xpNovo, agora]);
      } catch(e) {}

      userData = {
        email: email,
        nome: nomeExtraido,
        perfil: perfilNovo,
        dataCadastro: agora,
        xpTotal: xpNovo
      };
    }
    
    // Carrega o histórico de progresso do estudante, exercícios concluídos e dúvidas pendentes
    var progressoIds = [];
    var exerciciosConcluidos = [];
    var duvidasPendentes = [];
    var ultimaAula = 'aula_1_2';
    var ultimoPontoParada = { idAula: 'aula_1_2', idExercicio: null, data: '' };
    var maiorTimestampParada = '';
    var sheetProg = ss.getSheetByName(CONFIG.SHEET_PROGRESS);
    
    if (sheetProg && userData) {
      var pRows = sheetProg.getDataRange().getValues();
      for (var j = 1; j < pRows.length; j++) {
        if (pRows[j][1] && pRows[j][1].toString().trim().toLowerCase() === email.trim().toLowerCase()) {
          var pStatus = pRows[j][4];
          var pAula = pRows[j][2];
          var pTopico = pRows[j][3];
          var pDuvida = pRows[j][10] || '';
          var pData = pRows[j][9] ? pRows[j][9].toString() : '';
          
          if (pStatus === 'concluido') {
            if (pTopico === 'geral' || pTopico === 'memoria_casting' || pTopico === 'aula_completa') {
              if (progressoIds.indexOf(pAula) === -1) {
                progressoIds.push(pAula);
              }
            } else {
              exerciciosConcluidos.push(pAula + ':' + pTopico);
            }
          } else if (pStatus === 'com_duvidas') {
            duvidasPendentes.push({
              idAula: pAula,
              idTopico: pTopico,
              duvida: pDuvida,
              data: pData
            });
          }

          // Rastreia o ponto de parada ou atividade mais recente
          if (pStatus === 'em_andamento' || pStatus === 'concluido') {
            if (!maiorTimestampParada || pData >= maiorTimestampParada) {
              maiorTimestampParada = pData;
              ultimaAula = pAula;
              var idExResolvido = (pTopico !== 'geral' && pTopico !== 'memoria_casting' && pTopico !== 'aula_completa') ? (pTopico === 'ponto_parada' ? pDuvida : pTopico) : null;
              ultimoPontoParada = {
                idAula: pAula,
                idExercicio: idExResolvido,
                status: pStatus,
                data: pData
              };
            }
          }
        }
      }
    }
    
    return {
      autenticado: true,
      email: userData.email,
      nome: userData.nome,
      perfil: userData.perfil,
      xpTotal: userData.xpTotal,
      progressoIds: progressoIds,
      exerciciosConcluidos: exerciciosConcluidos,
      duvidasPendentes: duvidasPendentes,
      ultimaAulaAcessada: ultimaAula,
      ultimoPontoParada: ultimoPontoParada,
      podeGravar: (userData.perfil === 'aluno' || userData.perfil === 'professor'),
      isProfessor: (userData.perfil === 'professor')
    };
  } catch (err) {
    Logger.log('Erro em getUserSessionData: ' + err.message);
    return {
      autenticado: false,
      email: null,
      nome: 'Visitante (Fallback)',
      perfil: 'visitante',
      xpTotal: 0,
      progressoIds: [],
      exerciciosConcluidos: [],
      duvidasPendentes: [],
      ultimaAulaAcessada: 'aula_1_2',
      ultimoPontoParada: null,
      podeGravar: false,
      isProfessor: false,
      erro: err.message
    };
  }
}

/**
 * Retorna o catálogo de aulas estruturado hierarquicamente por módulo
 */
function getCatalogoAulas(emailParam) {
  try {
    var ss = ensureDatabase();
    var sheet = ss ? ss.getSheetByName(CONFIG.SHEET_CATALOG) : null;
    if (!sheet) return [];
    
    // Auto-sincronização de catálogo para novas aulas (ex: Aula 1.3)
    sincronizarAulasPadraoNoCatalogo(sheet);

    var data = sheet.getDataRange().getValues();
    var userSession = getUserSessionData(emailParam);
    var isProfessor = userSession.isProfessor;
    
    var catalog = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var status = row[6] || 'publicado';
      
      // Aulas em rascunho são visíveis apenas para perfil professor
      if (status === 'rascunho' && !isProfessor) {
        continue;
      }
      
      catalog.push({
        id_aula: row[0],
        modulo: row[1],
        ordem_modulo: Number(row[2]) || 1,
        titulo: row[3],
        arquivo_html: row[4],
        ordem: Number(row[5]) || 1,
        status: status,
        xp_base: Number(row[7]) || 100,
        tempo_estimado: row[8] || '15 min',
        descricao: row[9] || ''
      });
    }
    
    // Ordena por ordem de módulo e ordem de aula
    catalog.sort(function(a, b) {
      if (a.ordem_modulo !== b.ordem_modulo) {
        return a.ordem_modulo - b.ordem_modulo;
      }
      return a.ordem - b.ordem;
    });
    
    return catalog;
  } catch (err) {
    Logger.log('Erro em getCatalogoAulas: ' + err.message);
    return [];
  }
}

/**
 * Carrega dinamicamente o arquivo de aula solicitado (Arquitetura Híbrida)
 */
function carregarConteudoAula(idAula) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_CATALOG);
    if (!sheet) throw new Error('Catálogo de aulas não configurado.');
    
    var rows = sheet.getDataRange().getValues();
    var arquivoHtmlAlvo = null;
    var tituloAula = '';
    
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === idAula) {
        arquivoHtmlAlvo = rows[i][4];
        tituloAula = rows[i][3];
        break;
      }
    }
    
    // Fallback de segurança para aulas padrão
    if (!arquivoHtmlAlvo) {
      var mapaFallback = {
        'aula_1_2': 'Aula1_2',
        'aula_1_3': 'Aula1_3',
        'aula_1_4': 'Aula1_4',
        'aula_1_5': 'Aula1_5',
        'aula_2_1': 'Aula2_1'
      };
      arquivoHtmlAlvo = mapaFallback[idAula];
    }
    
    if (!arquivoHtmlAlvo) {
      return {
        sucesso: false,
        mensagem: 'A aula "' + idAula + '" não está registrada na aba Catalogo_Aulas.'
      };
    }
    
    var htmlContent = '';
    try {
      htmlContent = HtmlService.createHtmlOutputFromFile(arquivoHtmlAlvo).getContent();
    } catch (e) {
      return {
        sucesso: false,
        mensagem: 'O arquivo "' + arquivoHtmlAlvo + '.html" ainda não foi criado no projeto. Crie o arquivo antes de adicioná-lo ao catálogo.'
      };
    }
    
    return {
      sucesso: true,
      idAula: idAula,
      titulo: tituloAula,
      html: htmlContent
    };
  } catch (err) {
    Logger.log('Erro em carregarConteudoAula: ' + err.message);
    return {
      sucesso: false,
      mensagem: 'Não foi possível carregar a aula: ' + err.message
    };
  }
}

/**
 * Salva ou atualiza o progresso do estudante na aba Progresso e incrementa o XP
 */
function salvarProgresso(idAula, idTopico, status, exResolvido, exProposto, desafio, xpGanho, anotacaoDuvida, emailParam) {
  try {
    var email = (emailParam ? emailParam.toString().trim() : '') || Session.getActiveUser().getEmail();
    
    // Regra de Negócio: Visitante não persiste dados na planilha
    if (!email) {
      return {
        sucesso: false,
        isVisitante: true,
        mensagem: 'Modo visitante ativo. Conecte seu perfil ou informe seu e-mail para salvar seu progresso e acumular XP!'
      };
    }
    
    var ss = ensureDatabase();
    var sheetProg = ss ? ss.getSheetByName(CONFIG.SHEET_PROGRESS) : null;
    var sheetUsers = ss ? ss.getSheetByName(CONFIG.SHEET_USERS) : null;
    
    if (!sheetProg || !sheetUsers) {
      throw new Error('Abas da planilha não encontradas. Execute setupDatabase().');
    }
    
    var idRegistro = email + '_' + idAula + '_' + (idTopico || 'geral');
    var rowsProg = sheetProg.getDataRange().getValues();
    var foundIndex = -1;
    
    for (var i = 1; i < rowsProg.length; i++) {
      if (rowsProg[i][0] === idRegistro) {
        foundIndex = i + 1;
        break;
      }
    }
    
    var agora = new Date().toISOString();
    var pontosComputados = Number(xpGanho) || 0;
    var textoDuvida = anotacaoDuvida || '';
    
    if (foundIndex > 0) {
      sheetProg.getRange(foundIndex, 5, 1, 7).setValues([[
        status || 'concluido',
        Boolean(exResolvido),
        Boolean(exProposto),
        Boolean(desafio),
        pontosComputados,
        agora,
        textoDuvida
      ]]);
    } else {
      sheetProg.appendRow([
        idRegistro,
        email,
        idAula,
        idTopico || 'geral',
        status || 'concluido',
        Boolean(exResolvido),
        Boolean(exProposto),
        Boolean(desafio),
        pontosComputados,
        agora,
        textoDuvida
      ]);
    }
    
    // Atualiza o total de XP na aba Usuarios
    var rowsUsers = sheetUsers.getDataRange().getValues();
    for (var u = 1; u < rowsUsers.length; u++) {
      var rowUserEmail = rowsUsers[u][0] ? rowsUsers[u][0].toString().trim().toLowerCase() : '';
      if (rowUserEmail && rowUserEmail === email.trim().toLowerCase()) {
        var xpAtual = Number(rowsUsers[u][4]) || 0;
        var novoXp = Math.max(0, xpAtual + pontosComputados);
        sheetUsers.getRange(u + 1, 5).setValue(novoXp);
        sheetUsers.getRange(u + 1, 6).setValue(agora);
        break;
      }
    }
    
    return {
      sucesso: true,
      xpGanho: pontosComputados,
      timestamp: agora
    };
  } catch (err) {
    Logger.log('Erro em salvarProgresso: ' + err.message);
    return {
      sucesso: false,
      mensagem: err.message
    };
  }
}

/**
 * Painel Administrativo do Professor:
 * Retorna visão consolidada da turma com taxas de conclusão e engajamento.
 */
function obterRelatorioTurma(emailParam) {
  try {
    var session = getUserSessionData(emailParam);
    if (!session.isProfessor) {
      return {
        sucesso: false,
        mensagem: 'Acesso restrito: Esta funcionalidade exige credenciais de Professor.'
      };
    }
    
    var ss = ensureDatabase();
    var sheetUsers = ss ? ss.getSheetByName(CONFIG.SHEET_USERS) : null;
    var sheetProg = ss ? ss.getSheetByName(CONFIG.SHEET_PROGRESS) : null;
    var sheetCat = ss ? ss.getSheetByName(CONFIG.SHEET_CATALOG) : null;
    
    var totalAulas = 0;
    if (sheetCat) {
      totalAulas = Math.max(1, sheetCat.getLastRow() - 1);
    }
    
    var listaAlunos = [];
    if (sheetUsers) {
      var uRows = sheetUsers.getDataRange().getValues();
      for (var i = 1; i < uRows.length; i++) {
        var rowPerfil = (uRows[i][2] || '').toString().trim().toLowerCase();
        if (rowPerfil === 'aluno') {
          var userMail = (uRows[i][0] || '').toString().trim();
          listaAlunos.push({
            email: userMail,
            nome: (uRows[i][1] ? uRows[i][1].toString().trim() : '') || (userMail ? userMail.split('@')[0] : 'Aluno'),
            dataCadastro: uRows[i][3] || '',
            xpTotal: Number(uRows[i][4]) || 0,
            ultimoAcesso: uRows[i][5] || uRows[i][3] || '',
            aulasConcluidas: 0
          });
        }
      }
    }
    
    // Computa progresso individual
    // Mapeia por aluno: conjunto de aulas distintas concluídas e total de atividades realizadas
    var progressoMap = {}; // email -> { aulas: {}, totalAtividades: 0 }
    
    if (sheetProg) {
      var pRows = sheetProg.getDataRange().getValues();
      for (var p = 1; p < pRows.length; p++) {
        if (pRows[p][4] === 'concluido') {
          var emailAluno = (pRows[p][1] || '').toString().trim().toLowerCase();
          var idAula = (pRows[p][2] || '').toString().trim();
          var idTopico = (pRows[p][3] || '').toString().trim();
          
          if (!progressoMap[emailAluno]) {
            progressoMap[emailAluno] = { aulas: {}, totalAtividades: 0 };
          }
          progressoMap[emailAluno].totalAtividades++;
          
          // Conta como aula concluída se for o registro global da aula ou desafio final
          if (idTopico === 'geral' || idTopico === 'memoria_casting' || idTopico === 'aula_completa' || idTopico.indexOf('desafio') > -1) {
            progressoMap[emailAluno].aulas[idAula] = true;
          }
        }
      }
    }
    
    for (var a = 0; a < listaAlunos.length; a++) {
      var mailKey = listaAlunos[a].email.toLowerCase();
      var dadosProg = progressoMap[mailKey];
      if (dadosProg) {
        var numAulas = Object.keys(dadosProg.aulas).length;
        if (numAulas === 0 && dadosProg.totalAtividades > 0) {
          numAulas = Math.min(totalAulas, Math.ceil(dadosProg.totalAtividades / 4));
        }
        listaAlunos[a].aulasConcluidas = Math.min(totalAulas, numAulas);
        listaAlunos[a].totalAtividades = dadosProg.totalAtividades;
      } else {
        listaAlunos[a].aulasConcluidas = 0;
        listaAlunos[a].totalAtividades = 0;
      }
    }
    
    return {
      sucesso: true,
      totalAulasPublicadas: totalAulas,
      totalAlunos: listaAlunos.length,
      alunos: listaAlunos
    };
  } catch (err) {
    Logger.log('Erro em obterRelatorioTurma: ' + err.message);
    return {
      sucesso: false,
      mensagem: err.message
    };
  }
}

/**
 * ============================================================================
 * GOOGLE DRIVE — GESTÃO DA PASTA 'imagens' E UPLOAD PELO PROFESSOR
 * ============================================================================
 */

/**
 * Localiza ou cria dinamicamente a pasta 'imagens' dentro do mesmo diretório pai
 * onde reside a planilha ativa vinculada ao projeto.
 */
function obterOuCriarPastaImagens() {
  try {
    var ss = getSpreadsheet();
    var planilhaId = ss.getId();
    var arquivoPlanilha = DriveApp.getFileById(planilhaId);
    var pais = arquivoPlanilha.getParents();
    var pastaPai = pais.hasNext() ? pais.next() : DriveApp.getRootFolder();
    
    var pastas = pastaPai.getFoldersByName('imagens');
    if (pastas.hasNext()) {
      return pastas.next();
    } else {
      var novaPasta = pastaPai.createFolder('imagens');
      try {
        novaPasta.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (eShared) {
        Logger.log('Aviso ao ajustar compartilhamento da pasta imagens: ' + eShared.message);
      }
      return novaPasta;
    }
  } catch (err) {
    Logger.log('Erro em obterOuCriarPastaImagens: ' + err.message);
    throw new Error('Falha ao acessar pasta no Google Drive: ' + err.message);
  }
}

/**
 * Retorna o mapa de imagens didáticas cadastradas para uma aula específica.
 * Invocado pelo frontend ao abrir uma lição.
 */
function obterImagensAula(idAula) {
  try {
    var ss = ensureDatabase();
    var sheet = ss ? ss.getSheetByName(CONFIG.SHEET_IMAGES) : null;
    var mapa = {};
    
    if (sheet && sheet.getLastRow() > 1) {
      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        var rowAula = (rows[i][1] || '').toString().trim();
        if (rowAula === idAula) {
          var idEx = (rows[i][2] || '').toString().trim();
          mapa[idEx] = {
            idImagem: rows[i][0] || '',
            idAula: rowAula,
            idExercicio: idEx,
            driveFileId: rows[i][3] || '',
            urlVisualizacao: rows[i][4] || '',
            legenda: rows[i][5] || '',
            uploadedBy: rows[i][6] || '',
            dataUpload: rows[i][7] || ''
          };
        }
      }
    }
    
    return {
      sucesso: true,
      imagens: mapa
    };
  } catch (err) {
    Logger.log('Erro em obterImagensAula: ' + err.message);
    return {
      sucesso: false,
      mensagem: err.message,
      imagens: {}
    };
  }
}

/**
 * Salva uma nova imagem didática anexada pelo professor no Google Drive
 * e registra seus metadados na aba 'Imagens_Exercicios'.
 */
function salvarImagemExercicio(params) {
  try {
    if (!params || !params.idAula || !params.idExercicio || !params.base64Data) {
      return { sucesso: false, mensagem: 'Parâmetros incompletos para upload.' };
    }
    
    var session = getUserSessionData(params.emailParam);
    if (!session.isProfessor) {
      return {
        sucesso: false,
        mensagem: 'Apenas usuários com perfil de Professor podem anexar imagens aos exercícios.'
      };
    }
    
    var pasta = obterOuCriarPastaImagens();
    
    // Processa o conteúdo base64
    var rawBase64 = params.base64Data;
    if (rawBase64.indexOf(',') > -1) {
      rawBase64 = rawBase64.split(',')[1];
    }
    var mimeType = params.mimeType || 'image/png';
    var ext = mimeType.indexOf('jpeg') > -1 || mimeType.indexOf('jpg') > -1 ? 'jpg' : 'png';
    var nomeArquivo = 'resolvido_' + params.idAula + '_' + params.idExercicio + '_' + new Date().getTime() + '.' + ext;
    
    var bytes = Utilities.base64Decode(rawBase64);
    var blob = Utilities.newBlob(bytes, mimeType, nomeArquivo);
    var arquivoDrive = pasta.createFile(blob);
    
    try {
      arquivoDrive.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (eShare) {
      Logger.log('Aviso ao ajustar permissão do arquivo: ' + eShare.message);
    }
    
    var fileId = arquivoDrive.getId();
    // Gera URL de visualização direta compatível com exibição web
    var urlVisualizacao = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1200';
    var legenda = (params.legenda || '').toString().trim();
    var agora = new Date().toISOString();
    var idImagem = 'img_' + params.idAula + '_' + params.idExercicio;
    
    // Atualiza ou insere na aba Imagens_Exercicios
    var ss = ensureDatabase();
    var sheet = ss.getSheetByName(CONFIG.SHEET_IMAGES);
    if (!sheet) {
      setupDatabase(false);
      sheet = ss.getSheetByName(CONFIG.SHEET_IMAGES);
    }
    
    var rows = sheet.getDataRange().getValues();
    var linhaExistente = -1;
    for (var r = 1; r < rows.length; r++) {
      if (rows[r][1] === params.idAula && rows[r][2] === params.idExercicio) {
        linhaExistente = r + 1;
        break;
      }
    }
    
    if (linhaExistente > 0) {
      sheet.getRange(linhaExistente, 1, 1, 8).setValues([[
        idImagem,
        params.idAula,
        params.idExercicio,
        fileId,
        urlVisualizacao,
        legenda,
        session.email || 'professor',
        agora
      ]]);
    } else {
      sheet.appendRow([
        idImagem,
        params.idAula,
        params.idExercicio,
        fileId,
        urlVisualizacao,
        legenda,
        session.email || 'professor',
        agora
      ]);
    }
    
    return {
      sucesso: true,
      imagem: {
        idImagem: idImagem,
        idAula: params.idAula,
        idExercicio: params.idExercicio,
        driveFileId: fileId,
        urlVisualizacao: urlVisualizacao,
        legenda: legenda,
        uploadedBy: session.email,
        dataUpload: agora
      }
    };
  } catch (err) {
    Logger.log('Erro em salvarImagemExercicio: ' + err.message);
    return {
      sucesso: false,
      mensagem: err.message
    };
  }
}

/**
 * Remove a imagem de um exercício resolvido (solicitado pelo professor).
 */
function removerImagemExercicio(params) {
  try {
    if (!params || !params.idAula || !params.idExercicio) {
      return { sucesso: false, mensagem: 'Parâmetros incompletos.' };
    }
    
    var session = getUserSessionData(params.emailParam);
    if (!session.isProfessor) {
      return {
        sucesso: false,
        mensagem: 'Apenas usuários com perfil de Professor podem remover imagens.'
      };
    }
    
    var ss = ensureDatabase();
    var sheet = ss.getSheetByName(CONFIG.SHEET_IMAGES);
    if (!sheet) return { sucesso: true };
    
    var rows = sheet.getDataRange().getValues();
    for (var r = 1; r < rows.length; r++) {
      if (rows[r][1] === params.idAula && rows[r][2] === params.idExercicio) {
        var fileId = rows[r][3];
        if (fileId) {
          try {
            DriveApp.getFileById(fileId).setTrashed(true);
          } catch (eTrash) {
            Logger.log('Aviso ao descartar arquivo no Drive: ' + eTrash.message);
          }
        }
        sheet.deleteRow(r + 1);
        break;
      }
    }
    
    return { sucesso: true };
  } catch (err) {
    Logger.log('Erro em removerImagemExercicio: ' + err.message);
    return {
      sucesso: false,
      mensagem: err.message
    };
  }
}

/**
 * ============================================================================
 * GOOGLE DRIVE & GESTÃO DE AVALIAÇÕES / PROVAS PRÁTICAS (ESTÁGIO 2)
 * ============================================================================
 */

/**
 * Localiza ou cria a pasta raiz 'Avaliacoes' dentro do diretório onde reside a planilha.
 */
function obterOuCriarPastaRaizAvaliacoes() {
  try {
    var ss = getSpreadsheet();
    if (!ss) throw new Error('Planilha não encontrada.');
    var planilhaId = ss.getId();
    var arquivoPlanilha = DriveApp.getFileById(planilhaId);
    var pais = arquivoPlanilha.getParents();
    var pastaPai = pais.hasNext() ? pais.next() : DriveApp.getRootFolder();
    
    var pastas = pastaPai.getFoldersByName('Avaliacoes');
    if (pastas.hasNext()) {
      return pastas.next();
    } else {
      var novaPasta = pastaPai.createFolder('Avaliacoes');
      return novaPasta;
    }
  } catch (err) {
    Logger.log('Erro em obterOuCriarPastaRaizAvaliacoes: ' + err.message);
    throw new Error('Falha ao acessar pasta raiz Avaliacoes no Google Drive: ' + err.message);
  }
}

/**
 * Cria ou recupera a subpasta específica de uma avaliação dentro da pasta raiz 'Avaliacoes'.
 */
function obterOuCriarSubpastaAvaliacao(nomeAvaliacao, pastaDriveIdExistente) {
  try {
    if (pastaDriveIdExistente) {
      try {
        var pastaExistente = DriveApp.getFolderById(pastaDriveIdExistente);
        if (pastaExistente && !pastaExistente.isTrashed()) {
          return pastaExistente;
        }
      } catch (e) {
        Logger.log('Subpasta com ID ' + pastaDriveIdExistente + ' não encontrada ou inacessível. Criando nova subpasta.');
      }
    }
    
    var pastaRaiz = obterOuCriarPastaRaizAvaliacoes();
    var nomeSanitizado = (nomeAvaliacao || 'Avaliacao').toString().trim();
    
    // Procura se já existe subpasta com esse nome
    var subpastas = pastaRaiz.getFoldersByName(nomeSanitizado);
    if (subpastas.hasNext()) {
      return subpastas.next();
    }
    
    var novaSubpasta = pastaRaiz.createFolder(nomeSanitizado);
    try {
      novaSubpasta.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (eShare) {
      Logger.log('Aviso ao ajustar compartilhamento da subpasta de avaliação: ' + eShare.message);
    }
    return novaSubpasta;
  } catch (err) {
    Logger.log('Erro em obterOuCriarSubpastaAvaliacao: ' + err.message);
    throw new Error('Falha ao gerenciar subpasta da avaliação no Drive: ' + err.message);
  }
}

/**
 * Sanitiza texto removendo caracteres especiais e acentos para uso seguro em nomes de arquivos/pastas.
 */
function limparTexto(texto) {
  if (!texto) return '';
  return texto.toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_\-\. ]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

/**
 * Lista todas as avaliações cadastradas com total de envios (Restrito ao Professor).
 */
function listarAvaliacoes(emailParam) {
  try {
    var session = getUserSessionData(emailParam);
    if (!session.isProfessor) {
      return {
        sucesso: false,
        mensagem: 'Acesso restrito: Funcionalidade restrita a professores.'
      };
    }
    
    var ss = ensureDatabase();
    var sheetEval = ss ? ss.getSheetByName(CONFIG.SHEET_AVALIACOES) : null;
    var sheetEnv = ss ? ss.getSheetByName(CONFIG.SHEET_ENVIOS) : null;
    
    if (!sheetEval) {
      return { sucesso: true, avaliacoes: [] };
    }
    
    // Contagem de envios por id_avaliacao
    var contagemEnvios = {};
    if (sheetEnv && sheetEnv.getLastRow() > 1) {
      var dadosEnvios = sheetEnv.getDataRange().getValues();
      for (var e = 1; e < dadosEnvios.length; e++) {
        var idAvalEnvio = dadosEnvios[e][1] ? dadosEnvios[e][1].toString().trim() : '';
        if (idAvalEnvio) {
          contagemEnvios[idAvalEnvio] = (contagemEnvios[idAvalEnvio] || 0) + 1;
        }
      }
    }
    
    var lista = [];
    if (sheetEval.getLastRow() > 1) {
      var rows = sheetEval.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        var idEval = rows[i][0] ? rows[i][0].toString().trim() : '';
        if (!idEval) continue;
        
        var pastaId = rows[i][5] ? rows[i][5].toString().trim() : '';
        var pastaUrl = pastaId ? ('https://drive.google.com/drive/folders/' + pastaId) : '';
        
        lista.push({
          id_avaliacao: idEval,
          nome: rows[i][1] ? rows[i][1].toString().trim() : '',
          status: rows[i][2] ? rows[i][2].toString().trim().toLowerCase() : 'inativa',
          data_criacao: rows[i][3] ? rows[i][3].toString() : '',
          criado_por: rows[i][4] ? rows[i][4].toString() : '',
          pasta_drive_id: pastaId,
          pasta_drive_url: pastaUrl,
          total_envios: contagemEnvios[idEval] || 0
        });
      }
    }
    
    // Ordena da mais recente para a mais antiga
    lista.sort(function(a, b) {
      return new Date(b.data_criacao || 0) - new Date(a.data_criacao || 0);
    });
    
    return {
      sucesso: true,
      avaliacoes: lista
    };
  } catch (err) {
    Logger.log('Erro em listarAvaliacoes: ' + err.message);
    return {
      sucesso: false,
      mensagem: err.message,
      avaliacoes: []
    };
  }
}

/**
 * Salva (cria ou edita) uma avaliação e provisiona sua pasta dedicada no Google Drive.
 */
function salvarAvaliacao(dados, emailParam) {
  try {
    var session = getUserSessionData(emailParam);
    if (!session.isProfessor) {
      return {
        sucesso: false,
        mensagem: 'Acesso restrito: Apenas professores podem criar ou editar avaliações.'
      };
    }
    
    if (!dados || !dados.nome || dados.nome.toString().trim().length < 3) {
      return {
        sucesso: false,
        mensagem: 'O nome da avaliação deve ter no mínimo 3 caracteres.'
      };
    }
    
    var ss = ensureDatabase();
    var sheetEval = ss ? ss.getSheetByName(CONFIG.SHEET_AVALIACOES) : null;
    if (!sheetEval) {
      setupDatabase(false);
      sheetEval = ss.getSheetByName(CONFIG.SHEET_AVALIACOES);
    }
    
    var nome = dados.nome.toString().trim();
    var status = (dados.status === 'ativa' || dados.status === true) ? 'ativa' : 'inativa';
    var idAvaliacao = dados.id_avaliacao ? dados.id_avaliacao.toString().trim() : '';
    var agora = new Date().toISOString();
    var emailProf = session.email || 'professor';
    
    var rows = sheetEval.getDataRange().getValues();
    var rowIndex = -1;
    var pastaIdExistente = '';
    
    if (idAvaliacao) {
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] && rows[i][0].toString().trim() === idAvaliacao) {
          rowIndex = i + 1;
          pastaIdExistente = rows[i][5] ? rows[i][5].toString().trim() : '';
          break;
        }
      }
    }
    
    // Regra: se status for 'ativa', desativa qualquer outra avaliação ativa
    if (status === 'ativa') {
      for (var j = 1; j < rows.length; j++) {
        if ((!idAvaliacao || rows[j][0] !== idAvaliacao) && rows[j][2] === 'ativa') {
          sheetEval.getRange(j + 1, 3).setValue('inativa');
        }
      }
    }
    
    // Provisiona subpasta no Drive
    var subpasta = obterOuCriarSubpastaAvaliacao(nome, pastaIdExistente);
    var pastaDriveId = subpasta.getId();
    
    // Se for edição e o nome mudou, renomeia a subpasta no Drive
    if (rowIndex > 0) {
      try {
        if (subpasta.getName() !== nome) {
          subpasta.setName(nome);
        }
      } catch (eName) {
        Logger.log('Aviso ao renomear subpasta no Drive: ' + eName.message);
      }
      
      sheetEval.getRange(rowIndex, 2).setValue(nome);
      sheetEval.getRange(rowIndex, 3).setValue(status);
      sheetEval.getRange(rowIndex, 6).setValue(pastaDriveId);
      
      var dataCriacaoExistente = sheetEval.getRange(rowIndex, 4).getValue();
      
      return {
        sucesso: true,
        mensagem: 'Avaliação atualizada com sucesso!',
        avaliacao: {
          id_avaliacao: idAvaliacao,
          nome: nome,
          status: status,
          data_criacao: dataCriacaoExistente ? dataCriacaoExistente.toString() : agora,
          criado_por: sheetEval.getRange(rowIndex, 5).getValue() || emailProf,
          pasta_drive_id: pastaDriveId,
          pasta_drive_url: 'https://drive.google.com/drive/folders/' + pastaDriveId
        }
      };
    } else {
      idAvaliacao = 'eval_' + new Date().getTime();
      
      sheetEval.appendRow([
        idAvaliacao,
        nome,
        status,
        agora,
        emailProf,
        pastaDriveId
      ]);
      
      return {
        sucesso: true,
        mensagem: 'Avaliação criada com sucesso!',
        avaliacao: {
          id_avaliacao: idAvaliacao,
          nome: nome,
          status: status,
          data_criacao: agora,
          criado_por: emailProf,
          pasta_drive_id: pastaDriveId,
          pasta_drive_url: 'https://drive.google.com/drive/folders/' + pastaDriveId
        }
      };
    }
  } catch (err) {
    Logger.log('Erro em salvarAvaliacao: ' + err.message);
    return {
      sucesso: false,
      mensagem: err.message
    };
  }
}

/**
 * Alterna o status de uma avaliação entre 'ativa' e 'inativa'.
 * Se ativar, garante que todas as outras fiquem inativas (apenas 1 ativa por vez).
 */
function alternarStatusAvaliacao(idAvaliacao, ativar, emailParam) {
  try {
    var session = getUserSessionData(emailParam);
    if (!session.isProfessor) {
      return {
        sucesso: false,
        mensagem: 'Acesso restrito: Apenas professores podem alterar o status de avaliações.'
      };
    }
    
    if (!idAvaliacao) {
      return { sucesso: false, mensagem: 'ID da avaliação não informado.' };
    }
    
    var ss = ensureDatabase();
    var sheetEval = ss ? ss.getSheetByName(CONFIG.SHEET_AVALIACOES) : null;
    if (!sheetEval) {
      return { sucesso: false, mensagem: 'Aba de avaliações não encontrada.' };
    }
    
    var rows = sheetEval.getDataRange().getValues();
    var rowIndex = -1;
    var novoStatus = ativar ? 'ativa' : 'inativa';
    
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] && rows[i][0].toString().trim() === idAvaliacao.toString().trim()) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return { sucesso: false, mensagem: 'Avaliação com ID "' + idAvaliacao + '" não foi encontrada.' };
    }
    
    if (ativar) {
      for (var j = 1; j < rows.length; j++) {
        if (rows[j][2] === 'ativa') {
          sheetEval.getRange(j + 1, 3).setValue('inativa');
        }
      }
    }
    
    sheetEval.getRange(rowIndex, 3).setValue(novoStatus);
    
    return {
      sucesso: true,
      idAvaliacao: idAvaliacao,
      status: novoStatus,
      mensagem: 'Status da avaliação alterado para: ' + novoStatus
    };
  } catch (err) {
    Logger.log('Erro em alternarStatusAvaliacao: ' + err.message);
    return {
      sucesso: false,
      mensagem: err.message
    };
  }
}

/**
 * Exclui uma avaliação e remove sua pasta correspondente do Google Drive.
 */
function excluirAvaliacao(idAvaliacao, emailParam) {
  try {
    var session = getUserSessionData(emailParam);
    if (!session.isProfessor) {
      return {
        sucesso: false,
        mensagem: 'Acesso restrito: Apenas professores podem excluir avaliações.'
      };
    }
    
    if (!idAvaliacao) {
      return { sucesso: false, mensagem: 'ID da avaliação não informado.' };
    }
    
    var ss = ensureDatabase();
    var sheetEval = ss ? ss.getSheetByName(CONFIG.SHEET_AVALIACOES) : null;
    if (!sheetEval) {
      return { sucesso: false, mensagem: 'Aba de avaliações não encontrada.' };
    }
    
    var rows = sheetEval.getDataRange().getValues();
    var rowIndex = -1;
    var pastaId = '';
    
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] && rows[i][0].toString().trim() === idAvaliacao.toString().trim()) {
        rowIndex = i + 1;
        pastaId = rows[i][5] ? rows[i][5].toString().trim() : '';
        break;
      }
    }
    
    if (rowIndex === -1) {
      return { sucesso: false, mensagem: 'Avaliação com ID "' + idAvaliacao + '" não encontrada.' };
    }
    
    sheetEval.deleteRow(rowIndex);
    
    if (pastaId) {
      try {
        DriveApp.getFolderById(pastaId).setTrashed(true);
      } catch (eDrive) {
        Logger.log('Aviso ao enviar pasta da avaliação para a lixeira: ' + eDrive.message);
      }
    }
    
    return {
      sucesso: true,
      mensagem: 'Avaliação excluída com sucesso!'
    };
  } catch (err) {
    Logger.log('Erro em excluirAvaliacao: ' + err.message);
    return {
      sucesso: false,
      mensagem: err.message
    };
  }
}

/**
 * ============================================================================
 * TESTE ESPECÍFICO: CICLO DE VIDA DE AVALIAÇÕES (ESTÁGIO 2)
 * ============================================================================
 * Como executar:
 * 1. No Google Apps Script, selecione a função "testarCicloVidaAvaliacao".
 * 2. Clique em "Executar".
 * 3. Analise o "Registro de execução" (Execution Log).
 * ============================================================================
 */
function testarCicloVidaAvaliacao() {
  Logger.log('=====================================================');
  Logger.log('🔍 [PYTHONLAB] INICIANDO TESTE DO CICLO DE VIDA DE AVALIAÇÃO (ESTÁGIO 2)');
  Logger.log('=====================================================');

  var relatorio = {
    sucesso: false,
    etapa1_pastaRaiz: false,
    etapa2_criacao: false,
    etapa3_listagem: false,
    etapa4_alternarStatus: false,
    etapa5_exclusao: false,
    idAvaliacaoCriada: null,
    pastaDriveIdCriada: null,
    erros: []
  };

  var emailTeste = Session.getActiveUser().getEmail() || '';
  var sessionCheck = getUserSessionData(emailTeste);
  if (!sessionCheck.isProfessor) {
    var ss = ensureDatabase();
    var sheetUsers = ss ? ss.getSheetByName(CONFIG.SHEET_USERS) : null;
    if (sheetUsers) {
      var uData = sheetUsers.getDataRange().getValues();
      for (var u = 1; u < uData.length; u++) {
        if ((uData[u][2] || '').toString().toLowerCase() === 'professor') {
          emailTeste = uData[u][0];
          break;
        }
      }
    }
  }

  try {
    // Passo 1: Teste de Acesso/Criação da Pasta Raiz 'Avaliacoes' no Drive
    Logger.log('📁 Passo 1: Verificando pasta raiz "Avaliacoes" no Google Drive...');
    var pastaRaiz = obterOuCriarPastaRaizAvaliacoes();
    if (!pastaRaiz || !pastaRaiz.getId()) {
      throw new Error('Falha ao obter ou criar a pasta raiz "Avaliacoes" no Drive.');
    }
    relatorio.etapa1_pastaRaiz = true;
    Logger.log('   ✅ Pasta Raiz "Avaliacoes" pronta! ID: ' + pastaRaiz.getId());

    // Passo 2: Teste de Criação de Avaliação via salvarAvaliacao
    var nomeTeste = '__Teste_Automatizado_Prova_1__';
    Logger.log('📝 Passo 2: Criando avaliação de teste "' + nomeTeste + '"...');
    
    var resultadoCriacao = salvarAvaliacao({
      nome: nomeTeste,
      status: 'ativa'
    }, emailTeste);

    if (!resultadoCriacao.sucesso || !resultadoCriacao.avaliacao) {
      throw new Error('Falha ao criar avaliação: ' + (resultadoCriacao.mensagem || 'Erro desconhecido'));
    }

    var aval = resultadoCriacao.avaliacao;
    relatorio.idAvaliacaoCriada = aval.id_avaliacao;
    relatorio.pastaDriveIdCriada = aval.pasta_drive_id;
    relatorio.etapa2_criacao = true;

    Logger.log('   ✅ Avaliação criada com sucesso!');
    Logger.log('      - ID: ' + aval.id_avaliacao);
    Logger.log('      - Nome: ' + aval.nome);
    Logger.log('      - Status: ' + aval.status);
    Logger.log('      - Subpasta no Drive: ' + aval.pasta_drive_url);

    // Passo 3: Teste de Listagem de Avaliações
    Logger.log('📋 Passo 3: Listando avaliações via listarAvaliacoes...');
    var resultadoListagem = listarAvaliacoes(emailTeste);
    if (!resultadoListagem.sucesso || !resultadoListagem.avaliacoes) {
      throw new Error('Falha ao listar avaliações: ' + resultadoListagem.mensagem);
    }
    
    var encontrada = resultadoListagem.avaliacoes.find(function(a) {
      return a.id_avaliacao === aval.id_avaliacao;
    });

    if (!encontrada) {
      throw new Error('A avaliação recém-criada não foi encontrada na listagem.');
    }
    relatorio.etapa3_listagem = true;
    Logger.log('   ✅ Avaliação listada com sucesso! Total no banco: ' + resultadoListagem.avaliacoes.length);

    // Passo 4: Teste de Alternância de Status
    Logger.log('🔄 Passo 4: Alternando status da avaliação para "inativa" e depois "ativa"...');
    var resDesativar = alternarStatusAvaliacao(aval.id_avaliacao, false, emailTeste);
    if (!resDesativar.sucesso || resDesativar.status !== 'inativa') {
      throw new Error('Falha ao inativar avaliação: ' + resDesativar.mensagem);
    }

    var resReativar = alternarStatusAvaliacao(aval.id_avaliacao, true, emailTeste);
    if (!resReativar.sucesso || resReativar.status !== 'ativa') {
      throw new Error('Falha ao reativar avaliação: ' + resReativar.mensagem);
    }
    relatorio.etapa4_alternarStatus = true;
    Logger.log('   ✅ Alternância de status validada com sucesso (ativa <-> inativa)!');

    // Passo 5: Teste de Limpeza / Exclusão da Avaliação de Teste
    Logger.log('🧹 Passo 5: Excluindo avaliação de teste para manter a planilha e Drive limpos...');
    var resExclusao = excluirAvaliacao(aval.id_avaliacao, emailTeste);
    if (!resExclusao.sucesso) {
      throw new Error('Falha ao excluir avaliação de teste: ' + resExclusao.mensagem);
    }
    relatorio.etapa5_exclusao = true;
    Logger.log('   ✅ Avaliação de teste e subpasta excluídas com sucesso!');

    relatorio.sucesso = true;
    Logger.log('-----------------------------------------------------');
    Logger.log('🎉 SUCESSO TOTAL: Todos os 5 passos do ciclo de vida de Avaliações foram validados com êxito!');
    Logger.log('=====================================================');

    return relatorio;
  } catch (err) {
    Logger.log('❌ ERRO NO TESTE DE CICLO DE VIDA: ' + err.message);
    relatorio.sucesso = false;
    relatorio.erros.push(err.message);
    
    if (relatorio.idAvaliacaoCriada) {
      try {
        excluirAvaliacao(relatorio.idAvaliacaoCriada, emailTeste);
      } catch (eLimpeza) {}
    }
    
    return relatorio;
  }
}

/**
 * ============================================================================
 * UPLOAD DE ARQUIVOS (.ipynb/.py) & SUBMISSÕES DOS ALUNOS (ESTÁGIO 3)
 * ============================================================================
 */

/**
 * Retorna a avaliação atualmente aberta (status === 'ativa') e se o aluno já enviou.
 * Utilizado pelo Dashboard do estudante para exibir a prova ativa e histórico de entrega.
 */
function obterAvaliacaoAtiva(emailAluno) {
  try {
    var ss = ensureDatabase();
    var sheetEval = ss ? ss.getSheetByName(CONFIG.SHEET_AVALIACOES) : null;
    var sheetEnv = ss ? ss.getSheetByName(CONFIG.SHEET_ENVIOS) : null;
    
    if (!sheetEval || sheetEval.getLastRow() <= 1) {
      return { sucesso: true, ativa: null, envioAluno: null, jaEnviou: false };
    }
    
    var rows = sheetEval.getDataRange().getValues();
    var evalAtiva = null;
    
    for (var i = 1; i < rows.length; i++) {
      var status = (rows[i][2] || '').toString().trim().toLowerCase();
      if (status === 'ativa') {
        var pastaId = rows[i][5] ? rows[i][5].toString().trim() : '';
        evalAtiva = {
          id_avaliacao: rows[i][0] ? rows[i][0].toString().trim() : '',
          nome: rows[i][1] ? rows[i][1].toString().trim() : '',
          status: 'ativa',
          data_criacao: rows[i][3] ? rows[i][3].toString() : '',
          criado_por: rows[i][4] ? rows[i][4].toString() : '',
          pasta_drive_id: pastaId,
          pasta_drive_url: pastaId ? ('https://drive.google.com/drive/folders/' + pastaId) : ''
        };
        break;
      }
    }
    
    if (!evalAtiva) {
      return { sucesso: true, ativa: null, envioAluno: null, jaEnviou: false };
    }
    
    // Verifica se este aluno já realizou envio para esta avaliação ativa
    var envioAluno = null;
    var emailBusca = (emailAluno || '').toString().trim().toLowerCase();
    
    if (emailBusca && sheetEnv && sheetEnv.getLastRow() > 1) {
      var envRows = sheetEnv.getDataRange().getValues();
      for (var e = 1; e < envRows.length; e++) {
        var eIdAval = (envRows[e][1] || '').toString().trim();
        var eEmail = (envRows[e][3] || '').toString().trim().toLowerCase();
        if (eIdAval === evalAtiva.id_avaliacao && eEmail === emailBusca) {
          envioAluno = {
            id_envio: envRows[e][0] ? envRows[e][0].toString().trim() : '',
            id_avaliacao: eIdAval,
            nome_avaliacao: envRows[e][2] ? envRows[e][2].toString().trim() : '',
            email_aluno: envRows[e][3] ? envRows[e][3].toString().trim() : '',
            nome_aluno: envRows[e][4] ? envRows[e][4].toString().trim() : '',
            nome_arquivo_drive: envRows[e][5] ? envRows[e][5].toString().trim() : '',
            drive_file_id: envRows[e][6] ? envRows[e][6].toString().trim() : '',
            drive_file_url: envRows[e][7] ? envRows[e][7].toString().trim() : '',
            data_envio: envRows[e][8] ? envRows[e][8].toString() : '',
            tamanho_bytes: Number(envRows[e][9]) || 0
          };
          break;
        }
      }
    }
    
    return {
      sucesso: true,
      ativa: evalAtiva,
      jaEnviou: (envioAluno !== null),
      envioAluno: envioAluno
    };
  } catch (err) {
    Logger.log('Erro em obterAvaliacaoAtiva: ' + err.message);
    return {
      sucesso: false,
      mensagem: err.message,
      ativa: null,
      envioAluno: null,
      jaEnviou: false
    };
  }
}

/**
 * Recebe base64 de arquivo .ipynb ou .py do aluno, salva na subpasta do Drive
 * com convenção padronizada e registra ou atualiza na aba Envios_Avaliacoes.
 * Se o aluno já tiver enviado anteriormente, aplica a Substituição Formativa (lixeira no Drive e update na linha).
 */
function enviarArquivoAvaliacao(params) {
  try {
    if (!params || !params.idAvaliacao || !params.emailAluno || !params.base64Data) {
      return {
        sucesso: false,
        mensagem: 'Dados incompletos para envio da avaliação (id, email e arquivo são obrigatórios).'
      };
    }
    
    var emailAluno = params.emailAluno.toString().trim().toLowerCase();
    var idAvaliacao = params.idAvaliacao.toString().trim();
    
    var ss = ensureDatabase();
    var sheetEval = ss ? ss.getSheetByName(CONFIG.SHEET_AVALIACOES) : null;
    var sheetEnv = ss ? ss.getSheetByName(CONFIG.SHEET_ENVIOS) : null;
    var sheetUsers = ss ? ss.getSheetByName(CONFIG.SHEET_USERS) : null;
    
    if (!sheetEval || !sheetEnv) {
      throw new Error('Abas de Avaliações não encontradas.');
    }
    
    // 1. Valida se a avaliação existe e está com status 'ativa'
    var rowsEval = sheetEval.getDataRange().getValues();
    var avaliacaoEncontrada = null;
    for (var i = 1; i < rowsEval.length; i++) {
      if (rowsEval[i][0] && rowsEval[i][0].toString().trim() === idAvaliacao) {
        avaliacaoEncontrada = {
          id_avaliacao: rowsEval[i][0].toString().trim(),
          nome: rowsEval[i][1] ? rowsEval[i][1].toString().trim() : '',
          status: rowsEval[i][2] ? rowsEval[i][2].toString().trim().toLowerCase() : 'inativa',
          pasta_drive_id: rowsEval[i][5] ? rowsEval[i][5].toString().trim() : ''
        };
        break;
      }
    }
    
    if (!avaliacaoEncontrada) {
      return { sucesso: false, mensagem: 'Avaliação não encontrada na planilha.' };
    }
    
    if (avaliacaoEncontrada.status !== 'ativa') {
      return {
        sucesso: false,
        mensagem: 'Esta avaliação já foi encerrada e não aceita mais envios de arquivos.'
      };
    }
    
    // 2. Determina o nome do aluno
    var nomeAluno = (params.nomeAluno || '').toString().trim();
    if (!nomeAluno && sheetUsers) {
      var rowsU = sheetUsers.getDataRange().getValues();
      for (var u = 1; u < rowsU.length; u++) {
        if (rowsU[u][0] && rowsU[u][0].toString().trim().toLowerCase() === emailAluno) {
          nomeAluno = rowsU[u][1] ? rowsU[u][1].toString().trim() : '';
          break;
        }
      }
    }
    if (!nomeAluno) {
      var parteEmail = emailAluno.split('@')[0].replace(/[._]/g, ' ');
      nomeAluno = parteEmail.charAt(0).toUpperCase() + parteEmail.slice(1);
    }
    
    // 3. Processa dados do arquivo e convenção padronizada de nome
    var nomeOriginal = params.nomeOriginalArquivo || 'notebook.ipynb';
    var pontoIdx = nomeOriginal.lastIndexOf('.');
    var ext = (pontoIdx > -1) ? nomeOriginal.substring(pontoIdx + 1).toLowerCase() : 'ipynb';
    var nomeBaseOriginal = (pontoIdx > -1) ? nomeOriginal.substring(0, pontoIdx) : nomeOriginal;
    
    // Garantir extensão permitida (.ipynb ou .py)
    if (ext !== 'ipynb' && ext !== 'py') {
      ext = 'ipynb';
    }
    
    var timeZone = Session.getScriptTimeZone() || 'America/Sao_Paulo';
    var timestampStr = Utilities.formatDate(new Date(), timeZone, 'HH_mm_dd_MM');
    
    // [Nome_da_Avaliacao]_[Nome_do_Aluno]_[Nome_Original]_[HH_mm_dd_MM].[ext]
    var nomePadronizado = limparTexto(avaliacaoEncontrada.nome) + '_' +
                          limparTexto(nomeAluno) + '_' +
                          limparTexto(nomeBaseOriginal) + '_' +
                          timestampStr + '.' + ext;
    
    // 4. Salva o arquivo na subpasta correspondente no Google Drive
    var subpasta = obterOuCriarSubpastaAvaliacao(avaliacaoEncontrada.nome, avaliacaoEncontrada.pasta_drive_id);
    
    var cleanBase64 = params.base64Data;
    if (cleanBase64.indexOf(',') > -1) {
      cleanBase64 = cleanBase64.split(',')[1];
    }
    var bytes = Utilities.base64Decode(cleanBase64);
    var mime = params.mimeType || (ext === 'py' ? 'text/plain' : 'application/x-ipynb+json');
    var blob = Utilities.newBlob(bytes, mime, nomePadronizado);
    
    var driveFile = subpasta.createFile(blob);
    try {
      driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (eShare) {}
    
    var fileId = driveFile.getId();
    var fileUrl = 'https://drive.google.com/file/d/' + fileId + '/view?usp=sharing';
    var agora = new Date().toISOString();
    var tamanhoFinal = Number(params.tamanhoBytes) || bytes.length;
    
    // 5. Substituição Formativa: verifica se já existe envio anterior deste aluno
    var rowsEnv = sheetEnv.getDataRange().getValues();
    var rowIndexExistente = -1;
    var oldFileId = '';
    var idEnvioExistente = '';
    
    for (var r = 1; r < rowsEnv.length; r++) {
      var rowIdAval = (rowsEnv[r][1] || '').toString().trim();
      var rowEmail = (rowsEnv[r][3] || '').toString().trim().toLowerCase();
      if (rowIdAval === idAvaliacao && rowEmail === emailAluno) {
        rowIndexExistente = r + 1;
        idEnvioExistente = rowsEnv[r][0] ? rowsEnv[r][0].toString().trim() : '';
        oldFileId = (rowsEnv[r][6] || '').toString().trim();
        break;
      }
    }
    
    var foiSubstituido = false;
    var idEnvioFinal = '';
    
    if (rowIndexExistente > 0) {
      foiSubstituido = true;
      idEnvioFinal = idEnvioExistente || ('sub_' + idAvaliacao + '_' + new Date().getTime());
      
      // Move o arquivo anterior para a lixeira do Drive
      if (oldFileId && oldFileId !== fileId) {
        try {
          DriveApp.getFileById(oldFileId).setTrashed(true);
          Logger.log('Arquivo anterior descartado no Drive: ' + oldFileId);
        } catch (eTrash) {
          Logger.log('Aviso ao descartar arquivo anterior: ' + eTrash.message);
        }
      }
      
      // Atualiza a linha existente na planilha
      // [id_envio, id_avaliacao, nome_avaliacao, email_aluno, nome_aluno, nome_arquivo_drive, drive_file_id, drive_file_url, data_envio, tamanho_bytes]
      sheetEnv.getRange(rowIndexExistente, 5).setValue(nomeAluno);
      sheetEnv.getRange(rowIndexExistente, 6).setValue(nomePadronizado);
      sheetEnv.getRange(rowIndexExistente, 7).setValue(fileId);
      sheetEnv.getRange(rowIndexExistente, 8).setValue(fileUrl);
      sheetEnv.getRange(rowIndexExistente, 9).setValue(agora);
      sheetEnv.getRange(rowIndexExistente, 10).setValue(tamanhoFinal);
    } else {
      // Inserção de novo envio
      idEnvioFinal = 'sub_' + idAvaliacao + '_' + new Date().getTime();
      sheetEnv.appendRow([
        idEnvioFinal,
        idAvaliacao,
        avaliacaoEncontrada.nome,
        emailAluno,
        nomeAluno,
        nomePadronizado,
        fileId,
        fileUrl,
        agora,
        tamanhoFinal
      ]);
    }
    
    return {
      sucesso: true,
      substituido: foiSubstituido,
      mensagem: foiSubstituido 
        ? 'Arquivo reexaminado e substituído com sucesso na nuvem!' 
        : 'Arquivo da avaliação enviado com sucesso!',
      envio: {
        id_envio: idEnvioFinal,
        id_avaliacao: idAvaliacao,
        nome_avaliacao: avaliacaoEncontrada.nome,
        email_aluno: emailAluno,
        nome_aluno: nomeAluno,
        nome_arquivo_drive: nomePadronizado,
        drive_file_id: fileId,
        drive_file_url: fileUrl,
        data_envio: agora,
        tamanho_bytes: tamanhoFinal
      }
    };
  } catch (err) {
    Logger.log('Erro em enviarArquivoAvaliacao: ' + err.message);
    return {
      sucesso: false,
      mensagem: err.message
    };
  }
}

/**
 * Retorna a lista detalhada de submissões dos estudantes para uma avaliação (Exclusivo Professor).
 */
function listarEnviosAvaliacao(idAvaliacao, emailParam) {
  try {
    var session = getUserSessionData(emailParam);
    if (!session.isProfessor) {
      return {
        sucesso: false,
        mensagem: 'Acesso restrito: Funcionalidade restrita a professores.'
      };
    }
    
    if (!idAvaliacao) {
      return { sucesso: false, mensagem: 'ID da avaliação não informado.' };
    }
    
    var ss = ensureDatabase();
    var sheetEval = ss ? ss.getSheetByName(CONFIG.SHEET_AVALIACOES) : null;
    var sheetEnv = ss ? ss.getSheetByName(CONFIG.SHEET_ENVIOS) : null;
    
    var dadosAvaliacao = null;
    if (sheetEval && sheetEval.getLastRow() > 1) {
      var rowsEval = sheetEval.getDataRange().getValues();
      for (var i = 1; i < rowsEval.length; i++) {
        if (rowsEval[i][0] && rowsEval[i][0].toString().trim() === idAvaliacao.toString().trim()) {
          var pastaId = rowsEval[i][5] ? rowsEval[i][5].toString().trim() : '';
          dadosAvaliacao = {
            id_avaliacao: rowsEval[i][0].toString().trim(),
            nome: rowsEval[i][1] ? rowsEval[i][1].toString().trim() : '',
            status: rowsEval[i][2] ? rowsEval[i][2].toString().trim() : '',
            pasta_drive_id: pastaId,
            pasta_drive_url: pastaId ? ('https://drive.google.com/drive/folders/' + pastaId) : ''
          };
          break;
        }
      }
    }
    
    var envios = [];
    if (sheetEnv && sheetEnv.getLastRow() > 1) {
      var rowsEnv = sheetEnv.getDataRange().getValues();
      for (var j = 1; j < rowsEnv.length; j++) {
        var rowIdAval = (rowsEnv[j][1] || '').toString().trim();
        if (rowIdAval === idAvaliacao.toString().trim()) {
          var fId = (rowsEnv[j][6] || '').toString().trim();
          var fUrl = (rowsEnv[j][7] || '').toString().trim();
          if (!fUrl && fId) {
            fUrl = 'https://drive.google.com/open?id=' + fId;
          }
          
          envios.push({
            id_envio: rowsEnv[j][0] ? rowsEnv[j][0].toString().trim() : '',
            id_avaliacao: rowIdAval,
            nome_avaliacao: rowsEnv[j][2] ? rowsEnv[j][2].toString().trim() : '',
            email_aluno: rowsEnv[j][3] ? rowsEnv[j][3].toString().trim() : '',
            nome_aluno: rowsEnv[j][4] ? rowsEnv[j][4].toString().trim() : '',
            nome_arquivo_drive: rowsEnv[j][5] ? rowsEnv[j][5].toString().trim() : '',
            drive_file_id: fId,
            drive_file_url: fUrl,
            data_envio: rowsEnv[j][8] ? rowsEnv[j][8].toString() : '',
            tamanho_bytes: Number(rowsEnv[j][9]) || 0
          });
        }
      }
    }
    
    // Ordena por data decrescente (envios mais recentes primeiro)
    envios.sort(function(a, b) {
      return new Date(b.data_envio || 0) - new Date(a.data_envio || 0);
    });
    
    return {
      sucesso: true,
      avaliacao: dadosAvaliacao,
      total: envios.length,
      envios: envios
    };
  } catch (err) {
    Logger.log('Erro em listarEnviosAvaliacao: ' + err.message);
    return {
      sucesso: false,
      mensagem: err.message,
      envios: []
    };
  }
}

/**
 * ============================================================================
 * TESTE ESPECÍFICO: ENVIO E SUBSTITUIÇÃO FORMATIVA DE ARQUIVOS (ESTÁGIO 3)
 * ============================================================================
 * Como executar:
 * 1. No Google Apps Script, selecione a função "testarEnvioSubstituicaoAluno".
 * 2. Clique em "Executar".
 * 3. Analise o "Registro de execução" (Execution Log).
 * ============================================================================
 */
function testarEnvioSubstituicaoAluno() {
  Logger.log('=====================================================');
  Logger.log('🔍 [PYTHONLAB] INICIANDO TESTE DE ENVIO E SUBSTITUIÇÃO (ESTÁGIO 3)');
  Logger.log('=====================================================');

  var relatorio = {
    sucesso: false,
    etapa1_provaAtiva: false,
    etapa2_primeiroEnvio: false,
    etapa3_statusAposEnvio: false,
    etapa4_substituicaoFormativa: false,
    etapa5_listagemEnvios: false,
    etapa6_limpeza: false,
    idAvaliacaoCriada: null,
    erros: []
  };

  var emailProf = Session.getActiveUser().getEmail() || '';
  var sessionCheck = getUserSessionData(emailProf);
  if (!sessionCheck.isProfessor) {
    var ss = ensureDatabase();
    var sheetUsers = ss ? ss.getSheetByName(CONFIG.SHEET_USERS) : null;
    if (sheetUsers) {
      var uData = sheetUsers.getDataRange().getValues();
      for (var u = 1; u < uData.length; u++) {
        if ((uData[u][2] || '').toString().toLowerCase() === 'professor') {
          emailProf = uData[u][0];
          break;
        }
      }
    }
  }

  var emailAlunoTeste = 'aluno.automacao@exemplo.com';
  var nomeAlunoTeste = 'Marina Silva Santos';

  try {
    // 1. Cria uma avaliação de teste ativa para o ensaio
    Logger.log('📝 Preparando avaliação de teste ativa "__Prova_Teste_Envios__"...');
    var resCriacao = salvarAvaliacao({
      nome: '__Prova_Teste_Envios__',
      status: 'ativa'
    }, emailProf);

    if (!resCriacao.sucesso || !resCriacao.avaliacao) {
      throw new Error('Falha ao criar avaliação de teste: ' + resCriacao.mensagem);
    }
    var aval = resCriacao.avaliacao;
    relatorio.idAvaliacaoCriada = aval.id_avaliacao;

    // Etapa 1: Verificar obterAvaliacaoAtiva para aluno que ainda não enviou
    Logger.log('🔍 Etapa 1: Consultando obterAvaliacaoAtiva para o aluno...');
    var resAtivaAntes = obterAvaliacaoAtiva(emailAlunoTeste);
    if (!resAtivaAntes.sucesso || !resAtivaAntes.ativa || resAtivaAntes.jaEnviou !== false) {
      throw new Error('obterAvaliacaoAtiva falhou: deveria retornar ativa=true e jaEnviou=false.');
    }
    relatorio.etapa1_provaAtiva = true;
    Logger.log('   ✅ Prova ativa localizada e aluno confirmado como sem envios prévios!');

    // Etapa 2: Primeiro Envio de Arquivo (.ipynb)
    Logger.log('📤 Etapa 2: Realizando o 1º envio de arquivo pelo aluno...');
    var conteudoFake1 = JSON.stringify({
      cells: [{ cell_type: "code", execution_count: 1, source: ["print('Versao 1 da Prova')"] }],
      metadata: {},
      nbformat: 4,
      nbformat_minor: 2
    });
    var base64Fake1 = Utilities.base64Encode(conteudoFake1, Utilities.Charset.UTF_8);

    var resEnvio1 = enviarArquivoAvaliacao({
      idAvaliacao: aval.id_avaliacao,
      emailAluno: emailAlunoTeste,
      nomeAluno: nomeAlunoTeste,
      nomeOriginalArquivo: 'exercicio_resolvido_v1.ipynb',
      base64Data: base64Fake1,
      mimeType: 'application/x-ipynb+json',
      tamanhoBytes: conteudoFake1.length
    });

    if (!resEnvio1.sucesso || !resEnvio1.envio) {
      throw new Error('Falha no 1º envio: ' + (resEnvio1.mensagem || 'Erro desconhecido'));
    }
    var envio1 = resEnvio1.envio;
    var fileId1 = envio1.drive_file_id;
    relatorio.etapa2_primeiroEnvio = true;

    Logger.log('   ✅ 1º Arquivo gravado com sucesso no Drive e registrado na planilha!');
    Logger.log('      - Nome gerado: ' + envio1.nome_arquivo_drive);
    Logger.log('      - File ID: ' + fileId1);
    Logger.log('      - URL Drive: ' + envio1.drive_file_url);

    // Etapa 3: Verificar status após o 1º envio
    Logger.log('🔍 Etapa 3: Verificando obterAvaliacaoAtiva após 1º envio...');
    var resAtivaDepois1 = obterAvaliacaoAtiva(emailAlunoTeste);
    if (!resAtivaDepois1.sucesso || !resAtivaDepois1.jaEnviou || !resAtivaDepois1.envioAluno) {
      throw new Error('Falha: jaEnviou deveria ser true após o primeiro envio.');
    }
    relatorio.etapa3_statusAposEnvio = true;
    Logger.log('   ✅ Sistema reconhece envio anterior do estudante!');

    // Etapa 4: Segundo Envio (Substituição Formativa do Arquivo)
    Logger.log('🔄 Etapa 4: Realizando o 2º envio (substituição formativa)...');
    var conteudoFake2 = JSON.stringify({
      cells: [{ cell_type: "code", execution_count: 2, source: ["print('Versao 2 corrigida da Prova')"] }],
      metadata: {},
      nbformat: 4,
      nbformat_minor: 2
    });
    var base64Fake2 = Utilities.base64Encode(conteudoFake2, Utilities.Charset.UTF_8);

    var resEnvio2 = enviarArquivoAvaliacao({
      idAvaliacao: aval.id_avaliacao,
      emailAluno: emailAlunoTeste,
      nomeAluno: nomeAlunoTeste,
      nomeOriginalArquivo: 'exercicio_resolvido_final.ipynb',
      base64Data: base64Fake2,
      mimeType: 'application/x-ipynb+json',
      tamanhoBytes: conteudoFake2.length
    });

    if (!resEnvio2.sucesso || !resEnvio2.substituido) {
      throw new Error('Falha na substituição: substituido deveria ser true. Mensagem: ' + resEnvio2.mensagem);
    }

    var envio2 = resEnvio2.envio;
    var fileId2 = envio2.drive_file_id;

    // Confere se o arquivo antigo foi para a lixeira
    var arquivo1NoDrive = DriveApp.getFileById(fileId1);
    if (!arquivo1NoDrive.isTrashed()) {
      throw new Error('O arquivo anterior (fileId: ' + fileId1 + ') deveria estar na lixeira do Drive após a substituição.');
    }

    // Confere se o arquivo novo está ativo
    var arquivo2NoDrive = DriveApp.getFileById(fileId2);
    if (arquivo2NoDrive.isTrashed()) {
      throw new Error('O novo arquivo (fileId: ' + fileId2 + ') não deveria estar na lixeira.');
    }

    relatorio.etapa4_substituicaoFormativa = true;
    Logger.log('   ✅ Substituição Formativa validada com êxito!');
    Logger.log('      - Arquivo antigo enviado para a lixeira do Drive: OK');
    Logger.log('      - Novo arquivo ativo salvo: ' + envio2.nome_arquivo_drive);
    Logger.log('      - Linha na aba Envios_Avaliacoes atualizada sem duplicidade!');

    // Etapa 5: Listagem de Envios para o Professor
    Logger.log('👥 Etapa 5: Professor listando envios da avaliação...');
    var resListagemEnvios = listarEnviosAvaliacao(aval.id_avaliacao, emailProf);
    if (!resListagemEnvios.sucesso || !resListagemEnvios.envios || resListagemEnvios.envios.length !== 1) {
      throw new Error('Falha ao listar envios: esperava exatamente 1 envio ativo para a avaliação.');
    }
    if (resListagemEnvios.envios[0].drive_file_id !== fileId2) {
      throw new Error('O envio listado deveria ser o arquivo da substituição (fileId: ' + fileId2 + ').');
    }
    relatorio.etapa5_listagemEnvios = true;
    Logger.log('   ✅ Professor recebeu relatório de envios com o arquivo mais recente!');

    // Etapa 6: Limpeza do Teste
    Logger.log('🧹 Etapa 6: Limpando registros e arquivos do teste...');
    var ssLimpeza = ensureDatabase();
    var sheetEnvLimpeza = ssLimpeza.getSheetByName(CONFIG.SHEET_ENVIOS);
    if (sheetEnvLimpeza) {
      var rowsE = sheetEnvLimpeza.getDataRange().getValues();
      for (var r = rowsE.length - 1; r >= 1; r--) {
        if (rowsE[r][1] === aval.id_avaliacao) {
          sheetEnvLimpeza.deleteRow(r + 1);
        }
      }
    }
    try {
      arquivo2NoDrive.setTrashed(true);
    } catch(eTr) {}

    excluirAvaliacao(aval.id_avaliacao, emailProf);
    relatorio.etapa6_limpeza = true;
    Logger.log('   ✅ Limpeza completa concluída com sucesso!');

    relatorio.sucesso = true;
    Logger.log('-----------------------------------------------------');
    Logger.log('🎉 SUCESSO TOTAL: Todos os 6 passos de Envio e Substituição foram validados com êxito!');
    Logger.log('=====================================================');

    return relatorio;

  } catch (err) {
    Logger.log('❌ ERRO NO TESTE DE ENVIO/SUBSTITUIÇÃO: ' + err.message);
    relatorio.sucesso = false;
    relatorio.erros.push(err.message);

    if (relatorio.idAvaliacaoCriada) {
      try {
        var ssErr = ensureDatabase();
        var sheetEnvErr = ssErr ? ssErr.getSheetByName(CONFIG.SHEET_ENVIOS) : null;
        if (sheetEnvErr) {
          var rErr = sheetEnvErr.getDataRange().getValues();
          for (var re = rErr.length - 1; re >= 1; re--) {
            if (rErr[re][1] === relatorio.idAvaliacaoCriada) {
              sheetEnvErr.deleteRow(re + 1);
            }
          }
        }
        excluirAvaliacao(relatorio.idAvaliacaoCriada, emailProf);
      } catch (eLimpeza) {}
    }

    return relatorio;
  }
}

/**
 * ============================================================================
 * ENDPOINTS RPC: MOTOR DE SORTEIO SÍNCRONO DA TURMA (ROLETA)
 * ============================================================================
 */

/**
 * Retorna os estudantes cadastrados e o histórico da rodada de sorteio
 */
function obterDadosSorteioProfessor(emailParam) {
  try {
    var ss = ensureDatabase();
    if (!ss) return { sucesso: false, mensagem: 'Erro ao conectar à planilha.' };

    var sheetUsers = ss.getSheetByName(CONFIG.SHEET_USERS);
    var sheetSorteios = ss.getSheetByName(CONFIG.SHEET_SORTEIOS);

    var alunos = [];
    if (sheetUsers && sheetUsers.getLastRow() > 1) {
      var dadosUsers = sheetUsers.getDataRange().getValues();
      for (var i = 1; i < dadosUsers.length; i++) {
        var email = String(dadosUsers[i][0] || '').trim();
        var nome = String(dadosUsers[i][1] || '').trim();
        var perfil = String(dadosUsers[i][2] || '').trim().toLowerCase();
        var xp = Number(dadosUsers[i][4]) || 0;

        if (perfil === 'aluno' && email) {
          alunos.push({
            nome: nome || formatarNomeDeEmail(email),
            email: email,
            xpTotal: xp
          });
        }
      }
    }

    // Se a aba Usuarios ainda não tiver alunos, gera mock inicial para visualização do professor
    if (alunos.length === 0) {
      alunos = [
        { nome: 'Ana Carolina Silva', email: 'ana.silva@aluno.ce.gov.br', xpTotal: 520 },
        { nome: 'Bruno Castro', email: 'bruno.castro@aluno.ce.gov.br', xpTotal: 410 },
        { nome: 'Carlos Eduardo Lima', email: 'carlos.lima@aluno.ce.gov.br', xpTotal: 380 },
        { nome: 'Daniela Ferreira', email: 'daniela.ferreira@aluno.ce.gov.br', xpTotal: 490 },
        { nome: 'Gabriel Rocha', email: 'gabriel.rocha@aluno.ce.gov.br', xpTotal: 450 },
        { nome: 'Helena Ribeiro', email: 'helena.ribeiro@aluno.ce.gov.br', xpTotal: 340 },
        { nome: 'Lucas Oliveira', email: 'lucas.oliveira@aluno.ce.gov.br', xpTotal: 510 },
        { nome: 'Mariana Santos', email: 'mariana.santos@aluno.ce.gov.br', xpTotal: 470 },
        { nome: 'Pedro Henrique Alves', email: 'pedro.alves@aluno.ce.gov.br', xpTotal: 430 },
        { nome: 'Rafaela Costa', email: 'rafaela.costa@aluno.ce.gov.br', xpTotal: 390 }
      ];
    }

    var historico = [];
    if (sheetSorteios && sheetSorteios.getLastRow() > 1) {
      var dadosSorteios = sheetSorteios.getDataRange().getValues();
      for (var j = 1; j < dadosSorteios.length; j++) {
        var idS = String(dadosSorteios[j][0] || '');
        var emailA = String(dadosSorteios[j][1] || '').trim();
        var nomeA = String(dadosSorteios[j][2] || '').trim();
        var dataS = dadosSorteios[j][3];
        var statusP = String(dadosSorteios[j][5] || 'Não tentou').trim() || 'Não tentou';
        if (emailA) {
          historico.push({
            idSorteio: idS,
            email: emailA,
            nome: nomeA || formatarNomeDeEmail(emailA),
            data: dataS ? new Date(dataS).toISOString() : new Date().toISOString(),
            status: statusP
          });
        }
      }
    }

    return {
      sucesso: true,
      alunos: alunos,
      historico: historico
    };
  } catch (err) {
    Logger.log('Erro em obterDadosSorteioProfessor: ' + err.message);
    return { sucesso: false, mensagem: 'Erro ao carregar dados de sorteio: ' + err.message };
  }
}

/**
 * Acionado pelo professor para sortear um aluno elegível
 */
function iniciarSorteioTurma(params) {
  try {
    params = params || {};
    var emailParam = params.emailParam || '';
    var ausentesEmails = params.ausentesEmails || [];
    var ausentesSet = {};
    for (var a = 0; a < ausentesEmails.length; a++) {
      ausentesSet[String(ausentesEmails[a]).toLowerCase()] = true;
    }

    var ss = ensureDatabase();
    if (!ss) return { sucesso: false, mensagem: 'Erro ao conectar à planilha.' };

    var sheetSorteios = ss.getSheetByName(CONFIG.SHEET_SORTEIOS);

    var dados = obterDadosSorteioProfessor(emailParam);
    if (!dados || !dados.sucesso) return dados;

    var historicoSet = {};
    for (var h = 0; h < (dados.historico || []).length; h++) {
      historicoSet[String(dados.historico[h].email).toLowerCase()] = true;
    }

    var elegiveis = [];
    for (var i = 0; i < dados.alunos.length; i++) {
      var al = dados.alunos[i];
      var elow = al.email.toLowerCase();
      if (!ausentesSet[elow] && !historicoSet[elow]) {
        elegiveis.push(al);
      }
    }

    if (elegiveis.length === 0) {
      return {
        sucesso: false,
        mensagem: 'Todos os alunos presentes já foram sorteados nesta rodada! Clique em "Resetar Rodada" para começar novamente.'
      };
    }

    var winnerIndex = Math.floor(Math.random() * elegiveis.length);
    var vencedor = elegiveis[winnerIndex];

    var now = Date.now();
    var inicioTimestamp = now;
    var spinTimestamp = now + 4000;
    var fimTimestamp = spinTimestamp + 6500;
    var idSorteio = 'sorteio_' + now;

    var criador = '';
    try {
      criador = Session.getActiveUser().getEmail() || emailParam || '';
    } catch (e) {
      criador = emailParam || '';
    }

    var sorteio = {
      ativo: true,
      sucesso: true,
      idSorteio: idSorteio,
      inicioTimestamp: inicioTimestamp,
      spinTimestamp: spinTimestamp,
      fimTimestamp: fimTimestamp,
      vencedor: {
        email: vencedor.email,
        nome: vencedor.nome
      },
      status: 'Não tentou',
      participantes: elegiveis.map(function(e) { return { email: e.email, nome: e.nome }; }),
      winnerIndex: winnerIndex
    };

    // Salva no CacheService para que alunos recebam em tempo real
    try {
      var cache = CacheService.getScriptCache();
      if (cache) {
        cache.put('PYTHONLAB_SORTEIO_ATIVO', JSON.stringify(sorteio), 120);
      }
    } catch(errCache) {
      Logger.log('Erro no cache de sorteio: ' + errCache.message);
    }

    // Persiste na planilha Google Sheets com status inicial "Não tentou"
    if (sheetSorteios) {
      sheetSorteios.appendRow([
        idSorteio,
        vencedor.email,
        vencedor.nome,
        new Date().toISOString(),
        criador,
        'Não tentou'
      ]);
    }

    return sorteio;
  } catch (err) {
    Logger.log('Erro em iniciarSorteioTurma: ' + err.message);
    return { sucesso: false, mensagem: 'Erro ao iniciar sorteio: ' + err.message };
  }
}

/**
 * Reseta o histórico da rodada de sorteio
 */
function resetarSorteioTurma(emailParam) {
  try {
    var ss = ensureDatabase();
    if (!ss) return { sucesso: false, mensagem: 'Erro ao acessar planilha.' };

    var sheetSorteios = ss.getSheetByName(CONFIG.SHEET_SORTEIOS);
    if (sheetSorteios && sheetSorteios.getLastRow() > 1) {
      sheetSorteios.deleteRows(2, sheetSorteios.getLastRow() - 1);
    }

    try {
      var cache = CacheService.getScriptCache();
      if (cache) {
        cache.remove('PYTHONLAB_SORTEIO_ATIVO');
      }
    } catch (e) {}

    return { sucesso: true, mensagem: 'Rodada de sorteio resetada com sucesso!' };
  } catch (err) {
    return { sucesso: false, mensagem: 'Erro ao resetar sorteio: ' + err.message };
  }
}

/**
 * Consulta o status atual do sorteio (chamado periodicamente pelos alunos conectados)
 */
function verificarStatusSorteio() {
  try {
    var cache = CacheService.getScriptCache();
    if (!cache) return { sucesso: true, sorteioAtivo: null };
    var cached = cache.get('PYTHONLAB_SORTEIO_ATIVO');
    if (!cached) return { sucesso: true, sorteioAtivo: null };
    var sorteio = JSON.parse(cached);
    return { sucesso: true, sorteioAtivo: sorteio };
  } catch (err) {
    return { sucesso: false, sorteioAtivo: null };
  }
}

/**
 * Atualiza o status de participação de um aluno sorteado (Não tentou, Errou, Acertou)
 */
function atualizarStatusSorteio(idSorteioOuEmail, novoStatus, emailParam) {
  try {
    var ss = ensureDatabase();
    if (!ss) return { sucesso: false, mensagem: 'Erro ao conectar à planilha.' };

    var sheetSorteios = ss.getSheetByName(CONFIG.SHEET_SORTEIOS);
    if (!sheetSorteios || sheetSorteios.getLastRow() <= 1) {
      return { sucesso: false, mensagem: 'Histórico de sorteios vazio.' };
    }

    var data = sheetSorteios.getDataRange().getValues();
    var linhaEncontrada = -1;

    for (var i = data.length - 1; i >= 1; i--) {
      var idRow = String(data[i][0] || '').trim();
      var emailRow = String(data[i][1] || '').trim().toLowerCase();
      if (idRow === String(idSorteioOuEmail).trim() || emailRow === String(idSorteioOuEmail).trim().toLowerCase()) {
        linhaEncontrada = i + 1;
        break;
      }
    }

    if (linhaEncontrada > 0) {
      sheetSorteios.getRange(linhaEncontrada, 6).setValue(novoStatus);
      return { sucesso: true, mensagem: 'Participação registrada: ' + novoStatus };
    }

    return { sucesso: false, mensagem: 'Registro do sorteio não localizado.' };
  } catch (err) {
    Logger.log('Erro em atualizarStatusSorteio: ' + err.message);
    return { sucesso: false, mensagem: 'Erro ao atualizar status: ' + err.message };
  }
}