import React, { useState, useEffect, useRef, useMemo } from 'react';
import { aiService } from '../../services/aiService';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { getPageHelp } from '../../services/aiPageHelpMap';
import { captureScreen, compressScreenshot, isScreenshotSupported } from '../../services/screenshotService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AssetContext {
  code?: string;
  id?: number | string;
  description?: string;
  unit?: string;
}

interface AIChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  assetContext?: AssetContext;
  initialPrompt?: string;
  currentScreen?: string;
}

const SESSION_STORAGE_KEY = 'ai_chat_session_id';

export const AIChatWindow: React.FC<AIChatWindowProps> = ({ isOpen, onClose, assetContext, initialPrompt, currentScreen }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const hasSentInitialPrompt = useRef(false);

  // Contexto da página atual
  const pageHelp = useMemo(() => getPageHelp(currentScreen || ''), [currentScreen]);

  // Screenshot
  const [isCapturing, setIsCapturing] = useState(false);
  const screenshotSupported = useMemo(() => isScreenshotSupported(), []);

  /**
   * Captura a tela, analisa com Gemini e exibe o resultado no chat.
   */
  const handleScreenshot = async () => {
    if (isCapturing || isLoading) return;

    setIsCapturing(true);
    setIsLoading(true);

    try {
      // 1. Captura a tela
      const screenshot = await captureScreen({ maxWidth: 1024, quality: 0.7 });

      // 2. Comprime (economiza tokens)
      const compressed = await compressScreenshot(screenshot.dataUrl, 1024, 0.7);

      // 3. Adiciona mensagem do usuário (foto)
      setMessages(prev => [...prev, {
        role: 'user',
        content: `📸 Analisar minha tela atual`,
      }]);

      // 4. Analisa com Gemini
      const analysis = await aiService.analyzeScreenshot(compressed, undefined);

      // 5. Adiciona resposta do assistente
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: analysis,
      }]);

      setErrorHeader(null);
    } catch (error: any) {
      console.error('Screenshot error:', error);
      const errorMsg = error.message || "Erro ao analisar screenshot";
      setErrorHeader(errorMsg);

      let chatMsg = 'Não foi possível analisar a screenshot.';
      if (errorMsg.includes('capturar a tela') || errorMsg.includes('elemento')) {
        chatMsg = 'Falha ao capturar a tela. Verifique se a página carregou completamente e tente novamente.';
      } else if (errorMsg.includes('API_KEY') || errorMsg.includes('inválida')) {
        chatMsg = 'Chave de API do Gemini inválida. Verifique se VITE_GEMINI_API_KEY está configurada corretamente.';
      } else if (errorMsg.includes('resposta vazia')) {
        chatMsg = 'O Gemini retornou uma resposta vazia. Tente novamente.';
      } else if (errorMsg.includes('Não foi possível analisar')) {
        chatMsg = errorMsg;
      } else {
        chatMsg = `Erro ao analisar screenshot: ${errorMsg}`;
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: chatMsg,
      }]);
    } finally {
      setIsCapturing(false);
      setIsLoading(false);
    }
  };

  // Inicializar sessão: reutilizar existente ou criar nova
  useEffect(() => {
    if (isOpen && !sessionId && currentUser) {
      setIsLoading(true);
      const storedSessionId = localStorage.getItem(`${SESSION_STORAGE_KEY}_${currentUser.uuid}`);

      const initSession = async () => {
        try {
          // Tenta reutilizar sessão existente
          if (storedSessionId) {
            const existingMessages = await aiService.loadMessages(storedSessionId);
            if (existingMessages.length > 0) {
              setSessionId(storedSessionId);
              setMessages(existingMessages);
              setErrorHeader(null);
              setIsLoading(false);
              return;
            }
          }

          // Busca última sessão do banco
          const existingSession = await aiService.getExistingSession(currentUser.uuid);
          if (existingSession) {
            const existingMessages = await aiService.loadMessages(existingSession.id);
            setSessionId(existingSession.id);
            localStorage.setItem(`${SESSION_STORAGE_KEY}_${currentUser.uuid}`, existingSession.id);
            if (existingMessages.length > 0) {
              setMessages(existingMessages);
            }
            setErrorHeader(null);
          } else {
            // Cria nova sessão
            const session = await aiService.createSession(currentUser.uuid);
            setSessionId(session.id);
            localStorage.setItem(`${SESSION_STORAGE_KEY}_${currentUser.uuid}`, session.id);
            setErrorHeader(null);
          }
        } catch (err) {
          console.error("Failed to initialize session", err);
          setErrorHeader("Erro ao conectar com o banco de dados. Verifique as tabelas do assistente.");
        } finally {
          setIsLoading(false);
        }
      };

      initSession();
    }
  }, [isOpen, currentUser, sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (overrideInput?: string) => {
    const messageToSend = typeof overrideInput === 'string' ? overrideInput : input;
    if (!messageToSend.trim() || !sessionId || !currentUser) {
        if (!sessionId && !isLoading && isOpen) {
            setErrorHeader("Sessão não iniciada. Verifique se as migrações SQL foram aplicadas.");
        }
        return;
    }

    const userMessage = messageToSend.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // Gera título automático na primeira mensagem
    if (messages.length === 0) {
      const autoTitle = userMessage.length > 50 ? userMessage.substring(0, 50) + '...' : userMessage;
      aiService.updateSessionTitle(sessionId, autoTitle);
    }

    try {
      const userRole = currentUser.profileId ? String(currentUser.profileId) : undefined;
      const response = await aiService.chat(sessionId, userMessage, currentUser.uuid, assetContext, currentScreen, userRole);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setErrorHeader(null);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMsg = error.message || "Erro ao processar mensagem";
      setErrorHeader(errorMsg);

      // Mensagem mais amigável dependendo do tipo de erro
      let errorMsgText = 'Desculpe, tive um erro ao processar sua solicitação.';
      if (errorMsg.includes('webhook retornou') || errorMsg.includes('resposta vazia')) {
        errorMsgText = 'O assistente está indisponível no momento. Verifique se o workflow do assistente está ativo no painel do n8n.';
      } else if (errorMsg.includes('timeout')) {
        errorMsgText = 'A solicitação demorou muito. Tente uma pergunta mais simples.';
      } else if (errorMsg.includes('Gemini')) {
        errorMsgText = 'Erro na configuração da IA. Verifique se a chave VITE_GEMINI_API_KEY está configurada.';
      }

      setMessages(prev => [...prev, { role: 'assistant', content: errorMsgText }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(null);
    hasSentInitialPrompt.current = false;
    if (currentUser) {
      localStorage.removeItem(`${SESSION_STORAGE_KEY}_${currentUser.uuid}`);
    }
  };

  // Envia prompt inicial quando o chat abre (apenas uma vez)
  useEffect(() => {
    if (isOpen && initialPrompt && sessionId && currentUser && messages.length === 0 && !hasSentInitialPrompt.current) {
      hasSentInitialPrompt.current = true;
      handleSend(initialPrompt);
    }
  }, [isOpen, initialPrompt, sessionId]);

  if (!isOpen) return null;

  // Título do header: contexto do ativo > contexto da página > genérico
  const headerTitle = assetContext?.code
    ? `Ativo ${assetContext.code}`
    : pageHelp.label !== 'SIGES'
      ? pageHelp.label
      : 'Siges Assistant';

  // Subtítulo do header
  const headerSubtitle = assetContext?.code
    ? 'Assistente do Ativo'
    : currentScreen
      ? `Assistente • ${pageHelp.label}`
      : 'Assistente SIGES';

  return (
    <div className="fixed bottom-6 left-6 w-[400px] h-[599px] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-9999 animate-in slide-in-from-left-5 duration-300" style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}>
      {/* Header */}
      <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">{pageHelp.icon}</span>
          </div>
          <div>
            <h3 className="font-bold text-white leading-tight">{headerTitle}</h3>
            <span className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              {isLoading ? 'Digitando...' : headerSubtitle}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleNewChat} className="p-2 hover:bg-slate-700 rounded-full transition-colors" title="Nova conversa">
            <span className="material-symbols-outlined text-slate-400">add_comment</span>
          </button>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>
      </div>

      {/* Error Header */}
      {errorHeader && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-red-500 text-sm">warning</span>
            <p className="text-[11px] text-red-400 font-medium leading-tight">{errorHeader}</p>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.length === 0 && (
          <div className="text-center py-10 px-6">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
               <span className="material-symbols-outlined text-3xl text-slate-500">{pageHelp.icon}</span>
            </div>
            <p className="text-slate-400 text-sm">
              {currentScreen
                ? `Como posso ajudar na página "${pageHelp.label}"?`
                : 'Como posso ajudar você hoje?'}
            </p>
            {/* Suggestions removed */}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
              m.role === 'user'
                ? 'bg-primary text-white rounded-br-none'
                : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
            }`}>
              {m.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-slate-700 flex gap-1">
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-slate-800 border-t border-slate-700">
        {/* Botão de Screenshot */}
        {screenshotSupported && (
          <div className="mb-2">
            <button
              onClick={handleScreenshot}
              disabled={isCapturing || isLoading || !sessionId}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-slate-600/50"
            >
              {isCapturing ? (
                <>
                  <span className="material-symbols-outlined text-[14px] animate-pulse">photo_camera</span>
                  Analisando sua tela...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                  Analisar esta tela
                </>
              )}
            </button>
          </div>
        )}

        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={currentScreen ? `Pergunte sobre ${pageHelp.label}...` : 'Digite sua mensagem...'}
            className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-primary transition-colors"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading || !sessionId}
            className="absolute right-2 top-1.5 p-2 text-primary disabled:text-slate-600 hover:bg-slate-700 rounded-xl transition-all"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
        <p className="text-[10px] text-slate-500 mt-2 text-center uppercase tracking-widest font-bold">
          Siges AI Beta
        </p>
      </div>
    </div>
  );
};
