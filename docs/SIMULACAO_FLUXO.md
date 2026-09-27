# Simulação: Fluxo Completo de Aprovação de Visita

## 📋 Dados Iniciais

```
┌─────────────────────────────────────────────────────────────────┐
│                    DADOS DA ORDEM DE SERVIÇO                    │
├─────────────────────────────────────────────────────────────────┤
│  OS编号: OS-2024-001234                                         │
│  Contratante: Petrobras                                         │
│  Contratada: PetroService                                       │
│  Unidade: Refinaria Landulpho Alves                             │
│  Prioridade: Alta                                               │
│  Descrição: Manutenção preventiva bomba centrifuga B-101       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Simulação Passo a Passo

### FASE 1: Geração da SS (Não Programada)

```
USUÁRIO: Gerente de Manutenção (Contratante)
Ação: Cria Solicitação de Serviço

┌─────────────────────────────────────────────────────────────────┐
│  TELA: Formulário de SS                                        │
├─────────────────────────────────────────────────────────────────┤
│  Unidade: [Refinaria Landulpho Alves     ▼]                    │
│  Equipamento: [Bomba Centrífuga B-101    ▼]                    │
│  Descrição: Manutenção preventiva bomba centrifuga B-101       │
│  Prioridade: [Alta ▼]                                          │
│  Observações: Vazamento detectado na vedação                   │
│                                                                 │
│  [Salvar como SS]                                              │
└─────────────────────────────────────────────────────────────────┘

RESULTADO:
  • SS criada: SS-2024-005678
  • Status OS: NP (Não Programada) = 1
  • Data: 14/08/2024 08:30
```

---

### FASE 2: Geração da OS (Em Avaliação)

```
USUÁRIO: Gerente de Manutenção (Contratante)
Ação: Converte SS → OS

┌─────────────────────────────────────────────────────────────────┐
│  TELA: Conversão SS → OS                                       │
├─────────────────────────────────────────────────────────────────┤
│  SS Origem: SS-2024-005678                                     │
│  Contrato: [Contrato Manutenção Industrial ▼]                  │
│  Tipo Serviço: [Manutenção Preventiva ▼]                       │
│  Classificação: [Mecânica ▼]                                   │
│                                                                 │
│  [Converter para OS]                                           │
└─────────────────────────────────────────────────────────────────┘

RESULTADO:
  • OS criada: OS-2024-001234
  • Status OS: AV (Avaliação) = 2
  • Data: 14/08/2024 09:00
```

---

### FASE 3: Autorização da OS

```
USUÁRIO: Gerente de Manutenção (Contratante)
Ação: Autoriza OS e designa equipe

┌─────────────────────────────────────────────────────────────────┐
│  TELA: Autorização de OS                                       │
├─────────────────────────────────────────────────────────────────┤
│  OS: OS-2024-001234                                            │
│  Contratada: [PetroService ▼]                                  │
│  Equipe: [Equipe Mecânica Alpha ▼]                             │
│  Data Prevista: [20/08/2024]                                   │
│  Observações: Urgente - bomba parada                           │
│                                                                 │
│  [Autorizar OS]                                                │
└─────────────────────────────────────────────────────────────────┘

RESULTADO:
  • Status OS: AU (Autorizada) = 3
  • Equipe designada: Equipe Mecânica Alpha (ID: team-001)
  • Data: 14/08/2024 09:30
```

---

### FASE 4: Assumir ou Encaminhar

```
USUÁRIO: Líder da Equipe (Contratada)
Ação: Assume responsabilidade pela OS

┌─────────────────────────────────────────────────────────────────┐
│  TELA: Atribuição de OS                                        │
├─────────────────────────────────────────────────────────────────┤
│  OS: OS-2024-001234                                            │
│  Equipe Original: Equipe Mecânica Alpha                        │
│  Opções:                                                       │
│    (•) Assumir responsabilidade                                │
│    ( ) Encaminhar para outra equipe                            │
│                                                                 │
│  [Confirmar]                                                   │
└─────────────────────────────────────────────────────────────────┘

RESULTADO:
  • Status OS: EX (Execução) = 5
  • Visita criada: VIS-2024-003456
  • Processing: 1 (Rascunho)
  • Data: 14/08/2024 10:00
```

---

### FASE 5: Reporte da Visita

```
USUÁRIO: Líder da Equipe (Contratada)
Ação: Reporta visita com informações técnicas

┌─────────────────────────────────────────────────────────────────┐
│  TELA: Reporte de Visita                                       │
├─────────────────────────────────────────────────────────────────┤
│  Visita: VIS-2024-003456                                       │
│                                                                 │
│  ┌─ ATIVOS INTERVENIDOS ─────────────────────────────────────┐ │
│  │  Ativo: Bomba Centrífuga B-101                            │ │
│  │  Estado Anterior: Funcionando com vazamento               │ │
│  │  Estado Posterior: Vedação substituída, sem vazamento     │ │
│  │  Fotos: [foto_antes.jpg] [foto_depois.jpg]                │ │
│  │                                                           │ │
│  │  Atividades Realizadas:                                   │ │
│  │  ☑ Desmontagem da bomba                                   │ │
│  │  ☑ Substituição da vedação mecânica                       │ │
│  │  ☑ Recalibração do eixo                                  │ │
│  │  ☑ Teste de estanqueidade                                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ SERVIÇOS EXECUTADOS ─────────────────────────────────────┐ │
│  │  Serviço: Manutenção preventiva bomba                     │ │
│  │  Quantidade: 1                                            │ │
│  │  Valor Unitário: R$ 1.250,00                              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ MATERIAIS UTILIZADOS ────────────────────────────────────┐ │
│  │  Material: Vedação mecânica ANSI B71.1                    │ │
│  │  Quantidade: 2                                            │ │
│  │  Valor Unitário: R$ 445,25                                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ VEÍCULOS ────────────────────────────────────────────────┐ │
│  │  Veículo: Carro Baú ABC-1234                              │ │
│  │  Km Inicial: 45.230                                       │ │
│  │  Km Final: 45.280                                         │ │
│  │  Valor por Km: R$ 1,50                                    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [Reportar Visita]                                             │
└─────────────────────────────────────────────────────────────────┘

RESULTADO:
  • Processing: 1 (Rascunho) → 2 (Reportada)
  • Data: 15/08/2024 14:00
  
  CUSTOS CALCULADOS:
  • Serviços: R$ 1.250,00
  • Materiais: R$ 890,50 (2 × R$ 445,25)
  • Transporte: R$ 75,00 (50km × R$ 1,50)
  • TOTAL: R$ 2.215,50
```

---

### FASE 6: Revisão Técnica

```
USUÁRIO: Supervisor de Manutenção (Contratada)
Ação: Revisa informações técnicas

┌─────────────────────────────────────────────────────────────────┐
│  TELA: Revisão Técnica                                         │
├─────────────────────────────────────────────────────────────────┤
│  Visita: VIS-2024-003456                                       │
│  Status: Reportada                                             │
│                                                                 │
│  ┌─ CHECKLIST DE REVISÃO ────────────────────────────────────┐ │
│  │  ☑ Fotos antes/depois conferidas                          │ │
│  │  ☑ Atividades condizem com serviço solicitado             │ │
│  │  ☑ Equipamentos sobre intervenção corretos                │ │
│  │  ☑ Materiais utilizados conferem com estoque              │ │
│  │  ☑ Valores dos serviços conferem com contrato             │ │
│  │  ☑ Veículos e km conferidos                               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Observações: Tudo conferido, padrão de qualidade atendido     │
│                                                                 │
│  [Aprovar Tecnicamente]  [Rejeitar]                            │
└─────────────────────────────────────────────────────────────────┘

USUÁRIO: Supervisor de Manutenção (Contratada)
Ação: Aprova tecnicamente

RESULTADO:
  • Processing: 2 (Reportada) → 3 (Revisada)
  • Data: 15/08/2024 16:30
```

---

### FASE 7: Aprovação Técnica (Contratante)

```
USUÁRIO: Gerente de Manutenção (Contratante)
Ação: Analisa e aprova informações técnicas

┌─────────────────────────────────────────────────────────────────┐
│  TELA: Aprovação Técnica                                       │
├─────────────────────────────────────────────────────────────────┤
│  Visita: VIS-2024-003456                                       │
│  Status: Revisada                                              │
│                                                                 │
│  ┌─ RESUMO TÉCNICO ──────────────────────────────────────────┐ │
│  │  Equipamento: Bomba Centrífuga B-101                      │ │
│  │  Serviço: Manutenção preventiva                           │ │
│  │  Atividades: 4 itens executados                           │ │
│  │  Fotos: 2 imagens (antes/depois)                          │ │
│  │  Status: Aprovado pelo supervisor da contratada           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ DOCUMENTAÇÃO ────────────────────────────────────────────┐ │
│  │  ☑ Relatório técnico anexado                              │ │
│  │  ☑ Fotos validadas                                        │ │
│  │  ☑ Assinatura do líder confirmada                         │ │
│  │  ☑ Assinatura do supervisor confirmada                    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [Aprovar Tecnicamente]  [Solicitar Mais Informações]          │
└─────────────────────────────────────────────────────────────────┘

USUÁRIO: Gerente de Manutenção (Contratante)
Ação: Aprova tecnicamente

RESULTADO:
  • Processing: 3 (Revisada) → 5 (Aprovada)
  • Data: 16/08/2024 09:00
  
  ⚠️ VISITA AGORA ESTÁ "APROVADA" (processing = 5)
  ⚠️ PODE RECEBER INCLUSÃO DE CUSTOS
```

---

### FASE 8: Inclusão de Custos

```
USUÁRIO: Supervisor de Manutenção (Contratada)
Ação: Inclui custos detalhados

┌─────────────────────────────────────────────────────────────────┐
│  TELA: Inclusão de Custos                                      │
├─────────────────────────────────────────────────────────────────┤
│  Visita: VIS-2024-003456                                       │
│  Status: Aprovada                                              │
│  Financeiro: Aguardando Custos                                 │
│                                                                 │
│  ┌─ SERVIÇOS ────────────────────────────────────────────────┐ │
│  │  Serviço                    Qtd   Valor Unit   Subtotal   │ │
│  │  Manutenção preventiva      1     R$ 1.250,00  R$ 1.250,00│ │
│  │  ─────────────────────────────────────────────────────────│ │
│  │  Total Serviços: R$ 1.250,00                              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ MATERIAIS ───────────────────────────────────────────────┐ │
│  │  Material                   Qtd   Valor Unit   Subtotal   │ │
│  │  Vedação mecânica ANSI      2     R$ 445,25    R$ 890,50  │ │
│  │  ─────────────────────────────────────────────────────────│ │
│  │  Total Materiais: R$ 890,50                               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ TRANSPORTE ──────────────────────────────────────────────┐ │
│  │  Veículo         Km Rodado  Valor/Km    Subtotal          │ │
│  │  Carro Baú       50 km      R$ 1,50     R$ 75,00         │ │
│  │  ─────────────────────────────────────────────────────────│ │
│  │  Total Transporte: R$ 75,00                               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ RESUMO FINANCEIRO ───────────────────────────────────────┐ │
│  │  Serviços:     R$ 1.250,00                                │ │
│  │  Materiais:    R$   890,50                                │ │
│  │  Transporte:   R$    75,00                                │ │
│  │  ════════════════════════════════════════════════════════ │ │
│  │  TOTAL:        R$ 2.215,50                                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Observações: Custos conforme contrato vigente                 │
│                                                                 │
│  [Enviar para Aprovação Financeira]                            │
└─────────────────────────────────────────────────────────────────┘

USUÁRIO: Supervisor de Manutenção (Contratada)
Ação: Envia custos para aprovação

RESULTADO:
  • ov_costs_status: pending → submitted
  • Data: 16/08/2024 10:30
  
  ⚠️ CUSTOS ENVIADOS PARA APROVAÇÃO FINANCEIRA
  ⚠️ AGUARDANDO ANÁLISE DA CONTRATANTE
```

---

### FASE 9: Aprovação Financeira

```
USUÁRIO: Gerente de Manutenção (Contratante)
Ação: Analisa custos

┌─────────────────────────────────────────────────────────────────┐
│  TELA: Aprovação Financeira                                    │
├─────────────────────────────────────────────────────────────────┤
│  Visita: VIS-2024-003456                                       │
│  Status: Aprovada                                              │
│  Financeiro: Custos Enviados                                   │
│                                                                 │
│  ┌─ ANÁLISE FINANCEIRA ──────────────────────────────────────┐ │
│  │                                                           │ │
│  │  Serviços:                                               │ │
│  │  ☑ Manutenção preventiva - R$ 1.250,00                   │ │
│  │    Preço contrato: R$ 1.250,00 ✓ Confere                 │ │
│  │                                                           │ │
│  │  Materiais:                                              │ │
│  │  ☑ Vedação mecânica - R$ 890,50                          │ │
│  │    Preço contrato: R$ 445,25/un ✓ Confere                │ │
│  │                                                           │ │
│  │  Transporte:                                             │ │
│  │  ☑ Carro Baú - R$ 75,00                                  │ │
│  │    Km: 50 ✓ Confere                                      │ │
│  │    Valor/km: R$ 1,50 ✓ Confere                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ VALIDAÇÕES ──────────────────────────────────────────────┐ │
│  │  ☑ Valores conferem com tabela de preços                 │ │
│  │  ☑ Quantidades batem com relatório técnico               │ │
│  │  ☑ Descontos aplicados conforme contrato                 │ │
│  │  ☑ Sem duplicidade de itens                              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Total: R$ 2.215,50                                            │
│                                                                 │
│  [Aprovar Financeiramente]  [Rejeitar Custos]                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### CENÁRIO A: Aprovação Definitiva

```
USUÁRIO: Gerente de Manutenção (Contratante)
Ação: Aprova custos

┌─────────────────────────────────────────────────────────────────┐
│  CONFIRMAÇÃO DE APROVAÇÃO FINANCEIRA                           │
├─────────────────────────────────────────────────────────────────┤
│  Visita: VIS-2024-003456                                       │
│  Valor Total: R$ 2.215,50                                      │
│                                                                 │
│  Deseja aprovar definitivamente esta visita?                   │
│                                                                 │
│  [Confirmar Aprovação]  [Cancelar]                             │
└─────────────────────────────────────────────────────────────────┘

RESULTADO:
  • ov_costs_status: submitted → approved
  • ov_costs_approved_at: 16/08/2024 11:00
  • ov_costs_approved_by: user-gerente-001
  • Data: 16/08/2024 11:00
  
  ✅ VISITA COMPLETAMENTE APROVADA
  ✅ PODE SER ARQUIVADA (is_filed = true)
  ✅ OS PODE SER CONCLUÍDA (status = 8)
```

---

### CENÁRIO B: Rejeição de Custos

```
USUÁRIO: Gerente de Manutenção (Contratante)
Ação: Rejeita custos

┌─────────────────────────────────────────────────────────────────┐
│  MOTIVO DA REJEIÇÃO                                            │
├─────────────────────────────────────────────────────────────────┤
│  Visita: VIS-2024-003456                                       │
│  Valor Total: R$ 2.215,50                                      │
│                                                                 │
│  Motivo da Rejeição:                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Material "Vedação mecânica" com valor acima do          │   │
│  │ contrato. Preço correto: R$ 380,00 un.                 │   │
│  │ Favor corrigir e reenviar.                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Confirmar Rejeição]  [Cancelar]                              │
└─────────────────────────────────────────────────────────────────┘

RESULTADO:
  • ov_costs_status: submitted → rejected
  • ov_costs_rejected_at: 16/08/2024 11:00
  • ov_costs_rejected_by: user-gerente-001
  • ov_costs_rejection_reason: "Material com valor acima do contrato"
  • Data: 16/08/2024 11:00
  
  ⚠️ CUSTOS REJEITADOS
  ⚠️ CONTRATADA DEVE CORRIGIR E REENVIAR
```

---

### CORREÇÃO APÓS REJEIÇÃO

```
USUÁRIO: Supervisor de Manutenção (Contratada)
Ação: Corrige e reenvia custos

┌─────────────────────────────────────────────────────────────────┐
│  TELA: Correção de Custos                                      │
├─────────────────────────────────────────────────────────────────┤
│  Visita: VIS-2024-003456                                       │
│  Status: Aprovada                                              │
│  Financeiro: Custos Rejeitados                                 │
│                                                                 │
│  Motivo da Rejeição: Material com valor acima do contrato      │
│                                                                 │
│  ┌─ CORREÇÃO NECESSÁRIA ─────────────────────────────────────┐ │
│  │  Material: Vedação mecânica                               │ │
│  │  Valor Anterior: R$ 445,25                                │ │
│  │  Valor Correto: R$ 380,00                                 │ │
│  │  Subtotal Anterior: R$ 890,50                             │ │
│  │  Subtotal Correto: R$ 760,00                              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ RESUMO CORRIGIDO ────────────────────────────────────────┐ │
│  │  Serviços:     R$ 1.250,00                                │ │
│  │  Materiais:    R$   760,00 (corrigido)                    │ │
│  │  Transporte:   R$    75,00                                │ │
│  │  ════════════════════════════════════════════════════════ │ │
│  │  TOTAL:        R$ 2.085,00 (era R$ 2.215,50)             │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [Reenviar para Aprovação]                                     │
└─────────────────────────────────────────────────────────────────┘

RESULTADO:
  • ov_costs_status: rejected → submitted
  • Novo valor: R$ 2.085,00
  • Data: 16/08/2024 14:00
  
  ⚠️ CUSTOS CORRIGIDOS REENVIADOS
  ⚠️ AGUARDANDO NOVA ANÁLISE
```

---

## 📊 Resumo do Fluxo

```
┌─────────────────────────────────────────────────────────────────┐
│                    RESUMO DA SIMULAÇÃO                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FASE   DATA/HORA     AÇÃO                    RESPONSÁVEL      │
│  ────   ──────────    ────                    ───────────      │
│   1     14/08 08:30   Cria SS                 Gerente (CT)    │
│   2     14/08 09:00   Converte SS → OS        Gerente (CT)    │
│   3     14/08 09:30   Autoriza OS             Gerente (CT)    │
│   4     14/08 10:00   Assume OS               Líder (CD)      │
│   5     15/08 14:00   Reporta visita          Líder (CD)      │
│   6     15/08 16:30   Revisão técnica         Supervisor (CD) │
│   7     16/08 09:00   Aprovação técnica       Gerente (CT)    │
│   8     16/08 10:30   Inclui custos           Supervisor (CD) │
│   9     16/08 11:00   Aprovação financeira    Gerente (CT)    │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  CT = Contratante | CD = Contratada                            │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ESTADO FINAL:                                                  │
│  • Processing: 5 (Aprovada)                                    │
│  • Financeiro: approved                                         │
│  • Valor: R$ 2.215,50                                          │
│  • Pode ser arquivada: SIM                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Estados Possíveis

```
┌─────────────────────────────────────────────────────────────────┐
│                 MAPA DE ESTADOS                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PROCESSING (1-5)          FINANCEIRO (4 estados)              │
│  ════════════════          ══════════════════════              │
│                                                                 │
│  1 Rascunho ──────┐       pending ─────┐                       │
│       │           │            │        │                       │
│       ▼           │            ▼        │                       │
│  2 Reportada ─────┤       submitted ────┤                       │
│       │           │            │        │                       │
│       ▼           │            ▼        │                       │
│  3 Revisada ──────┤       approved ─────┤                       │
│       │           │            │        │                       │
│       ▼           │            ▼        │                       │
│  5 Aprovada ──────┘       rejected ─────┘                       │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  REGRAS:                                                       │
│  • Financeiro SÓ pode ser alterado quando processing = 5       │
│  • Processing SÓ pode avançar quando financeiro = pending      │
│  • Para arquivar: processing = 5 E financeiro = approved       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
