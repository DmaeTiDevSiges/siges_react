# Sistema de Gamificação de Líderes de Equipe

## Visão Geral

Sistema de ranking e gamificação para líderes de equipe baseado nas avaliações de visitas técnicas. Os scores são calculados por mês de encerramento da visita, com comparação entre líderes do mesmo departamento.

## Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                    CAMADA DE DADOS                   │
│                                                      │
│  v_order_visit_scores         (view - score/visita)  │
│  v_leader_ranking             (view - ranking)       │
│  leader_monthly_scores        (tabela - snapshot)    │
│  leader_scores_history        (tabela - detalhe)     │
│  leader_score_badges          (tabela - conquistas)  │
│  recalculate_*()              (funções RPC)          │
├─────────────────────────────────────────────────────┤
│                    CAMADA DE SERVIÇO                  │
│                                                      │
│  gamificationService.ts       (service principal)    │
│  dataService.ts               (proxy)               │
├─────────────────────────────────────────────────────┤
│                    CAMADA DE APRESENTAÇÃO             │
│                                                      │
│  LeaderRankingDashboard.tsx   (dashboard principal)  │
└─────────────────────────────────────────────────────┘
```

## Fórmula de Score

O score de cada visita é baseado nas avaliações de requisitos do contrato:

- **penalty_score**: soma dos `weight` dos requisitos onde `was_applied = true` (descumpridos)
- **compliance_score**: `(1 - penalty_score / max_possible_score) * 100`
  - 100% = perfeito (zero descumprimentos)
  - 0% = todos os requisitos descumpridos

O score mensal de um líder é a **média dos compliance_scores** de todas as visitas encerradas naquele mês.

## Tabelas

### `v_order_visit_scores` (View)
Calcula o score individual de cada visita encerrada. Campos principais:
- `leader_id`, `leader_name`, `department_id`, `department_name`
- `score_year`, `score_month` (baseado em `ov_ended_at`)
- `total_evaluations`, `failed_evaluations`
- `penalty_score`, `max_possible_score`, `compliance_score`

### `leader_monthly_scores` (Snapshot Mensal)
Uma linha por líder por mês. Atualizada via `recalculate_leader_monthly_score()`.
- `ranking_position`: posição no ranking do departamento
- `avg_compliance_score`: média de conformidade
- `best_compliance_score`, `worst_compliance_score`

### `leader_scores_history` (Detalhe)
Uma linha por visita avaliada. Usada para o histórico detalhado do líder.

### `leader_score_badges` (Conquistas)
Badges automáticos concedidos:

| Badge | Código | Condição |
|-------|--------|----------|
| Mês Perfeito | `PERFECT_MONTH` | Compliance = 100% no mês |
| 1º Lugar | `TOP_1` | Ranking position = 1 |
| Top 3 | `TOP_3` | Ranking position ≤ 3 |
| Sequência de 3 | `STREAK_3` | 3 meses seguidos com compliance ≥ 90% |
| Melhoria | `IMPROVEMENT` | Melhoria ≥ 10% vs mês anterior |

## Funções RPC (PostgreSQL)

```sql
-- Recalcular score de um líder específico
recalculate_leader_monthly_score(p_leader_id, p_year, p_month)

-- Recalcular todos os líderes de um departamento
recalculate_department_scores(p_department_id, p_year, p_month)

-- Recalcular todos os departamentos
recalculate_all_scores(p_year, p_month)
```

## Service API

### `gamificationService.ts`

| Método | Descrição |
|--------|-----------|
| `getVisitScores(filters)` | Scores individuais das visitas |
| `getLeaderRanking(deptId, year, month)` | Ranking de líderes do departamento |
| `getLeaderHistory(leaderId, months)` | Histórico mensal do líder |
| `getLeaderVisitHistory(leaderId, year, month)` | Detalhe das visitas no mês |
| `getLeaderBadges(leaderId)` | Badges conquistadas |
| `getDepartmentSummary(deptId, year, month)` | Resumo do departamento |
| `recalculateLeaderScore(leaderId, year, month)` | Recálculo sob demanda |
| `recalculateDepartmentScores(deptId, year, month)` | Recálculo do departamento |
| `recalculateAllScores(year, month)` | Recálculo global |
| `checkAndGrantBadges(leaderId, year, month)` | Verificar e conceder badges |
| `getDepartmentsWithLeaders()` | Lista departamentos com líderes |

## Fluxo de Recálculo

### Automático (após avaliação)
1. Usuário salva avaliação em uma visita
2. Verifica se a visita está encerrada (`ov_status_id = 2`)
3. Chama `recalculateLeaderScore()` via RPC
4. Snapshot e histórico são atualizados

### Manual (dashboard)
1. Admin clica "Recalcular Scores" no dashboard
2. Chama `recalculateDepartmentScores()` para o departamento selecionado
3. Todos os líderes do departamento são recalculados

## Dashboard

### Ranking de Líderes (`/leader-ranking`)
- **Filtros**: Departamento, Mês/Ano
- **Cards de resumo**: Total de líderes, compliance médio, melhor score, total de visitas
- **Tabela de ranking**: Posição, nome, visitas, compliance, tendência, badges
- **Painel de detalhes**: Clique em um líder para ver badges, histórico de visitas e evolução

### Permissões
Utiliza a mesma permissão do dashboard de avaliações: `dashboard_contracts_evaluations`

## Migração

Execute o arquivo SQL:
```sql
dev/supabase/migrations/20260807_create_gamification_system.sql
```

## Arquivos Criados/Modificados

| Arquivo | Ação |
|---------|------|
| `dev/supabase/migrations/20260807_create_gamification_system.sql` | **CRIADO** - Migration SQL |
| `types.ts` | **MODIFICADO** - Adicionadas interfaces de gamificação |
| `services/gamification/gamificationService.ts` | **CRIADO** - Service principal |
| `services/dataService.ts` | **MODIFICADO** - Adicionados proxies |
| `views/Dashboards/LeaderRankingDashboard.tsx` | **CRIADO** - Dashboard principal |
| `App.tsx` | **MODIFICADO** - Rota e lazy import |
| `components/DashboardTabs.tsx` | **MODIFICADO** - Aba "Ranking" |
| `components/Sidebar.tsx` | **MODIFICADO** - Tipo do activeTab |
| `components/BottomNav.tsx` | **MODIFICADO** - Tipo do activeTab |
| `views/Visits/VisitEvaluationPage.tsx` | **MODIFICADO** - Recálculo automático |
| `views/Visits/VisitEvaluationInline.tsx` | **MODIFICADO** - Recálculo automático |
| `views/Contracts/Evaluations/VisitEvaluationDialog.tsx` | **MODIFICADO** - Recálculo automático |
