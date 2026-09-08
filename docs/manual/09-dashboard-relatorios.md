# 09 — Dashboard e Relatórios

> **Perfil:** Todos (dashboard pessoal) • Gestor/Líder (dashboards gerenciais) • Admin (todos + exportação)  
> **Rota:** `/dashboard` (pessoal) → Abas laterais para dashboards específicos  
> **Exportação:** SSH tunnel + `npm run db:export` (ver guia técnico)

---

## 1. Visão Geral dos Dashboards

O SIGES oferece **múltiplos dashboards** especializados, acessíveis via abas no menu lateral do `/dashboard` ou rotas diretas.

| Dashboard | Rota | Público | Foco |
|-----------|------|---------|------|
| **Pessoal** | `/dashboard` | Todos | Minhas tarefas, visitas, SS, alertas |
| **Ordens (Admin)** | `/dashboard/orders-admin` | Gestor/Admin | Todas OSs, filtros avançados, KPIs |
| **Ordens (Usuário)** | `/dashboard/orders-user` | Técnico/Líder | Minhas OSs, ações rápidas |
| **Visitas Admin** | `/dashboard/visits-admin` | Gestor/Admin | Calendário, aprovações, financeiro |
| **Visitas Hoje** | `/dashboard/visits-today` | Líder/Técnico | Visitas do dia, check-in/out |
| **Calendário Admin** | `/dashboard/calendar-admin` | Gestor/Admin | Matriz semanal OS × Equipe |
| **Matriz Ativos** | `/dashboard/assets-matrix` | Gestor/Admin | Ativos × Mês × Sub-tipo (Cap. 05) |
| **Unidades/Ativos** | `/dashboard/units-assets` | Gestor | Disponibilidade, potência elétrica |
| **Contratos/Avaliações** | `/dashboard/contracts-eval` | Gestor/Admin | Requisitos, avaliações contratuais |
| **Ranking Líderes** | `/dashboard/leader-ranking` | Gestor | Produtividade por líder/equipe |

---

## 2. Dashboard Pessoal (`/dashboard`)

### Cards Principais (Resumo Rápido)

| Card | Conteúdo | Ação |
|------|----------|------|
| **Minhas Visitas** | Qtd: Em andamento / Agendadas / Concluídas mês | Clica → Lista visitas |
| **Minhas SS** | Abertas / Em Andamento / Concluídas | Clica → Lista SS |
| **Minhas OS** | Em Avaliação / Autorizadas / Em Andamento | Clica → Lista OS |
| **Para Aprovar** | SS/OS/Visitas pendentes da minha alçada | Clica → Triagem |
| **Almoxarifado** | Minhas requisições pendentes / Custódia atual | Clica → `/warehouse` |
| **Disponibilidade** | Meu status (🟢/🟡/⚫) + Botão toggle | Toggle disponível |

### Ações Rápidas (Botões Flutuantes)
- ➕ **Nova SS** → Inicia wizard (Cap. 02)
- 📅 **Nova Visita** → Só se tem OS autorizada
- 📦 **Solicitar Material** → `/warehouse` nova requisição
- 🔔 **Notificações** → Badge com contadores

---

## 3. Dashboards Gerenciais (Gestor/Admin)

### 3.1 Ordens Admin (`DashboardOrdersAdminScreen`)
- **Lista completa** de OSs com filtros: status, tipo, prioridade, equipe, contrato, período
- **KPIs:** Total por status, SLA médio, OSs vencidas, conversão SS→OS
- **Ações em lote:** Autorizar, Encaminhar, Cancelar (seleção múltipla)
- **Exportação:** CSV da lista filtrada

### 3.2 Visitas Admin (`DashboardOrdersVisitsAdminScreen`)
- **Abas:** Técnico / Financeiro / Histórico
- **Técnico:** Processing (1-5), revisões pendentes, rejeições
- **Financeiro:** `ov_costs_status` (pending/submitted/approved/rejected), valores totais
- **Calendário semanal** integrado (ver 3.4)

### 3.3 Calendário Admin (`DashboardOrdersAdminCalendarScreen`)
- **Matriz Semanal:** Equipes (linhas) × Dias da semana (colunas)
- **Células:** OSs agendadas (badge com máscara + tipo)
- **Drag & Drop:** Reagendar OS arrastando entre dias/equipes
- **Filtros:** Contrato, Tipo, Equipe, Período
- **Navegação:** Semana anterior/próxima, "Hoje"

### 3.4 Matriz Ativos × Meses (`AssetsOrdersVisitsCalendar` — Cap. 05)
- **Linhas:** Ativos configurados na unidade
- **Colunas:** 12 meses do ano selecionado
- **Células:** Badges por sub-tipo (PRV, COR, ELE, MEC...) com contagem
- **Drill-down:** Clique na badge → Modal com OSs/Visitas daquele ativo+mês+sub-tipo
- **Filtros:** Contrato, Tipo OS, Setor (Tag), Equipe

### 3.5 Disponibilidade Elétrica (`DashboardUnitsPowerElectric`)
- **Por Unidade:** Disponibilidade overall + breakdown por setor (Tag)
- **Medições:** Tensão, Amperagem, Potência (último registro)
- **Alertas:** Setores < threshold (ex: 80%)
- **Gráficos:** Tendência temporal (semanal/mensal)

### 3.6 Ranking de Líderes (`LeaderRankingDashboard`)
- **Métricas por Líder/Equipe:**
  - Visitas concluídas no período
  - OSs finalizadas
  - Tempo médio de atendimento
  - Taxa de aprovação técnica (1ª submissão)
  - Custos aprovados vs submetidos
- **Período:** Mês atual / Mês anterior / Personalizado
- **Exportação:** PDF/CSV para reuniões de gestão

---

## 4. Exportação de Dados (Guia Técnico)

> ⚠️ **Para usuários:** Peça ao Admin/TI.  
> 🔧 **Para Admin/TI:** Use o guia completo em `dev/docs/EXPORTACAO_COMPLETA_GUIA.md`.

### Método Recomendado: Túnel SSH + Conexão Direta

```bash
# Terminal 1: Manter túnel aberto
ssh -L 5432:localhost:5432 usuario@vps.supabase.siges-app.com.br

# Terminal 2: Configurar .env.local temporário
SUPABASE_DB_HOST=localhost
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=sua_senha

# Terminal 2: Exportar TUDO
npm run db:export
```

### O que Exporta (Completo)
- ✅ Todas as tabelas (40+)
- ✅ Todas as views (definições completas)
- ✅ Todas as functions
- ✅ Todos os triggers
- ✅ Todas as policies RLS
- ✅ Todos os indexes/constraints
- ✅ Dados seed completos

### Saída
Pasta `supabase/database-structure/` com:
```
01-core-schema/     # Tabelas base, enums, types
02-business-schema/ # Tabelas de negócio, views, functions
data/               # CSVs de dados por tabela
```

### Alternativas (se sem SSH)
| Método | Completude | Tempo | Observação |
|--------|------------|-------|------------|
| **Túnel SSH** | 100% | 5 min | Recomendado |
| **pg_dump no VPS** | 100% | 3 min | Requer acesso SSH ao VPS |
| **REST API melhorado** | ~80% | 10 min | Sem functions/triggers exatos |
| **Híbrido (schema.sql + REST)** | Quase 100% | 15 min | Merge manual necessário |

---

## 5. Relatórios Operacionais Comuns

### 5.1 Relatório de SS/OS por Período
- **Filtros:** Data início/fim, Cliente, Unidade, Tipo, Status, Equipe
- **Colunas:** Máscara, Cliente, Unidade, Tipo, Prioridade, Status, Datas, Solicitante
- **Uso:** Acompanhamento de demanda, SLA, backlog

### 5.2 Relatório de Visitas (Técnico + Financeiro)
- **Técnico:** Processing, Ativos intervencionados, Fotos, Atividades, KM
- **Financeiro:** Serviços, Materiais, Veículos, Total, Status aprovação
- **Uso:** Prestação de contas, faturamento, auditoria

### 5.3 Relatório de Almoxarifado
- **Kardex:** Movimentações cronológicas por material
- **Posição:** Saldo atual por almoxarifado
- **Baixo Estoque:** Itens < min_stock
- **Custódia:** Por técnico / por equipe
- **CMP:** Evolução do custo médio

### 5.4 Relatório de Ativos/Disponibilidade
- **Por Unidade/Setor:** % disponibilidade, ativos críticos
- **Medições:** Últimos valores (vazão, potência, pressão, tensão)
- **Histórico:** Evolução temporal por ativo
- **Calendário Matriz:** OSs por ativo/mês/sub-tipo

### 5.5 Relatório de Equipes/Produtividade
- **Por Líder/Equipe:** Visitas, OSs, Tempo médio, Taxa aprovação
- **Disponibilidade:** Horas homem livres vs alocadas
- **Custódia:** Materiais em posse por equipe

---

## 6. Como Gerar Relatórios (Interface)

### Via Dashboard (Não Técnico)
1. Acesse dashboard desejado
2. Aplique **filtros** (período, equipe, contrato, status)
3. Clique **Exportar CSV** (botão no header da tabela)
4. Abra no Excel/Sheets → Formate, pivote, gráfico

### Via SQL Direto (Admin/Técnico)
```sql
-- Exemplo: OSs por status no mês
SELECT status_id, COUNT(*) as qtd
FROM orders
WHERE created_at >= '2026-09-01' AND created_at < '2026-10-01'
  AND company_id = 1
GROUP BY status_id;
```

### Via API (Integração)
- Endpoints REST do Supabase (`/rest/v1/...`)
- Use filtros query params: `?status_id=eq.5&created_at=gte.2026-09-01`
- Autenticação: `apikey` + `Authorization: Bearer <jwt>`

---

## 7. KPIs Principais (Definições)

| KPI | Fórmula | Meta Sugerida |
|-----|---------|---------------|
| **SS→OS Conversion** | `OSs criadas / SSs no período` | > 80% |
| **OS SLA Cumprimento** | `OSs concluídas no prazo / Total concluídas` | > 90% |
| **Visita Aprovação 1ª vez** | `Visitas processing=5 na 1ª submissão / Total submetidas` | > 85% |
| **Financeiro Aprovação** | `Visitas ov_costs=approved / Submetidas` | > 95% |
| **Estoque Baixo** | `Itens < min_stock / Total itens ativos` | < 5% |
| **Custódia Ativa** | `Itens em custódia > 30 dias / Total custódia` | < 10% |
| **Disponibilidade Média** | `Média ponderada setores` | > 95% |
| **Técnico Produtividade** | `Visitas concluídas / Técnico ativo no mês` | Conforme contrato |

---

## 8. Agendamento de Relatórios (Futuro)

> 🚧 **Roadmap:** Relatórios agendados por e-mail (diário/semanal/mensal)
- Template configurável (filtros fixos)
- Destinatários por perfil
- Formato: PDF (executivo) + CSV (dados)
- Disparo: Cron job no backend

---

## 9. Validações e Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| "Exportação vazia" | Filtros muito restritivos | Revise filtros; teste sem filtros |
| "CSV com encoding errado" | Acentuação quebrada no Excel | Abra no Excel → Dados → De Texto/CSV → UTF-8 |
| "Timeout na exportação" | Muitos dados (> 50k linhas) | Use filtro de período menor ou SSH export |
| "Dashboards lentos" | Query pesada / sem índice | Verifique `EXPLAIN ANALYZE`; adicione índice |
| "Dados desatualizados" | Cache local / offline | Pull-to-refresh; verifique conexão |

---

## 10. Dicas e Boas Práticas

### Para Análise Diária
1. **Comece pelo Pessoal** — Veja suas pendências ("Para Aprovar", "Minhas Visitas")
2. **Use filtros salvos** — Dashboards gravam últimos filtros no `localStorage`
3. **Drill-down sempre** — Card → Lista → Detalhe → Ação

### Para Gestão Semanal
1. **Segunda:** Visitas Admin → Aba "Pendentes Revisão" + "Pendentes Financeiro"
2. **Quarta:** Calendário Admin → Rebalancear equipes da semana
3. **Sexta:** Ranking Líderes + Estoque Baixo → Ações corretivas

### Para Relatórios Mensais (Fechamento)
1. **Exportar CSVs** de: OSs, Visitas, Almoxarifado, Ativos
2. **Consolidar no Excel** → Pivot tables por: Cliente, Tipo, Equipe, Mês
3. **Comparar com mês anterior** → Identificar tendências
4. **Compartilhar PDF** → Stakeholders (use `DashboardUnitsPowerElectric` para clientes)

---

## 11. Perguntas Frequentes (FAQ — Dashboard/Relatórios)

| Pergunta | Resposta |
|----------|----------|
| **Posso criar dashboard customizado?** | Não na interface. Admin pode criar views SQL + componente React novo. |
| **Como faço relatório "OSs por técnico"?** | Dashboard Ordens Admin → Filtra por `requester_team_id` ou `team_id` → Exporta CSV. |
| **Dados do dashboard são tempo real?** | Sim (Supabase Realtime nas views). Pull-to-refresh força atualização. |
| **Posso agendar envio por e-mail?** | Ainda não (roadmap). Workaround: `cron` no servidor → `npm run db:export` → anexa e-mail. |
| **Como exportar TODOS os dados do banco?** | Use túnel SSH + `npm run db:export` (guia em `dev/docs/EXPORTACAO_COMPLETA_GUIA.md`). |
| **Qual a diferença entre "Ordens Admin" e "Ordens Usuário"?** | Admin = todas OSs da empresa + ações gerenciais. Usuário = só OSs da sua equipe + ações operacionais. |

---

## 12. Links Relacionados

- [Cap. 02 — Solicitações de Serviço](./02-solicitacoes-servico.md) — Origem dos dados de SS
- [Cap. 03 — Ordens de Serviço](./03-ordens-servico.md) — Dados de OS nos dashboards
- [Cap. 04 — Visitas Técnicas](./04-visitas-tecnicas.md) — Dados de visitas (técnico + financeiro)
- [Cap. 05 — Ativos e Equipamentos](./05-ativos-equipamentos.md) — Matriz ativos × meses
- [Cap. 07 — Almoxarifado](./07-almoxarifado.md) — Relatórios de estoque/custódia/CMP
- [Cap. 08 — Equipes e Colaboradores](./08-equipes-colaboradores.md) — Ranking de líderes
- [Cap. 11 — Glossário](./11-faq-glossario.md) — Termos: KPI, SLA, CMP, processing, ov_costs_status
- **Guia Técnico:** `dev/docs/EXPORTACAO_COMPLETA_GUIA.md` — Exportação completa do banco