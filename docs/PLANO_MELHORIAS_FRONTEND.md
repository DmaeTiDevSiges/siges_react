# Plano — melhorias do frontend (13/11/2026)

Ordem decidida: **3 → 1 → 2 → 4 → 5**. Cada etapa só começa com a anterior verde (`npx tsc --noEmit`, `npm test`, `npm run lint:eslint`).

## Etapa 3 — Rede de segurança (FEITA em 13/11/2026)
- Jest com 2 projetos: `node` (`*.test.ts`, serviços) e `ui` (`*.test.tsx`, jsdom + React Testing Library). `npm run test:ui` roda só o de interface.
- `tests/setupUi.ts` (jest-dom, mock do Capacitor Preferences) e `tests/featuresStub.ts` (substitui `features.ts`, que usa `import.meta.env` do Vite).
- Para testar uma tela: `jest.mock` do `dataService`/`AuthContext`/`sonner` (ver `OrderVisitAssetActivities.test.tsx`). Qualquer módulo que use `import.meta` precisa de stub no `moduleNameMapper`.
- `DataQualityIndicator.test.tsx` é legado que nunca rodou (mocks quebrados): ignorado no projeto `ui` até ser reescrito.
- ESLint 10 (`eslint.config.js`): `rules-of-hooks` = erro, `exhaustive-deps` = aviso. Linha de base: **0 erros, 4.330 avisos** (2.483 `any`, 1.606 variáveis não usadas, 163 `exhaustive-deps`). Meta: só cair.
- Corrigido o que a regra achou: 4 telas (`AssetDetails`, `ServiceRequestDetail`, `OrderRequestView`, `UnitDetails`) chamavam hooks depois do `return` de "Acesso Negado" (quebra com "Rendered more hooks" se a permissão mudar de negada para liberada com a tela aberta); `UserProfileHeader` e `DashboardUnitsPowerElectric` (useMemo dentro do JSX).
- Próximos testes (fluxos críticos, a fazer): iniciar visita, relatar ativo, encerrar visita, fila offline na tela de pendências. Depois 1–2 testes de ponta a ponta (Playwright) do caminho feliz.

## Etapa 1 — Roteamento e quebra do `App.tsx` (EM ANDAMENTO)
Decisões do usuário (13/11/2026): **react-router** + **histórico por hash** (`#/tela`).
Hoje: `App.tsx` ~3.700 linhas, ~190 `useState`, `switch (currentScreen)`.

**Fase 1a — FEITA em 13/11/2026 (ponte tela ⇄ URL):**
- `HashRouter` em `index.tsx`. O `currentScreen` continua sendo a fonte de verdade; `hooks/useScreenHistory.ts` espelha cada troca de tela em `#/<tela>` (push) e atende voltar/avançar (POP). Só age com usuário logado: antes disso o `#` pode ter o token de recuperação de senha do Supabase (o `App.tsx` lê `window.location.hash` na 1ª renderização — não mexer nessa ordem).
- Voltar para a tela que era a anterior desempilha a entrada (a seta do cabeçalho não faz o histórico crescer).
- `canEnter` (em `App.tsx`, `canEnterScreen`): voltar para tela que exige seleção em memória perdida (ativo, visita, OS…) cai no painel em vez de tela em branco. Ao criar tela nova que dependa de seleção, **incluí-la ali**.
- **Botão voltar do Android** (antes fechava o app em qualquer tela): `utils/backButton.ts` é uma pilha de prioridade — modal/painel/passo de fluxo (`useBackToClose`, `registerBackHandler`) → `handleBack` do cabeçalho (`app/screenBack.ts › hasHeaderBack` decide se a tela tem seta) → histórico (-1) → painel → sair do app. `Modal`, `BottomSheet`, `DeleteVisitModal`, `StepFlow`, `PendingOpsPanel`, `DashboardOrdersUserScreen` e `DesignKitScreen` já usam. **Não chamar `CapApp.addListener('backButton')` direto** em componente novo: use `registerBackHandler`/`useBackToClose`.
- Testes: `hooks/useScreenHistory.test.tsx`, `utils/backButton.test.ts`, `app/screenBack.test.ts`, `components/ui/Modal.test.tsx`. Jest `ui` agora transforma `react-router` (ESM) via `tests/tsJestImportMeta.cjs` (traduz `import.meta`).
- NÃO verificado em aparelho/emulador (só Jest + build do Vite): roteiro no fim deste bloco.

**Fase 1b — em andamento (fluxo da visita, OS/SS, ativo e aprovação/avaliação feitos em 13/11/2026):**
- `app/screenRoutes.ts`: rotas com parâmetros — `#/visita/:visitId`, `#/visita-ativo/:ovaId`, `#/visita-ativo/:ovaId/atividades/:orderTypeId`, `#/visita-ativo/:ovaId/materiais`. `toPath`/`fromPath` (com `matchPath`/`generatePath`; ids com ":" de ativo criado offline funcionam).
- `useScreenHistory` agora trabalha com **caminhos** (tela + ids): trocar de ativo na mesma tela vira entrada nova; voltar/avançar, recarregar (F5) e link aberto leem a seleção **da URL** (`applySelection`), sem passar por `canEnter`. Link aberto antes do login só é seguido depois de logar (o hash fica intacto enquanto deslogado).
- No `App.tsx`: `routeSelection` (de onde vêm os ids) e `applyRouteSelection` (como a URL volta para a memória). `leaveAssetReport()` descobre a visita pelo ativo quando o relatório foi aberto por link/recarregamento (senão a tela da visita ficava em branco).
- **OS/SS e ativo:** `#/os/:orderId` (`order-detail`), `#/ss/:orderId` (`service-request-detail`) e `#/ativo/:assetId` (`asset-details`). Essas telas recebem o objeto pronto e não buscam sozinhas, então o `App.tsx` usa `hooks/useRouteEntity.ts`: quando a URL traz um id diferente do que está em memória, busca (`getOrderById`/`getAssetById`); enquanto isso, `pendingId` mostra "Carregando..." e segura o id na URL; se não achar (ou estiver offline, ou for ativo `tmp:` ainda não enviado) avisa e cai no painel. `handleOrderSelect`/`handleAssetSelect` chamam `cancel()` para descartar busca atrasada. A aba da OS/SS, `lastOrderSource` e `lastAssetSource` seguem em memória (após F5, o voltar cai na origem padrão: painel de OS / busca de ativos).
- **Aprovação/avaliação da visita:** `#/visita/:id/aprovar` (`order-visit-approve`) e `#/visita/:id/avaliar` (`order-visit-evaluation`), com o id em `approvalVisitId` (separado de `visitId` para não confundir com a visita em execução). Ao abrir por URL, `routeApproval` (`useRouteEntity`) busca a visita e, se a OS em memória for outra, a OS dela; a tela da visita (destino do voltar/aprovar) recebe o mesmo id.
- **Para migrar outra tela:** incluir em `ROUTES` (`screenRoutes.ts`, mais específicas primeiro), incluir o id em `Selection`, ligar em `routeSelection`/`applyRouteSelection` (se a tela não buscar sozinha pelo id, usar `useRouteEntity`) e conferir o que acontece ao recarregar nela (a tela busca tudo pelo id? o "voltar" depende de estado em memória?).
- **Ainda em memória (não vão para a URL):** aba da visita (`visitActiveTab`), `assetReportBackScreen`, `lastVisitSource`, aba da OS/SS (`orderDetailActiveTab`/`ssDetailActiveTab`), `lastOrderSource`.
- **Próximas na fila:** cadastros (empresa, cliente, unidade…).
**Outras telas com overlay próprio** (`fixed inset-0` sem usar `Modal`) ainda não tratam o voltar do Android: migrar para `Modal` ou `useBackToClose`.

**Roteiro de teste manual (Android):**
1. Painel → OS → visita → ativo → relatório: voltar (físico) percorre o caminho inverso, sem sair do app.
2. Em qualquer modal aberto: voltar fecha só o modal.
3. No "Meu Painel": voltar sai do app.
4. Relatório do ativo → atividades → voltar físico volta ao relatório.
5. Recuperar senha pelo e-mail: link abre o app/site na tela de nova senha (o `#` do Supabase não pode ser perdido).
6. Web/Electron: botão voltar do navegador percorre as telas; recarregar (F5) dentro de uma visita/ativo reabre a mesma tela (fluxo da visita já na URL); nas demais telas ainda abre no painel.
7. Abrir `#/visita-ativo/<id>` colado no navegador (logado): abre o relatório do ativo; voltar leva à visita (não à tela em branco).
8. OS/SS/ativo: abrir uma OS (ou ativo), recarregar (F5) → reabre a mesma; colar `#/os/<id>`, `#/ss/<id>` ou `#/ativo/<id>` no navegador abre a tela; id inexistente avisa e cai no painel.
9. Aprovação: na visita, abrir a aprovação, recarregar (F5) → reabre a aprovação (com a OS certa); colar `#/visita/<id>/aprovar` ou `/avaliar` funciona; voltar leva à visita.

## Etapa 2 — Camada de dados (TanStack Query) (PENDENTE)
`QueryClientProvider` por cima do `dataService`; migrar telas de leitura uma a uma (começando por listas). O `readCache` offline continua por baixo (fonte de `initialData`). Invalidar por chave após cada operação da fila offline. Meta: sumir os `useEffect` + `loading/error` manuais.

## Etapa 4 — Telas gigantes e `any` (PENDENTE)
`OrderVisitAssetReport` (1.483 linhas) → hooks `useAssetReport`, `useVisitActions` + seções. `OrderVisitScreen` (1.039). Gerar tipos do Supabase (`supabase gen types`) e trocar `any` nas respostas. Meta: `no-explicit-any` abaixo de 1.500 avisos.

## Etapa 5 — Acessibilidade e design system (PENDENTE)
`IconButton` obrigatório com `aria-label` nos botões só de ícone (254 arquivos usam `material-symbols-outlined`); foco e `Esc` nos modais; alvo de toque ≥ 44 px; centralizar botão/modal/card no design system junto com o redesign (`PLANO_DESIGN_ESTILO_NUBANK.md`).
