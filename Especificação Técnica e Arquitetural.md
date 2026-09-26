# Especificação Técnica e Arquitetural — PythonLab (Apps Script + Sheets + Drive)

> [!IMPORTANT]
> ### PREMISSAS ARQUITETURAIS & FILOSOFIA PEDAGÓGICA
> 1. **Zero Execução de Código Python no Sistema**: A plataforma é **100% informativa, rica em modelos visuais conceituais e interativa**. A prática real de código ocorre no **Google Colab** ou **Jupyter Notebook**.
> 2. **Bifurcação Didática Imediata no Topo da Aula (Fast-Track vs. Deep-Dive)**: Logo no cabeçalho inicial de cada aula, o aluno visualiza uma divisão clara entre **"Explicações & Fundamentos"** e **"Exercícios Propostos & Prática"**. O aluno decide de imediato se precisa consolidar a teoria (simulação passo a passo, memória Stack x Heap, trace tables e exercício resolvido) ou se prefere saltar diretamente para os desafios práticos no Colab/Jupyter.
> 3. **Suporte a Imagens Didáticas Opcionais do Professor em Cada Questão**: Toda e qualquer questão da plataforma (exercícios resolvidos de exemplo, atividades práticas propostas em cada bloco temático ou desafios integradores) possui suporte nativo para o professor anexar uma imagem explicativa (diagramas conceituais, anotações de lousa, esquemas mentais, ilustrações de apoio, tabelas I/O ou mapas de fluxo). O anexo de imagem é **estritamente opcional**: se o professor não cadastrar imagem, o aluno/visitante visualiza a questão com diagramação limpa sem espaços vazios. Essas imagens são salvas automaticamente em uma pasta do Google Drive denominada **`imagens`**, localizada exatamente no mesmo diretório pai que contém a planilha-mestre do projeto, com metadados persistidos na aba **`Imagens_Exercicios`**.
> 4. **Autorresponsabilidade na Gestão da Aprendizagem**: Não existe juiz automático punitivo ou bloqueio artificial. O **próprio aluno é o responsável por sinalizar sua evolução**, com dois propósitos fundamentais:
>    - **Saber onde parou e dar prosseguimento**: Retomar os estudos com 1 clique exatamente do tópico onde interrompeu sua sessão anterior;
>    - **Identificar no que precisa tirar dúvidas com o professor**: Sinalizar conceitos ou exercícios difíceis, registrar perguntas no "Caderno de Dúvidas" e chegar à aula/monitoria com foco cirúrgico no que precisa destravar.
> 5. **Ponte Didática para o Colab/Jupyter**: Códigos iniciais copiáveis com 1 clique, especificações detalhadas de I/O (entradas vs saídas esperadas), gabaritos comentados para comparação e autoavaliação formativa.

---

## 1. Visão Geral do Projeto

O **PythonLab** é uma plataforma educacional interativa construída sobre o ecossistema do **Google Workspace** (Google Apps Script + Google Sheets + Google Drive), com custo zero de infraestrutura e sem necessidade de servidores dedicados de backend.

O foco didático central é transformar o aprendizado de algoritmos em uma experiência visual intuitiva, revelando a "caixa-preta" de CPython:
- O que ocorre na **Call Stack** (frames locais e identificadores de variáveis);
- Como funciona o **Heap Space** (alocação de objetos, imutabilidade de tipos primitivos e ponteiros);
- Como rastrear iterações e condições através de **Tabelas de Teste de Mesa (Trace Tables)**;
- Prática assistida que incentiva o aluno a codificar em ferramentas profissionais de ciência de dados (**Jupyter Notebook** e **Google Colab**);
- Enriquecimento visual com **imagens didáticas opcionais anexadas pelos educadores em qualquer questão da trilha** e **navegação bifurcada no início de cada aula** para respeito ao ritmo individual de cada aprendiz.

---

## 2. Arquitetura do Sistema e Fluxo de Trabalho

```mermaid
graph TD
    subgraph Aluno_Ambiente ["Ambiente Prático do Aluno (Execução Real)"]
        Colab["Google Colab (Nuvem)"]
        Jupyter["Jupyter Notebook (Local)"]
    end

    subgraph PythonLab_Frontend ["PythonLab SPA (Apps Script HtmlService)"]
        Shell["Shell Unificado (Navbar + Streak + XP)"]
        
        subgraph Topo_Aula ["Topo da Página da Aula: Divisor Didático Imediato"]
            NavBifurcada{"Escolha do Estudante"}
            Trilha1["Trilha 1: 📖 Explicações & Fundamentos"]
            Trilha2["Trilha 2: 🛠️ Exercícios Propostos & Prática"]
        end

        subgraph Modulo_Explicacoes ["Conteúdo: Explicações & Fundamentos"]
            T2["Player Passo a Passo (Linha Ativa & Console Stdout)"]
            T3["Simulador de Memória CPython (Stack x Heap)"]
            T3b["Tabela de Teste de Mesa (Trace Table)"]
            T4_Resolvido["Exercício Resolvido + Slot de Imagem Opcional"]
        end
        
        subgraph Modulo_Pratica ["Conteúdo: Oficina de Prática"]
            T4_Proposto["Exercícios Propostos (Blocos A, B, C) + Slots de Imagem Opcional"]
            T4_Desafio["Exercício Desafio Integrador + Slot de Imagem Opcional"]
            Bridge["Ação: Copiar Código com 1 Clique / Abrir no Colab"]
            Checklist["Checklist de Validação & Conclusão de XP"]
        end
    end

    subgraph Google_Workspace ["Backend & Armazenamento (Google Workspace)"]
        GAS["Google Apps Script (Code.gs)"]
        
        subgraph Pasta_Raiz_Drive ["Pasta do Projeto no Google Drive"]
            Sheets[("Google Sheets (Planilha-Mestre)")]
            PastaImagens[("Pasta 'imagens' (Google Drive)")]
        end
        
        GAS <-->|SpreadsheetApp| Sheets
        GAS <-->|DriveApp| PastaImagens
        
        Tab1[("Aba 'Usuarios'")]
        Tab2[("Aba 'Progresso'")]
        Tab3[("Aba 'Catalogo_Aulas'")]
        Tab4[("Aba 'Imagens_Exercicios'")]
        Sheets --- Tab1
        Sheets --- Tab2
        Sheets --- Tab3
        Sheets --- Tab4
    end

    Shell --> Topo_Aula
    NavBifurcada -->|Quero entender os conceitos| Trilha1
    NavBifurcada -->|Quero ir direto para o código| Trilha2
    Trilha1 --> Modulo_Explicacoes
    Trilha2 --> Modulo_Pratica

    T4_Proposto --> Bridge
    T4_Desafio --> Bridge
    Bridge -.->|Aluno cola o código e executa| Colab
    Bridge -.->|Aluno cola o código e executa| Jupyter
    Colab -.->|Aluno confere saída esperada| Checklist
    Jupyter -.->|Aluno confere saída esperada| Checklist
    Checklist -->|google.script.run.salvarProgresso| GAS
    
    Prof["Professor Autenticado"] -->|Upload de Imagem Didática em Qualquer Questão| GAS
    GAS -->|Salva arquivo de imagem| PastaImagens
    PastaImagens -.->|Serve URL / Thumbnail para o frontend| T4_Resolvido
    PastaImagens -.->|Serve URL / Thumbnail para o frontend| T4_Proposto
    PastaImagens -.->|Serve URL / Thumbnail para o frontend| T4_Desafio
```

---

## 3. Arquitetura Híbrida: Flexibilidade para Novas Aulas

Para permitir que o catálogo de aulas evolua continuamente de forma modular, padronizada e sem necessidade de alterar o roteador central:

1. **Repositório de Especificações Didáticas (`/aulas`)**:
   - Todas as novas aulas têm suas orientações pedagógicas registradas na pasta **`aulas/`** em formato Markdown (ex.: `aulas/aula1_2.md`, `aulas/aula1_3.md`).
   - Cada arquivo `.md` contém a estrutura canônica: metadados (XP, tempo sugerido), fundamentos teóricos, diagramas conceituais (Call Stack x Heap), testes de mesa passo a passo (Trace Table), caderno de oficinas práticas (Blocos A, B, C), especificações de I/O para os desafios integradores e indicação de imagem didática opcional de apoio para cada questão (exercícios resolvidos, propostos e desafios).
2. **Templates de Componentes Reutilizáveis (`AulaX_Y.html`)**:
   - Com base no arquivo `.md` correspondente na pasta `aulas/`, é gerado o arquivo parcial HTML (ex.: `Aula1_2.html`, `Aula1_3.html`) utilizando o Design System estabelecido em `Style.html` e `Script.html`.
   - Incorpora obrigatoriamente o **Divisor Didático no Topo**, permitindo ao usuário alternar instantaneamente entre a trilha conceitual e a trilha prática.
   - Contém os containers/slots visuais (`.questao-imagem-slot` e `.exercicio-resolvido-slot`) para **cada questão da aula**, permitindo que o professor anexe imagens explicativas opcionais gerenciadas dinamicamente.
3. **Google Sheets como Catálogo Dinâmico (`Catalogo_Aulas`)**:
   - Cada linha na planilha representa uma aula com seu ID, módulo, título, status (*publicado*, *rascunho*, *bloqueado*), XP base e o nome do arquivo HTML correspondente.
4. **Inclusão Dinâmica de Conteúdo**:
   - O `Code.gs` obtém o catálogo e inclui o arquivo HTML via `HtmlService.createHtmlOutputFromFile(arquivoHtml).getContent()`.
   - Adicionar uma nova aula no futuro requer apenas:
     - 1. Adicionar o arquivo de orientações em `aulas/aulaX_Y.md` com os slots de cada questão;
     - 2. Criar o arquivo HTML modular correspondente (`AulaX_Y.html`);
     - 3. Inserir a linha de registro na aba `Catalogo_Aulas` da planilha.

---

## 4. Modelagem de Dados no Google Sheets e Armazenamento no Google Drive

O ecossistema utiliza a planilha como banco relacional e o Google Drive como repositório de mídias didáticas:

### 4.1. Aba `Usuarios`
| Campo | Tipo | Exemplo | Descrição |
| :--- | :--- | :--- | :--- |
| `email` | String (PK) | `marina.costa@aluno.com` | E-mail capturado via `Session.getActiveUser().getEmail()` ou modal. |
| `nome` | String | `Marina Costa` | Nome de exibição do estudante ou educador. |
| `perfil` | Enum | `visitante` \| `aluno` \| `professor` | Nível de permissão no sistema. |
| `data_cadastro` | DateTime (ISO) | `2026-03-01T10:00:00Z` | Data/hora do primeiro acesso. |
| `xp_total` | Integer | `480` | Pontuação total acumulada na jornada. |
| `ultimo_acesso` | DateTime (ISO) | `2026-09-25T14:30:00Z` | Timestamp da última interação. |

### 4.2. Aba `Catalogo_Aulas`
| Campo | Tipo | Exemplo | Descrição |
| :--- | :--- | :--- | :--- |
| `id_aula` | String (PK) | `aula_1_2` | Identificador único de rota. |
| `modulo` | String | `Módulo 1: Fundamentos de CPython` | Nome agrupador do módulo. |
| `ordem_modulo` | Integer | `1` | Ordenação numérica do módulo. |
| `titulo` | String | `Variáveis, Memória Stack vs Heap e Casting` | Título oficial exibido nos cards. |
| `arquivo_html` | String | `Aula1_2` | Nome do arquivo HTML parcial no Apps Script. |
| `ordem` | Integer | `2` | Posição sequencial da aula no módulo. |
| `status` | Enum | `publicado` \| `rascunho` \| `bloqueado` | Controle de visibilidade (`rascunho` visível apenas a professores). |
| `xp_base` | Integer | `120` | Quantidade de XP concedida ao concluir. |
| `tempo_estimado`| String | `15 min` | Tempo estimado de leitura e prática. |
| `descricao` | String | `Comportamento dos identificadores locais...` | Resumo pedagógico do tópico. |

### 4.3. Aba `Progresso`
| Campo | Tipo | Exemplo | Descrição |
| :--- | :--- | :--- | :--- |
| `id_registro` | String (PK) | `marina@aluno.com_aula_1_2_geral` | Chave composta: `{email}_{id_aula}_{id_topico}`. |
| `email_aluno` | String (FK) | `marina.costa@aluno.com` | Referência ao usuário. |
| `id_aula` | String (FK) | `aula_1_2` | Referência à aula. |
| `id_topico` | String | `memoria_casting` | Tópico ou subtarefa. |
| `status` | Enum | `concluido` \| `em_andamento` \| `com_duvidas` | Gestão de autonomia: onde parou, concluído ou com dúvida. |
| `exercicio_resolvido_visto` | Boolean | `TRUE` | Visualizou o teste de mesa e decomposição. |
| `exercicio_proposto_concluido`| Boolean | `TRUE` | Resolveu no Colab/Jupyter e validou os casos I/O. |
| `desafio_concluido` | Boolean | `FALSE` | Concluiu o desafio avançado no Notebook. |
| `anotacao_duvida` | String | `"Não entendi por que y manteve o endereço 0x10A0"` | Pergunta específica registrada para a monitoria. |
| `xp_obtido` | Integer | `80` | Pontuação creditada pela etapa. |
| `data_conclusao` | DateTime (ISO) | `2026-09-25T14:40:00Z` | Data e hora da conclusão ou última atualização. |

### 4.4. Aba `Imagens_Exercicios` (Armazenamento de Metadados de Mídia)
| Campo | Tipo | Exemplo | Descrição |
| :--- | :--- | :--- | :--- |
| `id_imagem` | String (PK) | `img_aula_1_2_bloco_a_atv_2` | Identificador único da imagem associada à questão ou exercício. |
| `id_aula` | String (FK) | `aula_1_2` | Referência da aula a que pertence a questão. |
| `id_exercicio` | String | `bloco_a_atv_2` | Identificador da questão ou exercício (ex.: `resolvido_bloco_a`, `bloco_a_atv_2`, `desafio_1`, `desafio_mestre`). |
| `drive_file_id` | String | `1A2b3C4d5E6f...` | ID interno do arquivo criado no Google Drive. |
| `url_visualizacao`| String | `https://drive.google.com/thumbnail?id=...` | URL direta para renderização otimizada no frontend. |
| `legenda` | String | `"Diagrama de Lousa: Transição de Ponteiros x e y"` | Descrição acessível ou legenda explicativa. |
| `uploaded_by` | String | `professor@instituto.edu.br` | E-mail do professor que enviou o material. |
| `data_upload` | DateTime (ISO) | `2026-09-25T22:50:00Z` | Timestamp do upload ou substituição da imagem. |

### 4.5. Estrutura e Diretrizes da Pasta `imagens` no Google Drive
1. **Regra Obrigatória de Localização**:
   - A pasta `imagens` deve obrigatoriamente residir dentro do **mesmo diretório pai** onde se encontra a Planilha-Mestre do Google Sheets.
   - Resolução dinâmica no Apps Script:
     ```javascript
     function obterOuCriarPastaImagens() {
       var planilhaId = SpreadsheetApp.getActiveSpreadsheet().getId();
       var arquivoPlanilha = DriveApp.getFileById(planilhaId);
       var pais = arquivoPlanilha.getParents();
       var pastaPai = pais.hasNext() ? pais.next() : DriveApp.getRootFolder();
       
       var pastas = pastaPai.getFoldersByName('imagens');
       if (pastas.hasNext()) {
         return pastas.next();
       } else {
         var novaPasta = pastaPai.createFolder('imagens');
         novaPasta.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
         return novaPasta;
       }
     }
     ```
2. **Políticas de Acesso e Exibição**:
   - Os arquivos de imagem salvos na pasta recebem permissão de leitura para quem possui o link (`DriveApp.Access.ANYONE_WITH_LINK`), permitindo que a imagem seja visualizada sem restrição na página web por alunos e visitantes.
   - O frontend renderiza a imagem com visualizador responsivo em alta definição com recurso de zoom/modal (*lightbox*).
3. **Padrão de Nomenclatura dos Arquivos**:
   - `questao_{id_aula}_{id_exercicio}_{timestamp}.png` (ou `.jpg`).

---

## 5. Níveis de Acesso e Regras de Negócio

1. **Visitante (Usuário sem e-mail conectado ou não autenticado)**:
   - Acesso irrestrito a todas as aulas, infográficos, simuladores visuais de memória, testes de mesa e imagens didáticas de todas as questões;
   - Pode navegar livremente pelo **Divisor de Topo** entre Explicações e Exercícios Propostos;
   - Pode copiar os códigos e enunciados livremente para o Google Colab ou Jupyter;
   - Ao clicar em *"Concluir Aula"*, *"Salvar XP"* ou no avatar superior, a interface exibe o modal convidando à conexão do perfil por e-mail (ex: `neylor@gmail.com`).
2. **Aluno (E-mail cadastrado na aba `Usuarios`)**:
   - Identificado via sessão Google institucional ou conectando seu e-mail no modal (salvo no `localStorage`);
   - Salva o progresso das aulas e acumula XP diretamente na planilha do professor;
   - Visualiza no Dashboard seu streak de dias, metas e taxa de conclusão da trilha;
   - Tem acesso a dicas escalonadas, gabaritos comentados e visualização em tela cheia (*lightbox modal*) das imagens didáticas de cada questão.
3. **Professor (E-mail validado com perfil `professor`)**:
   - Permissões completas de aluno;
   - Visualização antecipada de aulas com status `rascunho`;
   - **Gerenciamento de Imagens Didáticas em Qualquer Questão**: Capacidade de anexar, alterar ou excluir a imagem explicativa de **qualquer questão** (exercícios resolvidos, atividades propostas de cada bloco ou desafios práticos), com upload direto para a pasta `imagens` do Google Drive e sincronização imediata na aba `Imagens_Exercicios`;
   - **Painel Administrativo da Turma**: Tabela consolidada com taxa de conclusão individual de todos os alunos, total de XP, anotações de dúvidas registradas e data do último acesso.

> [!NOTE]
> **Compatibilidade com Contas @gmail.com**: Como implantações executadas em modo *"Executar como: Eu"* não expõem o e-mail de contas Google pessoais por privacidade do Google, o sistema adota um modelo híbrido: tenta capturar o e-mail via `Session.getActiveUser().getEmail()` e, caso venha vazio, permite que o aluno ou professor se identifique informando seu e-mail no modal, armazenando com segurança no `localStorage` do navegador para manter a sessão ativa.

---

## 6. Componentes Pedagógicos Obrigatórios em Cada Aula

Cada arquivo de aula (ex: `Aula1_2.html`) deve estruturar o aprendizado através da seguinte arquitetura de componentes:

### Componente 0: Divisor Didático de Topo (Navegador Bifurcado)
- **Posicionamento**: Imediatamente após o cabeçalho principal da aula (título, módulo, XP e badges de status);
- **Objetivo**: Permitir que o estudante tome uma decisão consciente de aprendizado nos primeiros segundos de contato com a página:
  1. **📖 Explicações & Fundamentos Conceituais**: Foco em modelagem mental, visualização de ponteiros, rastreio em tabelas de teste de mesa e estudo do exercício resolvido com anotações visuais do professor;
  2. **🛠️ Oficina Prática & Exercícios Propostos**: Foco em "mão na massa", abrindo diretamente o enunciado, bateria de casos de teste I/O e botão de copiar código para o Google Colab ou Jupyter Notebook.
- **Mecanismo de Interação**:
  - Seletor estilo *Segmented Pill Tabs* de alto contraste e transição fluida;
  - Suporte a rolagem ancorada suave (*smooth scroll*) ou alternância dinâmica de abas com preservação do estado de leitura.

### Componente 1: Visor de Código com Simulação Passo a Passo
- Código-fonte modelo com sintaxe colorida em tema escuro (Obsidian Slate);
- Botões de navegação (*Passo Anterior* / *Próximo Passo* / Seletores numéricos);
- Destaque em tempo real da linha ativa e exibição da saída progressiva no console Stdout simulado;
- Card com explicação didática contextual de cada passo algorítmico.

### Componente 2: Diagrama Visual de Memória CPython (Stack x Heap)
- **Call Stack (Frame Local)**: Mostra as variáveis locais e seus ponteiros para endereços de memória;
- **Heap Space**: Demonstra visualmente as células de alocação de objetos (inteiros, strings, floats, listas);
- Evidencia a **imutabilidade** (ex.: ao executar `x += 5`, `x` aponta para um novo objeto, e não sobrescreve o valor anterior).

### Componente 3: Tabela de Rastreio (Trace Table / Teste de Mesa)
- Tabela com colunas: *Passo*, *Linha do Código*, *Variáveis*, *Condição Avaliada* e *Saída no Terminal*;
- Destaca a linha correspondente ao passo selecionado no Player, demonstrando como simular o algoritmo manualmente no papel antes de codificar.

### Componente 4: Oficina de Prática e Exercícios

#### 4.1. Exercício Resolvido com Suporte a Imagem Didática do Professor
- **Decomposição Algorítmica**: Explicação do problema, raciocínio passo a passo e solução modelo comentada;
- **Slot de Imagem Didática do Professor (`.exercicio-resolvido-slot`)**:
  - Área visual integrada ao card do exercício para exibição de esquemas gráficos, fotos de lousa ou diagramas criados pelo educador;
  - Armazenamento em nuvem na pasta **`imagens`** (no mesmo diretório da planilha no Google Drive);
  - Interface adaptativa (visível com zoom para alunos; botões de gerenciar/excluir para professores).

#### 4.2. Exercícios Propostos com Suporte a Imagem Didática Opcional em Cada Questão
- **Slot de Imagem Didática por Questão (`.questao-imagem-slot`)**:
  - **Cada questão individual** (atividades propostas de 2 a 10 em cada bloco temático) conta com suporte a uma imagem didática opcional anexada pelo educador;
  - **Totalmente Opcional**: Se nenhuma imagem for anexada pelo professor, o slot permanece oculto (`display: none`) para alunos e visitantes, mantendo o design limpo;
  - **Gestão pelo Professor**: Professores visualizam um botão discreto (*"📷 Anexar Imagem [Professor]"*) permitindo anexar esquemas visuais, ilustrações ou anotações de lousa específicas daquela questão;
- Tabela com cenários de **Aprovação** e **Rejeição** (Entrada do usuário vs Saída esperada);
- Botão de **1 clique "Copiar Template para Google Colab / Jupyter"** contendo comentários e bateria de casos de teste prontos;
- Instruções diretas de como abrir no Google Colab ou rodar localmente no Jupyter Notebook;
- Botão para revelar solução comentada após reflexão;
- Checklist de autoavaliação com confirmação: *"Testei no meu notebook e obtive as saídas esperadas"*.

#### 4.3. Exercício Desafio Integrador e Desafios Práticos
- Problemas abertos de maior complexidade para prática aprofundada, concedendo XP bônus e incentivando autonomia algorítmica;
- **Slot de Imagem Didática Opcional (`.questao-imagem-slot`)**: presente em cada desafio (temáticos e Desafio Mestre integrador) para diagramas de contexto, mapas de fluxo ou tabelas visuais enviadas pelo professor.

---

## 7. Estrutura de Arquivos no Apps Script e Repositório

```text
├── aulas/                  # Diretório de especificações pedagógicas em Markdown (.md)
│   ├── aula1_2.md          # Orientações, teoria, diagrama de memória, oficinas e desafios da Aula 1.2
│   └── aulaX_Y.md          # Próximas aulas adicionadas continuamente no mesmo padrão
├── Code.gs                 # Backend: doGet(), setupDatabase(), API RPC, DriveApp helper (pasta imagens)
├── Style.html              # Folha de estilo: Design System, divisor de topo, imagens e modais
├── Script.html             # Frontend: SPA, bifurcação didática, motor de passos, zoom e upload de imagem
├── Index.html              # Shell HTML unificado que inclui as parciais com <?!= include() ?>
├── Dashboard.html          # Painel do estudante com progresso, streak e catálogo dinâmico
├── Aula1_2.html            # Aula modelo gerada a partir de aulas/aula1_2.md (com bifurcador e slot de imagem)
├── appsscript.json         # Manifesto com runtime V8 e escopos de autorização (Drive e Sheets)
└── preview_local.html      # Ambiente de pré-visualização no navegador local sem deploy
```

> [!TIP]
> **No Google Drive**:
> ```text
> 📁 [Pasta do Projeto no Google Drive]
>  ├── 📊 Planilha-Mestre PythonLab (Google Sheets)
>  └── 📁 imagens/ (Google Drive Folder)
>       ├── resolvido_aula_1_2_ex1_1727289000.png
>       └── ...
> ```