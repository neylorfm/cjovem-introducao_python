# Especificações Técnicas e Arquiteturais para Implementação Futura
## Sistema de Avaliações/Provas Práticas (.ipynb) & Roleta de Sorteio Síncrona

> **Nota:** Este documento preserva a modelagem completa, regras de negócio, estruturas de dados (Google Sheets), integração com Google Drive e interfaces com o usuário concebidas para o **PythonLab**. Este material servirá de base para quando a equipe decidir reintegrar esses módulos.

---

## 1. Módulo de Avaliações e Provas Práticas

### 1.1. Objetivo Pedagógico
Permitir que o professor publique simulados, provas práticas e desafios avaliativos onde os estudantes façam upload de seus notebooks (`.ipynb`) ou scripts Python (`.py`), com salvamento direto na nuvem do Google Drive da turma e registro centralizado na planilha Google Sheets.

### 1.2. Estrutura de Banco de Dados (Google Sheets)

#### Aba 1: `Avaliacoes`
* `id_avaliacao` (string, ex: `eval_1727700000000`)
* `nome` (string, ex: `Prova 1 - Fundamentos e Estruturas de Decisão`)
* `status` (string: `ativa` | `inativa`)
* `data_criacao` (ISO string)
* `criado_por` (email do professor)
* `pasta_drive_id` (ID da subpasta da avaliação no Google Drive)

#### Aba 2: `Envios_Avaliacoes`
* `id_envio` (string, ex: `sub_eval_1_1727700000000`)
* `id_avaliacao` (referência para `Avaliacoes.id_avaliacao`)
* `nome_avaliacao` (string denormalizada para busca rápida)
* `email_aluno` (string, chave de identificação do aluno)
* `nome_aluno` (string, nome do aluno cadastrado ou digitado)
* `nome_arquivo_drive` (string, nome final padronizado do arquivo)
* `drive_file_id` (string, ID do arquivo salvo no Google Drive)
* `drive_file_url` (string, URL direta do arquivo no Drive)
* `data_envio` (ISO string do momento da entrega)
* `tamanho_bytes` (número inteiro)

### 1.3. Regras de Integração com Google Drive
1. **Hierarquia de Pastas**:
   * Uma pasta raiz chamada `Avaliacoes` é criada dinamicamente na mesma pasta do Google Drive onde reside a planilha mestre do sistema.
   * Para cada avaliação criada, o sistema cria uma subpasta dedicada com o nome da avaliação (ex: `Avaliacoes/Prova 1 - Fundamentos e Decisão/`).
2. **Convenção Padronizada de Nomes de Arquivo**:
   * `[Nome_da_Avaliacao]_[Nome_do_Aluno]_[Nome_Original]_[HH_mm_dd_MM].[ext]`
   * Exemplo: `Prova_1_Marina_Costa_exercicio_resolvido_14_30_29_09.ipynb`
   * Caracteres especiais e acentos são sanitizados via `limparTexto()`.
3. **Substituição Formativa de Arquivos**:
   * O aluno pode reenviar o arquivo caso a prova ainda esteja com status `ativa`.
   * Ao reenviar, o arquivo anterior na pasta do Drive é enviado para a lixeira (`setTrashed(true)`) e a linha correspondente na aba `Envios_Avaliacoes` é atualizada com os dados do novo arquivo.

### 1.4. Endpoints RPC no Backend (Google Apps Script)
* `obterAvaliacaoAtiva(emailAluno)`: Retorna a avaliação atualmente aberta (`status === 'ativa'`) e se o aluno já realizou envio.
* `listarAvaliacoes(emailParam)`: Lista todas as avaliações cadastradas com total de envios de cada uma (restrito a professor).
* `salvarAvaliacao(dados, emailParam)`: Cria ou edita uma avaliação e provisiona a pasta no Drive.
* `alternarStatusAvaliacao(idAvaliacao, ativar, emailParam)`: Ativa ou desativa a prova (apenas uma pode estar ativa por vez).
* `excluirAvaliacao(idAvaliacao, emailParam)`: Remove a avaliação e desativa os envios.
* `listarEnviosAvaliacao(idAvaliacao, emailParam)`: Retorna a lista detalhada de submissões dos estudantes.
* `enviarArquivoAvaliacao(params)`: Recebe `base64Data`, decodifica via `Utilities.base64Decode`, cria o arquivo no Drive e registra na planilha.

---

## 2. Módulo de Roleta de Sorteio Síncrona da Turma

### 2.1. Objetivo Pedagógico
Proporcionar dinâmicas ativas e engajadoras durante as aulas ao vivo, permitindo ao professor sortear alunos para responder a exercícios, apresentar soluções de código ou participar de dinâmicas em grupo.

### 2.2. Arquitetura Síncrona e Algoritmo de Sorteio
1. **Filtro de Alunos Aptos**:
   * Busca todos os estudantes cadastrados na aba `Usuarios` (com perfil `aluno`).
   * Exclui alunos marcados como `ausente` ou alunos que já foram sorteados na sessão atual (para garantir rotatividade justa até que todos tenham participado).
2. **Buffer de Sincronização**:
   * O professor clica em "Girar Roleta".
   * O backend agenda o giro com um buffer de **4 segundos** no futuro (`tempoGiroRoleta = agora + 4000`).
   * Isso garante que todas as telas conectadas comecem a animação da roda exatamente no mesmo milissegundo.
3. **Física da Roleta no Frontend (Canvas / WebGL)**:
   * A roda é dividida em fatias proporcionais (`2 * PI / N`).
   * Cada fatia possui cor alternada com contraste acessível e o primeiro nome do estudante legível radialmente.
   * Desaceleração suave por curva cúbica (`cubic-bezier(0.2, 0.8, 0.2, 1)` ou decaimento exponencial de velocidade angular).
   * Efeitos sonoros procedurais gerados via **Web Audio API** (`OscillatorNode` simulando o clique do pino da roleta e fanfarra harmônica na consagração do sorteado).
   * Chuva de confetes com física de gravidade e arrasto de ar renderizada em camada sobreposta de Canvas.
4. **Persistência de Histórico**:
   * Registro do aluno sorteado na aba `Sorteios_Historico` (ou `localStorage` em modo offline), com horário, tópico da aula e status de participação.

---
