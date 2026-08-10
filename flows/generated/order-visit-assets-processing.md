# Order Visit Assets Processing

**Categoria:** ordersVisitsAssets  
**Versão:** 1.1.0  
**Descrição:** Sincronização de contadores de ativos na Visita para gestão de workflow e status de processamento.

**Autor:** Flow System  
**Data:** 2026-02-08  

---

## Contexto

Manter a integridade dos contadores de situação na tabela `orders_visits` refletindo em tempo real o estado dos ativos vinculados em `orders_visits_assets`. Esses contadores são fundamentais para habilitar ações como "Reportar Visita" ou "Arquivar Ativos".

## Passos do Fluxo

### 1. [Identificar Gatilhos de Mudança]

**Quando:** 
- Um ativo é incluído ou removido de uma visita (`orders_visits_assets`).
- Uma visita não estiver arquivada (`orders_visits.is_filed = false`).
- Um ativo tem a situação do processamento alterada (`orders_visits_assets.processing_id`).

**Ação:** 
- O sistema detecta a mudança direta no banco de dados ou via aplicação.
- Verifica-se se a visita pai está ativa (não arquivada).

### 2. [Cálculo dos Contadores Consolidados]

**Quando:** 
- A mudança é validada.

**Ação:** 
- O sistema executa a contagem total de ativos na visita.
- Filtra e agrupa os ativos por `processing_id` para obter os valores de:
  - `Draft` (ID 1)
  - `Reported` (ID 2)
  - `Revised` (ID 3)
  - `Disapproved` (ID 4)
  - `Approved` (ID 5 - detalhado por `is_filed`).

### 3. [Atualizar Registro da Visita]

**Quando:** 
- Os novos valores são calculados.

**Ação:** 
- Atualizar a tabela `orders_visits` em uma única transação atômica.
- Inserir os valores nos campos: `ov_assets_amount`, `ov_assets_draft_amount`, `ov_assets_reported_amount`, etc.

---

## Regras de Negócio e Integridade
- **Atomicidade**: A atualização de todos os contadores da visita deve ocorrer em uma única instrução SQL ou transação.
- **Não-Recursividade**: Garantir que o update na visita não dispare gatilhos colaterais.
- **Persistência**: Se a visita estiver arquivada, os contadores são somente leitura.

## Resultado Final
- Um registro é alterado na tabela `orders_visits`.
- A interface é notificada em tempo real.
