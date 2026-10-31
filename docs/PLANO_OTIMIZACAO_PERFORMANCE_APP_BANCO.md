# Plano de otimização de performance — SIGES

> **Status:** PLANEJAMENTO — não executar mudanças de produção com base apenas neste documento.  
> **Data de elaboração:** 2026-10-31  
> **Objetivo:** elevar a performance percebida e a capacidade de crescimento do app, priorizando por evidência e sem comprometer dados, segurança ou compatibilidade.

---

## 1. Resumo executivo

O caminho para obter o máximo de performance não é adicionar índices ou cache indiscriminadamente. Primeiro é necessário medir o fluxo completo — navegador/app, rede, Supabase/Postgres e serviços externos — e então corrigir os gargalos que mais afetam os usuários.

O plano propõe cinco frentes:

1. **Observabilidade e baseline** de experiência, consultas e operações.
2. **Consultas e dashboards**: reduzir trabalho repetido, payloads, latência e processamento no cliente.
3. **Banco de dados**: otimizar consultas comprovadamente caras, índices, RLS e escrita.
4. **Frontend e dispositivos móveis**: limitar JavaScript inicial, renderização e consumo de memória.
5. **Operação contínua**: testes de regressão, rollout gradual e acompanhamento após cada alteração.

Não há métricas atuais de produção anexadas a este plano. Portanto, os itens abaixo são hipóteses e áreas de investigação, não afirmações de que já sejam gargalos.

---

## 2. Contexto identificado no repositório

- As telas já são carregadas sob demanda por meio de `React.lazy` e `lazyWithRetry` em [`app/routes.tsx`](../app/routes.tsx).
- O build já separa alguns fornecedores grandes — PDF, Excel, mapas e Supabase — em chunks específicos; o limite de aviso de chunk está configurado em [`vite.config.ts`](../vite.config.ts).
- Há serviços especializados por domínio e uma fachada pública em [`services/dataService.ts`](../services/dataService.ts).
- Os dashboards de SS/OS já possuem estratégias locais de cache e atualização; devem ser medidas antes de uma eventual mudança geral de cache.
- Existem migrations anteriores para índices de consultas de ordens e correção de chaves estrangeiras, como [`20260913_optimize_v_orders_and_users_queries.sql`](../dev/supabase/migrations/20260913_optimize_v_orders_and_users_queries.sql) e [`20260913_fix_unindexed_fkeys_pk_and_unused_indexes.sql`](../dev/supabase/migrations/20260913_fix_unindexed_fkeys_pk_and_unused_indexes.sql).
- A migration de otimização de `v_orders` registra uma medição histórica de consultas de 2026. Esses números são referência histórica, não baseline atual.
- A aplicação possui muitas consultas distribuídas pelos serviços. Uma contagem estática de `.select()`, `range()` ou `Promise.all()` não identifica, por si só, o custo real em produção.
- O schema versionado pode divergir do banco vivo. Índices, views e constraints deverão ser confirmados no ambiente-alvo antes de qualquer migration.

---

## 3. Princípios e limites

1. **Medir antes e depois.** Toda mudança deve estar ligada a um gargalo observado e a uma métrica de sucesso.
2. **Otimizar o caminho crítico.** Priorizar inicialização, login, dashboards mais usados, busca, abertura de detalhes e gravações frequentes.
3. **Não presumir que mais índices é melhor.** Índices aceleram algumas leituras, mas aumentam custo de escrita, armazenamento e manutenção.
4. **Não presumir que cache é sempre correto.** Definir invalidação, escopo de usuário/empresa, idade máxima e comportamento offline.
5. **Preservar segurança.** RLS, autorização por perfil/cliente e isolamento entre empresas fazem parte dos testes de performance e correção.
6. **Compatibilidade e rollback.** Alterações de banco são aditivas quando possível, graduais e com plano de reversão.
7. **Não executar `DROP ... CASCADE` sem inventário de dependências.** Seguir as regras de migrations já registradas em `AGENTS.md`.
8. **Não modificar views/funções ou criar índices no banco vivo sem validar o schema real, o volume, o plano de execução e as dependências.**
9. **Considerar web, Android/Capacitor e Electron.** Melhorias de desktop não podem degradar memória, rede ou responsividade em dispositivos móveis.

---

## 4. Fase 0 — Baseline e observabilidade (pré-requisito)

### 4.1 Experiência no cliente

Medir por rota e classe de dispositivo, com ambiente, versão do build e amostra suficientes:

- Core Web Vitals: **LCP, INP e CLS**, segmentados por mobile e desktop.
- Tempo até a tela utilizável, não apenas até o primeiro paint.
- Duração de navegação/troca de telas, busca, abertura de detalhe e aplicação de filtros.
- Erros de carregamento de chunks, erros de rede e falhas JavaScript.
- Tamanho transferido e descomprimido dos chunks iniciais e das principais rotas.
- Uso de memória e travamentos em dispositivos Android representativos.

### 4.2 Rede e backend

- Duração, volume de resposta e taxa de erro por chamada a Supabase, APIs próprias e serviços externos.
- Identificar cascatas de chamadas sequenciais que poderiam ser paralelas sem alterar dependências.
- Separar tempo de rede, processamento do banco e processamento do frontend sempre que possível.
- Registrar chamadas repetidas na mesma sessão e chamadas cujo resultado não é usado.

### 4.3 PostgreSQL/Supabase

Com acesso autorizado ao projeto e às métricas disponíveis:

- Obter estatísticas de consultas mais caras por **tempo total, chamadas, média e percentis**; habilitar/usar `pg_stat_statements` se estiver disponível e aprovado na operação.
- Capturar consultas lentas, planos com `EXPLAIN (ANALYZE, BUFFERS)` em ambiente seguro e cardinalidades relevantes.
- Levantar tamanho e crescimento de tabelas, índices, bloat, estatísticas e frequência de leitura/escrita.
- Medir latência e erros de RPCs, views, políticas RLS e triggers.
- Comparar estatísticas de índices existentes e identificar índices redundantes ou sem uso em janela representativa.
- Medir separadamente consultas de leitura e gravações, incluindo efeitos de auditoria por trigger nas tabelas de maior volume.

### 4.4 Entregáveis da fase

- Relatório do top 20 de interações lentas no cliente e top 20 de consultas por custo total.
- Perfil das rotas e dispositivos afetados.
- Baseline versionado com data, ambiente, volume de dados e método de coleta.
- Lista priorizada com hipótese, evidência, impacto esperado, risco, esforço e responsável.

**Gate 0:** não aprovar otimização de índice, cache global, mudança de view ou reestruturação ampla sem baseline suficiente para comparar.

---

## 5. Fase 1 — Ganhos de alto impacto e baixo risco

### 5.1 Consultas e dashboards

- Revisar primeiro os fluxos de maior uso e custo identificados na Fase 0, começando pelos dashboards de ordens/solicitações, visitas e ativos somente se estiverem no topo medido.
- Garantir seleção explícita de colunas: evitar `select('*')` quando a tela precisa de um subconjunto pequeno.
- Garantir paginação real e limites máximos; investigar buscas e dashboards que carregam listas grandes ou repetem contagens.
- Avaliar paginação por cursor/chave (keyset) nas listas profundas em que `OFFSET` ficar caro. Manter a ordenação estável e filtros equivalentes.
- Eliminar duplicação de chamadas entre montagem da tela, filtros, efeitos e componentes filhos.
- Executar em paralelo apenas chamadas independentes; manter sequenciais as que dependem do resultado anterior.
- Separar contagem total de carregamento da lista quando a contagem exata for cara e não for necessária para a primeira renderização.
- Evitar transferir snapshots/dados extensos quando a tela só precisa de sumários ou indicadores.

### 5.2 Cache e atualização

- Inventariar caches atuais (memória, `localStorage`, cache do browser e snapshots dos dashboards) e documentar chave, escopo, validade e invalidação.
- Priorizar reuso de dados dentro da mesma navegação para evitar chamadas repetidas.
- Definir cache por usuário e escopo de empresa/cliente; impedir reutilização entre sessões ou escopos diferentes.
- Usar stale-while-revalidate apenas em dados que toleram atualização eventual, mantendo atualização explícita para operações críticas.
- Evitar guardar dados sensíveis no `localStorage`; avaliar tamanho, quota e invalidação após logout.
- Medir se realtime reduz polling/refetch e limitar inscrições ativas às telas que precisam delas.

### 5.3 Renderização

- Usar React Profiler e gravações de performance para identificar renderizações caras; otimizar somente os componentes medidos.
- Reduzir trabalho de filtros/sort/map repetido a cada render quando houver custo comprovado.
- Avaliar virtualização em listas longas com muitos itens e manter acessibilidade, seleção, foco e scroll.
- Evitar montar dashboards, modais ou mapas pesados que não estão visíveis.
- Rever imagens e documentos: dimensões adequadas, thumbnails, carregamento tardio e cancelamento de trabalho que não é mais necessário.

**Critério de aceite:** melhoria mensurável no fluxo-alvo sem regressão de dados, autorização, latência de gravação ou acessibilidade.

---

## 6. Fase 2 — Otimização do banco de dados

### 6.1 Índices guiados por consulta

- Relacionar cada índice candidato à consulta concreta, filtros, ordenação e volume estimado.
- Considerar índices compostos começando pelas colunas de igualdade/escopo e cobrindo a ordenação necessária, conforme o plano medido.
- Avaliar índices parciais apenas quando o predicado for estável e seletivo.
- Conferir suporte às FKs não indexadas e remover redundâncias somente após validar uso em janela representativa.
- Medir custo de escrita, tamanho do índice e plano antes/depois; não duplicar os índices já presentes nas migrations.
- Para tabelas grandes em produção, avaliar `CREATE INDEX CONCURRENTLY` fora de transação, respeitando o processo operacional e as limitações do Postgres.

### 6.2 Queries, views e funções

- Corrigir primeiro full scans, sorts, joins, subconsultas correlacionadas e filtros não sargáveis identificados no plano.
- Rever views mais usadas, inclusive views de dashboard. Não trocar uma view por materialized view sem medir frequência de atualização, tolerância a dados defasados e custo de refresh.
- Usar RPC/função no banco quando reduzir de forma demonstrável múltiplas viagens de rede ou agregação pesada, mantendo validação de entrada, autorização e testes.
- Evitar materializar ou duplicar a mesma lógica em serviços, views e componentes sem estabelecer fonte de verdade.
- Validar todas as dependências de views/funções antes de alterar assinatura ou remover colunas.

### 6.3 RLS, triggers e escrita

- Avaliar políticas RLS com os planos e consultas reais, preservando isolamento por cliente/empresa.
- Verificar se expressões de autorização permitem uso de índices e evitam subconsultas por linha desnecessárias.
- Medir latência de `INSERT`/`UPDATE`/`DELETE` em tabelas com triggers; para auditoria, medir custo, crescimento, índices e volume de JSON antes de reduzir escopo ou retenção.
- Evitar triggers que façam consultas repetidas por linha quando uma alternativa segura e equivalente puder reduzir trabalho.
- Revisar índices em colunas alteradas frequentemente, pois cada índice aumenta o custo de escrita.

### 6.4 Migrações e segurança operacional

- Confirmar cada mudança contra o banco vivo e o dump versionado.
- Preparar migration `UP` e rollback `DOWN` coerentes, considerando se os dados podem ser preservados.
- Testar em cópia/sandbox com volume representativo.
- Definir `lock_timeout`, duração máxima aceitável, janela, backup e critério para interromper.
- Fazer rollout de forma aditiva, validando a versão antiga quando houver clientes que ainda a utilizem.
- Nunca aplicar automaticamente migrations no banco de produção sem autorização explícita e runbook aprovado.

---

## 7. Fase 3 — Frontend, bundle e dispositivos móveis

- Medir bundle inicial e chunks por rota com análise de build; configurar orçamento por chunk/rota em vez de depender somente do aviso global.
- Manter lazy loading de telas e revisar se bibliotecas pesadas são realmente isoladas e carregadas só quando a funcionalidade é aberta.
- Investigar dependências que entram no chunk `vendor` comum e dividir somente quando reduzir download/parse do caminho inicial.
- Adiar import de PDF, Excel, mapas, câmera e processamento de imagem até a ação que os exige.
- Revisar polyfills globais do Vite: confirmar quais são necessários por alvo e retirar apenas após testes web, Android e Electron.
- Medir cache HTTP dos assets com hash, HTML de entrada e service worker (se aplicável) para evitar chunks antigos após deploy.
- Reduzir imagens grandes, evitar base64 quando arquivo/URL otimizada for suficiente e usar dimensões responsivas.
- Testar cold start em aparelho Android de referência, rede limitada e cache limpo.
- Não aumentar ou reduzir manualmente a quantidade de chunks sem comparar transferência, parse/eval e cache em navegação real.

---

## 8. Fase 4 — Capacidade, testes e automação

- Criar um conjunto pequeno e estável de cenários sintéticos: login, dashboard principal, pesquisa, detalhe e gravação.
- Medir percentis (p50/p75/p95), em vez de usar apenas média.
- Adicionar teste de regressão de consultas para fluxos críticos: volume retornado, paginação, ordenação e restrições de escopo.
- Adicionar testes de carga controlados antes de mudanças que alterem agregações, RPCs, índices ou realtime.
- Estabelecer alertas para regressão de latência, taxa de erro, crescimento anormal de tabela de auditoria e esgotamento de recursos.
- Repetir medições após deploy em uma janela compatível com o tráfego normal; comparar com o mesmo ambiente e método.

### Metas iniciais sugeridas

As metas definitivas devem ser aprovadas após o baseline, mas a equipe pode usar estes objetivos como referência:

- Atingir as faixas “good” dos Core Web Vitals no percentil 75, separando mobile e desktop: **LCP ≤ 2,5 s**, **INP ≤ 200 ms**, **CLS ≤ 0,1**.
- Melhorar em pelo menos **30%** o p95 do fluxo ou query priorizado, sem aumentar erros ou comprometer a correção.
- Não regredir em mais de **10%** o p95 de gravação nem a taxa de sucesso nas rotas críticas.
- Reduzir bundle inicial transferido/parseado nas rotas afetadas, com meta definida no relatório de baseline.

Esses números são metas de projeto, não medições atuais nem garantia de resultado; adequar a capacidade de infraestrutura, rede e dispositivos reais.

---

## 9. Priorização proposta

| Prioridade | Iniciativa | Dependência | Risco | Decisão |
|---|---|---|---|---|
| P0 | Criar baseline cliente, rede e banco | Acesso a métricas e ambiente | Baixo | Fazer primeiro |
| P1 | Corrigir consultas/fluxos no topo do custo e uso | Gate 0 | Baixo a médio | Implementar em fatias pequenas |
| P1 | Rever payload, paginação e chamadas repetidas | Evidência por fluxo | Baixo a médio | Combinar com P1 |
| P1 | Revisar índices para consultas medidas | Planos e schema vivo | Médio | Migration isolada e validada |
| P2 | Ajustar caches, invalidação e realtime | Mapa dos caches e regras de frescor | Médio | Uma tela/domínio por vez |
| P2 | Virtualização e otimização de render | Perfil React/dispositivo | Baixo a médio | Apenas em listas/componentes caros |
| P2 | Dividir bundle e adiar bibliotecas pesadas | Análise de build e cold start | Médio | Validar os três alvos |
| P3 | RPCs/views/materialized views e mudanças estruturais | Prova de gargalo persistente | Médio a alto | Proposta técnica e rollback próprios |

---

## 10. Checklist por iniciativa

Antes de iniciar:

- [ ] Fluxo afetado e usuários/dispositivos identificados.
- [ ] Baseline reproduzível salvo com versão e ambiente.
- [ ] Hipótese e métrica de sucesso definidas.
- [ ] Segurança, RLS, escopo e compatibilidade revisados.
- [ ] Plano de teste, rollout, observação e rollback definidos.

Antes de concluir:

- [ ] Mesmo cenário medido antes/depois.
- [ ] p50/p75/p95 e taxa de erro comparados.
- [ ] Testes funcionais, TypeScript e testes relevantes executados.
- [ ] Em mudança de banco, query plan, escrita, índices e dependências verificados.
- [ ] Impacto em web/mobile/Electron documentado.
- [ ] Resultado real, trade-offs e próximos passos registrados.

---

## 11. Fora de escopo inicial

- Reescrever a arquitetura completa de serviços ou trocar a stack sem evidência de que ela seja o gargalo.
- Criar índices para todas as colunas filtradas ou todas as FKs sem considerar seletividade e custo de escrita.
- Migrar dashboards para materialized views sem medir defasagem aceitável e custo de atualização.
- Introduzir um novo cache distribuído, biblioteca de estado ou ferramenta de observabilidade antes de provar a necessidade e revisar custo operacional.
- Alterar RLS, permissões ou triggers para obter ganhos não medidos.

---

## 12. Próximo passo para implantação

Abrir uma execução da **Fase 0** com responsável técnico e acesso autorizado às métricas do Supabase. O primeiro resultado deve ser um relatório conciso com:

1. cinco fluxos de usuário mais lentos ou mais utilizados;
2. vinte consultas de maior custo total e seus planos;
3. métricas de bundle e Core Web Vitals por dispositivo;
4. top três iniciativas com estimativa de impacto, risco e esforço;
5. decisão explícita sobre quais mudanças podem seguir para piloto.

Nenhuma otimização de produção deve começar antes desse gate, exceto correção de incidente de performance já reproduzível e documentado.
