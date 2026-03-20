import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "./supabase";

// Inicializa a IA com a chave de API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

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

  async chat(sessionId: string, userMessage: string, userId: string) {
    try {
      // 1. Busca histórico
      const { data: history } = await supabase
        .from("ai_messages")
        .select("role, content")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      // 2. Busca Contexto (RAG)
      const contextDocs = await this.searchKnowledge(userMessage);
      const context = contextDocs.map((d: any) => d.content).join("\n---\n");

      // 3. Inicializa o modelo
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-pro",
        systemInstruction: `Você é o Siges Assistant, um assistente técnico de manutenção especializado no sistema SIGES.
        Responda em Português do Brasil de forma profissional e concisa.
        
        DIRETRIZES:
        - Use 'getOrders' sempre que o usuário perguntar sobre ordens de serviço (OS), ordens suspensas ou pendentes.
        - Se o usuário mencionar uma OS específica (ex: 8.1.2025), use a ferramenta para buscar os detalhes.
        - Quando listar ordens, informe sempre o ID (Máscara), a Descrição e o Status.
        - Se uma busca por uma OS específica não retornar nada, informe ao usuário que não encontrou essa OS no sistema.
        - Se ocorrer um erro técnico, peça desculpas e tente explicar que houve um erro na consulta ao banco.
        
        CONTEXTO TÉCNICO:
        ${context || "Nenhum manual relevante encontrado."}`,
        tools: [
          {
            functionDeclarations: [
              {
                name: "getOrders",
                description: "Consulta ordens de serviço (OS) no sistema.",
                parameters: {
                  type: "OBJECT" as any,
                  properties: {
                    orderId: { type: "STRING" as any, description: "ID ou Máscara da OS (ex: 8.1.2025)" },
                    limit: { type: "NUMBER" as any, description: "Limite de resultados" }
                  }
                }
              }
            ]
          }
        ] as any
      });

      // 4. Inicia chat
      const chatSession = model.startChat({
        history: (history || []).map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }))
      });

      let result = await chatSession.sendMessage(userMessage);
      let response = result.response;
      
      // Loop de ferramentas
      while (response.candidates?.[0]?.content?.parts?.some(p => p.functionCall)) {
        const functionCalls = response.candidates[0].content.parts.filter(p => p.functionCall);
        
        const functionResponses = await Promise.all(functionCalls.map(async (part) => {
          const call = part.functionCall!;
          const args = call.args as any;

          if (call.name === "getOrders") {
            try {
              // 1. Perfil para filtro de equipe (padrão do painel)
              const { data: userProfile } = await supabase
                .from("users")
                .select("id, team_id")
                .eq("uuid", userId)
                .maybeSingle();

              // 2. Query flexível
              let query = supabase
                .from("v_orders")
                .select("order_mask, requested_services, status_description, requested_at, parent_id");

              // Se houver um ID específico, tenta buscar pela máscara ou pela descrição
              if (args.orderId) {
                query = query.or(`order_mask.ilike.%${args.orderId}%,requested_services.ilike.%${args.orderId}%`);
              } else if (userProfile?.team_id) {
                // Filtro padrão: OSs da equipe que não são modelos (parent_id > 0)
                query = query.eq("team_id", userProfile.team_id).gt("parent_id", 0);
              } 
else {
                return { functionResponse: { name: call.name, response: { error: "Não foi possível filtrar por equipe." } } };
              }

              const { data: ordersData, error: ordersError } = await query
                .order("requested_at", { ascending: false })
                .limit(args.limit || 10);
              
              if (ordersError) {
                console.error("AI Service Error:", ordersError);
                return { functionResponse: { name: call.name, response: { error: "Erro técnico na consulta banco." } } };
              }

              return {
                functionResponse: {
                  name: call.name,
                  response: { 
                    orders: (ordersData || []).map(o => ({
                      id: o.order_mask,
                      descricao: o.requested_services,
                      status: o.status_description,
                      data: o.requested_at
                    }))
                  }
                }
              };
            } catch (e: any) {
              return { functionResponse: { name: call.name, response: { error: e.message } } };
            }
          }
          return { functionResponse: { name: call.name, response: { error: "Função não suportada." } } };
        }));

        result = await chatSession.sendMessage(functionResponses as any);
        response = result.response;
      }

      const text = response.text() || "Não consegui processar sua solicitação.";

      // 5. Salva no banco
      await supabase.from("ai_messages").insert([
        { session_id: sessionId, role: "user", content: userMessage },
        { session_id: sessionId, role: "assistant", content: text }
      ]);

      return text;
    } catch (error) {
      console.error("AI Service: Chat Error", error);
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
