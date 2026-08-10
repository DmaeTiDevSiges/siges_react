# Plano: Fluxo de Aprovação Multi-Etapa (Revisado)

> **Status:** Aguardando análise e autorização
> **Data:** 28/06/2026
> **Abordagem:** Nova coluna `ov_review_phase` em `orders_visits` (menor impacto)

---

## 1. Conceito

Manter os 5 `processing_id` existentes (1-5) e adicionar **uma única coluna** para indicar em qual fase de revisão/aprovação a visita se encontra: **técnica** ou **custos**.

---

## 2. Fluxo Solicitado

```
Rascunho(1) → Reportada(2) → Revisada Técnica(3) → Rejeitada(4) → Revisada Técnica(3)
    → Aprovada Técnica(5) → Revisada Custos(3) → Rejeitada(4) → Revisada Custos(3)
    → Aprovada(5) → Arquivada(ov_is_filed)
```

### Nova coluna: `ov_review_phase`

| Valor | Significado |
|-------|-------------|
| `null` | Fase inicial (Rascunho/Reportada) |
| `'technical'` | Na fase de revisão/aprovação **técnica** |
| `'cost'` | Na fase de revisão/aprovação **custos** |

### Diagrama com a nova coluna

```
┌──────────┐    ┌───────────┐    ┌──────────────────┐    ┌───────────┐
│ RASCUNHO │───>│ REPORTADA │───>│ REVISADA TÉCNICA │───>│ REJEITADA │
│  (1,null)│    │  (2,null) │    │  (3,technical)   │    │  (4,null) │
└──────────┘    └───────────┘    └──────────────────┘    └───────────┘
                                      │     ▲                  │
                                      │     └──────────────────┘
                                      ▼
                               ┌──────────────────┐    ┌──────────────────┐
                               │APROVADA TÉCNICA  │───>│ REVISADA CUSTOS  │
                               │  (5,technical)   │    │   (3,cost)       │
                               └──────────────────┘    └──────────────────┘
                                                          │     ▲
                                                          │     └── Rejeitada(4)
                                                          ▼
                                                   ┌──────────┐    ┌──────────┐
                                                   │ APROVADA │───>│ARQUIVADA │
                                                   │  (5,cost)│    │(is_filed)│
                                                   └──────────┘    └──────────┘
```

---

## 3. Mapeamento de Estados

| Etapa | processing_id | review_phase | Descrição |
|-------|---------------|--------------|-----------|
| Rascunho | 1 | `null` | Início |
| Reportada | 2 | `null` | Relatório enviado |
| Revisada Técnica | 3 | `'technical'` | Aguardando aprovação técnica |
| Rejeitada (técnico) | 4 | `null` | Rejeitado na fase técnica |
| Aprovada Técnica | 5 | `'technical'` | Aprovado tecnicamente, aguardando custos |
| Revisada Custos | 3 | `'cost'` | Aguardando aprovação de custos |
| Rejeitada (custos) | 4 | `null` | Rejeitado na fase de custos |
| Aprovada (final) | 5 | `'cost'` | Aprovado em ambas as fases |
| Arquivada | 5 | `'cost'` | `ov_is_filed = true` |

---

## 4. Alterações por Camada

### 4.1 Banco de Dados (Supabase)

| O quê | Tipo | Detalhe |
|-------|------|---------|
| Adicionar coluna `ov_review_phase` em `orders_visits` | DDL | `ALTER TABLE orders_visits ADD COLUMN ov_review_phase TEXT DEFAULT NULL;` |
| Criar migration | Arquivo | `supabase/migrations/YYYYMMDD_add_ov_review_phase.sql` |

**Sem outras mudanças de schema.** A tabela `cfg_orders_visits_processing` não precisa de novos registros.

### 4.2 Tipos TypeScript

**Arquivo:** `types.ts`

```typescript
// Adicionar na interface OrderVisit:
ovReviewPhase?: 'technical' | 'cost' | null;
```

### 4.3 DataService

**Arquivo:** `services/dataService.ts`

| Função | Mudança |
|--------|---------|
| `getOrderVisitById()` / queries | Incluir `ov_review_phase` no SELECT |
| `markOrderVisitAsRevised()` (2→3) | Definir `ov_review_phase = 'technical'` |
| `approveOrderVisitTechnical()` (3→5) | Definir `ov_review_phase = 'technical'` |
| **Nova:** `startCostReview()` (5→3) | Definir `ov_processing_id = 3, ov_review_phase = 'cost'` |
| `disapproveOrderVisit()` (→4) | Limpar `ov_review_phase = null` |
| `updateOrderVisitProcessing()` (→5) | Manter `ov_review_phase` existente |
| `reverseOrderVisitApproval()` | Reverter `ov_review_phase` conforme a fase |

### 4.4 Botões de Ação na Visita

**Arquivo:** `views/OrderVisit/OrderVisitScreen.tsx`

| Botão | Visibilidade | Transição |
|-------|-------------|-----------|
| **Reportar** | `processing_id ∈ [1,4]` | 1/4 → 2 |
| **Revisar (Técnico)** | `processing_id = 2` | 2 → 3 (`review_phase = 'technical'`) |
| **Rejeitar** | `processing_id = 3` | 3 → 4 (`review_phase = null`) |
| **Aprovar Técnica** | `processing_id = 3 AND review_phase = 'technical'` | 3 → 5 (`review_phase = 'technical'`) |
| **Revisar Custos** | `processing_id = 5 AND review_phase = 'technical'` | 5 → 3 (`review_phase = 'cost'`) |
| **Aprovar Final** | `processing_id = 3 AND review_phase = 'cost'` | 3 → 5 (`review_phase = 'cost'`) |
| **Arquivar** | `processing_id = 5 AND review_phase = 'cost'` | `ov_is_filed = true` |
| **Reverter** | `processing_id = 5` | Reverter conforme fase |

### 4.5 Botão de Processamento

**Arquivo:** `components/ordersVisits/OrderVisitProcessingButton.tsx`

| O quê | Detalhe |
|-------|---------|
| Adicionar parâmetro `reviewPhase` | Para exibir subtexto "Técnica" ou "Custos" |
| Exemplo: "Revisada · Técnica" / "Revisada · Custos" | Quando `processing_id = 3` |

### 4.6 Relatório do Ativo

**Arquivo:** `views/OrderVisit/OrderVisitAsset/OrderVisitAssetReport.tsx`

| O quê | Detalhe |
|-------|---------|
| Botão "Aprovar" | Muda de comportamento conforme `review_phase` |
| Rejeitar | Funciona em ambas as fases |

### 4.7 Dashboard

**Arquivo:** `views/Dashboards/DashboardOrdersVisitsAdminScreen.tsx`

| O quê | Detalhe |
|-------|---------|
| Cards de filtro | **Sem mudança** — mantém 5 cards (1-5) |
| Opcional: sub-filtro por fase | Mostrar "Técnica" / "Custos" nos cards quando `processing_id = 3 ou 5` |

---

## 5. Diagrama de Decisão dos Botões

```
Qual é o processing_id da visita?

  1 (Rascunho)      → Mostrar: [Reportar]
  2 (Reportada)     → Mostrar: [Revisar Técnico] [Rejeitar]
  3 (Revisada)      
    ├─ review_phase = 'technical' → Mostrar: [Aprovar Técnica] [Rejeitar]
    └─ review_phase = 'cost'      → Mostrar: [Aprovar Final] [Rejeitar]
  4 (Rejeitada)     → Mostrar: [Reportar]
  5 (Aprovada)
    ├─ review_phase = 'technical' → Mostrar: [Revisar Custos] [Reverter]
    └─ review_phase = 'cost'      → Mostrar: [Arquivar] [Reverter]
```

---

## 6. Resumo de Esforço

| Camada | Arquivos | Complexidade |
|--------|----------|-------------|
| Migration SQL | 1 migration | ⭐ Baixa |
| Tipos | 1 (`types.ts`) | ⭐ Baixa |
| Constantes | 1 (`OrderVisitProcessingButton.tsx`) | ⭐ Baixa |
| DataService | 1 (`dataService.ts`) | ⭐⭐ Média |
| Botões de ação | 1 (`OrderVisitScreen.tsx`) | ⭐⭐ Média |
| Relatório ativo | 1 (`OrderVisitAssetReport.tsx`) | ⭐ Baixa |
| Dashboard | 0-1 (automático ou sub-filtro) | ⭐ Baixa |

**Total: ~6 arquivos + 1 migration**

---

## 7. Vantagens desta Abordagem

| vs. Novos IDs | vs. Nova coluna |
|---------------|-----------------|
| ✅ Sem novos registros na tabela cfg | ✅ Menos impacto no app |
| ✅ Dashboard permanece igual (5 cards) | ✅ Sem mudanças no sync de contadores |
| ✅ Contadores existentes continuam válidos | ✅ Reutiliza funções existentes |
| ✅ Sem triggers novos | ✅ Migration simples (1 coluna) |

---

## 8. Perguntas Pendentes

1. **Rejeitar ativo**: Na fase de custos, o motivo de rejeição deve ser diferente do técnico?
2. **Permissões**: Quem aprova técnica vs quem aprova custos? São perfis diferentes ou o mesmo?
3. **Notificações**: Notificar a equipe ao mudar de etapa?
4. **Dashboard**: Precisa de sub-filtro por fase técnica/custos nos cards?
