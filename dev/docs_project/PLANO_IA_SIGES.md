# 🤖 Plano de Inteligência Artificial — SIGES

> **Data**: 03/07/2026
> **Versão**: 1.0
> **Contexto**: SIGES — Sistema Integrado de Gestão de Serviços (Manutenção, Ordens de Serviço, Ativos, Almoxarifado)

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Infraestrutura Existente](#2-infraestrutura-existente)
3. [Pilares Estratégicos de IA](#3-pilares-estratégicos-de-ia)
4. [Roadmap de Implementação](#4-roadmap-de-implementação)
5. [Arquitetura Técnica Proposta](#5-arquitetura-técnica-proposta)
6. [Componentes de IA Detalhados](#6-componentes-de-ia-detalhados)
7. [Integração com n8n](#7-integração-com-n8n)
8. [Métricas de Sucesso](#8-métricas-de-sucesso)
9. [Próximos Passos](#9-próximos-passos)

---

## 1. Visão Geral

### 1.1 Propósito

Evoluir o SIGES de um sistema reativo (o usuário busca informações) para um sistema **proativo e inteligente** que:
- **Antecipa** necessidades de manutenção
- **Automatiza** processos repetitivos com tomada de decisão contextual
- **Assiste** o usuário com linguagem natural em todas as telas
- **Analisa** dados históricos para gerar insights de negócio
- **Integra** fontes externas (Manus, fornecedores, IoT) em uma camada única de inteligência

### 1.2 Princípios

| Princípio | Descrição |
|-----------|-----------|
| **Privacidade First** | IA processa dados autorizados por perfil |
| **Humano no Loop** | Decisões críticas sempre revisadas por humanos |
| **Offline Resiliente** | Capacidade de operar com dados em cache quando sem conexão |
| **Modularidade** | Cada capacidade de IA é um módulo independente |
| **Evolução Contínua** | RAG e fine-tuning permitem melhoria constante |

---

## 2. Infraestrutura Existente

### 2.1 O que já está implementado ✅

```
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMA ATUAL                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🧠 AI Service (aiService.ts)                                │
│  ├── RAG com embeddings (Gemini Embedding + Supabase pgvector)│
│  ├── Chat com n8n orchestrator                               │
│  ├── CRUD de knowledge base                                  │
│  └── Gerenciamento de sessões                                │
│                                                              │
│  🎯 Gemini Service (geminiService.ts)                        │
│  └── Análise de riscos em contratos                          │
│                                                              │
│  💬 AI Chat UI                                               │
│  ├── AIAssistantBubble.tsx (botão flutuante)                 │
│  ├── AIChatWindow.tsx (janela de chat)                       │
│  └── Sessões persistentes via Supabase                       │
│                                                              │
│  🤖 n8n Workflows                                            │
│  ├── SIGES Assistant Orchestrator (Agente com Gemini)        │
│  │   └── Tools: get_clients, get_units, get_order_types,     │
│  │            get_contracts, get_priorities                  │
│  └── WhatsApp Notification (Evolution API)                   │
│                                                              │
│  📚 Admin RAG                                                │
│  └── AIKnowledgeAdmin.tsx (gestão manual da base de          │
│       conhecimento)                                          │
│                                                              │
│  🔌 Manus Integration                                        │
│  └── Importação de visitas técnicas do sistema Manus         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Tecnologias existentes

| Tecnologia | Uso |
|-----------|-----|
| **Google Gemini API** | LLM principal (chat, embeddings, análise) |
| **Supabase pgvector** | Armazenamento de embeddings para RAG |
| **n8n** | Orquestração de workflows multi-etapas |
| **Evolution API** | Disparo de mensagens WhatsApp |

---

## 3. Pilares Estratégicos de IA

```
┌────────────────────────────────────────────────────────────────┐
│                     PILARES DE IA                              │
├──────────┬──────────┬──────────┬──────────┬────────────────────┤
│          │          │          │          │                    │
│  🔮      │  💬      │  ⚡      │  📊      │  🔗               │
│ PREDITIVA│ CONVERSA │ AUTOMAÇÃO│ ANALÍTICA│ INTEGRAÇÃO        │
│          │  CIONAL  │          │          │                   │
│ Antecipar│ Assistir │ Executar │ Descobrir│ Conectar          │
│ falhas   │ usuário  │ workflows│ insights │ sistemas          │
│          │          │          │          │                   │
├──────────┼──────────┼──────────┼──────────┼────────────────────┤
│Manutenção│ Chat     │ Aprovação│ Dashboards│ API externa       │
│Preditiva │ contextual│ automática│inteligentes│ (Manus, R2)      │
│          │          │          │          │                   │
│Detecção  │ Pesquisa │ Geração  │ Detecção │ n8n como cérebro  │
│anomalias │ semântica│ relatórios│ tendências│ orquestrador      │
│          │          │          │          │                   │
│Previsão  │ FAQ      │ Classifi-│ Custo por│ Webhooks          │
│demanda   │ intelig. │ cação de │ unidade  │ inteligentes      │
│          │          │ visitas  │          │                   │
└──────────┴──────────┴──────────┴──────────┴────────────────────┘
```

---

## 4. Roadmap de Implementação

### Fase 1 — Fundação (Já implementado) ✅

| Feature | Status | Descrição |
|---------|--------|-----------|
| RAG básico | ✅ | Embeddings + busca vetorial |
| Chat assistant | ✅ | UI flutuante com sessões |
| Admin knowledge | ✅ | CRUD base de conhecimento |
| Análise contratos | ✅ | Gemini para riscos |
| Notificação WhatsApp | ✅ | n8n + Evolution API |
| Orquestrador n8n | ✅ | Agente com tools do Supabase |

### Fase 2 — Melhorias do Assistente (Semanas 1-6) 🚀

#### 2.0 Pré-requisito: Correção do Workflow n8n (SIGES Assistant Orchestrator)

O workflow `siges_assistant.workflow.ts` existe mas está **quebrado**. Esta correção é pré-requisito para qualquer evolução do assistente.

##### Diagnóstico

| Problema | Localização | Impacto |
|----------|-------------|---------|
| `active: false` | `@workflow({ active: false })` | Workflow não processa requisições |
| Parâmetros vazios | Todos os nós `= {}` | Nós não têm configuração |
| Conexões `.uses()` ausentes | Sub-nós de IA não conectados ao agente | Agente não tem acesso ao modelo, memória ou tools |
| Credenciais placeholder | `{{GOOGLE_GEMINI_CRED_ID}}`, `{{SUPABASE_CRED_ID}}` | Falha de autenticação |
| Webhook sem configuração | `ChatWebhook = {}` | Webhook não exposto |

##### Arquivo: `workflows/services_n8n_editor_2unk5k_easypanel_host_dmae_s/personal/siges_assistant.workflow.ts`

```typescript
// Correções necessárias:

// 1. Ativar o workflow
@workflow({
    name: "SIGES Assistant Orchestrator",
    active: true,  // ← mudar de false para true
    // ...
})

// 2. Configurar o Webhook
@node({
    name: "Chat Webhook",
    type: "n8n-nodes-base.webhook",
    version: 1,
    position: [0, 0]
})
ChatWebhook = {
    httpMethod: 'POST',
    path: 'siges-ai-assistant',
    options: {}
};

// 3. Configurar o AI Agent com system prompt e tools
@node({
    name: "SIGES AI Agent",
    type: "@n8n/n8n-nodes-langchain.agent",
    version: 1.6,
    position: [400, 0]
})
SigesAiAgent = {
    promptType: 'define',
    text: '={{ $json.chatInput }}',
    hasOutputParser: false,
    options: {
        systemMessage: `Você é o assistente virtual do SIGES (Sistema Integrado de Gestão de Serviços).
Você tem acesso a dados do sistema via tools do Supabase.
Responda em português brasileiro de forma clara e objetiva.
Use as tools disponíveis para buscar informações quando necessário.
Se não souber a resposta, diga que não sabe.`,
    },
};

// 4. Conectar sub-nós via .uses()
@links()
defineRouting() {
    this.ChatWebhook.out(0).to(this.SigesAiAgent.in(0));
    this.SigesAiAgent.out(0).to(this.SaveMessage.in(0));

    // CONEXÃO CRÍTICA — sub-nós de IA
    this.SigesAiAgent.uses({
        ai_languageModel: this.Gemini15Flash.output,
        ai_memory: this.SupabaseHistoryMemory.output,
        ai_tool: [
            this.GetClients.output,
            this.GetUnits.output,
            this.GetOrderTypes.output,
            this.GetOrderSubTypes.output,
            this.GetOrderObjects.output,
            this.GetContracts.output,
            this.GetPriorities.output,
        ],
    });
}

// 5. Preencher credentials com valores reais (via CLI n8nac)
// npx --yes n8nac credential list --json  →  obter IDs
// Substituir {{GOOGLE_GEMINI_CRED_ID}} e {{SUPABASE_CRED_ID}}
```

##### Procedimento de correção via CLI

```bash
# 1. Listar credenciais existentes para obter IDs reais
npx --yes n8nac credential list --json

# 2. Verificar o estado atual do workflow
npx --yes n8nac list | grep -i assistant

# 3. Aplicar as correções no arquivo .workflow.ts

# 4. Push com verificação
npx --yes n8nac push workflows/services_n8n_editor_2unk5k_easypanel_host_dmae_s/personal/siges_assistant.workflow.ts --verify

# 5. Ativar
npx --yes n8nac workflow activate X3YuuywO3VuOKZ1S

# 6. Testar
npx --yes n8nac test-plan X3YuuywO3VuOKZ1S --json
npx --yes n8nac workflow activate X3YuuywO3VuOKZ1S
npx --yes n8nac test X3YuuywO3VuOKZ1S --prod --data '{"sessionId":"test","userId":"1","message":"Olá, quais unidades estão cadastradas?"}'
```

> ⚠️ **Dependência**: Esta correção deve ser feita **antes** de qualquer outra feature da Fase 2.

---

#### 2.1 RAG Automático de Documentos (Prioridade: Alta)

**Objetivo**: Extrair automaticamente conhecimento de documentos (PDFs, manuais, regras de negócio) e alimentar a base vetorial, eliminando a necessidade de inserção manual via `AIKnowledgeAdmin`.

##### Arquitetura

```
Documento (PDF/DOCX/TXT)
       │
       ▼
  ┌─────────────────┐
  │ Upload via UI   │
  │ ou Storage R2   │
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │ Parser          │
  │ (pdf.js /       │
  │  mammoth / txt) │
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │ Intelligent     │
  │ Chunker         │
  │ (tamanho var.   │
  │  por tipo)      │
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │ Gemini Embedding│
  │ + Storage       │
  │ no pgvector     │
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │ Disponível      │
  │ para RAG        │
  └─────────────────┘
```

##### Arquivos a criar

| Arquivo | Descrição |
|---------|-----------|
| `services/aiDocumentParser.ts` | Serviço de parsing de documentos (PDF, DOCX, TXT) |
| `services/aiRagPipeline.ts` | Pipeline de chunking + embedding + inserção |
| `components/ai/AIDocumentUpload.tsx` | Componente de upload de documentos |
| `views/Settings/AIDocumentAdmin.tsx` | View de administração de documentos |
| `hooks/useRagPipeline.ts` | Hook para gerenciar o pipeline |

##### Serviço: `services/aiDocumentParser.ts`

```typescript
import { supabase } from './supabase';
import { r2Service } from './r2Service';

export type DocumentType = 'pdf' | 'docx' | 'txt' | 'manual' | 'business_rule';

export interface ParsedDocument {
  fileName: string;
  fileType: DocumentType;
  pages: { pageNumber: number; text: string }[];
  metadata: Record<string, any>;
}

export const aiDocumentParser = {
  /**
   * Extrai texto de um arquivo usando endpoint serverless ou parsing local
   */
  async parseDocument(file: File, type: DocumentType): Promise<ParsedDocument> {
    // 1. Upload do arquivo original para o R2
    const uploadResult = await r2Service.uploadFileToPath(
      file,
      `ai-knowledge/documents/${Date.now()}_${file.name}`
    );

    // 2. Extração de texto (PDF via pdf.js, DOCX via mammoth, TXT direto)
    let pages: { pageNumber: number; text: string }[] = [];
    
    if (type === 'pdf') {
      pages = await this.extractPdfText(file);
    } else if (type === 'docx') {
      pages = await this.extractDocxText(file);
    } else {
      const text = await file.text();
      pages = [{ pageNumber: 1, text }];
    }

    return {
      fileName: file.name,
      fileType: type,
      pages,
      metadata: {
        uploadedAt: new Date().toISOString(),
        originalUrl: uploadResult?.url || '',
        fileSize: file.size,
      },
    };
  },

  private async extractPdfText(file: File): Promise<{ pageNumber: number; text: string }[]> {
    // Usa pdf.js para extrair texto página por página
    const pdfjsLib = await import('pdfjs-dist');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages: { pageNumber: number; text: string }[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((item: any) => item.str).join(' ');
      pages.push({ pageNumber: i, text });
    }

    return pages;
  },

  // ... extractDocxText, extractTxtText
};
```

##### Serviço: `services/aiRagPipeline.ts`

```typescript
import { aiService } from './aiService';
import { aiDocumentParser, ParsedDocument } from './aiDocumentParser';
import { supabase } from './supabase';

export const aiRagPipeline = {
  /**
   * Processa um documento completo: chunking → embedding → storage
   */
  async processDocument(doc: ParsedDocument, sourceType: string = 'manual'): Promise<{
    chunksCount: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let chunksCount = 0;

    for (const page of doc.pages) {
      // Chunking inteligente: divide por parágrafos/seções
      const chunks = this.intelligentChunk(page.text, doc.fileType);

      for (const chunk of chunks) {
        try {
          // Gera embedding e insere no pgvector
          await aiService.addKnowledge(chunk, sourceType, {
            documentName: doc.fileName,
            pageNumber: page.pageNumber,
            fileType: doc.fileType,
            ...doc.metadata,
          });
          chunksCount++;
        } catch (error) {
          errors.push(`Erro no chunk da página ${page.pageNumber}: ${error}`);
        }
      }
    }

    return { chunksCount, errors };
  },

  /**
   * Chunking inteligente com tamanho variável por tipo de documento
   */
  intelligentChunk(text: string, type: string): string[] {
    // Manuais técnicos: chunks maiores (2000 chars)
    // Regras de negócio: chunks médios (1000 chars)
    // FAQ/geral: chunks pequenos (500 chars)
    const chunkSizes: Record<string, number> = {
      pdf: 2000,
      manual: 2000,
      business_rule: 1000,
      faq: 500,
      default: 1000,
    };

    const maxSize = chunkSizes[type] || chunkSizes.default;
    const chunks: string[] = [];
    let current = '';

    // Divide por parágrafos primeiro
    const paragraphs = text.split(/\n\s*\n/);

    for (const para of paragraphs) {
      if ((current + '\n' + para).length > maxSize && current.length > 0) {
        chunks.push(current.trim());
        current = para;
      } else {
        current += (current ? '\n' : '') + para;
      }
    }
    if (current.trim()) chunks.push(current.trim());

    return chunks;
  },
};
```

##### n8n Workflow: `RAG Auto Pipeline`

Criar novo workflow no n8n que escuta eventos de upload e processa documentos de forma assíncrona:

```typescript
// Workflow: RAG Auto Pipeline
// Trigger: Webhook (chamado pelo frontend após upload)
// Etapas:
//   1. Webhook → recebe metadata do documento
//   2. Supabase → SELECT documento pendente
//   3. HTTP Request → chama endpoint de parsing (ou executa local)
//   4. Code → chunking
//   5. Gemini Embedding → gera embeddings
//   6. Supabase INSERT → insere chunks na ai_knowledge
//   7. Webhook response → retorna resultado para o frontend
```

##### UI: `components/ai/AIDocumentUpload.tsx`

```
┌──────────────────────────────────────────┐
│  📄 Upload de Documento                   │
│                                          │
│  Tipo: [Manual Técnico ▼]                │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │                                  │    │
│  │   Arraste PDF ou clique para     │    │
│  │   selecionar                     │    │
│  │                                  │    │
│  └──────────────────────────────────┘    │
│                                          │
│  [⬆️ Enviar e Processar]                  │
│                                          │
│  ─── Documentos Processados ───          │
│  📄 manual_bombas.pdf   ✅ 45 chunks     │
│  📄 regras_contrato.docx ✅ 12 chunks    │
└──────────────────────────────────────────┘
```

##### SQL Migration: `supabase/migrations/ai_document_knowledge.sql`

```sql
-- Extensão da tabela ai_knowledge para suportar documentos
ALTER TABLE public.ai_knowledge
  ADD COLUMN IF NOT EXISTS document_name TEXT,
  ADD COLUMN IF NOT EXISTS page_number INTEGER,
  ADD COLUMN IF NOT EXISTS file_type TEXT,
  ADD COLUMN IF NOT EXISTS original_url TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Índice para busca por documento
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_document
  ON public.ai_knowledge(document_name);

-- Tabela de documentos
CREATE TABLE IF NOT EXISTS public.ai_documents (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  original_url TEXT,
  source_type TEXT DEFAULT 'manual',
  chunks_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending | processing | completed | error
  error_message TEXT,
  uploaded_by UUID REFERENCES public.users(uuid),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_ai_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_documents_updated_at
  BEFORE UPDATE ON public.ai_documents
  FOR EACH ROW EXECUTE FUNCTION update_ai_documents_updated_at();
```

##### Critérios de Aceitação

- [ ] Upload de PDF com 10+ páginas extrai todo o texto corretamente
- [ ] Chunks são armazenados no pgvector com metadata completa
- [ ] Busca RAG retorna conteúdo dos documentos processados
- [ ] Barra de progresso visível durante o processamento
- [ ] Documentos grandes (+50 páginas) processam em background

**Dependências**: Nenhuma (pode ser feito em paralelo com outros itens)
**Esforço estimado**: 5-7 dias

---

#### 2.2 Streaming de Respostas (Prioridade: Alta)

**Objetivo**: Substituir a resposta em blocos por streaming em tempo real (Server-Sent Events), melhorando significativamente a percepção de velocidade e a UX do chat.

##### Estado Atual

```typescript
// ❌ Atual: resposta chega completa (bloqueante)
const response = await aiService.chat(sessionId, userMessage, userId);
setMessages(prev => [...prev, { role: 'assistant', content: response }]);
```

##### Estado Desejado

```typescript
// ✅ Novo: resposta em streaming
const response = await aiService.chatStream(sessionId, userMessage, userId, {
  onToken: (partialText) => {
    // Atualiza UI incrementalmente
    updateLastMessage(partialText);
  },
  onComplete: (fullText) => {
    setIsLoading(false);
  },
});
```

##### Arquitetura

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  React   │  POST   │  n8n     │  POST   │  Gemini  │
│  App     │ ───────►│  Webhook │ ───────►│  API     │
│          │◄─────── │          │◄─────── │          │
│  SSE     │ stream  │  Stream  │ stream  │  Stream  │
│  parser  │  JSON   │  proxy   │  chunks  │  chunks  │
└──────────┘         └──────────┘         └──────────┘
```

##### Serviço: adicionar método `chatStream` em `services/aiService.ts`

```typescript
// NOVO método em aiService.ts
async chatStream(
  sessionId: string,
  userMessage: string,
  userId: string,
  callbacks: {
    onToken: (text: string) => void;
    onComplete: (fullText: string) => void;
    onError: (error: Error) => void;
  }
): Promise<void> {
  try {
    // 1. Busca contexto RAG
    const contextDocs = await this.searchKnowledge(userMessage);
    const context = contextDocs.map((d: any) => d.content).join('\n---\n');

    // 2. Salva mensagem do usuário
    await supabase.from('ai_messages').insert([
      { session_id: sessionId, role: 'user', content: userMessage }
    ]);

    // 3. Chama Gemini diretamente com streaming (alternativa 1: sem n8n)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { temperature: 0.3 },
    });

    const chat = model.startChat({
      history: [], // carregar histórico da sessão se existir
      systemInstruction: {
        role: 'user',
        parts: [{ text: this.buildSystemPrompt(context) }],
      },
    });

    const result = await chat.sendMessageStream(userMessage);
    let fullResponse = '';

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      callbacks.onToken(fullResponse);
    }

    // 4. Salva resposta no banco
    await supabase.from('ai_messages').insert([
      { session_id: sessionId, role: 'assistant', content: fullResponse }
    ]);

    callbacks.onComplete(fullResponse);
  } catch (error: any) {
    console.error('AI Service: Streaming Error', error);
    callbacks.onError(error);
  }
},

/**
 * Constrói o prompt do sistema com contexto RAG
 */
buildSystemPrompt(context: string): string {
  return `Você é o assistente virtual do SIGES.
Responda em português brasileiro de forma clara e objetiva.

CONTEXTO CONHECIDO:
${context || 'Nenhum contexto específico encontrado.'}

REGRAS:
- Responda apenas sobre assuntos relacionados ao SIGES
- Se não souber, diga que não sabe
- Seja objetivo e direto
- Use formatação simples (negrito para ênfase)`;
},
```

##### Componente: atualizar `components/ai/AIChatWindow.tsx`

```typescript
// ✅ NOVO: lidar com streaming no handleSend
const handleSend = async (overrideInput?: string) => {
  const messageToSend = overrideInput || input;
  if (!messageToSend.trim() || !sessionId || !currentUser) return;

  const userMessage = messageToSend.trim();
  setInput('');
  setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

  // Adiciona mensagem vazia do assistente que será preenchida via streaming
  setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
  setIsLoading(true);

  try {
    await aiService.chatStream(sessionId, userMessage, currentUser.uuid, {
      onToken: (partialText) => {
        // Atualiza a última mensagem (assistant) incrementalmente
        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              role: 'assistant',
              content: partialText,
            };
          }
          return updated;
        });
      },
      onComplete: () => setIsLoading(false),
      onError: (error) => {
        console.error('Stream error:', error);
        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              role: 'assistant',
              content: 'Desculpe, ocorreu um erro ao processar sua solicitação.',
            };
          }
          return updated;
        });
        setIsLoading(false);
      },
    });
  } catch (error) {
    setIsLoading(false);
  }
};
```

##### n8n: Workflow `SIGES Assistant Orchestrator` com suporte a streaming

O n8n atual não suporta streaming nativamente em webhooks. Duas abordagens:

| Abordagem | Prós | Contras |
|-----------|------|---------|
| **A: Sem n8n no streaming** (recomendado) | Mais simples, latência menor, controle direto do stream | Ignora o n8n para esta rota |
| **B: n8n com polling** | Mantém toda a lógica no n8n | UX pior, latência maior, complexidade extra |

**Decisão**: Usar **Abordagem A** para streaming (chamar Gemini diretamente) e manter n8n para operações que não precisam de streaming (ferramentas, análises, etc.).

##### Critérios de Aceitação

- [ ] Respostas aparecem palavra por palavra (token por token)
- [ ] Usuário vê o texto sendo construído em tempo real
- [ ] Botão de "Parar" permite cancelar a geração
- [ ] Latência para primeiro token < 2 segundos
- [ ] Fallback para modo não-streaming se houver erro

**Dependências**: Nenhuma
**Esforço estimado**: 3-4 dias

---

#### 2.3 Sugestões Contextuais por Tela (Prioridade: Alta)

**Objetivo**: Cada tela do SIGES oferece sugestões inteligentes de perguntas contextualizadas, permitindo que o usuário obtenha respostas rápidas sobre a entidade que está visualizando.

##### Arquitetura

```typescript
// services/aiSuggestionEngine.ts
// NOVO serviço de sugestões contextuais

export interface ScreenContext {
  route: string;
  entityType?: 'order' | 'asset' | 'unit' | 'contract' | 'material' | 'visit' | 'user' | 'dashboard';
  entityId?: string | number;
  entityName?: string;
  userPermissions: string[];
}

export interface Suggestion {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
  category: 'info' | 'action' | 'analysis' | 'report';
}

export const aiSuggestionEngine = {
  /**
   * Retorna sugestões com base na tela atual e entidade
   */
  async getSuggestions(context: ScreenContext): Promise<Suggestion[]> {
    const baseSuggestions = this.getBaseSuggestions(context.route);
    const entitySuggestions = context.entityType
      ? await this.getEntitySuggestions(context.entityType, context.entityId, context.entityName)
      : [];
    const permissionSuggestions = this.filterByPermissions(
      [...baseSuggestions, ...entitySuggestions],
      context.userPermissions
    );
    return permissionSuggestions.slice(0, 5); // máximo 5 sugestões
  },

  private getBaseSuggestions(route: string): Suggestion[] {
    // Sugestões fixas por rota
    const suggestions: Record<string, Suggestion[]> = {
      'asset-detail': [
        { id: 'asset_hist', label: '🔧 Histórico de manutenções', prompt: 'Qual o histórico de manutenções deste ativo?', category: 'info' },
        { id: 'asset_costs', label: '💰 Custos totais', prompt: 'Quanto já foi gasto em manutenção neste ativo?', category: 'analysis' },
        { id: 'asset_next', label: '📅 Próxima manutenção', prompt: 'Quando foi a última manutenção e quando é a próxima?', category: 'info' },
      ],
      'order-visit': [
        { id: 'visit_summary', label: '📋 Resumir visita', prompt: 'Faça um resumo desta visita técnica', category: 'report' },
        { id: 'visit_photos', label: '📸 Conferir fotos', prompt: 'Quantas fotos foram tiradas nesta visita?', category: 'info' },
        { id: 'visit_materials', label: '🧰 Materiais usados', prompt: 'Quais materiais foram utilizados nesta visita?', category: 'info' },
      ],
      'contract-detail': [
        { id: 'contract_risks', label: '⚠️ Analisar riscos', prompt: 'Analise os riscos deste contrato', category: 'analysis' },
        { id: 'contract_services', label: '🔧 Serviços mais acionados', prompt: 'Quais serviços deste contrato são mais utilizados?', category: 'analysis' },
      ],
      'unit-detail': [
        { id: 'unit_assets', label: '🏗️ Ativos da unidade', prompt: 'Liste os ativos desta unidade', category: 'info' },
        { id: 'unit_orders', label: '📋 OS desta unidade', prompt: 'Quantas ordens de serviço estão abertas para esta unidade?', category: 'info' },
      ],
      'dashboard': [
        { id: 'dash_summary', label: '📊 Resumo do dia', prompt: 'Faça um resumo das atividades de hoje', category: 'report' },
        { id: 'dash_pending', label: '⏳ Pendências', prompt: 'Quais são as principais pendências?', category: 'info' },
      ],
      'profile': [
        { id: 'profile_orders', label: '📋 Minhas OS', prompt: 'Quantas ordens de serviço estão atribuídas a mim?', category: 'info' },
      ],
    };

    return suggestions[route] || [];
  },

  private async getEntitySuggestions(
    entityType: string,
    entityId?: string | number,
    entityName?: string
  ): Promise<Suggestion[]> {
    // Sugestões dinâmicas baseadas em dados reais da entidade
    const dynamic: Suggestion[] = [];

    if (entityType === 'asset' && entityName) {
      dynamic.push({
        id: `asset_spec_${entityId}`,
        label: `ℹ️ Detalhes de ${entityName}`,
        prompt: `Me mostre as especificações técnicas do ativo ${entityName}`,
        category: 'info',
      });
    }

    // ... mais sugestões dinâmicas por tipo de entidade

    return dynamic;
  },

  private filterByPermissions(suggestions: Suggestion[], permissions: string[]): Suggestion[] {
    // Por enquanto retorna todas; futuramente filtrar por permissão
    return suggestions;
  },
};
```

##### Componente: `components/ai/AIContextualSuggestions.tsx`

```tsx
import React from 'react';
import { Suggestion } from '../../services/aiSuggestionEngine';

interface Props {
  suggestions: Suggestion[];
  onSelect: (prompt: string, label: string) => void;
  isLoading?: boolean;
}

export const AIContextualSuggestions: React.FC<Props> = ({ suggestions, onSelect, isLoading }) => {
  if (suggestions.length === 0 || isLoading) return null;

  return (
    <div className="mb-3">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2 px-1">
        Pergunte ao Assistente
      </p>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.prompt, s.label)}
            className="text-[11px] px-2.5 py-1.5 bg-slate-800/80 text-slate-300 
                       rounded-lg hover:bg-primary/20 hover:text-primary 
                       border border-slate-700/50 hover:border-primary/30 
                       transition-all duration-200 truncate max-w-[220px]"
            title={s.label}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
};
```

##### Hook: `hooks/useScreenContext.ts`

```typescript
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ScreenContext } from '../services/aiSuggestionEngine';
import { useAuth } from '../contexts/AuthContext';

export function useScreenContext(): ScreenContext {
  const location = useLocation();
  const { currentUser } = useAuth();
  const [context, setContext] = useState<ScreenContext>({
    route: '',
    userPermissions: [],
  });

  useEffect(() => {
    // Extrai rota e entidade da URL
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);

    let entityType: ScreenContext['entityType'];
    let entityId: string | undefined;

    // Mapeamento de rotas para tipos de entidade
    if (path.includes('/assets/')) entityType = 'asset';
    else if (path.includes('/units/')) entityType = 'unit';
    else if (path.includes('/contracts/')) entityType = 'contract';
    else if (path.includes('/orders/')) entityType = 'order';
    else if (path.includes('/visits/')) entityType = 'visit';
    else if (path.includes('/materials/')) entityType = 'material';
    else if (path.includes('/users/')) entityType = 'user';

    // Último segmento numérico é o ID
    for (const seg of segments.reverse()) {
      if (/^\d+$/.test(seg)) {
        entityId = seg;
        break;
      }
    }

    setContext({
      route: segments[0] || 'dashboard',
      entityType,
      entityId,
      userPermissions: currentUser?.permissions || [],
    });
  }, [location.pathname, currentUser]);

  return context;
}
```

##### Integração nas Views

Cada view que quiser sugestões contextuais adiciona:

```tsx
// Exemplo: AssetView.tsx
import { AIContextualSuggestions } from '../../components/ai/AIContextualSuggestions';
import { aiSuggestionEngine } from '../../services/aiSuggestionEngine';
import { useScreenContext } from '../../hooks/useScreenContext';

export const AssetDetails = () => {
  const screenContext = useScreenContext();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    aiSuggestionEngine.getSuggestions(screenContext).then(setSuggestions);
  }, [screenContext]);

  const handleAISuggestion = (prompt: string, label: string) => {
    // Abre o chat do assistente com o prompt preenchido
    openAssistantChat(prompt, label);
  };

  return (
    <div>
      {/* ... conteúdo da view ... */}
      
      {/* Sugestões contextuais */}
      <AIContextualSuggestions
        suggestions={suggestions}
        onSelect={handleAISuggestion}
      />
    </div>
  );
};
```

##### Views que devem receber sugestões (Fase 2)

| View | Rota | Sugestões |
|------|------|-----------|
| `AssetView.tsx` | `/assets/:id` | Histórico, custos, próxima manutenção |
| `UnitView.tsx` | `/units/:id` | Ativos da unidade, OS abertas |
| `ContractDetails.tsx` | `/contracts/:id` | Riscos, serviços mais usados |
| `OrderVisitPage.tsx` | `/visits/:id` | Resumo, fotos, materiais |
| `DashboardScreen.tsx` | `/dashboard` | Resumo do dia, pendências |
| `ProfileScreen.tsx` | `/profile` | Minhas OS, estatísticas |

##### Critérios de Aceitação

- [ ] Sugestões aparecem contextualmente em pelo menos 4 views
- [ ] Ao clicar em uma sugestão, o chat abre com o prompt preenchido
- [ ] Sugestões são filtradas por permissão do usuário
- [ ] Sugestões não aparecem se o assistente estiver desabilitado
- [ ] Máximo 5 sugestões por view para não poluir a interface

**Dependências**: Nenhuma (pode ser feito em paralelo)
**Esforço estimado**: 4-5 dias

---

#### 2.4 Memory Persistente por Usuário (Prioridade: Média)

**Objetivo**: Manter histórico de conversas entre sessões, permitindo que o usuário retome diálogos anteriores e o assistente tenha contexto de conversas passadas.

##### Estado Atual

O `aiService.createSession()` cria uma sessão, mas não há mecanismo de:
- Listar sessões anteriores do usuário
- Retomar uma sessão específica
- Excluir ou renomear sessões
- Carregar histórico na inicialização do chat

##### SQL Migration: `supabase/migrations/ai_session_management.sql`

```sql
-- Melhorias na tabela de sessões
ALTER TABLE public.ai_chat_sessions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_message TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[]; -- tags para categorizar conversas

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_ai_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_chat_sessions_updated_at
  BEFORE UPDATE ON public.ai_chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_ai_chat_sessions_updated_at();

-- Função para buscar mensagens de uma sessão ordenadas
CREATE OR REPLACE FUNCTION get_ai_session_messages(p_session_id UUID)
RETURNS TABLE(id BIGINT, role TEXT, content TEXT, created_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.role, m.content, m.created_at
  FROM public.ai_messages m
  WHERE m.session_id = p_session_id
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql;
```

##### Serviço: adicionar métodos em `services/aiService.ts`

```typescript
// NOVOS métodos em aiService.ts

/**
 * Lista sessões do usuário (mais recentes primeiro)
 */
async listSessions(userId: string, limit = 20): Promise<{
  id: string;
  title: string;
  message_count: number;
  last_message: string | null;
  updated_at: string;
}[]> {
  const { data, error } = await supabase
    .from('ai_chat_sessions')
    .select('id, title, message_count, last_message, updated_at')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
},

/**
 * Carrega histórico de mensagens de uma sessão
 */
async getSessionMessages(sessionId: string): Promise<{
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}[]> {
  const { data, error } = await supabase
    .rpc('get_ai_session_messages', { p_session_id: sessionId });

  if (error) throw error;
  return data || [];
},

/**
 * Renomeia uma sessão
 */
async renameSession(sessionId: string, newTitle: string): Promise<void> {
  const { error } = await supabase
    .from('ai_chat_sessions')
    .update({ title: newTitle })
    .eq('id', sessionId);

  if (error) throw error;
},

/**
 * Exclui (soft delete) uma sessão
 */
async deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('ai_chat_sessions')
    .update({ is_deleted: true })
    .eq('id', sessionId);

  if (error) throw error;
},

/**
 * Atualiza metadados da sessão após cada mensagem
 */
async updateSessionMetadata(sessionId: string, message: string, count: number): Promise<void> {
  const { error } = await supabase
    .from('ai_chat_sessions')
    .update({
      last_message: message.substring(0, 100),
      message_count: count,
    })
    .eq('id', sessionId);

  if (error) console.error('Error updating session metadata:', error);
},
```

##### Componente: `components/ai/AISessionList.tsx`

```
┌─────────────────────────────────────┐
│  💬 Histórico de Conversas          │
│                                     │
│  🔍 [Pesquisar conversas...       ] │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Hoje                         │    │
│  │ 📋 Consulta sobre contratos  │    │
│  │   3 mensagens · 10:32       │    │
│  ├─────────────────────────────┤    │
│  │ Ontem                        │    │
│  │ 🔧 Problema no ativo #4523  │    │
│  │   8 mensagens · 15:20       │    │
│  ├─────────────────────────────┤    │
│  │ Esta Semana                  │    │
│  │ 📊 Resumo de visitas        │    │
│  │   5 mensagens · 08/07      │    │
│  └─────────────────────────────┘    │
│                                     │
│  [↗️ Nova Conversa]                 │
└─────────────────────────────────────┘
```

##### Fluxo de inicialização do chat com memória

```typescript
// NOVO fluxo no AIChatWindow.tsx
useEffect(() => {
  if (isOpen && currentUser) {
    loadSessions();
  }
}, [isOpen, currentUser]);

const loadSessions = async () => {
  setIsLoading(true);
  try {
    const sessions = await aiService.listSessions(currentUser.uuid);
    setSessionsList(sessions);
    
    if (sessions.length > 0) {
      // Retoma a sessão mais recente
      const lastSession = sessions[0];
      setSessionId(lastSession.id);
      const messages = await aiService.getSessionMessages(lastSession.id);
      setMessages(messages.map(m => ({ role: m.role, content: m.content })));
    } else {
      // Cria nova sessão
      const session = await aiService.createSession(currentUser.uuid);
      setSessionId(session.id);
    }
  } catch (err) {
    console.error("Failed to load sessions", err);
  } finally {
    setIsLoading(false);
  }
};
```

##### Critérios de Aceitação

- [ ] Usuário pode ver lista de conversas anteriores agrupadas por data
- [ ] Ao clicar em uma conversa antiga, as mensagens são carregadas
- [ ] Usuário pode renomear conversas
- [ ] Usuário pode excluir conversas
- [ ] O título da sessão é gerado automaticamente baseado na primeira pergunta
- [ ] A sessão atualiza `last_message` e `message_count` após cada troca

**Dependências**: Nenhuma
**Esforço estimado**: 4-5 dias

---

#### 2.5 Suporte a Imagens (Visão) (Prioridade: Média)

**Objetivo**: Permitir que o usuário envie fotos para o assistente (medidores, placas de equipamentos, documentos) e receba análises visuais via Gemini Vision.

##### Arquitetura

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│  Camera  │    │  Galeria │    │  Upload  │
│  (nativa) │    │          │    │          │
└────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │
     └───────────────┼───────────────┘
                     ▼
          ┌──────────────────┐
          │  Compressão      │
          │  (max 800px,     │
          │   WebP, <500KB)  │
          └────────┬─────────┘
                   ▼
          ┌──────────────────┐
          │  Upload para R2  │
          │  (temp/ai-vision)│
          └────────┬─────────┘
                   ▼
          ┌──────────────────┐
          │  Gemini Vision   │
          │  analyze image   │
          │  + user prompt   │
          └────────┬─────────┘
                   ▼
          ┌──────────────────┐
          │  Resposta em     │
          │  streaming       │
          └──────────────────┘
```

##### Serviço: `services/aiVisionService.ts`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { r2Service } from './r2Service';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export interface VisionAnalysis {
  description: string;
  measurements?: { label: string; value: string }[];
  anomalies?: string[];
  confidence: number;
}

export const aiVisionService = {
  /**
   * Analisa uma imagem com o prompt do usuário
   */
  async analyzeImage(
    imageFile: File,
    userPrompt: string,
    onToken?: (partial: string) => void
  ): Promise<string> {
    // 1. Comprimir imagem
    const compressedBlob = await this.compressImage(imageFile);

    // 2. Upload temporário para R2 (opcional, para auditoria)
    const tempPath = `temp/ai-vision/${Date.now()}_${imageFile.name}`;
    await r2Service.uploadFileToPath(
      new File([compressedBlob], imageFile.name),
      tempPath
    );

    // 3. Converter para base64
    const base64 = await this.blobToBase64(compressedBlob);
    const mimeType = 'image/webp';

    // 4. Chamar Gemini Vision com streaming
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
    });

    const result = await model.generateContentStream([
      {
        inlineData: {
          data: base64.split(',')[1] || base64,
          mimeType,
        },
      },
      userPrompt,
    ]);

    let fullResponse = '';
    for await (const chunk of result.stream) {
      const text = chunk.text();
      fullResponse += text;
      if (onToken) onToken(fullResponse);
    }

    return fullResponse;
  },

  /**
   * Comprime imagem para no máximo 800px e <500KB
   */
  private async compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Redimensiona se maior que 800px
        if (width > 800 || height > 800) {
          const ratio = Math.min(800 / width, 800 / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Falha ao comprimir imagem'));
          },
          'image/webp',
          0.7 // qualidade 70%
        );
      };
      img.onerror = () => reject(new Error('Falha ao carregar imagem'));
      img.src = URL.createObjectURL(file);
    });
  },

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },
};
```

##### Componente: adicionar input de imagem no `AIChatWindow.tsx`

```tsx
// NOVO: Botão de anexar imagem no header do input
const [pendingImage, setPendingImage] = useState<File | null>(null);
const fileInputRef = useRef<HTMLInputElement>(null);

// NOVO: Preview da imagem selecionada
{pendingImage && (
  <div className="px-4 py-2 bg-slate-800/50 border-t border-slate-700">
    <div className="relative inline-block">
      <img
        src={URL.createObjectURL(pendingImage)}
        alt="Preview"
        className="h-20 w-20 object-cover rounded-lg border border-slate-600"
      />
      <button
        onClick={() => setPendingImage(null)}
        className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full 
                   flex items-center justify-center text-white text-xs"
      >
        ✕
      </button>
      <span className="absolute -bottom-1 -right-1 bg-slate-900 text-[9px] 
                       px-1 rounded text-slate-400 border border-slate-600">
        {pendingImage.type === 'image/jpeg' ? 'JPEG' : 'WEBP'}
      </span>
    </div>
  </div>
)}

// Botão de câmera/galeria no input
<button
  onClick={() => fileInputRef.current?.click()}
  className="p-2 text-slate-500 hover:text-primary transition-colors"
>
  <span className="material-symbols-outlined text-xl">add_a_photo</span>
</button>
<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  capture="environment"
  className="hidden"
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) setPendingImage(file);
  }}
/>

// NOVO: Handle enviar com imagem
const handleSend = async () => {
  if (pendingImage) {
    setIsLoading(true);
    const userMessage = input.trim() || 'Analise esta imagem';
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    await aiVisionService.analyzeImage(pendingImage, userMessage, (partial) => {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: partial };
        return updated;
      });
    });
    
    setPendingImage(null);
    setIsLoading(false);
    return;
  }
  // ... fluxo normal de texto
};
```

##### Casos de Uso

| Cenário | Prompt sugerido | Exemplo |
|---------|----------------|---------|
| Leitura de medidor | "Qual o valor do medidor?" | Hidrômetro, relógio de luz |
| Placa de equipamento | "Qual o número de série?" | Tag de ativo |
| Documento | "Extraia as informações principais" | Nota fiscal, contrato |
| Foto de avaria | "Descreva o dano visível" | Rachadura, vazamento |
| Local | "Este local parece seguro?" | Foto do ambiente |

##### Critérios de Aceitação

- [ ] Usuário pode tirar foto pela câmera nativa (via Capacitor)
- [ ] Usuário pode selecionar foto da galeria
- [ ] Imagem é comprimida antes do upload (max 800px, <500KB)
- [ ] Preview da imagem aparece antes do envio
- [ ] Resposta com análise visual aparece em streaming
- [ ] Suporte a múltiplas imagens em sequência

**Dependências**: 2.2 (Streaming) — reusa o mecanismo de streaming
**Esforço estimado**: 4-5 dias

---

#### 2.6 Feedback Loop (Thumbs Up/Down) (Prioridade: Média)

**Objetivo**: Coletar feedback dos usuários sobre as respostas do assistente para melhorar a qualidade, identificar falhas no RAG e permitir ajustes no prompt/system message.

##### Arquitetura

```
Resposta do Assistente
       │
       ▼
┌──────────────────┐     ┌──────────────────┐
│  👍 Thumbs Up    │────►│  Nada acontece   │
│                  │     │  (apenas log)    │
└──────────────────┘     └──────────────────┘
       │
       ▼
┌──────────────────┐     ┌──────────────────┐
│  👎 Thumbs Down  │────►│  Abre formulário │
│                  │     │  de feedback      │
└──────────────────┘     └──────────────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │  Salvar no       │
                      │  Supabase        │
                      │  (ai_feedback)   │
                      └──────────────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │  Admin pode      │
                      │  revisar         │
                      │  + ajustar RAG   │
                      └──────────────────┘
```

##### SQL Migration: `supabase/migrations/ai_feedback.sql`

```sql
-- Tabela de feedback das respostas do assistente
CREATE TABLE IF NOT EXISTS public.ai_feedback (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  message_id BIGINT REFERENCES public.ai_messages(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(uuid),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  -- 1 = péssimo, 2 = ruim, 3 = regular, 4 = bom, 5 = excelente
  feedback_type TEXT DEFAULT 'response', -- 'response' | 'rag_quality' | 'speed' | 'other'
  feedback_text TEXT,
  -- Campos para análise
  user_message TEXT,
  assistant_response TEXT,
  rag_context_used TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para análise
CREATE INDEX IF NOT EXISTS idx_ai_feedback_rating ON public.ai_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_created ON public.ai_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user ON public.ai_feedback(user_id);

-- Políticas RLS
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can insert own feedback"
  ON public.ai_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins can view all feedback"
  ON public.ai_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE uuid = auth.uid()
      AND profile_id IN (1, 2) -- Super Admin, Admin
    )
  );

CREATE POLICY "users can view own feedback"
  ON public.ai_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

##### Componente: Feedback buttons no `AIChatWindow.tsx`

```tsx
// Adicionar após cada mensagem do assistente
{messages.map((m, i) => (
  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
      m.role === 'user'
        ? 'bg-primary text-white rounded-br-none'
        : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
    }`}>
      {m.content}

      {/* Feedback buttons - apenas na última mensagem do assistente não-feedbackada */}
      {m.role === 'assistant' && i === messages.length - 1 && !isLoading && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700/50">
          <button
            onClick={() => handleFeedback(i, 'positive')}
            className="p-1 rounded hover:bg-slate-700 transition-colors
                       text-slate-500 hover:text-green-400"
            title="Resposta útil"
          >
            <span className="material-symbols-outlined text-sm">thumb_up</span>
          </button>
          <button
            onClick={() => handleFeedback(i, 'negative')}
            className="p-1 rounded hover:bg-slate-700 transition-colors
                       text-slate-500 hover:text-red-400"
            title="Resposta não foi útil"
          >
            <span className="material-symbols-outlined text-sm">thumb_down</span>
          </button>
          <span className="text-[10px] text-slate-600">Avalie esta resposta</span>
        </div>
      )}
    </div>
  </div>
))}
```

##### Serviço: `services/aiFeedbackService.ts`

```typescript
import { supabase } from './supabase';

export interface AIFeedback {
  messageId?: number;
  sessionId: string;
  userId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  feedbackType?: string;
  feedbackText?: string;
  userMessage?: string;
  assistantResponse?: string;
  ragContextUsed?: string;
}

export const aiFeedbackService = {
  async submitFeedback(feedback: AIFeedback): Promise<void> {
    const { error } = await supabase
      .from('ai_feedback')
      .insert([{
        message_id: feedback.messageId,
        session_id: feedback.sessionId,
        user_id: feedback.userId,
        rating: feedback.rating,
        feedback_type: feedback.feedbackType || 'response',
        feedback_text: feedback.feedbackText || null,
        user_message: feedback.userMessage,
        assistant_response: feedback.assistantResponse,
        rag_context_used: feedback.ragContextUsed,
      }]);

    if (error) {
      console.error('Error saving AI feedback:', error);
      throw error;
    }
  },

  async getFeedbackStats(period: 'day' | 'week' | 'month' = 'week'): Promise<{
    total: number;
    average: number;
    positive: number;
    negative: number;
    distribution: Record<number, number>;
  }> {
    const interval = {
      day: '1 day',
      week: '7 days',
      month: '30 days',
    }[period];

    const { data, error } = await supabase
      .from('ai_feedback')
      .select('rating')
      .gte('created_at', new Date(Date.now() - {
        day: 86400000,
        week: 604800000,
        month: 2592000000,
      }[period]).toISOString());

    if (error) throw error;

    const ratings = (data || []).map(r => r.rating);
    const total = ratings.length;
    const average = total > 0 ? ratings.reduce((a, b) => a + b, 0) / total : 0;
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => { distribution[r]++; });

    return {
      total,
      average: Math.round(average * 100) / 100,
      positive: ratings.filter(r => r >= 4).length,
      negative: ratings.filter(r => r <= 2).length,
      distribution,
    };
  },
};
```

##### View: `views/Settings/AIFeedbackAdmin.tsx`

```
┌─────────────────────────────────────────────┐
│  📊 Análise de Feedback do Assistente       │
│                                             │
│  ⭐ Média: 4.2  |  👍 Positivos: 78%       │
│  👎 Negativos: 12% | 💬 Total: 342         │
│                                             │
│  ┌─── Distribuição ───────────────────────┐ │
│  │  5 ⭐: ████████████ 45%               │ │
│  │  4 ⭐: ████████ 33%                   │ │
│  │  3 ⭐: ███ 10%                        │ │
│  │  2 ⭐: ██ 7%                          │ │
│  │  1 ⭐: █ 5%                           │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  ─── Feedbacks Negativos Recentes ───       │
│  ┌──────────────────────────────────────┐   │
│  │  📅 Hoje 10:32                       │   │
│  │  👤 João Silva                       │   │
│  │  💬 "Não respondeu sobre o contrato" │   │
│  │  [🤖 Ver Conversa] [📝 Anotar]       │   │
│  ├──────────────────────────────────────┤   │
│  │  📅 Ontem 15:20                      │   │
│  │  👤 Maria Souza                      │   │
│  │  💬 "Resposta muito genérica"        │   │
│  │  [🤖 Ver Conversa] [📝 Anotar]       │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

##### Critérios de Aceitação

- [ ] Após cada resposta do assistente, aparecem os botões 👍/👎
- [ ] Ao clicar em 👍, feedback positivo é salvo automaticamente
- [ ] Ao clicar em 👎, um formulário simples permite detalhar o problema
- [ ] Admin tem view para ver estatísticas e feedbacks negativos
- [ ] Dados de feedback são usados para ajustar prompts e RAG

**Dependências**: 2.4 (Session Memory) — para associar feedback à sessão
**Esforço estimado**: 3-4 dias

---

### Mapa de Dependências da Fase 2

```
2.0 Correção n8n (pré-requisito)
  │
  ├── 2.1 RAG Automático (independente)
  │
  ├── 2.2 Streaming ───────────────────┐
  │                                   │
  ├── 2.3 Sugestões Contextuais       │
  │   (independente)                  │
  │                                   │
  ├── 2.4 Memory Persistente ─────────┤
  │                                   │
  ├── 2.5 Suporte Imagens ────────────┘
  │       (depende de 2.2 Streaming)
  │
  └── 2.6 Feedback Loop ──────────────┘
          (depende de 2.4 Memory)
```

### Ordem Recomendada de Implementação

| Ordem | Feature | Semana | Justificativa |
|-------|---------|--------|---------------|
| 1 | **2.0** Correção n8n | S1 | Pré-requisito base |
| 2 | **2.2** Streaming | S1-S2 | Melhora UX imediatamente |
| 3 | **2.3** Sugestões Contextuais | S2-S3 | Independe de outros |
| 4 | **2.1** RAG Automático | S3-S4 | Independe de outros |
| 5 | **2.4** Memory Persistente | S4-S5 | Necessário para 2.6 |
| 6 | **2.6** Feedback Loop | S5 | Depende de 2.4 |
| 7 | **2.5** Suporte Imagens | S5-S6 | Depende de 2.2 |

### Resumo de Esforço

| Feature | Arquivos novos | Arquivos modificados | SQL migrations | Esforço |
|---------|---------------|---------------------|----------------|---------|
| 2.0 Correção n8n | 0 | 1 (workflow .ts) | 0 | 1 dia |
| 2.1 RAG Automático | 4-5 | 1-2 | 1 | 5-7 dias |
| 2.2 Streaming | 0 | 2 | 0 | 3-4 dias |
| 2.3 Sugestões Contextuais | 4 | 5-8 (views) | 0 | 4-5 dias |
| 2.4 Memory Persistente | 2 | 2 | 1 | 4-5 dias |
| 2.5 Suporte Imagens | 1 | 2 | 0 | 4-5 dias |
| 2.6 Feedback Loop | 2 | 2 | 1 | 3-4 dias |
| **Total** | ~13-14 | ~15-17 | 3 | **24-31 dias** |

### Fase 3 — IA Preditiva (Semanas 7-12) 📈

| Feature | Prioridade | Descrição |
|---------|-----------|-----------|
| **3.1** Manutenção Preditiva | Alta | Prever falhas baseado em histórico de OS/visitas |
| **3.2** Previsão de Demanda | Alta | Estimar volume de OS por período |
| **3.3** Detecção de Anomalias | Média | Alertar comportamento anômalo em ativos |
| **3.4** Classificação Inteligente de Visitas | Média | Auto-classificar visitas Manus (A/D/X) |
| **3.5** Recomendação de Estoque | Média | Sugerir compras baseado em consumo histórico |

### Fase 4 — Automação Inteligente (Semanas 13-18) 🤖

| Feature | Prioridade | Descrição |
|---------|-----------|-----------|
| **4.1** Agente de Aprovação | Alta | Análise e recomendação de aprovação de SS |
| **4.2** Geração Automática de OS | Alta | Criar OS a partir de texto livre |
| **4.3** Agendamento Inteligente | Média | Otimizar rota de visitas técnicas |
| **4.4** Resumo Automático de Visitas | Média | Gerar relatório executivo ao fechar visita |
| **4.5** Chatbot WhatsApp com IA | Média | Atendimento via WhatsApp com contexto do sistema |

### Fase 5 — Analítica Avançada (Semanas 19-24) 📊

| Feature | Prioridade | Descrição |
|---------|-----------|-----------|
| **5.1** Dashboard Inteligente | Média | Métricas com insights em linguagem natural |
| **5.2** Detecção de Fraudes/Sobrepreço | Baixa | Analisar valores de materiais vs. mercado |
| **5.3** Cluster de Ativos | Baixa | Agrupar ativos com comportamento similar |
| **5.4** Predição de SLA | Baixa | Prever tempo de conclusão de OS |

---

## 5. Arquitetura Técnica Proposta

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ARQUITETURA DE IA                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐         │
│  │  React   │   │  React   │   │  Admin   │   │  Webhooks│         │
│  │  App     │   │  Native  │   │  Web     │   │  Externos│         │
│  │ (Mobile) │   │ (Capac.) │   │ (Painel) │   │  (n8n)   │         │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘         │
│       │              │              │              │               │
│  ┌────▼──────────────▼──────────────▼──────────────▼─────┐         │
│  │                    LAYER DE APRESENTAÇÃO               │         │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────┐   │         │
│  │  │ AIAssist.  │  │ Sugestões  │  │ Dashboard      │   │         │
│  │  │ Bubble/Chat│  │ Contextuais│  │ Inteligente    │   │         │
│  │  └────────────┘  └────────────┘  └────────────────┘   │         │
│  └────────────────────────────────────────────────────────┘         │
│                              │                                      │
│  ┌──────────────────────────▼──────────────────────────────────┐    │
│  │                    LAYER DE SERVIÇOS                         │    │
│  │                                                              │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │    │
│  │  │  aiService   │  │  geminiSvc   │  │  apiN8nService   │   │    │
│  │  │  (chat,RAG)  │  │  (analytics) │  │  (orquestração)  │   │    │
│  │  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘   │    │
│  │         │                 │                    │              │    │
│  │  ┌──────▼─────────────────▼────────────────────▼─────────┐   │    │
│  │  │              AI ORCHESTRATOR LAYER                     │   │    │
│  │  │  ┌───────────┐  ┌───────────┐  ┌──────────────────┐   │   │    │
│  │  │  │ RAG       │  │ Embeddings│  │ Session Memory   │   │    │
│  │  │  │ Engine    │  │ Service   │  │ Manager          │   │    │
│  │  │  └───────────┘  └───────────┘  └──────────────────┘   │    │
│  │  │  ┌───────────┐  ┌───────────┐  ┌──────────────────┐   │    │
│  │  │  │ Tool      │  │ Prompt    │  │ Classification   │   │    │
│  │  │  │ Executor  │  │ Templates │  │ Engine           │   │    │
│  │  │  └───────────┘  └───────────┘  └──────────────────┘   │    │
│  │  └────────────────────────────────────────────────────────┘    │
│  └────────────────────────────────────────────────────────────────┘
│                              │
│  ┌──────────────────────────▼──────────────────────────────────┐    │
│  │                    LAYER DE DADOS                            │    │
│  │                                                              │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │    │
│  │  │ Supabase │  │ Supabase │  │ R2       │  │ n8n         │  │    │
│  │  │ (OLTP)   │  │ pgvector │  │ (Imagens)│  │ (Workflows) │  │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │    │
│  │                                                              │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐   │    │
│  │  │ Gemini   │  │ Gemini   │  │ Cache Local             │   │    │
│  │  │ Chat     │  │ Embedding│  │ (IndexedDB para offline) │   │    │
│  │  └──────────┘  └──────────┘  └──────────────────────────┘   │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Componentes de IA Detalhados

### 6.1 RAG Engine Aprimorado

**Estado atual**: Embeddings + busca simples por similaridade.

**Meta**: RAG multi-fonte com ranqueamento inteligente.

```
┌────────────┐    ┌────────────┐    ┌────────────┐
│  PDFs/     │    │  Business  │    │ Chat       │
│  Manuais   │    │  Rules DB  │    │ Histórico  │
│  Técnicos  │    │            │    │            │
└─────┬──────┘    └──────┬─────┘    └──────┬─────┘
      │                  │                  │
      └──────────────────┼──────────────────┘
                         ▼
              ┌─────────────────────┐
              │  Document Chunker   │
              │  (tamanho dinâmico  │
              │   por tipo)         │
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────┐
              │  Embedding Generator│
              │  (Gemini Embedding) │
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────┐
              │  Supabase pgvector  │
              │  + Metadata Filter  │
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────┐
              │  Hybrid Search      │
              │  (similaridade +    │
              │   keyword + filtro) │
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────┐
              │  Reranker (cross-   │
              │  encoder leve)      │
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────┐
              │  Context Builder    │
              │  + Prompt Template  │
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────┐
              │  Gemini Chat        │
              │  (resposta final)   │
              └─────────────────────┘
```

**Melhorias propostas**:
1. **Chunking inteligente**: Tamanho variável por tipo de documento (manuais = chunks maiores, regras de negócio = chunks menores)
2. **Hybrid search**: Combinar busca vetorial +全文索引 (TSVector no Postgres) + filtro por metadados
3. **Reranker**: Modelo leve para reordenar resultados antes do prompt
4. **Metadata enriquecida**: Tags como `unidade`, `tipo_servico`, `contrato` para filtrar contexto

### 6.2 Assistente Contextual por Tela

**Estado atual**: Chat flutuante global, sem contexto da tela atual.

**Meta**: Assistente que sabe onde o usuário está e sugere ações relevantes.

```typescript
// Estrutura proposta: aiSuggestionEngine.ts
interface ScreenContext {
  route: string;
  entityType: 'order' | 'asset' | 'unit' | 'contract' | 'material' | 'visit';
  entityId?: string;
  userPermissions: string[];
  recentActions: string[];
}

// Sugestões automáticas por tela
const SCREEN_SUGGESTIONS: Record<string, Suggestion[]> = {
  'asset-detail': [
    { label: 'Histórico de manutenções', action: 'get_maintenance_history' },
    { label: 'Previsão de próxima falha', action: 'predict_failure' },
    { label: 'Custos totais no ano', action: 'get_asset_costs' },
  ],
  'order-visit': [
    { label: 'Resumir esta visita', action: 'summarize_visit' },
    { label: 'Materiais mais usados', action: 'suggest_materials' },
    { label: 'Conferir fotos', action: 'check_photos' },
  ],
  'contract-detail': [
    { label: 'Analisar riscos', action: 'analyze_contract_risks' },
    { label: 'Serviços mais acionados', action: 'top_services' },
  ],
};
```

### 6.3 Classificação Inteligente de Imagens (Manus)

**Estado atual**: Classificação manual A/D/X nas imagens de visitas Manus.

**Meta**: Classificação automática via Gemini Vision.

```typescript
// Proposta: aiImageClassifier.ts
export const aiImageClassifier = {
  async classifyManusImage(imageUrl: string): Promise<{
    classification: 'A' | 'D' | 'X';
    confidence: number;
    reason: string;
  }> {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        `Classifique esta imagem de visita técnica em:
        A - Antes (antes do serviço)
        D - Depois (após o serviço)  
        X - Evidência geral
        Responda apenas JSON.`,
        { inlineData: { data: imageUrl, mimeType: 'image/jpeg' } }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: { /* estrutura JSON */ }
      }
    });
    return JSON.parse(response.text);
  }
};
```

### 6.4 Manutenção Preditiva

**Proposta**: Sistema de predição usando dados históricos do SIGES.

```sql
-- Feature store (view materializada para predição)
CREATE MATERIALIZED VIEW ml_features_assets AS
SELECT
  a.id AS asset_id,
  a.type_id,
  COUNT(ov.id) AS total_visits_30d,
  AVG(ov.ov_durations_hours) AS avg_visit_duration,
  MAX(ov.ov_ended_at) AS last_visit_date,
  COUNT(CASE WHEN ov.ov_processing_id = 4 THEN 1 END) AS emergency_visits_30d,
  COUNT(DISTINCT m.id) AS unique_materials_used_30d,
  CURRENT_DATE - MAX(ov.ov_ended_at)::date AS days_since_last_visit
FROM assets a
LEFT JOIN orders_visits_assets ova ON ova.asset_id = a.id
LEFT JOIN orders_visits ov ON ov.id = ova.ov_id
  AND ov.ov_ended_at >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN orders_visits_assets_materials ovam ON ovam.ova_id = ova.id
LEFT JOIN materials m ON m.id = ovam.material_id
GROUP BY a.id, a.type_id;
```

**Abordagem**: Iniciar com **regressão logística simples** (SQL + função Supabase) e evoluir para modelo ML hospedado em n8n ou serverless.

### 6.5 Agente de Aprovação Inteligente

**Estado atual**: Aprovação manual de solicitações de serviço.

**Meta**: Recomendação automática com análise de risco.

```typescript
// Fluxo proposto:
// 1. Usuário cria SS
// 2. Trigger no banco ou webhook n8n dispara análise
// 3. Agente IA avalia:
//    - Histórico do solicitante
//    - Contrato associado (tem cobertura?)
//    - Valor estimado vs. contrato
//    - Urgência (prioridade)
//    - Ativos similares (já teve problemas?)
// 4. Retorna: "Aprovar", "Rejeitar", "Revisão Manual" + justificativa
// 5. Notifica aprovador via WhatsApp
```

---

## 7. Integração com n8n

O n8n é o **orquestrador central** da IA no SIGES. A arquitetura atual com o `SIGES Assistant Orchestrator` deve ser expandida:

### 7.1 Workflows de IA Planejados

| Workflow | Trigger | Descrição | Fase |
|----------|---------|-----------|------|
| **SIGES Assistant Orchestrator** | Webhook (chat) | Agente principal do chat ✅ | F1 |
| **WhatsApp Notification** | Webhook (eventos) | Notificar usuários via WhatsApp ✅ | F1 |
| **Auto Classification Manus** | Webhook (import) | Classificar imagens A/D/X automaticamente | F2 |
| **Maintenance Predictor** | Schedule (diário) | Calcular predições de falha | F3 |
| **Approval Analyzer** | Webhook (nova SS) | Recomendar aprovação de SS | F4 |
| **Auto OS Generator** | Webhook (chat/SS) | Criar OS a partir de linguagem natural | F4 |
| **Visit Report Summarizer** | Webhook (fechar visita) | Gerar resumo executivo | F4 |
| **Data Quality Monitor** | Schedule | Monitorar qualidade dos dados | F5 |

### 7.2 Tools do Agente (Expansão)

Tools atuais que o agente n8n possui:
- `get_clients`, `get_units`, `get_order_types`, `get_order_sub_types`, `get_order_objects`, `get_contracts`, `get_priorities`

Tools planejadas:
- `search_knowledge` — Busca no RAG
- `get_asset_history` — Histórico do ativo
- `get_user_open_orders` — OS abertas do usuário
- `predict_asset_failure` — Predição de falha
- `analyze_contract` — Análise de contrato
- `get_weather` — Clima (para visitas externas)
- `recommend_materials` — Sugestão de materiais

---

## 8. Métricas de Sucesso

### 8.1 KPIs do Assistente

| Métrica | Atual | Meta (3 meses) | Meta (6 meses) |
|---------|-------|----------------|----------------|
| Taxa de resolução (FCR) | — | 40% | 60% |
| Satisfação do usuário | — | 3.5/5 | 4.5/5 |
| Sessions por usuário/mês | — | 5 | 15 |
| Precisão do RAG | — | 70% | 85% |

### 8.2 KPIs de Processos

| Métrica | Atual | Meta (6 meses) |
|---------|-------|----------------|
| Tempo de aprovação de SS | ~2h | < 15min |
| Taxa de classificação automática Manus | 0% | 80% |
| Visitas sem conferência de fotos | Alta | < 10% |
| OS geradas automaticamente | 0% | 20% |

---

## 9. Próximos Passos

### Imediatos (Fase 2 — Iniciar agora)

1. **Revisar e corrigir `siges_assistant.workflow.ts`** — O workflow existe mas não está ativo (`active: false`). As tools têm nomes com underscore mas o agente não está configurado com `tools` declaradas. A conexão `.uses()` dos sub-nós (AI) está faltando — isso precisa ser corrigido para o agente funcionar.

2. **Implementar streaming** — Melhorar `AIChatWindow.tsx` para usar streaming de resposta (SSE ou WebSocket)

3. **Criar `aiSuggestionEngine.ts`** — Serviço de sugestões contextuais por tela

4. **Adicionar feedback loop** — Thumbs up/down nas respostas do assistente

5. **RAG automático** — Pipeline para extrair conhecimento de PDFs/documentos de negócio

### Curto Prazo (Semanas 1-4)

- Ativar e configurar corretamente o workflow `SIGES Assistant Orchestrator` no n8n
- Expandir tools do agente n8n
- Implementar classificação automática de imagens Manus (Gemini Vision)
- Criar view `ml_features_assets` no Supabase
- Configurar monitoramento de qualidade dos dados

### Médio Prazo (Meses 2-3)

- Modelo de manutenção preditiva
- Agente de aprovação inteligente
- Geração automática de OS
- Dashboard inteligente com insights

---

## Apêndice A: Correções Imediatas no n8n

O workflow `SIGES Assistant Orchestrator` precisa das seguintes correções para funcionar:

1. **Ativar `active: true`** no decorator `@workflow`
2. **Configurar parâmetros dos nós** — Todos os nós estão com `= {}` vazios
3. **Adicionar `.uses()` para sub-nós de IA** — O `SigesAiAgent` precisa conectar:
   - `ai_languageModel: this.Gemini15Flash.output`
   - `ai_memory: this.SupabaseHistoryMemory.output`
   - `ai_tool: [this.GetClients.output, this.GetUnits.output, ...]`
4. **Preencher credentials** — Substituir placeholders `{{GOOGLE_GEMINI_CRED_ID}}` e `{{SUPABASE_CRED_ID}}`
5. **Configurar webhook** — Definir `httpMethod`, `path` e `options` no `ChatWebhook`

---

## Apêndice B: Estrutura de Dados Sugerida (Supabase)

```sql
-- Tabela para feedback do usuário
CREATE TABLE public.ai_feedback (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  message_id UUID REFERENCES public.ai_messages(id),
  session_id UUID REFERENCES public.ai_chat_sessions(id),
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES public.users(uuid)
);

-- Tabela para cache de análises
CREATE TABLE public.ai_predictions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  entity_type VARCHAR(50), -- 'asset', 'order', 'contract'
  entity_id BIGINT,
  prediction_type VARCHAR(50), -- 'failure_risk', 'sla_breach', 'cost_overrun'
  score DECIMAL(5,4),
  details JSONB,
  model_version VARCHAR(20),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para busca híbrida (vetorial + texto)
ALTER TABLE public.ai_knowledge ADD COLUMN search_vector TSVECTOR 
  GENERATED ALWAYS AS (to_tsvector('portuguese', content)) STORED;
CREATE INDEX idx_ai_knowledge_search ON public.ai_knowledge USING GIN(search_vector);
```

---

> **Este plano é um documento vivo. Deve ser revisado e atualizado a cada sprint com base no feedback dos usuários e nas métricas coletadas.**
