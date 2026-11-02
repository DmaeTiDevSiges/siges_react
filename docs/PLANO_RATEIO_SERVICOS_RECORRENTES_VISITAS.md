# Plano de análise: rateio de serviços recorrentes nas visitas

**Data:** 01/11/2026  
**Status:** Proposta para análise posterior — regras e escopo ainda não aprovados  
**Contexto:** Apropriação de custos mensais de serviços vinculados a contratos, como aluguel de celulares utilizados no atendimento de visitas.

## 1. Objetivo

Avaliar uma rotina que permita configurar um serviço de contrato como recorrente mensal e, após o fechamento das visitas de uma competência, apropriar automaticamente seu custo às visitas elegíveis, proporcionalmente ao tempo de duração realizado.

O caso inicial considerado é o aluguel mensal de celulares. A solução deve ser pensada para outros serviços recorrentes que possam ser apropriados pela mesma base, sem presumir que todo serviço contratado deva ser rateado.

## 2. Proposta de funcionamento

1. No serviço associado ao contrato, um usuário autorizado indica se o custo é recorrente mensalmente.
2. Para um serviço recorrente, são informados ou confirmados o valor mensal, a vigência e o escopo de visitas/equipes/unidades abrangidas.
3. As visitas da competência são concluídas e fechadas conforme o processo vigente.
4. O responsável solicita a apuração da competência. O sistema identifica as visitas fechadas e elegíveis, calcula as durações realizadas e apresenta uma prévia.
5. Após revisão, o responsável confirma o lote. O sistema registra o custo do serviço nas visitas e guarda a memória de cálculo.
6. A competência é fechada para impedir duplicidade ou alteração silenciosa. Correções posteriores devem ocorrer por fluxo rastreável de reabertura, estorno ou ajuste.

O fechamento das visitas pode ser um pré-requisito da apuração sem necessariamente disparar a apropriação imediatamente. Recomenda-se confirmar se haverá uma ação explícita de apurar/confirmar, em vez de executar uma gravação financeira automaticamente como efeito colateral do último fechamento.

## 3. Regra de cálculo proposta

Para cada serviço recorrente e competência:

```text
duração total elegível = soma das durações realizadas das visitas elegíveis

valor da visita =
  valor mensal elegível × duração realizada da visita ÷ duração total elegível
```

Exemplo: serviço com custo mensal de R$ 1.800,00 e 90 horas de duração elegível no mês. Uma visita de 3 horas recebe R$ 60,00.

O denominador deve ser calculado dentro do mesmo escopo do serviço. Se um contrato cobrir apenas uma unidade ou determinadas equipes, não se deve dividir o custo pelas visitas de outras unidades/equipes.

### Competência parcial

Se a vigência começar ou terminar no meio do mês, é necessário escolher como determinar o valor mensal elegível:

- usar o valor efetivamente faturado na competência; ou
- proporcionalizar o valor mensal pelos dias de vigência no mês.

O sistema deve exibir qual regra e qual valor foram usados na prévia e no histórico da apuração.

### Arredondamento

Os lançamentos devem ser arredondados para centavos. Para garantir que a soma apropriada corresponda ao valor mensal elegível, o resíduo de arredondamento deve ser atribuído de forma determinística a uma visita do lote ou registrado como ajuste explícito, conforme decisão de negócio.

## 4. Definição de visita elegível

Critério inicial a validar:

- visita pertencente à competência apurada;
- visita fechada/concluída antes da apuração;
- visita não cancelada nem excluída;
- visita pertencente ao contrato, unidade ou conjunto de equipes coberto pelo serviço;
- duração realizada registrada e válida.

Visitas sem duração, com duração zero ou com dados inconsistentes devem aparecer como exceções na prévia. Não devem receber um rateio calculado por substituição silenciosa da duração.

Deve-se verificar no código e no banco qual campo ou conjunto de eventos representa a duração realizada, como são tratadas pausas e retomadas, e qual é a precisão disponível. Não assumir que duração prevista equivale à duração efetiva.

## 5. Cadastro do serviço recorrente

No vínculo do serviço ao contrato, avaliar os seguintes dados:

| Dado | Finalidade |
|---|---|
| Recorrente mensal | Habilita o serviço para apuração periódica |
| Valor mensal ou valor faturado por competência | Base monetária do rateio |
| Vigência | Define as competências em que o custo se aplica |
| Método de apropriação | MVP: proporcional à duração realizada |
| Escopo de aplicação | Contrato e, se necessário, unidade/equipe/visitas abrangidas |
| Centro de custo/categoria | Classificação do custo na visão financeira |
| Ativo ou quantidade associada (opcional) | Possível base futura se o custo depender de equipamentos alocados |

O serviço recorrente deve ser distinto de um item cobrado individualmente do cliente, salvo se a regra financeira existente determinar explicitamente o contrário. A análise deve identificar como evitar somar o mesmo valor tanto como preço do serviço da visita quanto como custo interno rateado.

## 6. Apuração, rastreabilidade e integridade

A apuração deve gerar um lote por competência e serviço, contendo no mínimo:

- serviço e contrato de origem;
- competência e valor mensal elegível;
- método de rateio e escopo usados;
- visitas incluídas e excluídas, com motivo;
- duração utilizada por visita e duração total do denominador;
- valor apropriado por visita;
- usuário e data/hora de simulação, confirmação, fechamento e eventual reabertura;
- estado do lote, como rascunho, calculado, aplicado, fechado ou estornado.

Requisitos de integridade:

- uma competência/serviço não pode ser aplicada duas vezes sem estorno ou revisão explícita;
- uma nova simulação não deve alterar lançamentos já confirmados;
- cada lançamento deve manter referência ao lote e à visita;
- visitas fechadas depois da apuração devem ser sinalizadas como pendentes de ajuste ou de nova apuração;
- alterações posteriores em duração, status, contrato ou escopo não devem reescrever silenciosamente o histórico;
- reabertura, estorno e recálculo devem preservar trilha de auditoria e totais anteriores.

## 7. Fluxo de interface a avaliar

### Configuração do contrato

- indicador “Custo recorrente mensal” no serviço vinculado ao contrato;
- campos de valor, vigência, escopo e método;
- validação para evitar configurações contraditórias com o preço faturável do serviço.

### Fechamento e apuração

- listar competências prontas para apuração;
- informar quantas visitas estão elegíveis e quantas têm pendências;
- apresentar total mensal, duração total, valor por visita e total distribuído;
- permitir inspecionar visitas incluídas/excluídas e os motivos;
- exigir confirmação do usuário antes de gravar;
- exibir resultado e acesso à memória de cálculo após a aplicação.

### Visita e relatórios

- exibir o custo recorrente como categoria separada, identificando o serviço e a competência;
- distinguir custo apropriado de valor cobrado do cliente;
- manter consistência entre detalhe financeiro da visita, consolidação, relatórios e aprovação, conforme o comportamento financeiro que vier a ser aprovado.

## 8. Exceções e cenários a decidir

1. **Nenhuma visita elegível:** manter o valor como custo não apropriado/ociosidade, atribuí-lo a uma unidade/centro de custo ou impedir o fechamento?
2. **Visitas sem duração válida:** bloquear a apuração inteira ou permitir confirmar o lote com exceções não rateadas?
3. **Visitas fechadas tardiamente:** gerar complemento, reabrir a competência ou aguardar ajuste manual?
4. **Custo e escopo compartilhados:** como ratear quando um serviço cobre mais de uma unidade, equipe ou contrato?
5. **Mais de um celular por visita:** duração da visita representa bem o consumo ou será necessário registrar equipamentos/quantidades?
6. **Alteração do valor faturado:** como ajustar uma competência já simulada ou aplicada?
7. **Custos já aprovados financeiramente:** exigir nova aprovação, registrar delta de aprovação ou permitir ajuste sem nova aprovação?
8. **Visita cancelada/excluída após aplicação:** estornar a parcela automaticamente ou exigir revisão?
9. **Horas ou minutos:** qual unidade e precisão devem ser persistidas e exibidas?
10. **Valor sem uso no mês:** aplicar mínimo, manter não apropriado ou distribuir apenas entre quem efetivamente usou o serviço?

## 9. Alternativas de base de rateio

### A. Duração realizada — proposta inicial

Distribui o custo conforme o tempo registrado nas visitas. É simples quando a duração é confiável e o custo acompanha o tempo de atendimento. Pode distorcer o rateio se o mesmo celular atende várias visitas ou se o custo depende principalmente da quantidade de equipamentos.

### B. Duração × quantidade de equipamentos

Usa horas ou dias multiplicados pela quantidade de equipamentos utilizados na visita. Representa melhor contratos por dispositivo, mas requer registrar a quantidade ou identificar os ativos associados.

### C. Valor fixo por visita

Divide igualmente por visita, independentemente da duração. É mais simples, mas pode distorcer custos quando há grande diferença entre durações; não é a recomendação inicial.

### D. Base configurável por serviço

Permite selecionar um método por vínculo de contrato. Aumenta a flexibilidade, mas exige desenho, validação e testes para cada método. Deve ser avaliada somente após confirmar a necessidade de mais de uma base.

## 10. Escopo sugerido para MVP

- configuração de recorrência mensal no serviço associado ao contrato;
- valor por competência ou regra aprovada para obter o valor mensal elegível;
- rateio por duração realizada das visitas fechadas;
- prévia com pendências e detalhamento por visita;
- confirmação explícita da apuração;
- registro persistente do lote e da memória de cálculo;
- idempotência, fechamento e fluxo controlado de estorno/reabertura;
- exibição do custo como categoria interna separada do valor faturável;
- relatório simples de valores apropriados e não apropriados.

Não incluir no MVP, salvo necessidade confirmada:

- rateio por quilometragem, quantidade de materiais ou combinações de bases;
- integração automática com faturas de fornecedores;
- apropriação por ativo individual quando o uso do ativo não for atualmente registrado;
- edição manual irrestrita dos valores depois da confirmação.

## 11. Etapas para análise e implementação futura

1. **Validar regra de negócio:** responder às decisões da seção 8, principalmente duração elegível, valor em competência parcial, escopo e visitas sem duração.
2. **Investigar modelo atual:** localizar o vínculo serviço-contrato, origem do valor contratado, ciclo de fechamento de visitas, fonte da duração realizada, custos atuais das visitas, aprovação financeira, permissões e trilhas de auditoria.
3. **Definir integração financeira:** decidir se o rateio é custo interno, componente de preço ou ambos em cenários distintos, e como aparece nos totais e aprovações.
4. **Especificar persistência:** definir tabelas/relacionamentos para lotes e lançamentos, estados, constraints, segurança/RLS e regras de idempotência. Evitar pressupor que tabelas de rateio de veículos sirvam diretamente a outros serviços.
5. **Detalhar experiência de apuração:** prototipar prévia, exceções, confirmação, fechamento, reabertura e relatório.
6. **Implementar e validar:** criar migration reversível quando aplicável, serviços especializados e proxies tipados, UI, testes unitários/integração e validação no banco; preservar o fluxo atual de custos das visitas.
7. **Implantar com conferência:** testar competência histórica controlada, comparar cálculo manual e obter aprovação do responsável financeiro antes da primeira apuração real.

## 12. Critérios de aceite propostos

- Um serviço marcado como recorrente gera rateio somente para competências e visitas dentro de sua vigência e escopo.
- O cálculo usa duração realizada e apresenta a base usada por visita.
- A soma dos valores apropriados mais o valor explicitamente não apropriado reconcilia com o valor mensal elegível, considerando a regra de arredondamento aprovada.
- Visitas sem duração e outras exceções são visíveis, sem rateio silencioso.
- Reexecutar simulação ou confirmação não duplica lançamentos.
- O lote aplicado é auditável e permite identificar contrato, serviço, competência, visitas e usuário responsável.
- Correções posteriores preservam os valores originais e deixam trilha de ajuste/estorno.
- O custo interno não é confundido ou contado em duplicidade como valor cobrado do cliente.

## 13. Decisões pendentes para a próxima análise

| Prioridade | Pergunta | Recomendação inicial |
|---|---|---|
| Alta | A duração efetiva está registrada de forma completa e confiável? | Confirmar no fluxo e nos dados antes de definir a fórmula |
| Alta | O custo acompanha tempo, quantidade de celulares ou ambos? | Começar por duração apenas se representar o consumo real |
| Alta | O rateio compõe custo interno, preço cobrado ou ambos? | Tratar como custo interno separado até decisão financeira |
| Alta | Como tratar visitas sem duração e custo não distribuído? | Exibir exceções e impedir fechamento sem decisão explícita |
| Alta | A confirmação é manual ou automática após fechar as visitas? | Prévia e confirmação explícitas |
| Média | Como tratar vigência parcial e alterações de valor no mês? | Priorizar valor efetivamente faturado por competência |
| Média | Quem pode simular, confirmar, fechar, reabrir e estornar? | Usar perfis/permissões financeiras existentes após verificar adequação |
| Média | Mudanças pós-aprovação exigem nova aprovação? | Não alterar aprovação silenciosamente; exigir política explícita |

---

Este documento descreve uma proposta para orientar a análise posterior. Não autoriza, por si só, mudanças no banco, na interface ou no processo financeiro existente.
