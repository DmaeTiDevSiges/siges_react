import React, { useState, useEffect, useRef } from 'react';
import { aiService } from '../../services/aiService';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIChatWindow: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !sessionId && currentUser) {
        setIsLoading(true);
        aiService.createSession(currentUser.uuid)
          .then(session => {
            setSessionId(session.id);
            setErrorHeader(null);
          })
          .catch(err => {
            console.error("Failed to create session", err);
            setErrorHeader("Erro ao conectar com o banco de dados. Verifique as tabelas do assistente.");
          })
          .finally(() => setIsLoading(false));
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

    try {
      const response = await aiService.chat(sessionId, userMessage, currentUser.uuid);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setErrorHeader(null);
    } catch (error: any) {
      console.error('Chat error:', error);
      setErrorHeader(error.message || "Erro ao processar mensagem");
      setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, tive um erro ao processar sua solicitação. Verifique se a chave de API do Gemini está configurada.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 left-6 w-[400px] h-[599px] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-9999 animate-in slide-in-from-left-5 duration-300" style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}>
      {/* Header */}
      <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">smart_toy</span>
          </div>
          <div>
            <h3 className="font-bold text-white leading-tight">Siges Assistant</h3>
            <span className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              {isLoading ? 'Digitando...' : 'Online'}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
          <span className="material-symbols-outlined text-slate-400">close</span>
        </button>
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
               <span className="material-symbols-outlined text-3xl text-slate-500">chat_bubble</span>
            </div>
            <p className="text-slate-400 text-sm">Como posso ajudar você hoje?</p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <button 
                  onClick={() => handleSend('Quais solicitações estão pendentes de aprovação?')} 
                  disabled={isLoading || !sessionId}
                  className="px-3 py-1.5 bg-slate-800 text-xs text-slate-300 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 disabled:opacity-50"
                >
                  Pendências de Aprovação
                </button>
                <button 
                  onClick={() => handleSend('Preciso criar uma nova Solicitação de Serviço (SS)')} 
                  disabled={isLoading || !sessionId}
                  className="px-3 py-1.5 bg-slate-800 text-xs text-slate-300 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 disabled:opacity-50"
                >
                  Criar Nova SS
                </button>
                <button 
                  onClick={() => handleSend('Quais ativos estão na minha empresa?')} 
                  disabled={isLoading || !sessionId}
                  className="px-3 py-1.5 bg-slate-800 text-xs text-slate-300 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 disabled:opacity-50"
                >
                  Consultar Ativos
                </button>
                <button 
                  onClick={() => handleSend('Dúvida sobre manutenção')} 
                  disabled={isLoading || !sessionId}
                  className="px-3 py-1.5 bg-slate-800 text-xs text-slate-300 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 disabled:opacity-50"
                >
                  Dúvida Técnica
                </button>
            </div>
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
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Digite sua mensagem..."
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
