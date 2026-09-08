import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "./supabase";
import { dataService } from "./dataService";
import { apiN8nService } from "./apiN8nService";
import { getPageHelp, getPageKnowledgeKeywords } from "./aiPageHelpMap";

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
if (!geminiApiKey) {
  console.error("AI Service: VITE_GEMINI_API_KEY não está configurada.");
}

// Inicializa a IA com a chave de API
const genAI = new GoogleGenerativeAI(geminiApiKey);

/**
 * AI Service for SIGES Assistant
 */
export const aiService = {
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
      const response = await model.embedContent(text);
      // Garante que o embedding tenha exatamente 768 dimensões para o Supabase
      return response.embedding.values.slice(0, 768);
    } catch (error) {
      console.error("AI Service: Error generating embedding", error);
      throw error;
    }
  },

  /**
   * Analisa uma screenshot usando Gemini Vision.
   * Identifica a tela, elementos visíveis e funcionalidade em uso.
   *
   * @param imageBase64 - Imagem em base64 (com ou sem prefixo data:image)
   * @param userQuestion - Pergunta opcional do usuário para contextualizar
   * @returns Análise descritiva da tela
   */
  async analyzeScreenshot(imageBase64: string, userQuestion?: string): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

      // Remove prefixo data:image se presente
      const pureBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const prompt = [
        "Analise esta screenshot do SIGES (Sistema Integrado de Gestão de Serviços).",
        "",
        "Identifique APENAS:",
        "- Qual tela/módulo está aberto (ex: Dashboard, OS, Visitas, Ativos, Contratos, etc.)",
        "- Resuma em 1 frase curta o que está sendo exibido.",
        "",
        "Se o usuário fez uma pergunta específica, responda com base na tela.",
        "Se NÃO há pergunta, apenas diga qual tela identificou e pergunte: 'O que gostaria de saber sobre esta tela?'",
        "",
        "Seja extremamente conciso (máximo 2-3 linhas). Responda em português brasileiro.",
        userQuestion ? `\nPergunta do usuário: "${userQuestion}"` : "",
      ].filter(Boolean).join('\n');

      const response = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: "image/png",
            data: pureBase64,
          },
        },
      ]);

      const text = response.response.text();
      if (!text) {
        throw new Error("Gemini retornou resposta vazia na análise de screenshot.");
      }

      return text;
    } catch (error: any) {
      console.error("[AI Service] Erro ao analisar screenshot:", error);
      const msg = error.message || '';
      const status = error?.status || error?.code || '';
      if (msg.includes('API_KEY') || msg.includes('api_key') || msg.includes('invalid') || status === 400) {
        throw new Error("Chave de API do Gemini inválida. Verifique VITE_GEMINI_API_KEY.");
      }
      if (msg.includes('quota') || msg.includes('Quota') || status === 429) {
        throw new Error("Cota da API Gemini excedida. Aguarde ou use outra chave.");
      }
      if (status === 404 || msg.includes('not found') || msg.includes('no longer available')) {
        throw new Error("Modelo Gemini indisponível. Atualize o nome do modelo na configuração.");
      }
      if (msg.includes('network') || msg.includes('fetch') || msg.includes('Failed to fetch')) {
        throw new Error("Erro de conexão com a API Gemini. Verifique sua internet.");
      }
      if (msg.includes("resposta vazia")) {
        throw new Error("Gemini retornou resposta vazia na análise de screenshot.");
      }
      throw new Error(`Não foi possível analisar a screenshot: ${msg || 'Erro desconhecido'}`);
    }
  },

  async searchKnowledge(query: string, matchCount = 3) {
    try {
      const embedding = await this.generateEmbedding(query);
      const { data, error } = await supabase.rpc("match_knowledge", {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: matchCount,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("AI Service: Error searching knowledge", error);
      return [];
    }
  },

  /**
   * Busca conhecimento filtrado pela tela atual.
   * Prioriza entradas da tela, depois busca geral.
   */
  async searchKnowledgeByScreen(query: string, currentScreen: string, matchCount = 5) {
    try {
      const embedding = await this.generateEmbedding(query);
      const keywords = getPageKnowledgeKeywords(currentScreen);

      // Busca 1: entradas que combinam com a query E com keywords da tela
      let screenResults: any[] = [];
      if (keywords.length > 0) {
        const { data, error } = await supabase
          .from("ai_knowledge")
          .select("id, content, metadata, source_type")
          .or(keywords.map(k => `content.ilike.%${k}%`).join(','))
          .limit(matchCount);

        if (!error && data) {
          screenResults = data.map((item: any) => ({
            ...item,
            similarity: 0.8, // boost para entradas da tela
            fromScreen: true,
          }));
        }
      }

      // Busca 2: busca semântica geral (RAG puro)
      const generalResults = await this.searchKnowledge(query, matchCount);

      // Merge: prioriza resultados da tela, depois gerais
      const seenIds = new Set(screenResults.map((r: any) => r.id));
      const merged = [
        ...screenResults,
        ...generalResults.filter((r: any) => !seenIds.has(r.id)),
      ].slice(0, matchCount);

      return merged;
    } catch (error) {
      console.warn("AI Service: Screen search failed, falling back to general search", error);
      return this.searchKnowledge(query, matchCount);
    }
  },

  async chat(
    sessionId: string,
    userMessage: string,
    userId: string,
    assetContext?: { code?: string; id?: number | string; description?: string; unit?: string },
    currentScreen?: string,
    userRole?: string
  ) {
    try {
      // 1. Busca conhecimento relevante via RAG (filtrado por tela se disponível)
      let knowledgeContext: { content: string; similarity: number; source_type: string; fromScreen?: boolean }[] = [];
      try {
        if (currentScreen) {
          knowledgeContext = await this.searchKnowledgeByScreen(userMessage, currentScreen, 5);
        } else {
          knowledgeContext = await this.searchKnowledge(userMessage, 5);
        }
      } catch (ragError) {
        console.warn("AI Service: RAG search failed, continuing without context", ragError);
      }

      // 2. Monta contexto da tela para enviar ao n8n
      const pageHelp = currentScreen ? getPageHelp(currentScreen) : null;
      const screenContext = currentScreen ? {
        currentScreen,
        screenLabel: pageHelp?.label || currentScreen,
        knowledgeKeywords: pageHelp?.knowledgeKeywords || [],
        hasScreenKnowledge: knowledgeContext.some(k => k.fromScreen),
      } : undefined;

      // 3. Dispara o Webhook do n8n Orquestrador com contexto enriquecido
      const endpoint = import.meta.env.VITE_API_N8N_WEBHOOK_ASSISTANT || "webhook/siges-ai-assistant";
      
      const response = await apiN8nService.triggerWebhook(endpoint, {
        sessionId,
        userId,
        message: userMessage,
        assetContext,
        knowledgeContext: knowledgeContext.length > 0 ? knowledgeContext : undefined,
        screenContext,
        userRole,
      });

      // Verifica se o n8n retornou uma resposta vazia ou inválida
      if (!response || typeof response !== 'object') {
        throw new Error('Servidor retornou resposta inválida. Verifique se o workflow do assistente está ativo no n8n.');
      }

      // O n8n deve retornar no campo 'output' ou similar
      const text = response?.output || response?.text || response?.message || '';

      if (!text || text.trim() === '') {
        // Se tem knowledgeContext mas resposta vazia, provavelmente o workflow não processou
        if (knowledgeContext.length > 0) {
          throw new Error('O assistente não conseguiu processar sua pergunta. Verifique se o workflow "siges-ai-assistant" está ativo no n8n.');
        }
        throw new Error('Servidor retornou resposta vazia. Verifique se a variável VITE_API_N8N_WEBHOOK_ASSISTANT está configurada no .env.local');
      }

      // 3. Salva a mensagem do usuário no banco (o n8n já salva a do assistente no meu workflow)
      await supabase.from("ai_messages").insert([
        { session_id: sessionId, role: "user", content: userMessage }
      ]);

      return text;
    } catch (error: any) {
      console.error("AI Service: Chat Error (n8n Integration)", error);
      throw error;
    }
  },

  async createSession(userId: string, title = "Nova conversa") {
    try {
      const { data, error } = await supabase
        .from("ai_chat_sessions")
        .insert({ user_id: userId, title })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("AI Service: Error creating session", error);
      throw error;
    }
  },

  async addKnowledge(content: string, type: string = 'manual', metadata: any = {}) {
    try {
      const embedding = await this.generateEmbedding(content);
      const { data, error } = await supabase
        .from("ai_knowledge")
        .insert({
          content,
          embedding,
          source_type: type,
          metadata: { ...metadata, created_at: new Date().toISOString() }
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("AI Service: Error adding knowledge", error);
      throw error;
    }
  },

  async listKnowledge() {
    try {
      const { data, error } = await supabase
        .from("ai_knowledge")
        .select("id, content, source_type, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("AI Service: Error listing knowledge", error);
      throw error;
    }
  },

  async deleteKnowledge(id: string) {
    try {
      const { error } = await supabase
        .from("ai_knowledge")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("AI Service: Error deleting knowledge", error);
      throw error;
    }
  },

  async loadMessages(sessionId: string): Promise<{ role: 'user' | 'assistant'; content: string }[]> {
    try {
      const { data, error } = await supabase
        .from("ai_messages")
        .select("role, content")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as { role: 'user' | 'assistant'; content: string }[];
    } catch (error) {
      console.error("AI Service: Error loading messages", error);
      return [];
    }
  },

  async getExistingSession(userId: string): Promise<{ id: string } | null> {
    try {
      const { data, error } = await supabase
        .from("ai_chat_sessions")
        .select("id")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("AI Service: Error getting existing session", error);
      return null;
    }
  },

  async updateSessionTitle(sessionId: string, title: string) {
    try {
      const { error } = await supabase
        .from("ai_chat_sessions")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", sessionId);
      if (error) throw error;
    } catch (error) {
      console.error("AI Service: Error updating session title", error);
    }
  }
};
