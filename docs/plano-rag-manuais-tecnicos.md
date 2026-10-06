# RAG dos Manuais Técnicos — Plano & Status

> **Data**: 2026-09-28 (rev. 2) · **Status geral**: 🟡 Implementado (aguardando migration no banco vivo + validação ponta a ponta)
>
> **Arquitetura de navegação final**: os manuais e a IA de consulta técnica vivem no
> **relatório do ativo** (seção "Manuais Técnicos" + "Assistente do Ativo"). A aba
> "Manuais" no bottom nav da visita foi implementada e depois **removida** (rev. 2 —
> ver §9.0); o assistente da visita mantém RAG para dúvidas gerais da visita.
>
> Este documento registra a implementação do RAG (Retrieval-Augmented Generation) dos
> manuais técnicos para consulta em campo pelo técnico, com auxílio da IA na solução
> de problemas e dúvidas. Complementa a seção 2.1 do `PLANO_IA_SIGES.md`.

---

## 1. Objetivo

Permitir que o **técnico em campo**, durante a visita técnica, consulte os manuais
técnicos dos ativos da visita e tire dúvidas com o **assistente de IA**, que responde
com base nos trechos reais dos documentos (com citação de manual/página).

Escopo decidido com o usuário:

| Decisão | Escolha |
|---|---|
| Público | Técnico em campo |
| Pontos de acesso (rev. 2) | **Relatório do ativo** (manuais + assistente embutido) · Assistente da visita (dúvida geral) · Detalhe do ativo fora da visita (aba "Manuais", pré-existente) |
| Formato | IA + documentos (chat sobre o conteúdo dos manuais) |

---

## 2. Arquitetura

```
┌─────────────────────────── INDEXAÇÃO (admin) ───────────────────────────┐
│                                                                          │
│  Upload novo ──────────────► automático (após gravar no R2 + DB)         │
│  Acervo antigo ─────────────► botão "IA" por arquivo                     │
│  Lote (manual inteiro) ─────► botão "Indexar todos para IA" (seq. +      │
│                                barra de progresso + cancelamento)        │
│                    │                                                     │
│                    ▼                                                     │
│  r2Service.downloadFile()  ── GetObject S3 + gunzip automático           │
│                    │                                                     │
│                    ▼                                                     │
│  Extração de texto:                                                      │
│    pdf/docx → Gemini File API (prompt "=== PÁGINA N ===")                │
│    txt/csv  → leitura direta do blob                                     │
│    imagem/xlsx → 'skipped' (sem texto)                                   │
│                    │                                                     │
│                    ▼                                                     │
│  manualChunker.chunkManualText() ── headings numerados/CAPS, parágrafos, │
│    alvo ~1200 chars, overlap 150, proveniência de página                 │
│                    │                                                     │
│                    ▼                                                     │
│  Embeddings gemini-embedding-001 (768d, lotes de 8)                      │
│                    │                                                     │
│                    ▼                                                     │
│  INSERT ai_knowledge (embedding vector(768), source_type='manual',       │
│    tm_id, tm_file_id, document_name, page_number, metadata)              │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────── CONSULTA (técnico) ──────────────────────────┐
│                                                                          │
│  RELATÓRIO DO ATIVO (caminho principal, rev. 2):                         │
│    Seção "Manuais Técnicos" ── manuais SÓ daquele ativo,                 │
│      abre imagens (PhotoViewer) / PDFs (nova aba),                       │
│      chips → Assistente do Ativo                                         │
│    Assistente do Ativo (AIAssetPanel) ── chips "Troubleshooting (manual)" │
│      / "Inspeção (manual)" + pergunta livre; cada pergunta dispara:      │
│      searchManualExcerpts(pergunta, tm_ids_do_ativo, 6)                  │
│        → RPC match_manual_knowledge (similarity > 0.35, LIMIT 6)         │
│        → manualExcerpts no payload (via aiService.chat)                  │
│                                                                          │
│  ASSISTENTE DA VISITA (dúvida geral, múltiplos ativos):                  │
│    RAG com tm_ids de TODOS os ativos da visita (mesma RPC)               │
│                                                                          │
│                    ▼                                                     │
│  Agentes n8n (SigesAiVisit / siges-ai-assistant) usam os trechos como    │
│  FONTE PRIMÁRIA e citam "manual X, página Y" — nunca inventam conteúdo   │
└──────────────────────────────────────────────────────────────────────────┘
```

### Vínculo ativo ↔ manual (N:N)

- Manual nasce amarrado a um **tipo** de ativo: `technicals_manuals.asset_type_id`
- Vínculo com o ativo **instância**: tabela `technicals_manuals_assets` (PK composta `tm_id + asset_id`)
- Um manual atende vários ativos; um ativo pode ter vários manuais
- Consulta sempre: `asset_id → technicals_manuals_assets → v_technicals_manuals`

---

## 3. Entregas por arquivo

### Banco (migration a aplicar no SQL Editor)

| Arquivo | Conteúdo |
|---|---|
| `dev/supabase/migrations/20260928_manual_rag_knowledge.sql` | Colunas de proveniência em `ai_knowledge` (`tm_id`, `tm_file_id`, `document_name`, `page_number`), índices parciais, RPC `match_manual_knowledge(vector(768), int[], float, int)`, grants |

### Serviços

| Arquivo | Conteúdo |
|---|---|
| `services/media/r2Service.ts` | `downloadFile()` — GetObject + descompressão gzip (uploads são gravados comprimidos via `maybeCompress`) |
| `services/ai/manualChunker.ts` | Chunking puro (testável sem rede): headings, parágrafos, overlap, `pageNumber` |
| `services/ai/manualRagService.ts` | `indexFile()` (reindexação idempotente), `deleteFileIndex()`, `deleteManualIndex()`, `getFileChunkCount()` (cache), `searchManualExcerpts()` (fail-soft), `isGeminiConfigured()` |
| `services/assets/technicalManualsService.ts` | `getManualsWithFilesForAssets()` (manuais + arquivos em lote, sem N+1), `getAssociatedRawByAssetIds()` |
| `services/dataService.ts` | Proxy tipado do novo método (padrão facade) |
| `services/ai/aiVisitAssistantService.ts` | `VisitContext.technicalManuals` (metadados + ids), `buildContextWithManuals()` (fail-soft), `sendMessage` anexa `manualExcerpts` ao webhook |

### UI

| Arquivo | Conteúdo |
|---|---|
| `views/OrderVisit/OrderVisitAsset/OrderVisitAssetManualsSection.tsx` (novo) | Seção "Manuais Técnicos" no relatório do ativo: lista os manuais daquele ativo com arquivos por categoria, PhotoViewer para imagens, nova aba para PDFs, atalhos "Troubleshooting"/"Manutenção preventiva" → assistente do ativo. *(Substituiu a aba "Manuais" do bottom nav da visita, removida em 2026-09-28 — ver §9.0)* |
| `components/ordersVisits/OrderVisitBottomNav.tsx` | Tab `'manuals'` adicionada e depois **removida** (rev. 2) — `VisitTab` de volta a 8 tabs |
| `views/OrderVisit/OrderVisitScreen.tsx` | Render da aba adicionado e depois **removido** (rev. 2); `pendingPrompt` do assistente da visita mantido (não usado, inofensivo) |
| `components/ai/AIVisitAssistantTab.tsx` | Prop `pendingPrompt` (envia sozinho quando o contexto carrega); contexto inclui manuais |
| `components/ai/AIAssetPanel.tsx` | **Assistente do Ativo**: visibilidade liberada para técnicos (antes admin-super only); chips "Troubleshooting (manual)" e "Inspeção (manual)"; prop `pendingPrompt`; carrega `tm_ids` do ativo e passa ao `aiService.chat` (RAG) |
| `services/ai/aiService.ts` | `chat()` ganhou parâmetro opcional `manualTmIds` → `manualExcerpts` no payload do orquestrador (fail-soft) |
| `views/OrderVisit/OrderVisitAsset/OrderVisitAssetReport.tsx` | Integra seção de manuais + painel assistente; `handleAskAssetAssistant` coordena pergunta pré-preenchada |
| `views/Settings/Assets/TechnicalManuals/TechnicalManualDetails.tsx` | Botão "IA" por arquivo (contador de chunks; retry), **indexação automática no upload**, botão **"Indexar todos para IA"** em lote com progresso/cancelamento, limpeza de chunks ao excluir arquivo |

### Workflow n8n

| Item | Conteúdo |
|---|---|
| `SigesAiVisit` (ID `mwZdsrA2Y4J6hOXo`) | System message com 2 seções novas: (1) "Manuais Técnicos — Consulta e Troubleshooting" (metadados: citar manual, direcionar à aba Manuais, nunca inventar); (2) "TRECHOS DE MANUAIS (RAG) — manualExcerpts" (fonte primária, citar origem "manual X, página Y") |
| Validação | `n8nac skills validate` ✅ · `push --verify` ✅ (200 OK, sem issues) |

### Testes

| Arquivo | Status |
|---|---|
| `flows/ai/manualChunker.test.ts` (6 casos: vazio, headings, limite/overlap, página, lixo, índice sequencial) | ✅ passando |

---

## 4. Fluxos do usuário

### Admin — indexação
1. **Arquivo novo**: upload em Configurações → Manuais Técnicos → a indexação dispara sozinha em background (toast "IA: N trechos indexados"); tipos sem texto ficam silenciosos.
2. **Acervo antigo (unitário)**: botão "IA" no arquivo → mostra contador de chunks; clicar de novo reindexa (limpa e refaz).
3. **Acervo antigo (lote)**: botão "Indexar todos para IA" → processa sequencialmente com barra de progresso e cancelamento → resumo final (`X OK, Y com erro, Z ignorados`).

### Técnico — consulta em campo
1. Visita → aba **Ativos** → abre o **relatório do ativo**.
2. Bloco "Manuais Técnicos" (no corpo do relatório) → lista os manuais daquele ativo → toca num manual → arquivos por categoria → imagem no viewer / PDF em nova aba.
3. Dúvida técnica → chip no bloco de manuais ou no **Assistente do Ativo** (`AIAssetPanel`, ex.: "Troubleshooting (manual)") → resposta com trechos dos manuais do ativo, citando manual/página — **sem sair da tela**.
4. Dúvida geral da visita (múltiplos ativos) → aba **Assistente** da visita (RAG cobre os manuais de todos os ativos da visita).
5. Detalhe do ativo (fora da visita) continua com a aba "Manuais" tradicional.

> Nota: o chip "Manuais técnicos" do assistente da visita foi removido (redundante —
> a consulta por manual agora é escopada ao ativo, no relatório).

---

## 5. Limites e pré-requisitos

| Item | Detalhe |
|---|---|
| **Migration** | `20260928_manual_rag_knowledge.sql` precisa estar aplicada — sem ela, o insert dos embeddings falha (erro visível no toast "IA: ..."; arquivo continua indexável depois de aplicar) |
| **API key** | `VITE_GEMINI_API_KEY` (mesma do `aiService`; sem ela o botão em lote fica desabilitado) |
| **Tamanho** | ≤ 18 MB por arquivo (limite inline da Gemini File API) |
| **PDF escaneado** | Sem camada de texto → extração vazia → erro explícito no toast (sem OCR dedicado) |
| **Imagens/XLSX** | `skipped` — não geram índice (só visualização) |
| **Cota Gemini** | Indexação sequencial justamente para respeitar limites; lote grande pode demorar (1 requisição de extração + N/8 de embedding por arquivo) |
| **Threshold RAG** | `similarity > 0.35` (rpc default) — mais solto que o 0.5 do `match_knowledge` geral; ajustável na chamada |

---

## 6. Decisões de design registradas

| # | Decisão | Motivo |
|---|---|---|
| D1 | RAG só nos manuais dos ativos **da visita** (`tm_ids` no filtro da RPC) | Relevância + custo: não busca em todo o acervo |
| D2 | Extração via **Gemini File API** (não pdf.js no cliente) | Mais fiel em PDFs compostos; já há dependência e chave no projeto; pdf.js nem está em `package.json` |
| D3 | Chunking com **mescla** de seções pequenas até ~1200 chars | Fragmentos de 1 linha pioram recall e custam embeddings |
| D4 | `manualExcerpts` **fail-soft** (falha → payload sem trechos) | Assistente nunca pode deixar de responder por causa do RAG |
| D5 | Indexação **automática no upload** + manual para o acervo antigo | Acervo novo se mantém sem ação do admin; antigo indexado quando convier |
| D6 | Lote **sequencial + cancelável** | Cota da API + possibilidade de interromper sem corromper nada |
| D7 | Proveniência `tm_id/tm_file_id/page_number` como **colunas** (não só metadata JSONB) | Permite índices, deleção precisa por arquivo e contagem rápida |
| D8 (rev. 2) | Manuais no **relatório do ativo**, não no bottom nav da visita | Contexto do técnico é o ativo; RAG mais preciso escopado a 1 ativo; nav da visita já sobrecarregado (9 tabs) |
| D9 (rev. 2) | Chip "Manuais técnicos" removido do assistente da visita; RAG da visita **mantido** para perguntas livres | A capacidade permanece (pergunta técnica no chat da visita usa manuais); só o atalho redundante saiu |

---

## 7. Checklist de entrega (próximos passos)

- [ ] **Aplicar migration** `20260928_manual_rag_knowledge.sql` no SQL Editor do Supabase
- [ ] **Validar ponta a ponta**: indexar um PDF real → conferir chunks em `ai_knowledge` (`tm_file_id` preenchido)
- [ ] **Testar consulta**: no relatório do ativo (com manual vinculado), perguntar algo coberto pelo manual → conferir citação "manual X, página Y" na resposta do Assistente do Ativo
- [ ] **Backfill do acervo**: rodar "Indexar todos" nos manuais mais usados
- [ ] Opcional: reforçar o system message do `siges-ai-assistant` (orquestrador geral) para citar manual/página quando receber `manualExcerpts`
- [ ] Opcional (fase 2, §9.3–9.8): chips de sugestão de redação inline nos textareas de condição antes/depois do relatório
- [ ] Opcional: mover extração/indexação para workflow n8n assíncrono se a cota do cliente virar gargalo (seção 2.1 do `PLANO_IA_SIGES.md` já desenha esse caminho)

---

## 8. Arquivos modificados/criados (visão git)

**Novos**: `dev/supabase/migrations/20260928_manual_rag_knowledge.sql` · `services/ai/manualChunker.ts` · `services/ai/manualRagService.ts` · `views/OrderVisit/OrderVisitAsset/OrderVisitAssetManualsSection.tsx` · `flows/ai/manualChunker.test.ts`

**Alterados**: `services/media/r2Service.ts` · `services/assets/technicalManualsService.ts` · `services/dataService.ts` · `services/ai/aiVisitAssistantService.ts` · `services/ai/aiService.ts` · `components/ai/AIVisitAssistantTab.tsx` · `components/ai/AIAssetPanel.tsx` · `components/ordersVisits/OrderVisitBottomNav.tsx` · `views/OrderVisit/OrderVisitScreen.tsx` · `views/OrderVisit/OrderVisitAsset/OrderVisitAssetReport.tsx` · `views/Settings/Assets/TechnicalManuals/TechnicalManualDetails.tsx` · `workflows/.../SigesAiVisit.workflow.ts`

**Removidos (rev. 2)**: `views/OrderVisit/OrderVisitManualsTab.tsx` (excluído — lógica reciclada na `OrderVisitAssetManualsSection`)

**Nota**: o fix do campo "equipe do solicitante" no card da OS (primeiro item desta sessão) não faz parte deste plano — está em `services/orders/ordersService.ts` (`getChildOrders`: `requesterTeamCode: row.requester_team_code`).

---

## 9. DESIGN — IA no Relatório de Ativo (`OrderVisitAssetReport`)

> **Status (2026-09-28): IMPLEMENTADO — com decisão de navegação revisada.**
> A aba "Manuais" no bottom nav da visita foi **removida** (decisão do usuário:
> o contexto do técnico é o ativo, não a visita; o bottom nav da visita já estava
> sobrecarregado; e o RAG fica mais preciso escopado aos manuais de UM ativo).
> Os manuais agora vivem **dentro do relatório do ativo**.

### 9.0 Migração executada (aba da visita → relatório do ativo)

| Item | Ação |
|---|---|
| Tab `'manuals'` no `OrderVisitBottomNav` + `VisitTab` | **Removida** |
| `views/OrderVisit/OrderVisitManualsTab.tsx` | **Excluído** (lógica reciclada) |
| Nova `OrderVisitAssetManualsSection` | Seção "Manuais Técnicos" no corpo do relatório do ativo — mostra **só os manuais daquele ativo**, arquivos por categoria, atalhos para o assistente |
| `AIAssetPanel` (relatório) | **Visibilidade liberada** para o técnico (antes: admin super only); novos chips "Troubleshooting (manual)" e "Inspeção (manual)"; prop `pendingPrompt` (pergunta vinda dos manuais); **RAG do ativo** — carrega os `tm_ids` do ativo e envia `manualExcerpts` via `aiService.chat` |
| `aiService.chat` | Novo parâmetro opcional `manualTmIds` → busca RAG nos manuais do ativo e anexa `manualExcerpts` ao webhook |
| RAG no assistente da visita (`AIVisitAssistantTab`) | **Mantido** — dúvida geral da visita continua respondendo com manuais de todos os ativos da visita |

### 9.0.1 Interação do técnico (fluxo final)

1. Visita → aba Ativos → abre o **relatório do ativo**.
2. No bloco "Manuais Técnicos" (abaixo do card do ativo/assistente): lista os manuais daquele ativo → toca num manual → arquivos por categoria → imagem no viewer / PDF em nova aba.
3. Dúvida técnica → chips do bloco ou do `AIAssetPanel` ("Troubleshooting (manual)") → resposta do assistente com trechos do manual do ativo (cita manual/página) — **sem sair da tela**.
4. Pergunta livre via "Perguntar" no painel do assistente.

### 9.1 Problema

O relatório do ativo é onde o técnico mais precisa de ajuda:
- descrever **condição antes/depois** (texto obrigatório + foto);
- escolher **atividades** corretas para o tipo de OS;
- decidir **materiais** e lidar com **alertas**;
- interpretar sintomas/falhas do equipamento na hora.

Sair do relatório para ir ao chat da visita **quebra o fluxo** e perde o contexto
do ativo que está sendo preenchido.

### 9.2 Princípios da interação

| # | Princípio |
|---|---|
| P1 | **IA assiste, técnico autoria** — a IA nunca grava nada sozinha; toda inserção é acionada por toque do usuário |
| P2 | **Contexto é o ativo, não a visita** — o assistente embutido responde sobre ESTE equipamento e ESTE relatório |
| P3 | **Manuais primeiro (RAG)** — respostas técnicas citam trecho + "manual X, página Y"; sem manual indexado, diz e cai para orientação geral |
| P4 | **Não bloqueia** — painel deslizante (bottom sheet mobile-first); o relatório permanece preenchido atrás |
| P5 | **Rascunho proponível, verdade não** — sugestões de texto entram no campo como rascunho editável; fatos (fotos, leituras) continuam obrigatórios |

### 9.3 Pontos de contato na tela

```
┌─────────────────────────────────────────────────────┐
│ ← RELATÓRIO DO ATIVO            [🤖 Assistir]  ⭐   │  ← 1. botão fixo no header
│                                                     │
│ CONDIÇÃO ANTES *                                    │
│ ┌───────────────────────────────────────┐           │
│ │ [textarea]                 (✨ Sugestões) │           │  ← 2. chip inline no campo
│ └───────────────────────────────────────┘           │
│ 📷 fotos                                            │
│                                                     │
│ ATIVIDADES                                          │
│ ☐ Troca de filtro   ☐ Lubrificação  (✨)          │  ← 3. chip no bloco de atividades
│                                                     │
│ MATERIAIS · MOVIMENTAÇÃO · ALERTAS                 │
│                                                     │
│ CONDIÇÃO DEPOIS *                                   │
│ ┌───────────────────────────────────────┐           │
│ │ [textarea]                 (✨ Sugestões) │           │
│ └───────────────────────────────────────┘           │
│                                                     │
│         [ 🤖 FAB — perguntar à IA ]                 │  ← 4. FAB (alternativa ao header)
└─────────────────────────────────────────────────────┘
```

1. **Header/ou FAB** — abre o painel de chat embutido (bottom sheet ~85vh).
2. **Chip "✨ Sugestões" nos textareas** de Condição Antes/Depois — abre 2–3
   sugestões de redação geradas a partir do manual (seções "inspeção",
   "operação", "pós-manutenção") + estado atual (fotos existem?, atividades
   marcadas?). Toque → insere como **rascunho editável** no textarea (não sobrescreve
   texto já digitado; pergunta antes se houver conteúdo).
3. **Chip no bloco de atividades** — "quais atividades o manual recomenda para
   manutenção preventiva deste modelo?" → lista comparativa manual × atividades
   da OS; marcar sugestões ainda não incluídas.
4. **Painel de chat** — mesmo padrão visual do `AIVisitAssistantTab`
   (mensagens, suggestions chips, input), mas escopado ao ativo.

### 9.4 Sugestões contextuais (chips do painel)

Variam conforme a seção em edição no momento da abertura:

| Seção ativa | Chips sugeridos |
|---|---|
| Condição antes | "O que inspecionar antes de operar?" · "Como descrever esta condição?" |
| Atividades | "Procedimentos do manual para manutenção preventiva" · "Passo a passo da troca de filtro" |
| Materiais | "Quais peças o manual recomenda para esta atividade?" |
| Falha/sintoma | "O que pode causar [sintoma]?" · "Troubleshooting do manual" |
| Condição depois | "Checklist de operação normal após manutenção" |
| Alertas | "O que significa o alerta [código]?" |

### 9.5 Contexto enviado ao webhook

Extensão do `VisitContext` (ou payload paralelo) com o ativo em foco:

```jsonc
{
  "currentAsset": {
    "assetId": "...", "code": "BMB-001", "description": "Bomba capilar",
    "brand": "...", "model": "...", "serial": "...",
    "location": "...", "reportState": {
      "beforeCommentsFilled": true, "beforePhotos": 2,
      "activitiesSelected": ["Troca de filtro"],
      "afterCommentsFilled": false, "afterPhotos": 0,
      "maintenancePlanProgress": 40
    }
  },
  "currentAssetManualIds": ["12"],   // tm_ids SÓ deste ativo → RAG mais preciso
  "manualExcerpts": [ ... ]          // busca RAG com a pergunta (já existente)
}
```

Endpoint reutilizado: `siges-visit-assistant` (o agente ganha regras para
`currentAsset`; sessionKey continua `visitId`, mantendo a memória da conversa
por visita).

### 9.6 Fluxo típico (happy path)

1. Técnico chega no ativo, tira foto da condição antes.
2. Toca "✨ Sugestões" no textarea → IA propõe texto de inspeção baseado no
   manual (citado) → técnico ajusta e mantém.
3. No bloco de atividades, chip do manual lembra da lubrificação → marca.
4. Equipamento apresenta sintoma → abre o painel → chip "Troubleshooting" →
   resposta com trecho do manual ("manual BMB-01, página 12: verifique...").
5. Aplica o procedimento, preenche condição depois (sugestão de checklist
   de operação normal), reporta.

### 9.7 Guardas

- Leitura RAG e geração de sugestões **fail-soft** (sem manual/chave → chips não aparecem, chat responde genérico).
- Sugestão de texto **sempre editável** e marcada visualmente como "sugerido pela IA"? (decidir: marca visual sim/não).
- `readOnly` (ativo reportado/aprovado) → painel de chat disponível, mas chips de inserção em campos ocultos.
- Custo: 1 chamada de extração + N embeddings só na indexação; consulta = 1 embed + 1 RPC (barato).

### 9.8 Esforço estimado

| Item | Esforço |
|---|---|
| ~~`AssetReportAssistantSheet` (reusar padrão do `AIVisitAssistantTab`)~~ | ✅ **0 d** — reuso do `AIAssetPanel` existente (com `pendingPrompt` + RAG), sem sheet novo |
| ~~Extensão do contexto (tm_ids do ativo) no serviço~~ | ✅ **0 d** — `aiService.chat(manualTmIds)` implementado; `currentAsset` detalhado (reportState) fica para fase 2 |
| ~~Chips de manual no painel~~ | ✅ **0 d** — "Troubleshooting (manual)" e "Inspeção (manual)" no `AIAssetPanel` |
| Chips inline de sugestão de redação nos 2 textareas + bloco de atividades (§9.3 itens 2–3) | **0,5–1 d** (pendente, fase 2) |
| System message do orquestrador `siges-ai-assistant` citando manual/página | **0,25 d** (opcional) |

**Resumo da fase 1 (implementada)**: seção de manuais no relatório + assistente do ativo com RAG + indexação (auto/lote) + workflow SigesAiVisit — concluída.
**Fase 2 (opcional, estimada)**: chips de redação inline + contexto `reportState` — ~1–1,5 d.
