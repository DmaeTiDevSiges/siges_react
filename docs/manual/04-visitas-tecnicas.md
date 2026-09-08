# 04 — Visitas Técnicas

> **Perfil:** Técnico/Líder (execução) • Supervisor Contratada (revisão técnica) • Contratante (aprovação técnica + financeira)  
> **Rota:** `/visits` ou Detalhe OS → "Iniciar Visita"  
> **Máscara:** `{OS.mask}.{seq:2d}` (ex: `42.1.2026.01`)  
> **Processing (técnico):** 1-Rascunho → 2-Reportada → 3-Revisada → 5-Aprovada  
> **Custos (financeiro):** pending → submitted → approved/rejected *(feature flag)*

---

## 1. O que é uma Visita Técnica?

A **Visita** é a **execução real em campo** de uma Ordem de Serviço. É onde o técnico vai até a unidade, faz o serviço, registra evidências, relata atividades e materiais usados.

### Hierarquia
```
SS (Solicitação) → OS (Planejamento) → VISITA (Execução)
                              │
                              └─▶ Pode ter MÚLTIPLAS visitas por OS
```

### Estados Principais (Processing)

| ID | Label | Quem Move | Significado |
|----|-------|-----------|-------------|
| 1 | **Rascunho** | Líder (auto) | Visita criada, preenchendo relatório |
| 2 | **Reportada** | Líder | Relatório enviado para revisão |
| 3 | **Revisada** | Supervisor Contratada | Revisão técnica OK |
| 4 | **Rejeitada** | Supervisor/Contratante | Precisa correção → volta para 1 ou 2 |
| 5 | **Aprovada** | Contratante | Aprovação técnica final |

> **Financeiro (separado, feature flag):** `pending` → `submitted` → `approved` / `rejected`

---

## 2. Fluxo Completo (9 Fases)

```mermaid
flowchart TD
    F1[FASE 1: SS Criada] --> F2[FASE 2: OS Gerada]
    F2 --> F3[FASE 3: OS Autorizada + Equipe]
    F3 --> F4[FASE 4: Assumir/Encaminhar]
    F4 --> F5[FASE 5: Iniciar Visita<br/>(Check-in)]
    F5 --> F6[FASE 6: Executar + Reportar<br/>(Ativos, Fotos, Atividades)]
    F6 --> F7[FASE 7: Revisão Técnica<br/>(Supervisor Contratada)]
    F7 --> F8[FASE 8: Aprovação Técnica<br/>(Contratante)]
    F8 --> F9[FASE 9: Inclusão Custos<br/>(Contratada)]
    F9 --> F10[FASE 10: Aprovação Financeira<br/>(Contratante)]
    F10 --> F11[ARQUIVADO]
    
    F7 -.->|Rejeita| F6
    F8 -.->|Rejeita| F6
    F10 -.->|Rejeita| F9
```

---

## 3. Iniciando a Visita (Check-in)

### Pré-requisitos
- OS em status **Autorizada (3)** ou **Agendada (4)**
- Usuário é **líder da equipe** designada
- Localização (GPS) habilitada no app

### Passos
1. Acesse **Detalhe da OS** → Botão **"Iniciar Visita"**
2. Confirma no modal → Sistema cria:
   - Registro em `orders_visits` (status: Em Andamento, processing: 1-Rascunho)
   - `ov_mask` = `{OS.mask}.{ov_counter:02d}` (ex: `42.1.2026.01`)
   - Vincula **veículo** do usuário (se cadastrado)
   - Adiciona **líder + equipe disponível** em `orders_visits_teams`
   - Atualiza `users`: `ov_id_in_progress`, `is_available=false`, `is_ov_in_progress=true`
   - Envia **notificação** para seguidores da OS

### O que Acontece Automaticamente
| Tabela | Ação |
|--------|------|
| `orders` (SS) | `status_id=5`, `ov_counter++` |
| `orders` (OS) | `status_id=5` |
| `orders_visits` | Insert: `ov_status_id=1`, `ov_processing_id=1` |
| `orders_visits_vehicles` | Insert se usuário tem veículo |
| `orders_visits_teams` | Insert líder (is_leader=true) + equipe disponível |
| `users` | Marca todos da visita como "em visita" |
| `users_notifications` | Alerta seguidores da OS |

---

## 4. Executando e Reportando (Processing: 1 → 2)

### Abas da Tela de Visita

| Aba | Conteúdo | Ações |
|-----|----------|-------|
| **Ativos** | Equipamentos da OS (`order_visit_assets`) | Selecionar quais tiveram intervenção, adicionar observações |
| **Serviços** | `orders_visits_services` | Registrar serviços executados, qtd, valor unit, desconto |
| **Materiais** | `orders_visits_assets_materials` | Materiais consumidos (baixa automática na custódia) |
| **Veículos** | `orders_visits_vehicles` | Km rodado, valor/km |
| **Fotos** | Evidências visuais | Upload (máx. 10 por visita) |
| **Financeiro** | Resumo de valores | *Só visível se processing=5 e feature ativa* |

### Preenchendo o Relatório (Rascunho → Reportada)

1. Preencha **Ativos** (obrigatório: pelo menos 1 com intervenção)
2. Adicione **Serviços** executados
3. Registre **Materiais** consumidos (baixa da custódia do técnico)
4. Informe **Veículos** (km)
5. Anexe **Fotos** (antes/depois, defeitos, testes)
6. Botão **"Reportar Visita"** → `ov_processing_id` = 2 (Reportada)
7. Notifica **Supervisor da Contratada** para revisão

> ⚠️ **Regra:** Não é possível reportar sem pelo menos 1 ativo com intervenção.

---

## 5. Revisão Técnica (Supervisor da Contratada) — Processing: 2 → 3 ou 4

### Acesso
- Menu → Visitas → Aba **"Para Revisar"** (processing = 2)
- Ou notificação push

### Ações do Supervisor
| Ação | Resultado | Quando Usar |
|------|-----------|-------------|
| **Aprovar Tecnicamente** | `processing` = 3 (Revisada) | Relatório completo, dados corretos |
| **Rejeitar** | `processing` = 4 (Rejeitada) + motivo | Faltam dados, fotos ruins, inconsistência |

### Se Rejeitada
- Visita volta para **Rascunho (1)** ou **Reportada (2)** (configurável)
- Líder recebe notificação com motivo
- Líder corrige → "Reportar" novamente

---

## 6. Aprovação Técnica (Contratante) — Processing: 3 → 5

### Acesso
- Menu → Visitas → Aba **"Para Aprovar"** (processing = 3)
- Perfil: Contratante / Gestor do contratante

### Ações
| Ação | Resultado |
|------|-----------|
| **Aprovar** | `processing` = 5 (Aprovada) → Libera fase financeira |
| **Rejeitar / Solicitar Mais Info** | `processing` = 4 (Rejeitada) → Volta para líder |

> ✅ Ao aprovar tecnicamente, a aba **Financeiro** fica visível (se feature flag ativa).

---

## 7. Inclusão de Custos (Contratada) — ov_costs_status: pending → submitted

> ⚠️ **Requer feature flag:** `VITE_FEATURE_ORDER_VISIT_FINANCIAL_APPROVAL=true`

### Quando
- Após `processing` = 5 (Aprovada tecnicamente)
- Visita não arquivada

### O que Preencher
| Item | Tabela | Cálculo |
|------|--------|---------|
| **Serviços** | `orders_visits_services` | `qtd × valor_unit × (1 - desconto%)` |
| **Materiais** | `orders_visits_assets_materials` | `qtd × valor_unit × (1 - desconto%)` |
| **Veículos** | `orders_visits_vehicles` | `km × valor_km` |
| **Total** | — | `servicesValue + materialsValue + vehiclesValue` |

### Envio
- Botão **"Enviar Custos"** → `ov_costs_status` = `submitted`
- Preenche: `ov_costs_submitted_at`, `ov_costs_submitted_by`
- Notifica **Contratante** para aprovação financeira

---

## 8. Aprovação Financeira (Contratante) — ov_costs_status: submitted → approved/rejected

### Acesso
- Visita com `processing=5` e `ov_costs_status=submitted`
- Aba **Financeiro** → Botões "Aprovar" / "Rejeitar"

### Ações
| Ação | Resultado | Campos Atualizados |
|------|-----------|-------------------|
| **Aprovar** | `approved` | `ov_costs_approved_at`, `ov_costs_approved_by` |
| **Rejeitar** | `rejected` + motivo | `ov_costs_rejected_at`, `ov_costs_rejected_by`, `ov_costs_rejection_reason` |

### Se Rejeitado
- `ov_costs_status` = `rejected`
- Contratada recebe notificação
- Pode corrigir → **"Corrigir e Reenviar"** → volta para `submitted`

---

## 9. Arquivamento Final

### Condições
- ✅ `processing` = 5 (Aprovada tecnicamente)
- ✅ `ov_costs_status` = `approved` (se feature ativa) — *senão, ignora*
- ✅ Relatório completo

### Ação
- Botão **"Arquivar"** (apenas Contratante/Admin)
- `ov_is_filed` = `true`
- OS mãe → `status_id` = 8 (Concluída) se não houver outras visitas abertas
- SS avó → `status_id` = 8 se não houver outras OS em andamento

---

## 10. Matriz de Permissões (Resumo)

| Ação | Contratante | Supervisor Contratada | Líder/Técnico |
|------|-------------|----------------------|---------------|
| Iniciar Visita | ❌ | ❌ | ✅ (líder) |
| Reportar Visita | ❌ | ❌ | ✅ (líder) |
| Revisar Tecnicamente | ❌ | ✅ | ❌ |
| Aprovar Tecnicamente | ✅ | ❌ | ❌ |
| Enviar Custos | ❌ | ✅ | ✅ (líder) |
| Aprovar Financeiramente | ✅ | ❌ | ❌ |
| Rejeitar Custos | ✅ | ❌ | ❌ |
| Arquivar Visita | ✅ | ❌ | ❌ |

---

## 11. Badges de Status na Tela

| Processing | Financeiro | Badge Exibido |
|------------|------------|---------------|
| 1 (Rascunho) | — | 🟡 **Rascunho** |
| 2 (Reportada) | — | 🔵 **Reportada** |
| 3 (Revisada) | — | 🟣 **Revisada** |
| 4 (Rejeitada) | — | 🔴 **Rejeitada** |
| 5 (Aprovada) | pending | 🟢 **Aprovada** · 🟡 **Aguardando Custos** |
| 5 (Aprovada) | submitted | 🟢 **Aprovada** · 🔵 **Custos Enviados** |
| 5 (Aprovada) | approved | 🟢 **Aprovada** · 🟢 **Financeiro Aprovado** |
| 5 (Aprovada) | rejected | 🟢 **Aprovada** · 🔴 **Custos Rejeitados** |
| 5 + filed | — | ⚫ **Arquivada** |

---

## 12. Validações e Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| "Localização necessária" | GPS desabilitado | Ative localização no app/celular |
| "Usuário já em visita" | `ov_id_in_progress` preenchido | Finalize visita atual primeiro |
| "Nenhum ativo com intervenção" | Tentou reportar sem selecionar ativo | Marque pelo menos 1 ativo na aba Ativos |
| "Visita já reportada" | `processing` ≠ 1 | Edite em Rascunho ou peça rejeição |
| "Não pode encaminhar: visita aberta" | OS tem visita com `processing` < 5 | Finalize/cancele a visita atual |
| "Feature financeira desabilitada" | Flag `VITE_FEATURE_ORDER_VISIT_FINANCIAL_APPROVAL=false` | Peça ao admin para ativar |

---

## 13. Cálculos Financeiros (Resumo)

```
servicesValue = Σ(quantidade × valor_unitário × (1 - desconto/100))
materialsValue = Σ(quantidade × valor_unitário × (1 - desconto/100))
vehiclesValue = Σ(km_rodado × valor_por_km)
totalValue = servicesValue + materialsValue + vehiclesValue
```

- Valores unitários vêm de tabelas de preço do contrato
- Desconto % por item (negociação pontual)

---

## 14. Dicas e Boas Práticas

### Para Técnicos/Líderes
1. **Inicie a visita no local** — GPS valida presença
2. **Fotografe ANTES e DEPOIS** — Evita questionamentos
3. **Preencha materiais na hora** — Baixa automática da custódia
4. **Reveja antes de "Reportar"** — Evita ida/volta com supervisor

### Para Supervisores (Contratada)
1. **Revise no mesmo dia** — Evita acúmulo
2. **Seja específico na rejeição** — "Foto do painel faltando" > "Incompleto"
3. **Valide quantidades de materiais** — Confere com almoxarifado

### Para Contratantes
1. **Aprove tecnicamente rápido** — Libera financeiro
2. **Confira valores contra contrato** — Tabela de preços, descontos acordados
3. **Rejeite com motivo claro** — "Valor do serviço X acima do teto contratual"

---

## 15. Perguntas Frequentes (FAQ — Visitas)

| Pergunta | Resposta |
|----------|----------|
| **Posso ter várias visitas na mesma OS?** | Sim. Cada uma ganha máscara `.01`, `.02`, `.03`... |
| **O que acontece se eu fechar o app durante a visita?** | Dados ficam salvos localmente (Rascunho). Reabra e continue. |
| **Posso editar visita após "Aprovada"?** | Não. Só se Contratante rejeitar (volta para Rascunho). |
| **Materiais baixam do estoque na hora?** | Sim, ao reportar (trigger `BAIXA_VISITA` no banco). |
| **Veículo é obrigatório?** | Não. Só se usuário tem `vehicle_id` cadastrado. |
| **Como adicionar mais técnicos na visita?** | Líder edita visita → Aba "Equipe" → "Adicionar Membro" (disponíveis). |
| **O que é "Processing" vs "Status OS"?** | `processing` = estado do relatório da visita (1-5). `status_id` da OS = 5 (Em Andamento) enquanto houver visita aberta. |

---

## 16. Links Relacionados

- [Cap. 03 — Ordens de Serviço (OS)](./03-ordens-servico.md) — Origem da visita
- [Cap. 05 — Ativos e Equipamentos](./05-ativos-equipamentos.md) — Ativos intervencionados
- [Cap. 07 — Almoxarifado](./07-almoxarifado.md) — Materiais consumidos (baixa visita)
- [Cap. 08 — Equipes e Colaboradores](./08-equipes-colaboradores.md) — Designação de equipes
- [Cap. 11 — Glossário](./11-faq-glossario.md) — Termos: processing, ov_mask, ov_costs_status