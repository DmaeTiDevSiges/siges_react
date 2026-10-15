import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { compressForUpload } from '../media/imageCompressionService';
import {
    FuelReceiptExtraction,
    extractFuelReceiptJson,
    normalizeFuelReceiptExtraction
} from './fuelReceiptParser';

export {
    extractFuelReceiptJson,
    normalizeFuelReceiptExtraction,
    normalizeReceiptPlate,
    parseReceiptDate,
    parseReceiptNumber
} from './fuelReceiptParser';
export type { FuelReceiptExtraction } from './fuelReceiptParser';

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
if (!geminiApiKey) {
    console.error('Fuel Receipt Service: VITE_GEMINI_API_KEY não está configurada.');
}

const genAI = new GoogleGenerativeAI(geminiApiKey);

const MODEL = 'gemini-flash-latest';

const RESPONSE_SCHEMA = {
    type: SchemaType.OBJECT,
    properties: {
        plate: {
            type: SchemaType.STRING,
            description: 'Placa do veículo impressa no comprovante (ex: ABC1D23 ou ABC-1234). null se não houver.'
        },
        date: {
            type: SchemaType.STRING,
            description: 'Data do abastecimento em formato ISO YYYY-MM-DD. null se não houver.'
        },
        odometer: {
            type: SchemaType.NUMBER,
            description: 'Leitura do odômetro/hodômetro em Km, apenas se estiver impressa no comprovante. null se não houver.'
        },
        fuelQuantity: {
            type: SchemaType.NUMBER,
            description: 'Quantidade de combustível em litros. null se não identificada com certeza.'
        },
        totalValue: {
            type: SchemaType.NUMBER,
            description: 'Valor total pago em reais. null se não identificado com certeza.'
        },
        station: {
            type: SchemaType.STRING,
            description: 'Nome do posto/estabelecimento, se identificável. null caso contrário.'
        }
    },
    required: ['plate', 'date', 'odometer', 'fuelQuantity', 'totalValue', 'station']
};

const PROMPT = [
    'Você lê COMPROVANTES de abastecimento de veículos (cupom fiscal, comprovante de cartão,',
    'cartão de frota/conta corrente, recibo eletrônico) em português do Brasil.',
    '',
    'IMPORTANTE — o layout varia muito entre estabelecimentos (postos, bandeiras,',
    'impressoras e formatos diferentes). Os campos NÃO estão sempre nas mesmas posições.',
    'Localize cada campo pela SEMÂNTICA e pelo RÓTULO próximo (ex: "TOTAL A PAGAR",',
    '"VALOR TOTAL", "R$ TOTAL", "LITROS", "QTD", "VOLUME", "KM", "ODÔMETRO",',
    '"PLACA", "VEÍCULO", "DATA/HORA", "EMISSÃO"), nunca pela posição na página.',
    '',
    'Regras:',
    '- Retorne somente o JSON, sem texto adicional.',
    '- Use ponto como separador decimal nos números (ex: 250.5), sem símbolo de moeda.',
    '- "fuelQuantity": volume em LITROS (não o preço por litro).',
    '- "totalValue": valor TOTAL pago (não o preço por litro).',
    '- "odometer": só se o KM estiver explicitamente impresso; caso contrário null.',
    '- "date": data do abastecimento em YYYY-MM-DD; se houver só hora de hoje, use a data de hoje.',
    '- "plate": normalize para letras maiúsculas e dígitos (ex: ABC1D23).',
    '- Se um campo NÃO estiver no comprovante ou a leitura for incerta, retorne null.',
    '- NUNCA invente ou estime valores.',
    '- Se a imagem não for um comprovante de abastecimento, retorne todos os campos null.'
].join('\n');

const toBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const result = String(reader.result || '');
        resolve(result.replace(/^data:image\/\w+;base64,/, ''));
    };
    reader.onerror = () => reject(new Error('Falha ao ler a imagem do comprovante.'));
    reader.readAsDataURL(blob);
});

const mapGeminiError = (error: any): Error => {
    const msg = String(error?.message || '');
    const status = error?.status || error?.code || '';
    if (msg.includes('API_KEY') || msg.includes('api_key') || status === 400) {
        return new Error('Chave de API do Gemini inválida. Verifique VITE_GEMINI_API_KEY.');
    }
    if (msg.includes('quota') || msg.includes('Quota') || status === 429) {
        return new Error('Cota da API Gemini excedida. Aguarde ou preencha o formulário manualmente.');
    }
    if (status === 404 || msg.includes('not found') || msg.includes('no longer available')) {
        return new Error('Modelo Gemini indisponível. Preencha o formulário manualmente.');
    }
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('Failed to fetch')) {
        return new Error('Erro de conexão com a API Gemini. Verifique sua internet.');
    }
    return new Error('Não foi possível ler o comprovante. Preencha os dados manualmente.');
};

export const fuelReceiptService = {
    /**
     * Lê um comprovante de abastecimento (imagem) com Gemini Vision e extrai
     * placa, data, odômetro, litros e valor total. Tolerante a layout: cada
     * campo é localizado por semântica/rótulo, nunca por posição. Campos não
     * identificados com certeza voltam `null` — a UI deixa o preenchimento manual.
     */
    async extractFuelReceipt(file: File | Blob): Promise<FuelReceiptExtraction> {
        if (!geminiApiKey) {
            throw new Error('Leitura por IA não configurada (VITE_GEMINI_API_KEY ausente). Preencha manualmente.');
        }

        let base64: string;
        let mimeType = 'image/jpeg';
        try {
            const compressed = await compressForUpload(file, {
                maxDimension: 1600,
                quality: 0.8,
                format: 'jpeg'
            });
            if (compressed.type) mimeType = compressed.type;
            base64 = await toBase64(compressed);
        } catch (error) {
            console.error('[Fuel Receipt Service] Erro ao preparar a imagem:', error);
            throw new Error('Não foi possível processar a foto do comprovante.');
        }

        let text: string;
        try {
            const model = genAI.getGenerativeModel({ model: MODEL });
            const response = await model.generateContent({
                contents: [{
                    role: 'user',
                    parts: [
                        { text: PROMPT },
                        { inlineData: { mimeType, data: base64 } }
                    ]
                }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    responseSchema: RESPONSE_SCHEMA as any,
                    temperature: 0
                }
            });
            text = response.response.text();
        } catch (error: any) {
            console.error('[Fuel Receipt Service] Erro ao ler comprovante:', error);
            throw mapGeminiError(error);
        }

        return normalizeFuelReceiptExtraction(extractFuelReceiptJson(text));
    }
};
