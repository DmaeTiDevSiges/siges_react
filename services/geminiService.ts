
import { GoogleGenAI, Type } from "@google/genai";
import { Contract } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeContractRisk = async (contract: Contract) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise o seguinte resumo de contrato e forneça 3 insights estratégicos ou riscos em português:
      Empresa: ${contract.clientCompanyName || 'N/A'}
      Descrição: ${contract.description}
      Início: ${contract.dateStart}
      Fim: ${contract.dateEnd}
      Status: ${contract.statusId === 1 ? 'Ativo' : contract.statusId === 2 ? 'Inativo' : 'Pendente'}
      Valor Total: R$ ${contract.totalValue}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              insight: { type: Type.STRING, description: "O insight ou risco identificado" },
              severity: { type: Type.STRING, enum: ["low", "medium", "high"], description: "Gravidade do risco" }
            },
            required: ["insight", "severity"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
};
