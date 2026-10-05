# Especificação Técnica e Arquitetural — PythonLab (Apps Script + Sheets + Drive)

> [!IMPORTANT]
> ### PREMISSAS ARQUITETURAIS & FILOSOFIA PEDAGÓGICA
> 1. **Zero Execução de Código Python no Sistema**: A plataforma é **100% informativa, rica em modelos visuais conceituais e interativa**. A prática real de código ocorre no **Google Colab** ou **Jupyter Notebook**.
> 2. **Onde Estão as Orientações Pedagógicas para as Aulas**: As orientações completas, diretrizes curriculares, enunciados, gabaritos e planejamentos de cada aula **residem estritamente dentro da pasta `aulas/`, em formato Markdown (`.md`)** (ex.: `aulas/aula1_2.md`, `aulas/aula1_3.md`, etc.). O arquivo `.md` é a **fonte primária e oficial da verdade** para a implementação dos componentes modulares `AulaX_Y.html` da aplicação.
> 3. **Bifurcação Didática Imediata no Topo da Aula (Fast-Track vs. Deep-Dive)**: Logo no cabeçalho inicial de cada aula, o aluno visualiza uma divisão clara entre **"Explicações & Fundamentos"** e **"Exercícios Propostos & Prática"**. O aluno decide de imediato se precisa consolidar a teoria (simulação passo a passo, memória Stack x Heap, trace tables e exercício resolvido) ou se prefere saltar diretamente para os desafios práticos no Colab/Jupyter.
> 4. **Suporte a Imagens Didáticas Opcionais do Professor em Cada Questão**: Toda e qualquer questão da plataforma (exercícios resolvidos de exemplo, atividades práticas propostas em cada bloco temático ou desafios integradores) possui suporte nativo para o professor anexar uma imagem explicativa (diagramas conceituais, anotações de lousa, esquemas mentais, ilustrações de apoio, tabelas I/O ou mapas de fluxo). O anexo de imagem é **estritamente opcional**: se o professor não cadastrar imagem, o aluno/visitante visualiza a questão com diagramação limpa sem espaços vazios. Essas imagens são salvas automaticamente em uma pasta do Google Drive denominada **`imagens`**, localizada exatamente no mesmo diretório pai que contém a planilha-mestre do projeto, com metadados persistidos na aba **`Imagens_Exercicios`**.
> 5. **Autorresponsabilidade na Gestão da Aprendizagem**: Não existe juiz automático punitivo ou bloqueio artificial. O **próprio aluno é o responsável por sinalizar sua evolução**, com dois propósitos fundamentais:
>    - **Saber onde parou e dar prosseguimento**: Retomar os estudos com 1 clique exatamente do tópico onde interrompeu sua sessão anterior;
>    - **Identificar no que precisa tirar dúvidas com o professor**: Sinalizar conceitos ou exercícios difíceis, registrar perguntas no "Caderno de Dúvidas" e chegar à aula/monitoria com foco cirúrgico no que precisa destravar.
> 6. **Ponte Didática para o Colab/Jupyter**: Códigos iniciais copiáveis com 1 clique, especificações detalhadas de I/O (entradas vs saídas esperadas), gabaritos comentados para comparação e autoavaliação formativa.

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
├── aulas/                  # Diretório de especificações pedagógicas canônicas em Markdown (.md)
│   ├── aula1_2.md          # Orientações, teoria, diagrama de memória, oficinas e desafios da Aula 1.2
│   ├── aula1_3.md          # Orientações, teoria, operadores, precedência e desafios da Aula 1.3
│   └── aulaX_Y.md          # Próximas aulas adicionadas continuamente no mesmo padrão
├── Code.gs                 # Backend: doGet(), setupDatabase(), API RPC, DriveApp helper (pasta imagens)
├── Style.html              # Folha de estilo: Design System, divisor de topo, imagens e modais
├── Script.html             # Frontend: SPA, bifurcação didática, motor de passos, zoom e upload de imagem
├── Index.html              # Shell HTML unificado que inclui as parciais com <?!= include() ?>
├── Dashboard.html          # Painel do estudante com progresso, streak e catálogo dinâmico
├── Aula1_2.html            # Componente modular gerado a partir de aulas/aula1_2.md
├── Aula1_3.html            # Componente modular gerado a partir de aulas/aula1_3.md
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

---

## 8. Guia Canônico e Checklist para Criação de Novas Aulas ("Padrão de Fábrica")

Este guia estabelece o **contrato técnico e pedagógico obrigatório** para criar qualquer nova aula no ecossistema PythonLab (ex.: Aula 1.4, Aula 1.5, Módulo 2, etc.), garantindo consistência visual, interoperabilidade no Google Apps Script, sincronização com o Google Sheets/Drive e suporte a testes offline.

### 8.1. Convenção Estrita de Nomenclatura e Numeração

| Entidade | Padrão de Nomenclatura | Exemplo (Aula 1.4) |
| :--- | :--- | :--- |
| **Identificador da Aula (`id_aula`)** | `aula_X_Y` (minúsculo, separado por underline) | `aula_1_4` |
| **Numeração Exibida no Card (Badge)** | Derivada canonicamente de `id_aula` (`aula_X_Y` -> `Aula X.Y`) | `Aula 1.4` |
| **Coluna `ordem` no Google Sheets** | Número sequencial exato da aula no módulo (sempre igual a `Y`) | `4` (Aula 1.2 = `2`, Aula 1.3 = `3`) |
| **Documento Pedagógico Canônico** | `aulas/aulaX_Y.md` | `aulas/aula1_4.md` |
| **Componente Visual HTML** | `AulaX_Y.html` (PascalCase, sem underline) | `Aula1_4.html` |
| **ID do Template SPA (Client-side)** | `template-aula-X-Y` (hífen minúsculo) | `template-aula-1-4` |
| **Constante de Simulação JS** | `SIMULATION_STEPS_AULAX_Y` | `SIMULATION_STEPS_AULA1_4` |
| **Slot de Imagem da Questão** | `data-img-aula="aula_X_Y"` e `data-img-exercicio="..."` | `data-img-aula="aula_1_4"` e `data-img-exercicio="secao_1_atv_1"` |

> [!CAUTION]
> **Imunidade a Inconsistências de Numeração**: Para evitar que edições acidentais na planilha afetem o nome da aula no card, o frontend **sempre deriva o badge a partir do `id_aula`** (ex.: `aula_1_3` sempre exibe `Aula 1.3`). Além disso, as rotinas de sincronização no backend (`Code.gs`) realizam auto-correção na planilha para garantir que a coluna `ordem` coincida com a posição numérica correspondente (Aula 1.2 -> `2`, Aula 1.3 -> `3`, Aula 1.4 -> `4`).

---

### 8.2. Checklist dos 6 Arquivos Obrigatórios por Nova Aula

Ao criar uma nova aula, **exatamente 6 pontos no projeto** devem ser implementados/atualizados:

```text
[ ] 1. aulas/aulaX_Y.md        -> Fonte primária da verdade (conteúdo pedagógico, enunciados, gabaritos e desafios)
[ ] 2. AulaX_Y.html            -> Interface visual completa montada com as classes do Design System
[ ] 3. Index.html              -> Inclusão do <template id="template-aula-X-Y"><?!= include('AulaX_Y'); ?></template>
[ ] 4. Code.gs                 -> Registro no auto-sync (sincronizarAulasPadraoNoCatalogo com ordem correta) e mapaFallback
[ ] 5. Script.html             -> Constante de simulação, switch de abas, funções do Desafio Mestre e abrirAula()
[ ] 6. preview_local.html      -> Inclusão do template e rotinas JS para validação local offline em 2 cliques
```

---

### 8.3. Anatomia Padronizada do Arquivo `AulaX_Y.html`

Todo arquivo `AulaX_Y.html` deve seguir rigidamente a seguinte hierarquia visual:

```html
<div class="view-section" id="view-aula">

  <!-- 1. CABEÇALHO DA AULA (Responsivo: .lesson-header-card) -->
  <div class="lesson-header-card" style="...">
    <div>
      <!-- Breadcrumbs (Módulo > Aula), Badges de Dificuldade, Tempo e XP Base -->
      <h1 class="lesson-main-title">...</h1>
    </div>
    <!-- 3 Botões de Gestão pelo Aluno (.lesson-header-actions):
         - 📍 Marcar Onde Parei: onclick="marcarComoOndeParei('aula_X_Y', 'Título')"
         - ❓ Tenho Dúvidas: onclick="abrirModalDuvida('aula_X_Y', 'Tópico')"
         - 🏆 Concluir Aula (+XP Base): .btn-concluir-action onclick="concluirEtapaAtual()" -->
    <div class="lesson-header-actions">...</div>
  </div>

  <!-- 2. DIVISOR DIDÁTICO NO TOPO (Bifurcação Fast-Track vs Deep-Dive) -->
  <div class="lesson-mode-bifurcator" id="lesson-mode-bifurcator">
    <!-- Botão 1: 📖 Explicações & Fundamentos (onclick="setModoVisualizacaoAula('explicacoes')") -->
    <!-- Botão 2: 🛠️ Exercícios Propostos & Prática (onclick="setModoVisualizacaoAula('pratica')") -->
    <!-- Botão 3: 👁️ Visualização Completa (onclick="setModoVisualizacaoAula('tudo')") -->
  </div>

  <!-- ======================================================================
       BLOCO A: EXPLICAÇÕES & FUNDAMENTOS CONCEITUAIS (.secao-explicacoes)
       ====================================================================== -->
  <div class="secao-explicacoes">
    
    <!-- A.1 Alerta de Ambiente (Jupyter Notebook / Google Colab) -->
    
    <!-- A.2 Infográficos de Lógica e Decomposição Algorítmica -->
    <!-- Cards visuais destacando os conceitos fundamentais da aula -->
    <!-- Se contiver diagramas ou fluxogramas em texto/ASCII, envelopar obrigatoriamente:
         <div class="ascii-flowchart-card"><pre class="ascii-flowchart-box">...</pre></div> -->
    
    <!-- A.3 Tabela Sintática / Operadores / Regras de Precedência -->
    <!-- Tabelas estilizadas envelopadas em <div class="trace-table-container"><table class="trace-table"> -->
    
    <!-- A.4 Simulador de Memória CPython (Stack vs Heap) -->
    <!-- Representação visual de Call Stack (Frames e identificadores locais) vs Heap Space -->
    <!-- Evidenciar imutabilidade de tipos primitivos e ponteiros de endereços -->
    
    <!-- A.5 Player Interativo de Linha Ativa + Console Stdout + Teste de Mesa (Trace Table) -->
    <!-- Barra de Stepper: <div class="stepper-header-row">
         Controles de Passo: <div class="stepper-controls-container">
           - Botão Anterior: id="btn-step-prev" onclick="prevStep()"
           - Botões Numéricos Roláveis: <div id="step-buttons-container"></div>
           - Botão Próximo: id="btn-step-next" onclick="nextStep()" -->
    
    <!-- A.6 Exercício Resolvido de Demonstração -->
    <!-- Decomposição passo a passo, código comentado e:
         Slot de Imagem do Professor: class="exercicio-resolvido-slot"
         com data-img-aula="aula_X_Y" e data-img-exercicio="resolvido_ex1" -->

  </div>

  <!-- ======================================================================
       BLOCO B: OFICINAS & EXERCÍCIOS PRÁTICOS (.secao-exercicios)
       ====================================================================== -->
  <div class="secao-exercicios">
    
    <!-- B.1 Navegador de Abas por Seções ou Blocos Temáticos (.oficina-subtabs-bar) -->
    <!-- Contêiner de chips deslizantes: <div class="oficina-subtabs-bar">
         Botões das seções: .btn com onclick="switchOficinaBloco('secao-1')", etc.
         Botão Obrigatório de Desafios: id="btn-tab-desafios" onclick="switchOficinaBloco('desafios')" -->
    
    <!-- B.2 Painéis Individuais por Seção (.oficina-panel) -->
    <!-- Cada seção temática deve possuir: class="oficina-panel" id="panel-secao-X"
         Para CADA questão proposta:
         1. Enunciado claro com especificações de entradas e saídas esperadas
         2. SLOT DE IMAGEM DIDÁTICA DO PROFESSOR (Obrigatório em 100% das questões):
            <div class="questao-imagem-slot" data-img-aula="aula_X_Y" data-img-exercicio="secao_1_atv_1"></div>
         3. Gabarito comentado expansível com toggle individual
         4. Botão de feedback/conclusão de etapa (+XP) -->
         
    <!-- B.3 Painel Exclusivo de Desafios (.oficina-panel id="panel-desafios" style="display: none;") -->
    <!-- 1. Desafios Integradores de Código (Desafios Temáticos Intermediários)
         2. Desafio Mestre Integrador (Clímax da Aula):
            - Enunciado contextualizado com regras de negócio realistas
            - Slot de Imagem Didática Opcional (data-img-exercicio="desafio_mestre")
            - Tabela de Casos de Validação I/O (mínimo de 2 cenários completos)
            - Botão com 1 clique para Copiar Template Python para Área de Transferência
            - Gabarito comentado expansível
            - Checklist interativo de autoavaliação (mínimo de 4 itens checkbox)
            - Botão reativo "Homologar Desafio Mestre (+60 XP)" habilitado apenas com checklist 100% -->

  </div>

  <!-- 3. GUIA DE AMBIENTE NO RODAPÉ -->
  <!-- Instruções claras de como instalar Anaconda3 (Jupyter) ou usar Google Colab -->

</div>
```

---

### 8.4. Regras Obrigatórias para Imagens Didáticas do Professor

1. **Onipresença dos Slots**:
   - Todo exercício resolvido deve conter o container com classe `exercicio-resolvido-slot`.
   - **Toda e qualquer questão prática** (propostas e desafios) deve conter o container com classe `questao-imagem-slot`.
2. **Atributos Obrigatórios**:
   - `data-img-aula="aula_X_Y"`
   - `data-img-exercicio="identificador_unico"` (ex.: `secao_1_atv_1`, `secao_2_atv_5`, `desafio_1`, `desafio_mestre`).
3. **Comportamento Opcional Limpo**:
   - O slot começa vazio. Se o professor não tiver feito upload de imagem para aquele exercício, o container não exibe espaços em branco ou bordas vazias para o estudante.
   - Quando o professor está conectado, o sistema injeta automaticamente o botão discreto *"📷 Anexar Imagem [Professor]"*.

---

### 8.5. Regras Obrigatórias para o Desafio Mestre Integrador

Cada aula deve culminar em um **Desafio Mestre**:
1. **Casos de Teste Concretos**: No mínimo 2 casos com valores explícitos de entrada e saídas formatadas (com arredondamentos, unidades e booleanos esperados).
2. **Botão de 1 Clique Genérico**: Chama `copiarCodigo('codigo-gabarito-nomeaula', 'Mensagem de sucesso')`, copiando diretamente o código exibido no DOM sem duplicar strings no JavaScript.
3. **Gabarito com Toggle Universal**: Aciona `toggleGabarito('gabarito-nomeaula-body', 'gabarito-nomeaula-icon')`.
4. **Checklist Reativo Universal**: Mínimo de 4 checkboxes (`chk-[prefixo]-1`, `chk-[prefixo]-2`, etc.) que acionam `atualizarChecklist('[prefixo]', 4)`.
5. **Proteção de Submissão e Homologação de XP**: O botão de conclusão aciona `validarEConcluirDesafioMestre('desafio_mestre_[nome]', 'Título Amigável', [xp])` e só fica habilitado (`disabled = false`, opacidade 100%) quando **todos os checkboxes estiverem marcados**, concedendo a pontuação de XP formativa.

---

### 8.6. Regras de Isolamento e Navegação dos Desafios em Aba Própria (`btn-tab-desafios` / `panel-desafios`)

1. **Premissa Pedagógica e Sobrecarga Cognitiva**:
   - Os **Desafios Integradores de Código** e o **Problema Integrador para Homologação de XP (Desafio Mestre)** **NUNCA** devem ser renderizados de forma estática e persistente no rodapé de todas as seções temáticas da aula.
   - O estudante que está cursando os sub-tópicos iniciais (ex.: Seção 1, 2, 3...) não deve ter sua atenção dispersada ou ser sobrecarregado visualmente pelas dezenas de linhas dos desafios complexos finais enquanto ainda consolida a base.
2. **Botão Obrigatório na Barra de Navegação**:
   - Todas as aulas da plataforma devem incluir na barra de abas do Caderno de Práticas o botão dedicado aos desafios:
     ```html
     <button class="btn btn-outline" id="btn-tab-desafios" onclick="switchOficinaBloco('desafios')">
       🏆 Desafios & Desafio Mestre
     </button>
     ```
3. **Encapsulamento no Painel `panel-desafios`**:
   - O conjunto integral composto pelos desafios intermediários e pelo Desafio Mestre integrador deve residir estritamente dentro do container:
     ```html
     <div id="panel-desafios" class="oficina-panel" style="display: none;">
       <!-- Desafios Integradores de Código -->
       <!-- Desafio Mestre: Problema Integrador para Homologação de XP -->
     </div>
     ```
4. **Comportamento Reativo com `switchOficinaBloco('desafios')`**:
   - Ao navegar por qualquer seção temática (`secao-1`, `secao-2`, `bloco-a`, etc.), o `panel-desafios` permanece estritamente oculto (`display: none`).
   - Ao clicar em `btn-tab-desafios`, a rotina `switchOficinaBloco('desafios')` oculta o painel temático atual e torna visível exclusivamente `panel-desafios`.
   - A função `switchOficinaBloco(blocoId)` em `Script.html` e `preview_local.html` deve manter `'desafios'` permanentemente no array `todasAbas`.

---

### 8.7. Contrato de Código no Backend ([Code.gs](file:///c:/Users/T-GAMER/desenvolvimento/python-reforco/Code.gs))

Em [Code.gs](file:///c:/Users/T-GAMER/desenvolvimento/python-reforco/Code.gs), incluir a nova aula em **4 funções**:

1. **`sincronizarAulasPadraoNoCatalogo(sheetCat)`**:
   Adicionar a linha da nova aula no array `aulasObrigatorias` para auto-provisionamento em 0 cliques, garantindo que a coluna `ordem` coincida com a numeração (Aula 1.2 = 2, Aula 1.3 = 3, Aula 1.4 = 4).
2. **`setupDatabase(forcarRecriacao)`**:
   Adicionar no array `aulasSementes` para inicialização limpa de novas planilhas.
3. **`limparCatalogoParaAulasExistentes()`**:
   Adicionar no menu de manutenção da planilha.
4. **`carregarConteudoAula(idAula)`**:
   Adicionar no `mapaFallback` (`'aula_X_Y': 'AulaX_Y'`) como garantia de carregamento dinâmico.

---

### 8.8. Contrato de Código no Shell e Script ([Index.html](file:///c:/Users/T-GAMER/desenvolvimento/python-reforco/Index.html) e [Script.html](file:///c:/Users/T-GAMER/desenvolvimento/python-reforco/Script.html))

1. **Em [Index.html](file:///c:/Users/T-GAMER/desenvolvimento/python-reforco/Index.html)**:
   ```html
   <template id="template-aula-X-Y">
     <?!= include('AulaX_Y'); ?>
   </template>
   ```
2. **No próprio arquivo da aula ([AulaX_Y.html](file:///c:/Users/T-GAMER/desenvolvimento/python-reforco/AulaX_Y.html))**:
   - **Encapsulamento Total dos Dados da Aula**: O arquivo `Script.html` **NÃO deve conter arrays de passos nem strings de código hardcoded por aula**. Todos os passos do simulador CPython residem no próprio arquivo da lição em uma tag declarativa:
     ```html
     <script type="application/json" class="simulation-steps-data">
     [
       {
         "step": 0,
         "line": null,
         "insightTitle": "...",
         "insightDesc": "...",
         "stack": [ ... ],
         "heap": [ ... ],
         "stdout": "..."
       }
     ]
     </script>
     ```
   - O motor `Script.html` carrega os passos automaticamente via `obterPassosSimulacao(idAula)`.

3. **Em [Script.html](file:///c:/Users/T-GAMER/desenvolvimento/python-reforco/Script.html)**:
   - **Gerenciamento 100% Genérico e Agonístico**: `Script.html` apenas orquestra o motor do player (`initSimulation`, `goToStep`, etc.), navegação SPA (`abrirAula`) e persistência. Novas aulas são adicionadas **sem precisar alterar o Script.html para passos ou templates**.
   - As funções universais `copiarCodigo()`, `toggleGabarito()`, `atualizarChecklist()` e `validarEConcluirDesafioMestre()` atendem a todas as aulas sem nenhuma duplicação.
   - O mock de fallback do catálogo em `loadCatalog` apenas reflete as aulas disponíveis para teste offline.

---

### 8.9. Contrato de Código no Preview Offline ([preview_local.html](file:///c:/Users/T-GAMER/desenvolvimento/python-reforco/preview_local.html))

Para permitir que a nova aula seja testada no Windows com **dois cliques** sem precisar do Google Apps Script:
1. Embutir o código completo de `AulaX_Y.html` dentro de um `<template id="template-aula-X-Y">` no corpo do [preview_local.html](file:///c:/Users/T-GAMER/desenvolvimento/python-reforco/preview_local.html).
2. Com o encapsulamento local, os dados do simulador já viajam automaticamente dentro do template da aula.
3. Testar a troca de aula pelo Dashboard local confirmando que a alternância ocorre com sucesso.

---

### 8.10. Regra Canônica de Layout do Dashboard

A estrutura do Dashboard do Estudante ([Dashboard.html](file:///c:/Users/T-GAMER/desenvolvimento/python-reforco/Dashboard.html)) segue rigorosamente a ordem de prioridade visual:
1. **Banner Superior / Onde você parou**: Retomada rápida com 1 clique para a aula onde o estudante parou.
2. **Trilha de Aprendizagem & Módulos**: Posicionado **obrigatoriamente logo após o card de retomada**. Apresenta todos os módulos agrupados e cards de aulas disponíveis para acesso imediato sem necessidade de rolagem de página.
3. **Indicadores de Engajamento e Conquistas**: Métricas consolidadas (percentual de conclusão da trilha, contador de dúvidas pendentes e total de XP).
4. **Meu Caderno de Dúvidas para o Professor**: Painel de autonomia com os tópicos sinalizados pelo próprio estudante para revisão.

---

## 9. Diretrizes Canônicas de Responsividade e Ergonomia Mobile (Mobile-First)

Como a esmagadora maioria dos estudantes do projeto acessa o PythonLab através de **smartphones** (dispositivos móveis com viewports entre 360px e 430px de largura física), toda e qualquer interface da plataforma deve obedecer com rigor cirúrgico aos seguintes requisitos arquiteturais responsivos:

### 9.1. Dock de Navegação Inferior Móvel (*Mobile Bottom Navigation Dock*)
1. **Separação Estrutural**:
   - Em telas grandes (`> 768px`), a navegação reside no cabeçalho superior (`.main-nav.desktop-nav`), com botões horizontais estilizados.
   - Em celulares e telas compactas (`<= 768px`), o menu superior é ocultado (`display: none !important;`) e assume a forma de uma barra inferior fixa (`.mobile-bottom-nav`) ancorada diretamente no rodapé da viewport (`position: fixed; bottom: 0; left: 0; right: 0; z-index: 1000;`).
2. **Regra de Isolamento do Contexto de Empilhamento (Stacking / Containing Block)**:
   - O elemento `.mobile-bottom-nav` **NUNCA** deve residir como filho de elementos que utilizam `backdrop-filter`, `transform` ou `position: sticky` (como o `.app-header`), sob pena de anular o comportamento de fixação em relação à janela (conforme especificação W3C para CSS filters/backdrop-filters). O dock móvel reside diretamente sob a raiz do `<body>`.
3. **Ergonomia do Polegar**:
   - Os botões de navegação no dock móvel possuem altura mínima de 56px, ícone centralizado acima do rótulo (`flex-direction: column`) e área de toque acessível para o polegar.
4. **Compensação Inferior de Margem**:
   - O container principal da aplicação (`.app-shell`) recebe `padding-bottom: calc(4.5rem + env(safe-area-inset-bottom, 0px))` em viewports `<= 768px`, garantindo que os rodapés, botões e caixas de código nunca fiquem encobertos pelo dock.

### 9.2. Cabeçalho Limpo e Compacto no Mobile
1. **Altura Fixa e Alinhamento**:
   - No celular, o cabeçalho superior (`.app-header`) reduz para `3.5rem` de altura, mantendo apenas a marca (logotipo 🐍 **PythonLab**) alinhada à esquerda e os badges de engajamento (🔥 Sequência, ⭐ XP e Avatar) alinhados à direita.
   - A tag de perfil (`.role-tag`) e o subtítulo curricular são ocultados automaticamente no cabeçalho mobile para evitar transbordamento horizontal.

### 9.3. Stepper Responsivo com Rolagem e Auto-Centralização
1. **Container Rolável**:
   - O conjunto numérico do player passo a passo (`#step-buttons-container`) reside dentro de `.stepper-controls-container` com `overflow-x: auto; flex-wrap: nowrap; -webkit-overflow-scrolling: touch;`.
   - Botões numéricos utilizam `flex-shrink: 0; min-width: 32px; height: 32px;` preservando legibilidade mesmo em aulas com mais de 7 passos.
2. **Auto-Scroll Suave**:
   - Ao avançar ou retroceder passos via `goToStep(index)`, a rotina JavaScript aciona `activePill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });`, mantendo o número ativo sempre visível no centro da tela do celular.

### 9.4. Sub-abas de Oficinas em Formato de Chips Deslizantes
- As abas de seções temáticas e desafios no Caderno de Práticas (`.oficina-subtabs-bar`) utilizam `display: flex; flex-wrap: nowrap; overflow-x: auto; gap: 0.5rem; padding-bottom: 0.25rem;`.
- Os botões de abas não quebram em múltiplas linhas verticais caóticas; em vez disso, deslizam horizontalmente com efeito de chips (*touch swipe*).

### 9.5. Contenção Estrita de Diagramas ASCII, Código e Tabelas
1. **Diagramas e Fluxogramas ASCII**:
   - Devem ser envelopados obrigatoriamente dentro de `.ascii-flowchart-card` com o bloco de texto pré-formatado dentro de `.ascii-flowchart-box`.
   - A classe `.ascii-flowchart-box` impõe `overflow-x: auto; max-width: 100%; white-space: pre; font-size: 0.72rem;`, impedindo que linhas extensas de diagramas empurrem a largura da página.
2. **Tabelas de Rastreio (Trace Tables)**:
   - Toda e qualquer tabela (`.trace-table`) deve ser envelopada por `<div class="trace-table-container">`, com rolagem horizontal interna suave e sombra indicativa de continuidade.
3. **Visor de Código e Terminal**:
   - Classes `.code-player`, `.code-body` e `.terminal-console` têm `max-width: 100%; overflow-x: auto;` assegurando que quebras de instrução ou strings longas sejam navegáveis sem deformar o grid.

### 9.6. Prevenção de Auto-Zoom no iOS Safari / Chrome
- Em navegadores WebKit/iOS, qualquer `<input>`, `<select>` ou `<textarea>` com `font-size` inferior a 16px provoca zoom automático involuntário da tela ao receber foco, deslocando o layout da aplicação.
- Regra obrigatória: em viewports móveis, todos os campos interativos de formulário utilizam `font-size: 16px !important;`.

### 9.7. Neutralização de Grids com `minmax()` em Viewports Estreitas
- Grids desktop que utilizam `grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))` ou `minmax(300px, 1fr)` causam transbordamento lateral em smartphones de 360px a 390px (pois 300px + paddings laterais excedem a tela).
- Regra obrigatória: no media query `@media (max-width: 768px)`, todas as declarações de grid que utilizam `minmax()` acima de 220px são neutralizadas automaticamente para `grid-template-columns: 1fr !important;`.