---
name: Order Status History
category: orders
version: 1.0.0
description: Exibição do histórico de situações de uma OS/SS lendo o log global orders_statuses_logs (consumidor da Parte 1)
author: Flow System
date: 2026-09-25
tags:
  - read-only
  - orders
  - status
  - history
  - web
  - mobile
---

# Flow: Order Status History (Histórico de Situações)

## Contexto

A Parte 1 passou a gravar, por trigger no banco, **toda** mudança de situação de `orders`
em `orders_statuses_logs` — sem nenhuma linha de TypeScript participando. Até agora a tabela
só acumulava linhas sem leitor (**P8**). Este fluxo cria o consumidor: a aba **“Situações”**
da tela de detalhe da OS (`OrderRequestView`) mostra essas linhas como uma timeline.

- **Tabela:** `public.orders_statuses_logs`
- **Semântica:** **NEW** — cada linha guarda o **estado resultante** da mudança
  (`order_status_id` / `order_status_at` são o estado **após** a mudança).
- **Escopo (D14):** somente a OS (`OrderRequestView`). A SS (`ServiceRequestDetail`)
  mantém a timeline de eventos existente (`getServiceOrderHistory`) sem alteração.

## Etapas

| # | Etapa | Detalhe |
|---|-------|---------|
| 1 | Usuário abre a aba **Situações** | Aba adicionada ao array `tabs` de `OrderRequestView` |
| 2 | Busca | `dataService.getOrderStatusHistory(orderId)` → `ordersService.getOrderStatusHistory` |
| 3 | Consulta | `orders_statuses_logs` com join `cfg_orders_statuses(description, icon, icon_color, background_color)` e `users(name_short, name_full)`; `eq('order_id', id)`; `order('id', desc)`; `limit(200)` |
| 4 | Mapeamento | → `OrderStatusLogItem` (`types.ts`) |
| 5 | Render | `components/orderRequests/OrderStatusHistoryTimeline.tsx` — timeline vertical, do mais recente para o mais antigo |

## Regras de exibição

| Regra | Valor |
|-------|-------|
| Ordem | `id` decrescente (mais recente primeiro) |
| Item atual | primeira linha recebe o selo **“Atual”** |
| Rótulo/ícone/cor | `cfg_orders_statuses.description`/`icon`; fallback `getStatusConfig(statusId)` de `utils/formatters.ts` |
| Data principal | `order_status_at` → “Situação em vigor desde …” |
| Data de gravação | `created_date` → “Gravado em …”, exibida **apenas** quando difere da principal |
| Autor | `users.name_short` (fallback `name_full`); sem usuário → **“Sistema”** (n8n, jobs, imports, sem JWT — P5) |
| Vínculo SS | `order_parent_id > 0` → chip `SS <id>` |
| Sem dados | estado vazio “Sem histórico de situações” |
| Erro | `console.error` + lista vazia (mesma tolerância de `getServiceOrderHistory`) |

## Estados da UI

1. **Loading** — `<Loading size="md" />` + “CARREGANDO SITUAÇÕES…”
2. **Vazio** — ícone `history` + “Sem histórico de situações”
3. **Lista** — timeline com marcador colorido por situação

## Fora de escopo

- Inserir/editar linhas do log (exclusivo da trigger `fc_orders_statuses_logs`).
- Alterar a aba **Histórico** da OS (visitas + ativos) ou a timeline da SS.
- Filtros, paginação e exportação (limitado a 200 linhas por OS).
