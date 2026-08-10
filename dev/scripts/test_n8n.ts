import { apiN8nService } from './services/apiN8nService';

/**
 * Script de teste manual da integração n8n
 */
const testN8nIntegration = async () => {
    console.log('--- TESTANDO INTEGRAÇÃO N8N ---');
    try {
        const message = "🚨 *TESTE DE INTEGRAÇÃO*\n\nEste é um teste manual do SIGES via Antigravity.\n\nStatus: INDISPONÍVEL\nSetor: Teste / Geral\nUnidade: Unidade de Teste\nReportado por: Antigravity AI\nData: " + new Date().toLocaleString('pt-BR');
        
        // Usamos uma imagem de teste padrão (ex: placeholder) para validar o imgUrl
        const testImgUrl = "https://placehold.co/600x400/000000/FFFFFF.png?text=SIGES+TESTE"; 

        console.log('Enviando payload para:', import.meta.env.VITE_API_N8N_WEBHOOK);
        const result = await apiN8nService.sendWhatsAppMessage(message, testImgUrl);
        console.log('Resposta do n8n:', result);
        console.log('--- TESTE CONCLUÍDO COM SUCESSO ---');
    } catch (err) {
        console.error('--- FALHA NO TESTE ---', err);
    }
};

// Executa o teste
testN8nIntegration();
