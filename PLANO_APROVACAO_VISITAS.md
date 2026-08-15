# Plano: Aprovação de Visitas com Fases Separadas (Técnica + Financeira)

## 📋 Resumo do Cenário

| Empresa | Papel |
|---------|-------|
| **Contratante** | Gera SS/OS, autoriza, aprova técnica e financeiramente |
| **Contratada** | Executa serviços, reporta visitas, inclui custos |

---

## 🔄 Fluxo Proposto (9 Fases)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUXO DE APROVAÇÃO DE VISITAS                       │
└─────────────────────────────────────────────────────────────────────────────┘

FASE 1: GERAÇÃO DA SS (Não Programada)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Contratante cria SS ( Solicitação de Serviço )
  Status OS: NP (Não Programada) = 1

FASE 2: GERAÇÃO DA OS (Em Avaliação)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Contratante converte SS → OS
  Status OS: AV (Avaliação) = 2

FASE 3: AUTORIZAÇÃO DA OS
━━━━━━━━━━━━━━━━━━━━━━━━━━
  Contratante autoriza OS e designa equipe da Contratada
  Status OS: AU (Autorizada) = 3
  Campo: teamId (equipe responsável)

FASE 4: ASSUMIR OU ENCAMINHAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Equipe da Contratada:
  ┌─ Assumir responsabilidade (criar visita)
  └─ Encaminhar para outra equipe (SE não houver visita aberta)
  Status OS: AG (Agendada) = 4 ou EX (Execução) = 5

FASE 5: REPORTE DA VISITA (Pela Equipe)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Líder reporta visita com:
  • Equipamentos sobre intervenção
  • Fotos
  • Atividades realizadas
  
  Processing: 1 (Rascunho) → 2 (Reportada)

FASE 6: REVISÃO TÉCNICA (Pelo Supervisor da Contratada)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Supervisor revisa e:
  ┌─ Aprova tecnicamente → Processing: 2 → 3 (Revisada)
  └─ Rejeita → Processing: 2 → 4 (Rejeitada) → volta para Fase 5

FASE 7: APROVAÇÃO TÉCNICA (Pela Contratante)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Contratante analisa informações técnicas:
  ┌─ Aprova tecnicamente → Processing: 3 → 5 (Aprovada)
  └─ Rejeita → Solicita maiores informações → volta para Fase 5

  ✅ USA O STATUS EXISTENTE: processing_id = 5 (Aprovada)

FASE 8: INCLUSÃO DE CUSTOS (Pela Contratada)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Contratada inclui:
  • Serviços executados (orders_visits_services)
  • Materiais utilizados (orders_visits_assets_materials)
  • Transporte/veículos (orders_visits_vehicles)
  
  Valores são calculados automaticamente:
  • servicesValue = Σ(serviço × valorUnit × desconto)
  • materialsValue = Σ(material × valorUnit × desconto)
  • vehiclesValue = Σ(km × valorUnit)
  • totalValue = servicesValue + materialsValue + vehiclesValue

  ⚠️ NÃO MUDA O PROCESSING (continua = 5)
  ✅ USA CAMPO NOVO: ov_costs_status = 'pending' | 'submitted' | 'approved' | 'rejected'

FASE 9: APROVAÇÃO FINANCEIRA (Pela Contratante)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Contratante analisa custos:
  ┌─ Aprova definitivamente → ov_costs_status = 'approved'
  └─ Rejeita → ov_costs_status = 'rejected' → volta para Fase 8

  ✅ USA CAMPO NOVO: ov_costs_status = 'approved' | 'rejected'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ESTADO FINAL: 
  • processing_id = 5 (Aprovada)
  • ov_costs_status = 'approved'
  → Pode ser arquivada (is_filed = true)
  → OS retorna para CONCLUÍDA (status = 8)
```

---

## 🗂️ Mudanças no Banco de Dados

### Tabela `orders_visits` (campos novos)

```sql
-- Controle de aprovação financeira (SEPARADO do processing)
ALTER TABLE orders_visits 
  ADD COLUMN ov_costs_status TEXT DEFAULT 'pending' 
    CHECK (ov_costs_status IN ('pending', 'submitted', 'approved', 'rejected')),
  ADD COLUMN ov_costs_submitted_at TIMESTAMPTZ,
  ADD COLUMN ov_costs_submitted_by UUID REFERENCES users(id),
  ADD COLUMN ov_costs_approved_at TIMESTAMPTZ,
  ADD COLUMN ov_costs_approved_by UUID REFERENCES users(id),
  ADD COLUMN ov_costs_rejected_at TIMESTAMPTZ,
  ADD COLUMN ov_costs_rejected_by UUID REFERENCES users(id),
  ADD COLUMN ov_costs_rejection_reason TEXT;

-- Comentário explicativo
COMMENT ON COLUMN orders_visits.ov_costs_status IS 
  'Status da aprovação financeira: pending (aguardando custos), submitted (custos enviados), approved (aprovado), rejected (rejeitado)';
```

### Tabela `orders_visits_evaluations` (já existe - expandida)

```sql
-- Adicionar tipo de avaliação financeira
-- (já existe avaliação técnica, agora permite também financeira)
ALTER TABLE orders_visits_evaluations
  ADD COLUMN ove_evaluation_type TEXT DEFAULT 'technical'
    CHECK (ove_evaluation_type IN ('technical', 'financial'));
```

---

## 📊 Fluxo de Status (Sem Criar Novos Processing)

```
                    PROCESSING EXISTENTE (1-5)
                    ────────────────────────────
                    
    ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
    │    1     │ ──▶ │    2     │ ──▶ │    3     │ ──▶ │    5     │     │    5     │
    │ Rascunho │     │ Reportada│     │ Revisada │     │ Aprovada │     │ Aprovada │
    └──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘
                           │                │                │                │
                           ▼                ▼                ▼                ▼
                    ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
                    │    4     │     │    4     │     │          │     │          │
                    │Rejeitada │     │Rejeitada │     │          │     │          │
                    └──────────┘     └──────────┘     └──────────┘     └──────────┘
                    
                    
                   APROVAÇÃO FINANCEIRA (campo separado)
                   ─────────────────────────────────────
                   
    ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
    │ pending  │ ──▶ │submitted │ ──▶ │ approved │     │ rejected │
    │ Aguarda  │     │ Enviado  │     │ Aprovado │     │ Rejeitado│
    └──────────┘     └──────────┘     └──────────┘     └──────────┘
                           │                │                │
                           │                │                │
                           ▼                ▼                ▼
                    ┌──────────┐     ┌──────────┐     ┌──────────┐
                    │          │     │          │     │ submitted│
                    │          │     │          │     │ (corrigir│
                    │          │     │          │     │  custos) │
                    └──────────┘     └──────────┘     └──────────┘
```

---

## 📊 Matriz de Transições

### Processing (Técnico) - SEM MUDANÇAS

| De | Para | Quem | Condições |
|----|------|------|-----------|
| 1 (Rascunho) | 2 (Reportada) | Líder | Todos ativos com processing=2 |
| 2 (Reportada) | 3 (Revisada) | Supervisor Contratada | Todos ativos com processing=3 |
| 2 (Reportada) | 4 (Rejeitada) | Supervisor Contratada | Pelo menos 1 ativo com processing=4 |
| 3 (Revisada) | 5 (Aprovada) | Contratante | Análise técnica aprovada |
| 3 (Revisada) | 4 (Rejeitada) | Contratante | Solicita mais informações |
| 4 (Rejeitada) | 2 (Reportada) | Líder | Correções realizadas |

### Aprovação Financeira (NOVO CONTROLE)

| De | Para | Quem | Condições |
|----|------|------|-----------|
| pending | submitted | Contratada | Custos preenchidos (serviços, materiais, veículos) |
| submitted | approved | Contratante | Aprovação financeira |
| submitted | rejected | Contratante | Rejeição de custos |
| rejected | submitted | Contratada | Custos corrigidos |

---

## 🔐 Controles de Acesso (RBAC)

### Permissões Novas

```sql
INSERT INTO permissions (code, description) VALUES
('orders_visits_costs_submit', 'Enviar custos para aprovação financeira'),
('orders_visits_financial_approve', 'Aprovar custos financeiros'),
('orders_visits_financial_reject', 'Rejeitar custos financeiros');
```

### Matriz de Permissões

| Ação | Contratante | Contratada (Supervisor) | Contratada (Líder) |
|------|-------------|------------------------|-------------------|
| Gerar SS/OS | ✅ | ❌ | ❌ |
| Autorizar OS | ✅ | ❌ | ❌ |
| Assumir/Encaminhar OS | ❌ | ✅ | ✅ |
| Reportar Visita | ❌ | ❌ | ✅ |
| Revisar Tecnicamente | ❌ | ✅ | ❌ |
| Aprovar Tecnicamente | ✅ | ❌ | ❌ |
| Enviar Custos | ❌ | ✅ | ✅ |
| Aprovar Financeiramente | ✅ | ❌ | ❌ |
| Arquivar Visita | ✅ | ❌ | ❌ |

---

## 🎨 Mudanças na Interface

### 1. `OrderVisitScreen.tsx`

Adicionar lógica para exibir/ocultar seção financeira:

```typescript
// Só mostra aba financeira SE:
// - processing_id = 5 (Aprovada)
// - visit não está arquivada
const showFinancialSection = visit.ov_processing_id === 5 && !visit.ov_is_filed;
```

### 2. `OrderVisitFinancialDetail.tsx` (EXPANDIR)

```typescript
// Adicionar botões de ação baseados no ov_costs_status
const getFinancialActions = () => {
  switch (visit.ov_costs_status) {
    case 'pending':
      return canSubmitCosts ? [<Button key="submit">Enviar Custos</Button>] : [];
    case 'submitted':
      return canApproveFinancial ? [
        <Button key="approve" color="green">Aprovar</Button>,
        <Button key="reject" color="red">Rejeitar</Button>
      ] : [];
    case 'rejected':
      return canSubmitCosts ? [<Button key="resubmit">Corrigir e Reenviar</Button>] : [];
    default:
      return [];
  }
};
```

### 3. Novo Componente: `OrderVisitFinancialStatus.tsx`

```tsx
// Badge de status financeiro
interface FinancialStatusBadgeProps {
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
}

const statusConfig = {
  pending: { label: 'Aguardando Custos', color: 'bg-gray-100 text-gray-800' },
  submitted: { label: 'Custos Enviados', color: 'bg-blue-100 text-blue-800' },
  approved: { label: 'Financeiro Aprovado', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Custos Rejeitados', color: 'bg-red-100 text-red-800' },
};
```

### 4. `OrderVisitProcessingButton.tsx` (SEM MUDANÇAS)

Mantém os 5 status existentes (1-5).

---

## 📱 Fluxo de Telas

```
┌─────────────────────────────────────────────────────────────────┐
│                     TELA PRINCIPAL DA VISITA                    │
├─────────────────────────────────────────────────────────────────┤
│  [Status: Aprovada] [Financeiro: Custos Enviados]  [Ações ▼]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐     │
│  │  Ativos     │  Serviços   │  Materiais  │  Veículos   │     │
│  │  (Fechado)  │  (Fechado)  │  (Fechado)  │  (Fechado)  │     │
│  └─────────────┴─────────────┴─────────────┴─────────────┘     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              💰 RESUMO FINANCEIRO                       │   │
│  │                                                         │   │
│  │  Serviços:     R$ 1.250,00                             │   │
│  │  Materiais:    R$   890,50                             │   │
│  │  Transporte:   R$   320,00                             │   │
│  │  ─────────────────────────                              │   │
│  │  TOTAL:        R$ 2.460,50                             │   │
│  │                                                         │   │
│  │  [✓ Aprovar Financeiramente]  [✗ Rejeitar Custos]      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              📝 HISTÓRICO                               │   │
│  │  • 14/08 10:30 - Líder reportou visita                 │   │
│  │  • 14/08 14:00 - Supervisor revisou tecnicamente        │   │
│  │  • 15/08 09:00 - Contratante aprovou tecnicamente       │   │
│  │  • 15/08 11:00 - Contratada enviou custos              │   │
│  │  • 15/08 15:00 - Aguardando aprovação financeira       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Implementação Recomendada

### Fase 0: Feature Flag
1. Criar helper `isFinancialApprovalEnabled()` em `src/config/features.ts`
2. Adicionar `VITE_FEATURE_ORDER_VISIT_FINANCIAL_APPROVAL=false` no `.env.example`
3. Usar a flag em todos os componentes novos

### Fase 1: Backend (Banco)
1. Adicionar campos de aprovação financeira em `orders_visits`
2. Criar índice para `ov_costs_status`
3. Criar função RPC para atualizar status financeiro
4. Criar trigger de auditoria

### Fase 2: Serviços TypeScript
1. Atualizar `visitsService.ts`:
   - `submitVisitCosts(ovId)` - muda pending → submitted
   - `approveVisitFinancial(ovId)` - muda submitted → approved
   - `rejectVisitFinancial(ovId, reason)` - muda submitted → rejected
2. Atualizar `dataService.ts` com novos proxies

### Fase 3: Interface
1. Criar `OrderVisitFinancialStatus.tsx`
2. Atualizar `OrderVisitFinancialDetail.tsx`
3. Atualizar `OrderVisitScreen.tsx` (usando feature flag)
4. Adicionar controle de acesso por perfil

### Fase 4: Validações
1. Testar transições de status financeiro
2. Validar regras de negócio
3. Testar cenários de rejeição e correção
4. Validar cálculos financeiros

---

## ✅ Checklist de Implementação

- [ ] Criar helper `isFinancialApprovalEnabled()` em `src/config/features.ts`
- [ ] Adicionar `VITE_FEATURE_ORDER_VISIT_FINANCIAL_APPROVAL=false` no `.env.example`
- [ ] Adicionar campos de aprovação financeira no banco
- [ ] Criar índices para performance
- [ ] Implementar RPCs de status financeiro
- [ ] Atualizar visitsService.ts
- [ ] Atualizar dataService.ts
- [ ] Criar componente OrderVisitFinancialStatus
- [ ] Atualizar OrderVisitFinancialDetail (usando feature flag)
- [ ] Atualizar OrderVisitScreen (usando feature flag)
- [ ] Adicionar controle de acesso
- [ ] Testar fluxo completo
- [ ] Documentar API
- [ ] Treinar usuários

---

## 🚦 Feature Flag de Controle

### Variável de Ambiente

```env
# .env.local ou .env.development
VITE_FEATURE_ORDER_VISIT_FINANCIAL_APPROVAL=false
```

### Uso no Código

```typescript
// Helper para verificar se a feature está habilitada
export const isFinancialApprovalEnabled = () => {
  return import.meta.env.VITE_FEATURE_ORDER_VISIT_FINANCIAL_APPROVAL === 'true';
};
```

### Exemplos de Uso nos Componentes

```tsx
// OrderVisitScreen.tsx
import { isFinancialApprovalEnabled } from '@/config/features';

// Só mostra seção financeira se feature habilitada
{isFinancialApprovalEnabled() && (
  <FinancialSection visit={visit} />
)}
```

```tsx
// OrderVisitFinancialDetail.tsx
import { isFinancialApprovalEnabled } from '@/config/features';

// Só mostra botões de aprovação se feature habilitada
{isFinancialApprovalEnabled() && visit.ov_processing_id === 5 && (
  <FinancialApprovalActions visit={visit} />
)}
```

### Rollback Rápido

```
Para DESLIGAR a funcionalidade:
1. Mudar .env: VITE_FEATURE_ORDER_VISIT_FINANCIAL_APPROVAL=false
2. Redeploy (ou hot reload em desenvolvimento)
3. Feature fica invisível, mas dados permanecem no banco
```

---

## 🎯 Vantagens desta Abordagem

1. **Não altera o processamento existente** (1-5 continua igual)
2. **Controle separado** para aprovação financeira
3. **Rastreabilidade completa** de quem aprovou/rejeitou e quando
4. **Flexibilidade** para mudar regras financeiras sem afetar técnicas
5. **Mínimo de impacto** no código existente
6. **Feature flag** permite desligar instantaneamente sem rollback
