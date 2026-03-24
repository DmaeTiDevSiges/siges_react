import { toast } from 'sonner';

/**
 * n8n API Service
 * Responsável por disparar fluxos e integrações estruturadas via n8n.
 */
const BASE_WEBHOOK_URL = import.meta.env.VITE_API_N8N_WEBHOOK;
const WHATSAPP_SEND_MSG_ENDPOINT = import.meta.env.VITE_API_N8N_WEBHOOK_WHATSAPP_SEND_MSG;

export const apiN8nService = {
    /**
     * Envia uma mensagem via WhatsApp usando o fluxo do n8n.
     * @param msg Conteúdo da mensagem
     * @param imgUrl URL da imagem de evidência (opcional)
     * @param to Número de telefone (opcional, se não for fixo no n8n)
     */
    async sendWhatsAppMessage(msg: string, imgUrl: string = '', to?: string) {
        if (!BASE_WEBHOOK_URL) {
            console.error('N8N Webhook URL não configurada no .env');
            return;
        }

        try {
            const body: any = { msg, imgUrl };
            if (to) body.to = to; // Inclui o destinatário se fornecido

            const response = await fetch(`${BASE_WEBHOOK_URL}/${WHATSAPP_SEND_MSG_ENDPOINT}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                throw new Error(`Falha no webhook n8n: ${response.status} ${response.statusText}`);
            }

            // O n8n pode retornar conforme configurado no workflow (ex: { success: true })
            return await response.json();
        } catch (error: any) {
            console.error('Erro ao chamar webhook n8n:', error);
            const errorMsg = error.message.includes('Falha no webhook') 
                ? `Erro no servidor n8n: ${error.message}` 
                : 'Falha na conexão com o serviço de WhatsApp (n8n)';
            
            toast.error(errorMsg);
            throw error;
        }
    },

    /**
     * Dispara um webhook genérico no n8n.
     * @param endpoint Caminho do webhook (ex: "webhook/algum-slug")
     * @param data Dados a serem enviados no corpo da requisição
     */
    async triggerWebhook(endpoint: string, data: any) {
        if (!BASE_WEBHOOK_URL) {
            console.error('N8N Webhook URL não configurada no .env');
            return;
        }

        try {
            const response = await fetch(`${BASE_WEBHOOK_URL}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`Falha ao disparar webhook: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao disparar webhook n8n:', error);
            toast.error('Erro na integração com serviço externo n8n');
            throw error;
        }
    }
};
