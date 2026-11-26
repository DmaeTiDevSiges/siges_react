# Plano — Documentos (PDF) das unidades

Status: **aprovado em 26/11/2026** · Implementação: [PLANO_DOCUMENTOS_UNIDADES_IMPLEMENTACAO.md](PLANO_DOCUMENTOS_UNIDADES_IMPLEMENTACAO.md)

## Intenção

Cada unidade passa a ter uma biblioteca de documentos de consulta do dia a dia:
desenhos, plantas, diagramas, laudos, análises de risco e afins. Cada arquivo
tem tipo de documento e data.

## Objetivos

- Enviar PDF associado a uma unidade, com tipo, título, data e validade opcional.
- Consultar na tela da unidade, com filtro por tipo e busca pelo título.
- Abrir e baixar o arquivo para o aparelho.
- Cadastrar os tipos de documento em Ajustes.

## Fora do escopo

- Funcionar sem internet: não há cópia no app nem entrada na camada offline. O
  download é o comum (o arquivo fica no aparelho, fora do app).
- Aviso ou notificação de vencimento.
- Controle de revisões/versões (nova revisão = novo documento).
- Outros formatos além de PDF.
- Documentos de ativos, clientes, contratos ou OS.
- Indexação para o assistente de IA.

**Seria um fracasso** se: achar um documento der mais trabalho do que procurar no
WhatsApp ou na pasta de rede; ou se quem não pode excluir conseguir excluir.

## Abordagens consideradas

| Abordagem | A favor | Contra |
|---|---|---|
| **1. Tabelas próprias (escolhida)** | Simples, vínculo garantido à unidade, não mexe nos manuais | Repetir tabela e tela se outros cadastros pedirem documentos |
| 2. Tabela genérica (tipo de dono + id) | Reaproveitável | Banco não garante o dono, regras de acesso mais complexas, custo sem demanda |
| 3. Aproveitar manuais técnicos | Menos código novo | Mistura manual de equipamento com laudo/planta; sem data nem validade; indexação de IA |

## Banco

Uma migration (com `_DOWN`) em `dev/supabase/migrations/`, aplicada manualmente
no SQL Editor, idempotente.

`cfg_units_documents_types`: `id`, `description` (obrigatória, única entre as não
excluídas), `is_deleted`, `created_at`, `updated_at`. Carga inicial: Desenho,
Planta, Diagrama, Laudo, Análise de risco, Outros.

`units_documents`: `id`, `unit_id` (FK `units`), `type_id` (FK dos tipos),
`title` (obrigatório), `document_date` (`date`, obrigatória), `expires_at`
(`date`, opcional, ≥ `document_date`), `file_path`, `file_name`,
`original_file_name`, `file_size_bytes`, `created_at`, `created_user_id`,
`updated_at`, `updated_user_id`, `is_deleted`, `deleted_at`,
`deleted_user_id`. Índice em `unit_id` para as linhas não excluídas.

Exclusão é lógica (`is_deleted`). O arquivo **permanece** no armazenamento, para
poder recuperar um laudo apagado por engano.

## Permissões

Rotas novas em `cfg_routes`, concedidas pela tela de perfis:

| Chave | Ações |
|---|---|
| `units_documents` | criar, editar, excluir documentos |
| `settings_units_documents_types` | ver, criar, editar, excluir tipos |

**Regra:** somente usuários com permissão incluem e excluem documentos (editar
também exige permissão). Vale nos dois níveis: sem a permissão o botão não
aparece **e** o banco recusa a gravação. Ver a unidade não dá direito a incluir
nem excluir.

Políticas RLS com `fc_has_route_permission`:

- Ler documentos e tipos: quem tem `units` → ver (tipos: qualquer autenticado).
- Inserir: `units_documents` → criar.
- Atualizar: `units_documents` → editar **ou** excluir. A exclusão lógica é um
  UPDATE; um gatilho garante que mudar `is_deleted` exige a permissão de excluir.
- Sem DELETE físico pelo app.

O recorte por cliente do departamento continua sendo o da tela de unidades (feito
no app).

## Armazenamento

- R2, em `companies/<empresa da unidade>/units/<unidade>/documents/<carimbo>.pdf`.
- Somente PDF (conferir tipo e extensão), limite de `getMaxUploadBytes()` (25 MB
  hoje); arquivo maior é recusado com o tamanho na mensagem.

**Proteção do arquivo no worker `r2-files`:** hoje qualquer usuário autenticado
grava, sobrescreve, apaga e lê qualquer caminho em `companies/`. Para a regra de
permissão valer também no arquivo, nos caminhos
`companies/<n>/units/<n>/documents/…` o worker passa a:

- recusar `DELETE`;
- recusar gravar (upload ou cópia) por cima de um arquivo que já existe.

Assim ninguém apaga nem troca um documento pela API de arquivos. Consequência: se
a gravação no banco falhar depois do envio, o arquivo fica órfão no
armazenamento. Exige publicar o worker
(`wrangler`).

**Limite conhecido:** a leitura continua liberada a qualquer usuário autenticado
que saiba o caminho. Restringir isso é um trabalho à parte (o próprio worker
registra como 2ª etapa).

## Aplicativo

- Serviço `services/units/unitDocumentsService.ts`, exposto pelo `dataService`
  (proxy padrão). Leituras com TanStack Query (`['unit-documents', unitId]`,
  `['unit-document-types']`).
- Tela da unidade (`UnitView.tsx`): seção **Documentos**, em componente próprio
  (`components/units/UnitDocumentsSection.tsx`).
  - Lista ordenada por data (mais recente primeiro): título, tipo, data, tamanho.
  - Selo **Vencido** quando a validade é anterior a hoje (horário de São Paulo).
  - Filtro por tipo e busca por título (sem diferenciar acento e maiúscula).
  - Ações: abrir, baixar (`FileUtils`, também no Android), editar os dados e
    excluir (com `ConfirmDeleteModal`), conforme a permissão.
  - Botão "Adicionar" abre o formulário: arquivo, tipo, título (sugerido pelo
    nome do arquivo), data, validade; barra de progresso no envio.
  - Sem internet: a seção informa que os documentos exigem conexão.
- Ajustes: tela de tipos de documento (lista e formulário), no mesmo padrão dos
  tipos de unidade, com card próximo a eles. Tipo em uso pode ser excluído
  (lógico): os documentos antigos continuam mostrando o nome, e ele deixa de
  aparecer para novos envios.
- Editar não troca o arquivo: para substituir, excluir e enviar de novo.

## Verificação

- Testes: serviço (mapeamento, caminho do arquivo, erro quando o banco falha),
  regra de vencimento e filtro, a seção da unidade (permissões e sem internet) e
  as recusas do worker.
- `npx tsc --noEmit && npm test && npm run lint:eslint`.
- Manual, depois da migration: enviar, abrir, baixar (web e Android), editar,
  excluir e conferir um perfil sem permissão.

## Ordem de entrega

1. Migration, permissões e regra no worker.
2. Serviço e testes.
3. Cadastro de tipos em Ajustes.
4. Seção Documentos na unidade.

## Fica a critério de quem implementa

Layout fino da seção e do formulário, nomes internos, e o formato do carimbo do
nome do arquivo.
