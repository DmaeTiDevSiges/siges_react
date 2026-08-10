import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { aiVisitAssistantService, VisitContext, ChatMessage } from '../../services/aiVisitAssistantService';
import { Loading } from '../ui/Loading';
import type { OrderVisit, OrderVisitAssetView, OrderVisitTeam, OrderVisitVehicle, OrderVisitService } from '../../types';

interface AIVisitAssistantTabProps {
  visitId: string;
}

export const AIVisitAssistantTab: React.FC<AIVisitAssistantTabProps> = ({ visitId }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [context, setContext] = useState<VisitContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const loadContext = async () => {
      try {
        const [visit, team, assets, vehicles, services] = await Promise.all([
          dataService.getActiveOrderVisit(visitId),
          dataService.getOrderVisitTeam(visitId),
          dataService.getOrderVisitAssets(visitId),
          dataService.getOrderVisitVehicles(visitId),
          dataService.getOrderVisitServices(visitId),
        ]);
        if (visit) {
          const ctx = aiVisitAssistantService.buildContext(visit, assets, team, vehicles, services);
          setContext(ctx);
        }
      } catch (err) {
        console.error('[AIVisitAssistant] Error loading context:', err);
      } finally {
        setIsInitializing(false);
      }
    };
    loadContext();
  }, [visitId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading || !context || !currentUser) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    const updatedMessages = [...messagesRef.current, userMsg];
    messagesRef.current = updatedMessages;
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const reply = await aiVisitAssistantService.sendMessage(
        visitId, text.trim(), currentUser.uuid, context, updatedMessages
      );
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      };
      const afterReply = [...messagesRef.current, assistantMsg];
      messagesRef.current = afterReply;
      setMessages(afterReply);
    } catch {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: 'Erro ao consultar o assistente. Verifique sua conexão e tente novamente.',
        timestamp: new Date().toISOString(),
      };
      const afterError = [...messagesRef.current, errorMsg];
      messagesRef.current = afterError;
      setMessages(afterError);
    } finally {
      setIsLoading(false);
    }
  }, [context, currentUser, visitId, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const suggestions = aiVisitAssistantService.getSuggestions();

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loading />
      </div>
    );
  }

  if (!context) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">error_outline</span>
        <p className="text-sm text-slate-500">Não foi possível carregar os dados da visita.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-lg">support_agent</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Assistente da Visita</h3>
            <p className="text-[10px] text-slate-400">Tire dúvidas e saiba os próximos passos</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-primary text-3xl">support_agent</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Olá! Sou o assistente desta visita.
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Posso ajudar com o status, pendências, próximos passos e muito mais.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              {suggestions.map(s => (
                <button
                  key={s.id}
                  onClick={() => sendMessage(s.prompt)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
                    bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                    text-slate-700 dark:text-slate-300 hover:bg-primary/10 hover:border-primary/30 hover:text-primary
                    transition-all duration-200 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[14px]">{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
              msg.role === 'user'
                ? 'bg-primary text-white rounded-br-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-md border border-slate-200 dark:border-slate-700'
            }`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="material-symbols-outlined text-[12px] text-primary">support_agent</span>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Assistente</span>
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-slate-400">Consultando...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestions (after first message) */}
      {messages.length > 0 && !isLoading && (
        <div className="shrink-0 px-4 py-1.5 overflow-x-auto flex gap-1.5 border-t border-slate-100 dark:border-slate-800/50 no-scrollbar">
          {suggestions.slice(0, 3).map(s => (
            <button
              key={s.id}
              onClick={() => sendMessage(s.prompt)}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium
                bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400
                hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[10px]">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre a visita..."
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none px-4 py-2.5 text-sm rounded-xl
              bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700
              text-slate-900 dark:text-white placeholder-slate-400
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50
              disabled:opacity-50 max-h-24"
            style={{ minHeight: '42px' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="shrink-0 w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center
              hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-lg">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
