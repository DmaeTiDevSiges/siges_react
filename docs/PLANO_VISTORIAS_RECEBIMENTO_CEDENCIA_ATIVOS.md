# Plano de implantação — Empréstimos, Recebimentos e Cedências de ativos

**Status:** Proposta de implantação  
**Escopo:** Estender o fluxo atual de `assets_loans` para registrar empréstimos e vistorias unitárias de recebimento ou cedência, sem criar um segundo sistema de checklists e imagens.

## 1. Objetivo

Permitir registrar três tipos de atendimento vinculados a um ativo:

- **Empréstimo:** mantém o fluxo existente, com vistoria de entrega e vistoria de devolução.
- **Recebimento:** gera um único relatório de vistoria.
- **Cedência:** gera um único relatório de vistoria.

Recebimento e Cedência usam o mesmo formulário, checklist e formato de relatório. O tipo escolhido altera o título, não o conteúdo ou a quantidade de etapas. Essas vistorias não registram movimentação patrimonial nem alteram a unidade ou localização do ativo.

## 2. Decisão de modelagem

Reutilizar a tabela principal existente **`assets_loans`** para os três tipos. Não criar uma tabela principal nova para inspeções.

Adicionar um discriminador de tipo, por exemplo `record_type`, com valores:

- `loan` — empréstimo;
- `receipt` — recebimento;
- `cedencia` — cedência.

O nome e os valores definitivos devem seguir a convenção do banco e do código. Registros existentes devem ser migrados ou assumir o tipo `loan`, preservando integralmente seu comportamento atual.

Campos exclusivos de empréstimo, como a data prevista de devolução, devem continuar obrigatórios para `loan` e ser opcionais nos demais tipos. Antes da implementação, definir quais campos identificam a pessoa que entrega/recebe em cada modalidade; não reutilizar automaticamente `borrower_name` com significado diferente sem validar a regra com a área usuária.

## 3. Reutilização de checklists e imagens

Manter o cadastro/configuração de checklists existente por tipo de ativo e a tabela existente de imagens:

- `cfg_assets_types_loans_checklists` e/ou sua configuração associada continuam sendo a fonte dos itens configurados;
- `assets_loans_checklists` continua guardando os itens preenchidos e vinculados ao registro principal;
- `assets_loans_checklists_images` continua guardando imagens vinculadas ao item preenchido.

Não duplicar cadastros, componentes ou armazenamento de imagens para Recebimento e Cedência.

Atualmente, os checklists preenchidos usam `loan_id` e fases `before`/`after`, conforme a migration [20260915_create_asset_loans.sql](../dev/supabase/migrations/20260915_create_asset_loans.sql). Para suportar os três tipos:

- permitir uma fase unitária, por exemplo `single`;
- garantir que registros `loan` continuem usando as fases `before` e `after`;
- criar somente checklists `single` para Recebimento e Cedência;
- manter as imagens vinculadas ao registro do checklist, sem mudança do conceito de associação.

As alterações devem preservar os checklists e imagens já existentes, bem como os vínculos e relatórios dos empréstimos atuais.

## 4. Regras de negócio e ciclo de vida

### Empréstimo

- Continuar exigindo duas etapas: entrega (`before`) e devolução (`after`).
- Preservar campos, assinaturas, estados, checklist comparativo, divergências e relatório atuais.
- Não permitir encerrar o empréstimo sem completar a vistoria de devolução conforme as regras existentes.

### Recebimento e Cedência

- Criar um único registro principal em `assets_loans`, identificado por `record_type`.
- Criar e preencher somente uma vistoria (`single`).
- Não exigir data prevista de devolução nem vistoria de devolução.
- Concluir o registro após o preenchimento da vistoria única e das evidências obrigatórias definidas.
- Gerar um relatório independente, com título **Recebimento** ou **Cedência** conforme o tipo.
- Não mostrar comparação antes/depois e não atualizar a localização ou outros dados patrimoniais do ativo.

Os estados existentes foram desenhados para o ciclo de empréstimo. Antes de codificar, mapear os estados e transições atuais e definir como a vistoria unitária será concluída sem criar estados ambíguos. A regra deve ser aplicada tanto na interface/serviço quanto, quando viável, por constraints ou validações no banco.

## 5. Acesso na aplicação

Na ficha do ativo, disponibilizar a criação dos registros sem confundir os fluxos:

- ação **Novo registro** ou equivalente;
- escolha do tipo: **Empréstimo**, **Recebimento** ou **Cedência**;
- formulário e etapas apresentados de acordo com o tipo;
- listagem/consulta mostrando claramente o tipo e disponibilizando o relatório correspondente.

O fluxo existente de empréstimos deve continuar acessível e reconhecível. Recebimentos e Cedências devem ser identificados como vistorias unitárias, e não exibidos como empréstimos nas listas, filtros, contadores ou relatórios que se referem especificamente a empréstimos.

## 6. Fases de implantação

### Fase 1 — Validar requisitos

- Confirmar os campos obrigatórios de cada tipo, inclusive identificação de quem entrega/recebe.
- Confirmar quais itens de checklist, imagens e assinaturas são obrigatórios para uma vistoria unitária.
- Definir o estado inicial e a regra de conclusão para Recebimento/Cedência.
- Confirmar permissões para criar, consultar, concluir e eventualmente corrigir/cancelar cada tipo.
- Definir a política de edição/cancelamento e auditoria de registros concluídos.

### Fase 2 — Banco de dados

- Criar migration aditiva para o discriminador de tipo, com backfill dos registros atuais como empréstimo.
- Ajustar nulabilidade e constraints dos campos que são obrigatórios somente para empréstimo.
- Estender a fase do checklist para permitir `single`, preservando `before`/`after`.
- Garantir que o vínculo do checklist pertença a um registro principal e que as imagens continuem ligadas ao checklist.
- Revisar índices, RLS, triggers de auditoria e views que consultam `assets_loans`.
- Evitar `DROP ... CASCADE`; identificar dependências e recriá-las na mesma migration caso alguma alteração destrutiva seja inevitável.
- Validar a migration contra o banco vivo antes de aplicação; o schema local pode estar defasado.

### Fase 3 — Serviços e tipos

- Atualizar os tipos compartilhados para representar o discriminador e os dados opcionais por modalidade.
- Atualizar o serviço especializado de empréstimos para criar checklists nas fases apropriadas conforme `record_type`.
- Implementar validações de transição: duas fases para empréstimo e uma fase para Recebimento/Cedência.
- Atualizar as assinaturas públicas em `services/dataService.ts`, mantendo as consultas e gravações reais no serviço especializado.
- Tratar erros de inserção/consulta de checklists e imagens explicitamente; não considerar o registro criado com sucesso se suas evidências obrigatórias falharem.

### Fase 4 — Interface e relatórios

- Adicionar seleção do tipo ao iniciar um registro pela ficha do ativo.
- Condicionar campos, etapas e mensagens ao tipo escolhido.
- Reutilizar os componentes de checklist, assinatura e imagem sempre que compatíveis.
- Adaptar relatório unitário para não buscar nem exibir a fase ausente.
- Garantir que relatórios e telas exclusivos de empréstimo filtrem `record_type = 'loan'`.
- Apresentar Recebimento e Cedência com o mesmo layout, variando o título.

### Fase 5 — Testes e liberação

Testar no mínimo:

1. Criar empréstimo e completar entrega/devolução, verificando checklist, imagens, assinatura, divergências e relatório atuais.
2. Criar Recebimento com apenas checklist `single`, anexar imagens e emitir relatório.
3. Criar Cedência com o mesmo formulário e formato, verificando que somente o título varia.
4. Confirmar que os tipos unitários não exigem retorno e não alteram localização/dados patrimoniais do ativo.
5. Confirmar que Recebimentos/Cedências não aparecem como empréstimos em filtros, contadores e relatórios de empréstimos.
6. Confirmar que registros existentes continuam classificados como empréstimos e são consultados corretamente.
7. Validar permissões, RLS, auditoria, responsividade e comportamento com falha durante gravação de checklist/imagem.

Aplicar primeiro em homologação, validar migration e fluxos completos e, após aprovação, liberar em produção. As migrations Supabase seguem o procedimento do projeto e são aplicadas manualmente pelo usuário no SQL Editor.

## 7. Critérios de conclusão

- `assets_loans` permanece como tabela principal para os três tipos, com discriminação explícita.
- Empréstimos mantêm obrigatoriamente as vistorias `before` e `after`.
- Recebimento e Cedência usam uma única vistoria `single` e o mesmo relatório, com título variável.
- Checklists configurados e imagens são reutilizados, sem duplicação de estruturas de cadastro ou armazenamento.
- Dados atuais de empréstimo e seus relatórios permanecem compatíveis.
- Nenhum tipo de vistoria cria ou altera movimentação/localização do ativo.
