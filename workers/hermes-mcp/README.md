# siges-tools — servidor MCP do SIGES para o Hermes Agent

Servidor MCP (stdio) **somente leitura** que deixa o Hermes consultar o SIGES:
visitas, ordens agendadas, detalhe de ordem, estoque e resumo gerencial.

## Segurança (leia antes de instalar)

- O servidor faz **login com uma conta SIGES** (e-mail/senha + anon key). O RLS e
  as views `security_invoker` valem como no app: o Hermes só vê o que essa conta vê.
- **Nunca** use a `service_role` key aqui.
- A identidade vem das variáveis de ambiente, nunca do LLM. **Uma instância do Hermes
  corresponde a um usuário SIGES.** Restrinja o gateway (Telegram/WhatsApp) à(s)
  pessoa(s) dona(s) dessa conta (allowlist do Hermes).
- Nenhuma ferramenta escreve no banco. Escritas ficam para a fase 2, com confirmação.

## Ferramentas

| Ferramenta | O que faz | Fonte |
|---|---|---|
| `siges_quem_sou_eu` | Perfil vinculado (equipe, empresa, líder/admin) | `users`, `cfg_teams` |
| `siges_unidades` | Busca unidades por código ou nome (endereço, tipo, sistema, cliente, link do mapa) | `v_units` |
| `siges_unidade` | Situação de uma unidade: cadastro, OS abertas (status 2–5), visitas recentes, ativos indisponíveis | `v_units`, `v_orders`, `v_orders_visits`, `v_units_assets_tags` |
| `siges_unidades_proximas` | Unidades ativas num raio de uma coordenada (ex.: localização do WhatsApp) | `v_units` |
| `siges_visitas` | Visitas iniciadas no período; por padrão só as do usuário (líder ou membro da equipe); filtro opcional por unidade | `v_orders_visits`, `orders_visits_teams` |
| `siges_ordens_agendadas` | Ordens com status agendada (4) no período; padrão hoje → +7 dias; filtro opcional por unidade | `v_orders` |
| `siges_ordem` | Detalhe de uma ordem pelo número + visitas dela | `v_orders`, `v_orders_visits` |
| `siges_estoque` | Busca material por texto e mostra o saldo por almoxarifado | `v_materials`, `warehouses_materials` |
| `siges_estoque_abaixo_minimo` | Itens ≤ estoque mínimo, ordenados por valor do déficit | `warehouses_materials` |
| `siges_resumo_visitas` | Totais do painel Gestão > Visitas | RPC `fn_orders_visits_dashboard_summary` |

As datas são interpretadas e formatadas em `America/Sao_Paulo`.

## Instalação na VPS

```bash
# Node 20+
cd workers/hermes-mcp
npm ci
npm run build
cp env.example .env      # preencha URL, anon key, e-mail e senha da conta SIGES
chmod 600 .env
```

Teste rápido (deve listar as 7 ferramentas):

```bash
printf '%s\n' \
 '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"t","version":"0"}}}' \
 '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
 '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"siges_quem_sou_eu","arguments":{}}}' \
 | node dist/index.js
```

## Registrar no Hermes

No `~/.hermes/config.yaml` (confira o formato exato na documentação da sua versão do Hermes):

```yaml
mcp_servers:
  siges:
    command: node
    args: ["/opt/siges/workers/hermes-mcp/dist/index.js"]
```

O `.env` ao lado do `dist/` é lido automaticamente. Também dá para passar as
variáveis pelo bloco `env:` do Hermes. Reinicie o Hermes e pergunte, por exemplo,
"quais visitas eu tenho hoje?" ou "tem rolamento 6205 no estoque?".

### Boletim diário (cron do Hermes)

Agende no Hermes, por exemplo, para 07:00 em dias úteis:

> Use as ferramentas do SIGES para montar meu boletim: ordens agendadas para hoje,
> visitas em andamento, os 5 itens com maior déficit de estoque e o resumo de
> visitas do mês. Aponte riscos (ex.: o mesmo ativo com várias ordens).

## Próximas fases

1. **Multiusuário** (técnicos de campo): é preciso vincular o remetente ao usuário
   (tabela `users_chat_links` + código de vínculo gerado no app) de forma que o
   LLM não consiga escolher a identidade. Uma instância por usuário, ou um gateway
   que injeta o usuário fora do prompt.
2. **Escritas** (abrir SS, anexar foto, fechar visita): ferramentas separadas, com
   confirmação explícita no chat e registro no `auditService`.
3. **Manuais técnicos (RAG)**: expor a busca de `manualRagService`.
