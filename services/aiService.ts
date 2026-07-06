import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "./supabase";
import { dataService } from "./dataService";
import { apiN8nService } from "./apiN8nService";

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

  async chat(sessionId: string, userMessage: string, userId: string, assetContext?: { code?: string; id?: number | string; description?: string; unit?: string }) {
    try {
      // Dispara o Webhook do n8n Orquestrador
      const endpoint = import.meta.env.VITE_API_N8N_WEBHOOK_ASSISTANT || "webhook/siges-ai-assistant";
      
      const response = await apiN8nService.triggerWebhook(endpoint, {
        sessionId,
        userId,
        message: userMessage,
        assetContext, // Contexto automático do ativo
      });

      // O n8n deve retornar no campo 'output' ou similar
      const text = response?.output || response?.text || response?.message || "O assistente está processando sua solicitação...";

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
  }
};
