/**
 * dashboardRefresh.ts
 *
 * Sinaliza que um dado exibido nos dashboards de OS/SS foi alterado por uma
 * operação feita fora do dashboard (ex: cancelamento na tela de detalhe).
 *
 * Motivo: os dashboards buscam dados apenas na primeira entrada da sessão
 * (`osDashboardSessionLoaded` / `ssDashboardSessionLoaded`) e nos retornos
 * restauram snapshot do localStorage — o evento `refresh_dashboard` só é
 * ouvido enquanto o dashboard está montado, mas a tela de detalhe o desmonta
 * antes do commit da mutação. Ao remontar, o dashboard compara este carimbo
 * com o último carimbo em que ele próprio carregou e refaz a busca.
 */

let refreshRequestedAt = 0;

/** Deve ser chamado após qualquer mutação que invalide listas/contagens dos dashboards. */
export function requestDashboardRefresh(): void {
  refreshRequestedAt = Date.now();
}

/** Carimbo da última invalidação solicitada (0 = nunca houve). */
export function getDashboardRefreshRequestedAt(): number {
  return refreshRequestedAt;
}
