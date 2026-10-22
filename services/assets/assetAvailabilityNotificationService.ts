import { settingsService } from '../core/settingsService';
import { apiN8nService } from '../core/apiN8nService';

/**
 * Resultado do envio da notificação de disponibilidade.
 * `groupId` é o valor resolvido de `systems_whatsapp_group_id` (null = vazio).
 */
export interface AvailabilityNotificationResult {
    /** true quando a mensagem foi efetivamente enviada ao webhook */
    sent: boolean;
    /**
     * Id usado para resolver o grupo — `units.system_parent_id` (sistema pai
     * da unidade). É o valor exibido como `systemParentId` nos alertas.
     */
    systemParentId: string | number | null;
    /** Valor de `systems_whatsapp_group_id` usado no envio (null quando vazio) */
    groupId: string | null;
    /** Motivo da não-envio (preenchido apenas quando sent === false) */
    reason?: string;
}

/**
 * Notificação de disponibilidade dos ativos (setores) por WhatsApp.
 *
 * O destinatário é o grupo de WhatsApp configurado para o SISTEMA da unidade
 * (`cfg_systems.units_assets_tags_available_whatsapp_group_id`), resolvido
 * pelo `v_units.system_parent_id` da unidade (o sistema pai — ex.: Drenagem
 * Urbana, id 10).
 *
 * Regra de negócio: sistema SEM grupo configurado → a mensagem NÃO é enviada
 * (evita despachar para o grupo padrão do workflow do n8n por engano).
 */
export const assetAvailabilityNotificationService = {
    /**
     * Envia a mensagem de disponibilidade para o grupo do sistema.
     *
     * @param message Texto da mensagem
     * @param imageUrl URL da imagem de evidência (opcional)
     * @param systemParentId Sistema pai da unidade (`v_units.system_parent_id`)
     *        — é o id usado para procurar o `systems_whatsapp_group_id`
     * @returns `{ sent, systemParentId, groupId, reason }`
     */
    async sendAvailabilityMessage(params: {
        message: string;
        imageUrl?: string;
        systemParentId?: string | number | null;
    }): Promise<AvailabilityNotificationResult> {
        const { message, imageUrl = '', systemParentId } = params;

        if (!systemParentId) {
            console.warn(
                '[WhatsApp] Disponibilidade não enviada: unidade sem sistema definido.'
            );
            return { sent: false, systemParentId: null, groupId: null, reason: 'unidade sem sistema definido' };
        }

        const groupId = await settingsService.getSystemWhatsAppGroupId(systemParentId);

        if (!groupId) {
            console.warn(
                `[WhatsApp] Disponibilidade não enviada: sistema ${systemParentId} não possui grupo de WhatsApp configurado.`
            );
            return {
                sent: false,
                systemParentId,
                groupId: null,
                reason: 'sistema sem grupo de WhatsApp configurado',
            };
        }

        await apiN8nService.sendWhatsAppMessage(message, imageUrl, groupId);
        console.log(
            `[WhatsApp] Disponibilidade enviada para o grupo ${groupId} (sistema ${systemParentId}).`
        );
        return { sent: true, systemParentId, groupId };
    },
};
