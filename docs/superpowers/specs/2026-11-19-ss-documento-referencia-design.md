# Campo `requested_services_doc` nas SS — design (curto)

## Intenção
Controlar SS originadas de uma demanda específica recebida por processo administrativo. O campo guarda o nº/referência do processo (texto livre) e permite localizar todas as SS daquele processo.

## Metas
- Informar a referência no formulário de criação da SS.
- Encontrar SS pela referência na busca livre **e** em um filtro dedicado "Documento".
- Exibir a referência no detalhe, cards, listagens/PDF/Excel de SS; OS filhas herdam o valor da SS pai (via view, sem cópia).

## Não metas
- Sem tabela de processos, sem status/prazo de processo (abordagem C descartada).
- Sem máscara/validação de formato (formato varia; reavaliar se for fixo).
- Sem edição em massa.

## Anti-meta
- O valor não pode ser alterado por sanitização (pontos, barras, hífens preservados): **não** passa pelo trigger `fc_orders_replace_special_chars`.

## Abordagens consideradas
A) só busca livre; B) busca livre + filtro dedicado (**escolhida pelo usuário**); C) tabela própria de processos.

## Design
- **Banco** (migration aplicada manualmente): `ALTER TABLE orders ADD COLUMN requested_services_doc text`; índice `pg_trgm` (gin) para `ilike '%x%'`; recriar com `CREATE OR REPLACE VIEW` as views que expõem a coluna (`v_orders`, `v_orders_parent` e dependentes; OS filhas lêem da SS pai) e atualizar as funções SQL com busca `ILIKE` em `requested_services`. Conferir colunas/dependências no banco vivo (MCP `supabase-ro`), não só no `schema.sql`.
- **Serviço**: `ordersService` — gravar no insert/update da SS (~l.412, 613, 688), mapear leitura (`requestedServicesDoc`) nos mapeadores, incluir `requested_services_doc.ilike` nas ~8 buscas livres e novo `filters.requestedServicesDoc` (ilike só na coluna). Tipo em `types/index.ts`; proxy/assinatura no `dataService` se mudar retorno.
- **UI**: `ServiceRequestForm` (campo opcional, `trim`, passo 2); filtro no `ServicesRequestsDashboardAdmin`/filtros avançados; exibição em `ServiceRequestDetail`, `ServiceRequestCardDetail/ListItem`, `RequestsListDocument`, `RequestsExcelExportButton`; detalhe da OS filha mostra o processo de origem.
- **Offline/IA**: payload do `offlineFlowOps` e `aiSsCreationService`/`AINaturalLanguageForm` carregam o campo (opcional).
- **Testes**: mapeamento, filtro/busca (node) e formulário (ui).

## Fica para o construtor
Lista exata de views/funções dependentes; posição visual do campo e do filtro; nome do rótulo (decidido: "Documento").
