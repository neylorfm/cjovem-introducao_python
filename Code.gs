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
  VERSION: '1.0.0',
  SHEET_USERS: 'Usuarios',
  SHEET_PROGRESS: 'Progresso',
  SHEET_CATALOG: 'Catalogo_Aulas',
  SHEET_IMAGES: 'Imagens_Exercicios',
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
  var activeEmail = Session.getActiveUser().getEmail();
  template.activeEmail = activeEmail || '';
  
  return template.evaluate()
    .setTitle('PythonLab — Reforço Didático Interativo')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Menu contextual criado automaticamente na interface do Google Sheets
 */
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('🐍 PythonLab')
      .addItem('⚙️ Inicializar / Reparar Banco de Dados', 'setupDatabase')
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
  sheetCatalogo.setFrozenRows(1);
  try {
    SpreadsheetApp.getUi().alert('Catálogo redefinido com sucesso! Aulas 1.2 e 1.3 estão ativas na planilha.');
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
 * Obtém ou inicializa a planilha ativa vinculada
 */
function getSpreadsheet() {
  try {
    return SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    throw new Error('Não foi possível obter a planilha vinculada ao projeto. Certifique-se de que o Apps Script está associado a um Google Sheets.');
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
    
    // Se qualquer uma das abas essenciais não existir, provisiona automaticamente
    if (!sheetUsers || !sheetCat || !sheetProg || !sheetImg) {
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
    var email = (emailParam ? emailParam.toString().trim() : '') || Session.getActiveUser().getEmail();
    
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
    
    if (sheetUsers) {
      var rows = sheetUsers.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        var rowEmail = rows[i][0] ? rows[i][0].toString().trim().toLowerCase() : '';
        if (rowEmail && rowEmail === email.trim().toLowerCase()) {
          var rowPerfil = rows[i][2] ? rows[i][2].toString().trim().toLowerCase() : 'aluno';
          userData = {
            rowIndex: i + 1,
            email: rows[i][0].toString().trim(),
            nome: (rows[i][1] ? rows[i][1].toString().trim() : '') || email.split('@')[0],
            perfil: rowPerfil,
            dataCadastro: rows[i][3] || new Date().toISOString(),
            xpTotal: Number(rows[i][4]) || 0
          };
          // Atualiza último acesso
          try {
            sheetUsers.getRange(i + 1, 6).setValue(new Date().toISOString());
          } catch(e) {}
          break;
        }
      }
    }
    
    // Se o usuário informou um e-mail válido mas ainda não está cadastrado na planilha, realiza o auto-cadastro como Aluno
    if (!userData && sheetUsers) {
      var nomeExtraido = email.split('@')[0].replace(/[._]/g, ' ');
      nomeExtraido = nomeExtraido.charAt(0).toUpperCase() + nomeExtraido.slice(1);
      var agora = new Date().toISOString();
      
      sheetUsers.appendRow([email, nomeExtraido, 'aluno', agora, 0, agora]);
      userData = {
        email: email,
        nome: nomeExtraido,
        perfil: 'aluno',
        dataCadastro: agora,
        xpTotal: 0
      };
    }
    
    // Carrega o histórico de progresso do estudante e dúvidas pendentes
    var progressoIds = [];
    var duvidasPendentes = [];
    var ultimaAula = 'aula_1_2';
    var sheetProg = ss.getSheetByName(CONFIG.SHEET_PROGRESS);
    
    if (sheetProg && userData) {
      var pRows = sheetProg.getDataRange().getValues();
      for (var j = 1; j < pRows.length; j++) {
        if (pRows[j][1] && pRows[j][1].toString().trim().toLowerCase() === email.trim().toLowerCase()) {
          var pStatus = pRows[j][4];
          var pAula = pRows[j][2];
          var pTopico = pRows[j][3];
          var pDuvida = pRows[j][10] || '';
          
          if (pStatus === 'concluido') {
            progressoIds.push(pAula);
          } else if (pStatus === 'com_duvidas') {
            duvidasPendentes.push({
              idAula: pAula,
              idTopico: pTopico,
              duvida: pDuvida,
              data: pRows[j][9]
            });
          }
          if (pStatus === 'em_andamento') {
            ultimaAula = pAula;
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
      duvidasPendentes: duvidasPendentes,
      ultimaAulaAcessada: ultimaAula,
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
      duvidasPendentes: [],
      ultimaAulaAcessada: 'aula_1_2',
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
        'aula_1_3': 'Aula1_3'
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
        var novoXp = xpAtual + pontosComputados;
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
    if (sheetProg) {
      var pRows = sheetProg.getDataRange().getValues();
      for (var p = 1; p < pRows.length; p++) {
        if (pRows[p][4] === 'concluido') {
          var emailAluno = (pRows[p][1] || '').toString().trim().toLowerCase();
          for (var a = 0; a < listaAlunos.length; a++) {
            if (listaAlunos[a].email.toLowerCase() === emailAluno) {
              listaAlunos[a].aulasConcluidas++;
              break;
            }
          }
        }
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

