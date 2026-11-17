import { OFFLINE_COLLECTIONS } from './store/offlineStore';
import { cacheKey, patchCachedRead, readCached, registerReadKey } from './readCache';
import { sameId, str, type OfflineOpSpec } from './offlineOps';
import { TMP_PREFIX, findCatalogVehicle, newOfflineUuid } from './offlineFlowOps';
import { compressForOffline, saveOfflineFile } from './offlineFiles';

/**
 * Abastecimento de combustível SEM internet (Meu Painel › Abastecimentos).
 *
 * Fluxo da tela: 1) sobe o comprovante (uploadFuelExpenseImages) e 2) grava a despesa
 * (saveRentalExpense) com os nomes devolvidos pelo passo 1. Offline:
 *   • o comprovante é comprimido e salvo no aparelho com o NOME FINAL; o passo 1 devolve
 *     o caminho que o R2 terá, e a fila guarda só a referência ao arquivo;
 *   • a despesa entra na fila com offline_uuid (migration 20261201) — reenviar não duplica;
 *   • as duas operações usam a MESMA chave (fuel:<nome do arquivo>): se o upload falhar,
 *     a gravação que cita o arquivo espera;
 *   • a lista do mês atual (getFuelExpensesByUser) recebe o lançamento na hora.
 * Continua só online: editar/excluir despesa e a importação em lote (exigem o servidor).
 */

const rand = () => Math.random().toString(36).substring(2, 8);

const fuelFolder = (vehicleId: unknown, companyId: unknown) => `companies/${str(companyId) || 1}/vehicles/${str(vehicleId)}/fuel`;
const monthOf = (referenceMonth: unknown) => str(referenceMonth).slice(0, 7);
const fuelKey = (fileName: unknown) => `fuel:${str(fileName)}`;

export const OFFLINE_FUEL_OPS: Record<string, OfflineOpSpec> = {
    // uploadFuelExpenseImages(vehicleId, companyId, images | File, onProgress?, options?) → refs do R2
    uploadFuelExpenseImages: {
        entityKey: a => fuelKey(a[4]?.fileName),
        skipLocalOnOnline: true,
        prepareArgs: async a => {
            const [vehicleId, companyId, images] = a;
            const file = (images instanceof Blob ? images : images?.invoice) as Blob | undefined;
            if (!file) throw new Error('Adicione a foto do comprovante.');
            const { blob, ext } = await compressForOffline(file);
            const fileName = `${Date.now()}_${rand()}_invoice.${ext}`;
            const { ref } = await saveOfflineFile(fileName, blob, 'file');
            // O arquivo vai no 1º nível dos argumentos (a fila só reconstrói referências nesse nível).
            return [str(vehicleId), companyId ?? null, ref, null, { fileName }];
        },
        applyLocal: async (_ctx, a) => ({
            plateImgPath: null,
            plateImgName: null,
            odometerImgPath: null,
            odometerImgName: null,
            invoiceImgPath: `${fuelFolder(a[0], a[1])}/${str(a[4]?.fileName)}`,
            invoiceImgName: str(a[4]?.fileName),
        }),
    },

    // saveRentalExpense(input) — só o lançamento NOVO de combustível funciona offline
    saveRentalExpense: {
        entityKey: a => fuelKey(a[0]?.invoiceImgName || a[0]?.offlineUuid),
        skipLocalOnOnline: true,
        prepareArgs: async a => {
            const input = a[0] || {};
            const isNewFuel = !input.id && input.odometer != null && input.fuelQuantity != null && !!input.invoiceImgName;
            if (!isNewFuel) throw new Error('Sem internet só é possível lançar um novo abastecimento. Esta ação exige conexão.');
            return [{ ...input, offlineUuid: input.offlineUuid || newOfflineUuid() }];
        },
        applyLocal: async (ctx, a) => {
            const input = a[0] || {};
            const month = monthOf(input.referenceMonth);
            const vehicle = await findCatalogVehicle(ctx.store, input.vehicleId);
            const item = {
                id: `${TMP_PREFIX}${str(input.offlineUuid)}`,
                vehicleId: str(input.vehicleId),
                referenceMonth: `${month}-01`,
                costTypeId: str(input.costTypeId),
                value: Number(input.value) || 0,
                description: input.description ?? null,
                odometer: input.odometer ?? null,
                fuelQuantity: input.fuelQuantity ?? null,
                invoiceImgPath: input.invoiceImgPath ?? null,
                invoiceImgName: input.invoiceImgName ?? null,
                createdAt: input.createdAt ?? new Date(ctx.now()).toISOString(),
                vehicleDescription: vehicle?.description,
                vehiclePlates: vehicle?.plates,
            };
            const args = [str(input.userId), month];
            const hit = await patchCachedRead<any[]>(ctx.store, 'getFuelExpensesByUser', args, list =>
                Array.isArray(list) && list.some(x => sameId(x?.id, item.id)) ? undefined : [item, ...(Array.isArray(list) ? list : [])],
            );
            if (hit === undefined && !(await readCached(ctx.store, 'getFuelExpensesByUser', args))) {
                // Mês ainda sem lista baixada: cria só com o lançamento novo.
                await ctx.store.put(OFFLINE_COLLECTIONS.reads, cacheKey('getFuelExpensesByUser', args), { value: [item], savedAt: ctx.now() });
                await registerReadKey(ctx.store, 'getFuelExpensesByUser', args);
            }
            return item;
        },
    },
};
