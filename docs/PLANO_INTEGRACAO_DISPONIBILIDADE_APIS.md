# Plano — Integração de disponibilidade de ativos via APIs e n8n

> **Status:** Fase 1 implantada (banco + RPC de ingestão). A migration
> `20261104_create_assets_available_integrations.sql` ainda precisa ser aplicada
> manualmente no Supabase; Fases 2–4 seguem pendentes.  
> **Escopo:** receber disponibilidade de múltiplas APIs externas, relacioná-las aos
> registros do SIGES e preservar o fluxo atual de histórico e cascata.

## 1. Objetivo

Permitir integrar uma ou mais fontes externas de disponibilidade sem adicionar
colunas específicas de fornecedores, como `guaiba_flow_id`, à tabela
`cfg_units_assets_tags`.

O cadastro deve permitir identificar a integração, configurar os parâmetros não
secretos da API e relacionar cada ID externo ao registro interno do SIGES.
O n8n fará a orquestração, mas o estado e o histórico oficiais continuarão no SIGES.

## 2. Decisões propostas

| Tema | Proposta |
|---|---|
| Vários fornecedores | Estrutura genérica de integrações e mapeamentos; sem campos por fornecedor em `cfg_units_assets_tags`. |
| Várias instâncias do mesmo fornecedor | Cada conta/servidor é uma integração independente, com escopo de empresa. |
| IDs externos | Armazenar como `text`; não presumir que sejam numéricos. |
| Formatos de resposta | Assumir que cada API pode ter estrutura, autenticação, paginação, nomes de campos e semântica próprios; não criar um parser universal baseado no retorno da primeira API. |
| Credenciais | Guardar nas Credentials do n8n ou em secret manager; nunca em `VITE_*`, no navegador ou em JSON de configuração sem proteção. |
| Identidade de origem | Não usar conta humana compartilhada. Preferir registrar a integração como origem técnica; identidade técnica sem login só como compatibilidade temporária se a RPC atual exigir usuário. |
| `assets_available.comments` | Usar somente um marcador fixo, como `Leitura obtida via integração de APIs.`; não guardar nesse campo IDs, payloads, nome do provedor nem dados técnicos da integração. |
| Orquestração | n8n consulta a API (webhook ou polling), normaliza os dados e chama um endpoint controlado do SIGES. |
| Persistência | O SIGES valida o mapeamento e aplica a atualização pelo fluxo de backend que mantém histórico e cascata. |
| Sem mapeamento | Não atualizar nenhum ativo; registrar a ocorrência como pendente e disponibilizar para correção administrativa. |
| Dados repetidos | Operação idempotente: não gerar histórico novo para uma leitura repetida sem mudança relevante. |

## 3. Modelo de dados proposto

Os nomes abaixo são conceituais e devem ser conferidos com as convenções do schema
vivo antes da migration.

### 3.1 `cfg_assets_available_integrations`

Uma linha representa uma fonte/instância conectada ao SIGES.

Campos iniciais sugeridos:

- `id`
- `company_id` — empresa dona da integração
- `name` — nome operacional, por exemplo, “GuaibaFlow — Guarujá”
- `provider_code` — código do adaptador, por exemplo, `guaibaflow`
- `base_url` ou endpoint, se for necessário que o workflow leia a URL do banco
- `config` — parâmetros não secretos e específicos do adaptador, com validação; não
  presumir que um formato de configuração sirva para todos os provedores
- `polling_interval` ou configuração equivalente, se aplicável
- `is_active`
- `created_at`, `updated_at`, `created_user_id`, `updated_user_id`

Não armazenar `api_key`, senha, token, secret ou cabeçalho de autenticação nesta
tabela. Se um workflow precisar receber uma referência de credencial, armazenar
somente um identificador não secreto da Credential do n8n, sem expor o segredo.

Para integrações cujo status externo precisa ser traduzido, a configuração da
integração deve permitir declarar o caminho do campo e um mapa explícito de valores
para booleano interno. Exemplo para uma API que retorna `status: "ON"` ou
`status: "OFF"`:

```json
{
  "status_path": "status",
  "status_map": {
    "ON": true,
    "OFF": false
  }
}
```

O adaptador lê o valor indicado por `status_path`, procura uma correspondência exata
em `status_map` e produz `is_available` booleano: `ON` → `true`, `OFF` → `false`.
Pode normalizar espaços e capitalização apenas conforme regra documentada para aquele
provedor. Valores não configurados (por exemplo, `WARN`) devem gerar erro explícito e
nunca ser convertidos por padrão para `true` ou `false`. A validação da configuração
deve garantir que os destinos do mapa sejam booleanos.

### 3.2 `cfg_assets_available_integrations_mappings`

Relaciona o identificador fornecido pela API ao setor/ativo interno.

Campos iniciais sugeridos:

- `id`
- `integration_id` — FK para `cfg_assets_available_integrations`
- `external_id` — texto exatamente como recebido da API
- `unit_asset_tag_id` — FK para `cfg_units_assets_tags.id`
- `is_active`
- `created_at`, `updated_at`

Restrições propostas:

- `UNIQUE (integration_id, external_id)` para impedir mapeamentos duplicados na
  mesma integração.
- Índice por `unit_asset_tag_id` para localizar as integrações associadas a um
  registro do SIGES.
- FK com comportamento de exclusão decidido junto com a política de retenção; não
  apagar silenciosamente o histórico de integração quando um ativo for removido.

É permitido que duas integrações diferentes apontem para o mesmo
`unit_asset_tag_id`, caso isso seja uma relação válida. Deve existir uma decisão
explícita sobre conflitos quando fontes diferentes reportarem estados divergentes.

### 3.3 `logs_assets_available_integrations_events` — logs e idempotência

Registrar execuções e itens recebidos em uma estrutura de log, ou usar observabilidade
equivalente no n8n, contendo pelo menos:

- integração, horário, resultado e mensagem de erro sanitizada;
- `external_id`, mapeamento resolvido e resultado do processamento;
- identificador do evento externo, se a API fornecer um;
- chave de idempotência ou referência à última leitura processada.

Não registrar tokens, chaves, cabeçalhos de autorização nem payloads que possam conter
segredos. Definir retenção dos logs antes da implantação.

## 4. Fluxo proposto

```text
API externa
    ↓ webhook ou polling no n8n
Adaptador da integração: validar e normalizar resposta
    ↓ external_id + status + horário + dados necessários
Endpoint seguro de ingestão do SIGES
    ↓ autenticar integração, validar escopo, mapear e deduplicar
Fluxo/RPC de disponibilidade do SIGES
    ↓
assets_available + estado atual + regras de cascata
```

Para cada item recebido, o processamento deve:

1. No adaptador específico do provedor, extrair e validar:
   - identificador externo estável do item;
   - status externo, traduzido por uma tabela de regras explícita para
     `available`/`unavailable`;
   - data/hora da leitura na fonte;
   - motivo externo, apenas se houver regra explícita de correspondência com um
     motivo interno do SIGES;
   - identificador de evento da fonte, se existir, para idempotência.
   Nome/descrição externos podem auxiliar a conferência humana, mas nunca devem ser
   usados como chave de relacionamento. Status desconhecidos e datas inválidas
   devem falhar sem gravar estado.
2. Identificar a integração autenticada; não confiar em `integration_id` livre
   enviado no corpo para definir autorização.
3. Resolver `(integration_id, external_id)` para exatamente um
   `unit_asset_tag_id`.
4. Confirmar que integração, mapeamento e alvo estão ativos e pertencem ao escopo
   de empresa permitido.
5. Converter o status externo para o estado interno usando configuração validada
   (por exemplo, `ON` → disponível somente após confirmação do contrato da API).
   No informe gravado em `assets_available.comments`, usar apenas um texto fixo
   indicando a origem automatizada, por exemplo, `Leitura obtida via integração de
   APIs.`. Não concatenar nesse campo o motivo, o ID externo, o nome da integração
   ou o payload da API.
6. Obter do registro mapeado no SIGES os IDs internos relacionados, como
   `unit_asset_tag_id`, `unit_id`, `asset_tag_id` e `asset_tag_sub_id`, além do
   escopo da empresa. Não aceitar esses IDs como autoridade vinda diretamente do
   payload externo.
7. Converter a data/hora da fonte para o fuso `America/Sao_Paulo` antes de persistir
   em colunas `timestamp without time zone`, após validar o offset recebido. Usá-la
   como horário reportado; registrar separadamente o horário de processamento como
   horário de criação. Não descartar o offset sem conversão.
8. Rejeitar ou deixar pendente IDs não mapeados, status desconhecido, timestamp
   inválido, leitura mais antiga que a última aplicada ou motivo sem correspondência
   quando o motivo for obrigatório para a indisponibilidade.
9. Evitar duplicatas e evitar histórico novo quando estado e dados relevantes não
   mudaram.
10. Aplicar a alteração pelo fluxo oficial do SIGES e registrar o resultado.

## 5. Papel do n8n e contrato de ingestão

- Criar um workflow por provedor ou por padrão de integração, reutilizando nós e
  subworkflows somente quando houver autenticação e formato realmente em comum.
  Integrações diferentes não devem ser obrigadas a usar o mesmo parser só porque
  todas informam disponibilidade.
- Implementar um adaptador por provedor (e por versão/variante de contrato quando
  necessário). Cada adaptador conhece o formato real da resposta, paginação,
  autenticação, códigos de estado, timestamps e regras de erro da sua API.
- Usar Credentials do n8n para autenticação externa. Segredos devem ser provisionados
  fora dos dados normais da integração e nunca enviados ao frontend.
- Preferir webhooks quando a fonte os oferecer; usar polling quando necessário,
  com intervalo, timeout, paginação, limite de concorrência e retentativas definidos.
- Cada adaptador valida a resposta específica da API e transforma seus campos para o
  contrato canônico do SIGES. Somente depois dessa normalização os passos comuns
  resolvem mapeamento, idempotência e ingestão. Assim, o backend não precisa conhecer
  o formato proprietário de cada fornecedor:

```json
{
  "external_id": "25",
  "status": "available",
  "source_reported_at": "2026-11-04T18:17:51-03:00",
  "source_event_id": null,
  "reason": null
}
```

- Campos do contrato canônico:
  - `external_id` (obrigatório): ID fornecido pela API, normalizado para texto e
    resolvido pelo mapeamento da integração.
  - `status` (obrigatório): somente `available` ou `unavailable`, após tradução
      validada pelo adaptador. A configuração pode mapear valores externos, como
      `ON`/`OFF`, diretamente para `is_available: true`/`false`; valores desconhecidos
      devem ser rejeitados.
  - `source_reported_at` (obrigatório): data/hora da leitura na fonte, com offset
    explícito ou fuso documentado e validável.
  - `source_event_id` (opcional): ID único do evento externo para deduplicação.
  - `reason` (opcional): código externo normalizado; o backend só o converte para
    `asset_unavailable_reason_id` se houver mapeamento configurado. Texto livre não
    deve ser convertido automaticamente em ID interno.
- O adaptador pode ler campos extras da resposta (por exemplo, nome, motivo textual
  ou métricas), mas só deve encaminhar os campos canônicos aprovados. O nome externo
  serve para conferência/mapeamento assistido, nunca para resolver o alvo em produção.
- O backend resolve `external_id` para `unit_asset_tag_id` e obtém os campos internos
  necessários (`unit_id`, `asset_tag_id`, `asset_tag_sub_id`, empresa e demais valores
  validados) do próprio SIGES. O n8n não deve enviar esses IDs internos como fonte de
  autoridade.
- Para o registro em `assets_available`, o fluxo oficial determina/popula:
  - `unit_asset_tag_id`, `unit_id`, `asset_tag_id`, `asset_tag_sub_id`: dados internos
    obtidos pelo mapeamento;
  - `is_available`: resultado de `status`;
  - `reported_at`: `source_reported_at`, convertido corretamente para o timestamp
    local esperado pelo banco;
  - `created_at`: instante em que o SIGES processa/grava a leitura;
  - `comments`: marcador fixo `Leitura obtida via integração de APIs.`;
  - `asset_unavailable_reason_id`: motivo interno correspondente, quando mapeado;
    sem correspondência, aplicar a regra funcional aprovada (não inventar motivo);
  - `provider_company_id`: empresa/provedor interno validado no SIGES, não um ID
    arbitrário recebido da API;
  - `reported_user_id`/`created_user_id`: autoria humana nula quando permitido; não
    atribuir a um usuário humano que não realizou a ação;
  - coordenadas, anexos e `operation_record`: nulos/ausentes se não forem fornecidos
    e não forem necessários à regra de negócio.
- Não inserir diretamente em `assets_available` pelo n8n. O endpoint chama a RPC/fluxo
  controlado para manter atualização do estado atual, histórico e cascata.

- O contrato canônico deve ter versão e documentação. Campos sem equivalente na
  fonte podem ser nulos; campos obrigatórios ausentes, status desconhecido ou
  timestamps inválidos devem gerar erro explícito, não valores presumidos.
- Manter exemplos de payloads reais sanitizados e testes de transformação por
  adaptador. Mudança de formato do fornecedor deve falhar de modo observável e não
  produzir atualizações incorretas.
- A configuração da integração seleciona o adaptador e contém apenas os parâmetros
  não secretos que ele reconhece. Não permitir scripts ou expressões arbitrárias
  vindas da configuração para interpretar payloads.
- O endpoint do SIGES deve autenticar a integração e ser executado apenas no
  servidor. Pode ser uma Edge Function ou outro endpoint backend apropriado. Não
  entregar `service_role` ao n8n como dado do workflow nem ao navegador; se houver
  credencial de servidor entre n8n e SIGES, restringir escopo, permitir rotação e
  nunca incluí-la em payloads/logs.
- O endpoint não deve aceitar nome de tabela, SQL, RPC arbitrária ou parâmetros
  capazes de escolher um alvo fora do mapeamento autorizado.
- O endpoint chama uma operação explícita e validada, não dá ao workflow acesso
  irrestrito às tabelas do banco.

## 6. Compatibilidade com disponibilidade existente

O SIGES já usa `report_unit_asset_tag_availability` para gravar histórico em
`assets_available`, atualizar o estado corrente e processar cascatas, conforme
`dev/supabase/migrations/20261001_unit_sector_multi_parent.sql`. A chamada atual
pela aplicação está em `services/assets/assetTagsService.ts`.

A RPC existente exige, entre outros parâmetros, `p_reported_by_id`, `p_unit_id`,
`p_asset_tag_id`, `p_provider_company_id` e `p_is_web`. Portanto, antes de
implementar a ingestão, decidir como representar corretamente a origem automatizada:

### 6.1 Identidade técnica e autoria do informe

**Não criar nem reutilizar uma conta humana do Supabase Auth com senha compartilhada**
para a automação. A credencial que autentica n8n → SIGES é um segredo de máquina,
separado de qualquer registro de usuário e armazenado no backend/secret manager.

O marcador fixo em `assets_available.comments` é apenas informativo para quem consulta
o histórico. Ele não autentica a chamada, não identifica individualmente qual
integração produziu o evento e não substitui `reported_user_id` nem auditoria
estruturada.

**Solução definitiva preferida:** representar a integração como origem automatizada
própria. Registrar no histórico qual integração produziu o evento, mantendo a autoria
humana nula quando não houve ação de uma pessoa. Ajustar o endpoint e, se necessário,
a RPC/schema para aceitar essa origem explicitamente, sem remover a auditoria existente.

Como o schema de referência mostra `created_user_id` e `reported_user_id` como campos
que aceitam `NULL`, verificar primeiro se a RPC e as constraints do banco vivo também
permitem `p_reported_by_id = NULL`. Se permitido, manter a autoria humana nula; não
criar identidade técnica apenas para preencher esses campos.

**Compatibilidade temporária:** se a RPC não puder ser alterada imediatamente e
`p_reported_by_id` for obrigatório, pode-se provisionar um registro técnico controlado
no modelo de usuários, identificado claramente (por exemplo, “Integração de
disponibilidade”), sem conta ou credencial de login. Esse registro serve apenas como
identificador técnico legado; cada histórico ainda deve guardar separadamente o
`integration_id` real. Não atribuir o informe a um usuário humano arbitrário nem
permitir que essa identidade técnica faça login ou seja usada por pessoas.

Antes de adotar a compatibilidade temporária, confirmar as constraints e FKs de
`users` e `assets_available`, o que a interface mostra para `reported_user_id` e
`created_user_id`, e se a RPC aceita os parâmetros sob chamadas de serviço. Planejar
a remoção do identificador legado após a origem da integração estar representada de
forma nativa.

Em qualquer alternativa, preservar transação, histórico, cascata, auditoria e
tratamento de datas. Não marcar o evento como originado da interface web se veio do
n8n.

## 7. Configuração e administração no SIGES

Planejar uma tela administrativa para:

- listar integrações por empresa e mostrar estado, última execução e último erro;
- criar/editar nome, provedor, URL e parâmetros não secretos;
- ativar/desativar uma integração;
- administrar o mapeamento de ID externo para setor do SIGES;
- pesquisar itens externos ainda não mapeados e associá-los sem editar o workflow;
- validar a URL/conectividade por uma ação no servidor, sem revelar credenciais;
- testar e substituir credenciais pelo mecanismo de secrets, exibindo apenas estado
  configurado/não configurado.

A tela deve usar permissões próprias e escopo por empresa. Nunca devolver o segredo já
salvo ao cliente.

## 8. Segurança e confiabilidade

- Não expor chaves de APIs externas nem chaves Supabase privilegiadas em variáveis
  `VITE_*`; revisar e remover qualquer uso de `VITE_SUPABASE_SERVICE_ROLE_KEY` no
  frontend antes da implantação.
- Autenticar n8n → SIGES com credencial de servidor rotacionável e escopo mínimo.
- Validar e restringir URLs configuráveis no servidor para reduzir risco de SSRF;
  bloquear loopback, redes privadas e destinos de metadados, salvo exceção
  explicitamente aprovada.
- Aplicar timeout, limite de tamanho, paginação, limites de taxa e concorrência.
- Usar retentativas com backoff somente para falhas transitórias; evitar repetição
  infinita e permitir reprocessamento seguro.
- Comparar timestamps com offset corretamente. A leitura de exemplo da GuaibaFlow
  contém offset `-03:00`; armazenar o instante sem perder o offset semântico e exibir
  no padrão `America/Sao_Paulo`.
- Definir se atualizações automatizadas podem sobrescrever informes manuais e como
  resolver duas fontes para o mesmo setor antes de ativar a integração.
- Alertar sobre integração inativa, falha repetida, mapeamento ausente e atraso de
  leitura; informar erros operacionais sem incluir segredos.

## 9. Fases de entrega

### Fase 0 — Contrato e decisões

- Para cada API, obter documentação/autorização e amostras sanitizadas de sucesso,
  erro, paginação, autenticação, status e timestamp. Não generalizar o formato de
  uma integração para as demais.
- Definir o adaptador que interpreta cada contrato externo e a versão do contrato
  canônico interno.
- Confirmar o significado de cada status externo, frequência, limites e SLA.
- Definir precedência entre fontes, integrações e informes manuais.
- Aprovar o modelo de autoria: origem de integração nativa como destino; identidade
  técnica sem login somente como transição, após validar constraints, exibição no
  histórico e possibilidade de migração.
- Definir como a autenticação de máquina n8n → SIGES será provisionada, rotacionada
  e revogada, separadamente da identidade de auditoria.

**Gate:** nenhuma escrita automática até que mapeamento, estado, precedência e
identidade de origem estejam validados com exemplos reais.

### Fase 1 — Banco e endpoint de ingestão

- Criar migration aditiva para integrações, mapeamentos, índices, RLS e permissões.
- Revisar políticas conforme padrão de escopo por empresa; não copiar políticas
  universais sem avaliar exposição de configuração e mapeamentos.
- Implementar endpoint backend autenticado, validação do contrato, resolução do
  mapeamento, idempotência e chamada controlada da lógica de disponibilidade.
- Adicionar auditoria identificando a integração de origem.

**Gate:** teste de banco/endpoint confirma escopo, rejeição de payload inválido,
deduplicação e transação atômica.

### Fase 2 — Uma API em modo de observação

- Configurar a primeira integração no n8n e cadastrar seus mapeamentos.
- Executar consultas sem gravar estado inicialmente; comparar o resultado normalizado
  com o que operadores esperam no SIGES.
- Corrigir IDs ausentes, statuses e diferenças de horário.

**Gate:** todos os IDs relevantes mapeados; nenhuma associação baseada somente em
nome; amostra revisada pelo responsável funcional.

### Fase 3 — Ativação controlada

- Habilitar escrita para uma empresa ou conjunto piloto.
- Acompanhar logs, latência, duplicatas, falhas e divergência entre API e SIGES.
- Ter procedimento de desativação imediata da integração e reprocessamento controlado.

**Gate:** período piloto definido pelo responsável sem falhas críticas nem eventos
duplicados; divergências explicadas.

### Fase 4 — Administração e expansão

- Implementar tela de configuração e manutenção dos mapeamentos.
- Incluir os próximos provedores por adaptadores específicos e testes próprios,
  mantendo estável o contrato canônico e sem alterar o esquema de
  `cfg_units_assets_tags`.
- Documentar operação, rotação de credenciais, alertas, recuperação e rollback.

## 10. Testes e critérios de aceite

- Migration pode ser aplicada repetidamente sem efeitos destrutivos e tem plano de
  rollback compatível com os dados gravados.
- IDs externos numéricos e alfanuméricos mapeiam corretamente; IDs iguais em
  integrações diferentes não colidem.
- Cada integração trata seu formato de resposta por adaptador próprio; payloads
  incompatíveis ou inesperados não são interpretados por heurística nem gravados.
- O contrato canônico exige ID externo, estado normalizado e timestamp da fonte;
  motivo e ID de evento são opcionais conforme suporte do provedor e regras de
  negócio.
- IDs internos de unidade/setor/ativo são resolvidos no SIGES pelo mapeamento, não
  confiados ao payload externo.
- Timestamp com offset é convertido corretamente para o formato de persistência do
  SIGES; horário de leitura e horário de processamento não são confundidos.
- Os testes de cada adaptador usam amostras representativas do respectivo provedor,
  inclusive erros, status desconhecidos, timestamp inválido e paginação quando
  aplicável.
- ID não mapeado, integração desativada, empresa fora do escopo, status desconhecido
  e timestamp inválido não alteram a disponibilidade.
- Reentrega do mesmo evento não cria histórico duplicado.
- Repetição do mesmo estado sem mudança relevante não cria histórico desnecessário.
- Eventos atrasados não sobrescrevem estado mais recente.
- Informe automatizado mantém histórico e cascata; erros de cascata são visíveis e
  tratados sem sucesso falso.
- Eventos automatizados identificam a integração de origem sem atribuição falsa a
  usuário humano; eventual identidade técnica transitória não possui login e não
  expõe credenciais de máquina.
- `assets_available.comments` contém somente o marcador fixo de origem automatizada,
  sem dados variáveis nem segredos da API.
- Informes manuais e automatizados seguem a regra de precedência aprovada.
- Credenciais não aparecem na resposta da API, no frontend, nos logs ou em exportação
  normal da configuração.
- Tela respeita permissões e escopo da empresa.
- Testes cobrem função/RPC de ingestão, autorização, idempotência, mapeamento e
  conversão por provedor.

## 11. Fora de escopo inicial

- Adicionar uma coluna por fornecedor em `cfg_units_assets_tags`.
- Permitir que workflows executem SQL arbitrário ou escrevam diretamente nas tabelas
  de histórico e estado.
- Automatizar todos os fornecedores antes de validar o primeiro em modo de observação.
- Resolver automaticamente conflitos entre fontes sem regra de precedência aprovada.
