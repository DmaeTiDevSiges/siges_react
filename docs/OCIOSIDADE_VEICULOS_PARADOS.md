# Ociosidade de Veículos Parados (Contrato Só-Aluguel)

Veículos com contrato **só de aluguel** (`monthly_value > 0`, `value_unit = 0`)
que ficam **parados o mês inteiro** (0 Km) precisam ter o custo registrado
numa OS — sem inventar Km fake.

## 1. Rotina operacional (estrutura SS/OS)

- **1 SS para o ano** — ex. `Ociosidade frota — 2026`. Fica aberta o ano
  todo, é só o cabide. Não carrega custo.
- **1 OS por mês que precisar** — ex. `Ociosidade — Out/2026`, pendurada na
  SS acima. Só crie o mês com veículo parado. Não encerre a SS do ano antes
  de dezembro e não reuse a OS de um mês para lançar outro.
- Alternativa: usar a OS existente do cliente/contrato que ficou parado
  (a ociosidade fica amarrada àquele cliente).

## 2. Rotina no app (ex.: em 05/11, competência outubro)

1. Abra (ou crie) a OS `Ociosidade — Out/2026` e **inicie uma visita**
   normalmente.
2. Na visita, aba **Transporte**, associe o veículo (busca por placa/modelo).
   Como ele é só-aluguel e está sem Km, o card mostra o botão
   **Registrar ociosidade** (em vez de Início/Fim).
3. Clique, confira a **Competência** (o app sugere o mês anterior —
   `Out/2026`) e o **valor** (sugere a mensalidade do contrato). Confirme.
   - O registro é carimbado em **31/10 23:59**: a visita continua de
     novembro, mas o custo conta em outubro.
   - A busca de visitas de outubro **não** mostra essa visita (correto);
     a Apuração de Outubro mostra o valor vinculado à OS.
4. Feche a visita normalmente. A ociosidade aparece em card âmbar
   **fora do total** da visita e do financeiro (linha
   "Ociosidade (fora do total)").
5. Em **Transportes → Custos Mensais**, competência **Outubro**:
   **Confirmar apropriação** (amarra o aluguel à visita) e depois
   **Fechar competência**.

## 3. Regras

- Veículo que **rodou** (tem Km): lança Início/Fim normalmente. A diferença
  alimenta o Km do mês e o rateio; o valor operacional fica R$ 0,00.
  O botão de ociosidade só aparece quando **não há Km**.
- **1 ociosidade por veículo + competência.** Segunda tentativa avisa em
  qual visita já está (ex.: "já registrada ... (visita 12.3.26)").
- Km apontado × ociosidade são excludentes: com Km na visita, o registro é
  barrado (e vice-versa — a linha de Km vazia é removida ao confirmar).
- **Fechar sem visita é bloqueado**: competência 100% ociosa com aluguel
  só fecha com o registro vinculado ("sem visita vinculada").
- Registro **congelado** após apropriado/fechado: qualquer alteração exige
  estorno (ou reabertura) da competência.
- Lançar em mês **fechado** exige reabrir a competência primeiro.

## 4. Telas e mensagens

- **Custos Mensais**: selo **100% ocioso** no veículo parado + dica fixa
  ("Confirmar não distribui sem Km..."); erros técnicos viram orientação
  (ex.: sem registro → "registre a ociosidade numa visita ou feche para
  manter em ociosidade"); simulação explica ociosidade integral.
- **Custos do Período / relatórios**: ociosidade soma em `R$ Ociosidade`,
  separada do apropriado.

## 5. Referência técnica

| Item | Arquivo |
|---|---|
| Migration (aplicar 1º no SQL Editor) | `dev/supabase/migrations/20261021_vehicle_idle_record.sql` |
| Validador (rodar 2º, esperado `OK`) | `dev/supabase/validate_vehicle_idle.sql` |
| Tipo `costType` += `'idle'` | `types/index.ts` |
| Serviço + helpers de competência | `services/orders/visitsService.ts` (`addIdleToOrderVisit`), `utils/vehicleRentalAllocation.ts` |
| Proxy | `services/dataService.ts` (`addIdleToOrderVisit`) |
| Aba Transporte | `views/OrderVisit/OrderVisitVehicle/OrderVisitVehiclesList.tsx` |
| Financeiro da visita | `views/OrderVisit/OrderVisitFinancialDetail.tsx` |
| Custos Mensais | `views/Vehicles/CostsPeriod.tsx` |
| Testes | `utils/vehicleIdleCompetence.test.ts` |

Banco (o que a migration faz): `cost_type` aceita `'idle'`; `before_save`
calcula `1 × mensalidade` sem odômetro; rollup **exclui** `idle` do
`ov_vehicles_value`; `allocate` com 0 Km exige o registro e amarra
(apropriado = contrato); `close` com 0 Km e aluguel exige visita vinculada.

## 6. Ordem de implantação

1. Aplicar a migration no SQL Editor do Supabase.
2. Rodar o validador (`OK: todos os testes passaram`).
3. Só então usar o app com o botão (o banco antigo rejeita `idle`).

## 7. Por que não 1 Km fake

- `custo/Km = mensalidade ÷ 1` (ex.: R$ 4.500/Km) distorce relatórios.
- Corrompe progressão do hodômetro, gaps, utilização e `cost_per_km`.
- A linha de Km com `value_unit = 0` vale R$ 0,00 — o aluguel nunca ia
  para a OS pelo caminho correto.
