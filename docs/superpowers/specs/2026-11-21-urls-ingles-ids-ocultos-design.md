# URLs em inglês e ids fora da barra de endereço — design

Data: 21/11/2026 · Tamanho: mudança pequena (roteamento: `app/screenRoutes.ts` + `hooks/useScreenHistory.ts` + `App.tsx`)

## Intenção

Fora do localhost, o usuário não deve ver o id na URL (ex.: `#/visita-ativo/4363`). Assim ele não consegue trocar o número para abrir outro registro. Também queremos rotas com nomes em inglês. No localhost o id continua visível, só para conferência durante o desenvolvimento.

Esconder o id **não substitui a RLS**: quem chama o Supabase direto ainda consegue tentar outros ids. A barreira real é a RLS (fora deste escopo; ver "Depois").

## Objetivos

- Rotas com parâmetro passam a ter nomes em inglês (tabela abaixo).
- Produção: a URL mostra só o caminho, sem ids (ex.: `#/visit-asset`). Os ids ficam no estado do histórico do navegador (`history.state`, via `navigate(path, { state })`).
- localhost: a URL mostra os ids (ex.: `#/visit-asset/4363`), como hoje.
- F5, voltar e avançar continuam reabrindo a mesma tela com o mesmo registro, nos dois modos.

## Não-objetivos

- Links compartilháveis. Em produção, uma URL copiada (sem estado) abre o painel.
- Embaralhar/criptografar ids, ou criar um encurtador de links no banco.
- Mexer na RLS.

## Anti-objetivo

- Em produção, uma URL **digitada com id** (`#/visit-asset/4364`) não pode abrir o registro. Senão a troca continua possível. Ela cai no painel.

## Abordagens consideradas

1. **Ids no `history.state`, fora da URL** — escolhida. É simples, preserva F5 e voltar/avançar e não deixa nada editável na barra. Custo: o link não é compartilhável.
2. Id embaralhado na URL — mantém o link, mas a chave fica no app; protege só contra o curioso.
3. Link curto no banco (código → tela + id + dono) — único com link compartilhável e seguro, mas exige migration e serviço; desproporcional sem demanda de compartilhar.

## Rotas (antes → depois)

| Tela | Antes | Depois (localhost) | Depois (produção) |
|---|---|---|---|
| order-visit-asset-activities | `/visita-ativo/:ovaId/atividades/:orderTypeId` | `/visit-asset/:ovaId/activities/:orderTypeId` | `/visit-asset/activities` |
| order-visit-asset-materials | `/visita-ativo/:ovaId/materiais` | `/visit-asset/:ovaId/materials` | `/visit-asset/materials` |
| order-visit-asset-report | `/visita-ativo/:ovaId` | `/visit-asset/:ovaId` | `/visit-asset` |
| order-visit-approve | `/visita/:id/aprovar` | `/visit/:id/approve` | `/visit/approve` |
| order-visit-evaluation | `/visita/:id/avaliar` | `/visit/:id/evaluate` | `/visit/evaluate` |
| order-visit-execute | `/visita/:visitId` | `/visit/:visitId` | `/visit` |
| order-detail | `/os/:orderId` | `/order/:orderId` | `/order` |
| service-request-detail | `/ss/:orderId` | `/service-request/:orderId` | `/service-request` |
| asset-details | `/ativo/:assetId` | `/asset/:assetId` | `/asset` |
| company-details | `/empresa/:id` | `/company/:id` | `/company` |
| contract-details | `/contrato/:id` | `/contract/:id` | `/contract` |
| unit-details | `/unidade/:id` | `/unit/:id` | `/unit` |
| material-details | `/material/:id` | `/material/:id` | `/material` |
| technical-manual-details | `/manual/:id` | `/manual/:id` | `/manual` |
| client-details | `/cliente/:id` | `/client/:id` | `/client` |
| department-details | `/departamento/:id` | `/department/:id` | `/department` |
| team-details | `/equipe/:id` | `/team/:id` | `/team` |

As telas sem rota própria continuam em `/<nome-da-tela>`, que já está em inglês.

## Como decide o modo (escolha minha)

- Mostra ids quando `window.location.hostname` for `localhost` ou `127.0.0.1` **e** não for app nativo (`Capacitor.isNativePlatform()`). O Android roda em `https://localhost`, mas lá a URL não aparece; por isso fica no modo "esconde".
- O Electron empacotado roda em `file://` (hostname vazio), então esconde. O Electron em dev usa o servidor do Vite em localhost, então mostra.
- A decisão fica numa função única e testável (ex.: `showIdsInUrl()` em `app/screenRoutes.ts`), com o hostname injetável nos testes.

## Comportamento no modo "esconde" (escolhas minhas)

- Cada entrada do histórico grava `state: { screen, selection }`. Ao voltar, avançar ou dar F5, a seleção vem de `location.state.selection`, e não do caminho.
- Caminho sem ids e sem estado (link colado, aba nova) → painel (`dashboard`), sem erro.
- Caminho com ids (digitado ou antigo) → ignorado e trocado pelo painel.
- Os caminhos antigos em português **não** são mantidos como apelido: ninguém compartilha links, e em produção eles teriam ids, que não são aceitos de qualquer forma.
- Detalhe para quem implementar: hoje o hook compara caminhos (`location.pathname === path`, pilha `stack`) para saber se a entrada mudou. No modo "esconde", trocar de ativo na mesma tela gera o **mesmo** caminho. A identidade da entrada tem de passar a ser uma chave com ids (ex.: o caminho completo `toPath` de sempre), separada da URL exibida.

## Fica para quem implementar

- Organização interna de `toPath`/`fromPath` (ex.: `toKey` + `toUrl`, `fromLocation(pathname, state)`).
- Atualizar `app/screenRoutes.test.tsx`, `hooks/useScreenHistory.routes.test.tsx` e o PLANO_MELHORIAS_FRONTEND.md (rotas em português citadas lá). Testar os dois modos, inclusive F5 (estado preservado) e URL digitada com id em produção (cai no painel).

## Depois (fora deste escopo)

- Conferir no banco vivo (MCP `supabase-ro`) se as políticas de RLS de `orders`, `orders_visits_assets`, `assets` e `clients` limitam o usuário aos clientes e departamentos dele.
