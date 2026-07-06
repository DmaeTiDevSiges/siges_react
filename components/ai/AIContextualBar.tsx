/**
 * AIContextualBar — Sugestões Contextuais de IA
 * 
 * Componente que exibe sugestões de perguntas inteligentes baseadas
 * na tela que o usuário está visualizando. Ao clicar, consulta o
 * assistente IA e mostra a resposta inline.
 * 
 * ✨ Exemplo prático de IA no SIGES
 * 
 * Uso:
 * ```tsx
 * <AIContextualBar context={screenContext} />
 * ```
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { aiService } from '../../services/aiService';
import { useAuth } from '../../contexts/AuthContext';
import {
  aiSuggestionEngine,
  Suggestion,
  ScreenContext,
  fireSuggestionSelected,
} from '../../services/aiSuggestionEngine';

// ─── Props ──────────────────────────────────────────────────────────

interface AIContextualBarProps {
  /** Contexto da tela atual */
  context: ScreenContext;
  /** Máximo de sugestões a exibir (default: 3) */
  maxSuggestions?: number;
  /** Callback opcional quando uma sugestão é selecionada */
  onSuggestionSelect?: (prompt: string, label: string) => void;
}

// ─── Componente ─────────────────────────────────────────────────────

export const AIContextualBar: React.FC<AIContextualBarProps> = ({
  context,
  maxSuggestions = 3,
  onSuggestionSelect,
}) => {
  const { currentUser } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  // Estado do inline answer
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [answer, setAnswer] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const answerRef = useRef<HTMLDivElement>(null);

  // ── Carregar sugestões ──────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingSuggestions(true);
      try {
        const result = await aiSuggestionEngine.getSuggestions(context, maxSuggestions);
        if (!cancelled) setSuggestions(result);
      } catch (err) {
        console.error('[AIContextualBar] Erro ao carregar sugestões:', err);
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoadingSuggestions(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [context.route, context.entityType, context.entityId, context.entityName, maxSuggestions]);

  // ── Selecionar sugestão ─────────────────────────────────────────

  const handleSuggestionClick = useCallback(async (suggestion: Suggestion) => {
    // Se já está respondendo, ignora
    if (isAnswering) return;

    setSelectedSuggestion(suggestion);
    setAnswer('');
    setError(null);
    setIsAnswering(true);

    // Notifica listeners externos (ex: abrir chat window)
    fireSuggestionSelected(suggestion.prompt, suggestion.label);
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion.prompt, suggestion.label);
    }

    try {
      // Garante que tem uma sessão
      let sid = sessionId;
      if (!sid && currentUser) {
        const session = await aiService.createSession(currentUser.uuid);
        sid = session.id;
        setSessionId(sid);
      }

      if (!sid) {
        setError('Sessão não disponível');
        setIsAnswering(false);
        return;
      }

      // Chama o assistente
      const response = await aiService.chat(sid, suggestion.prompt, currentUser?.uuid || '');
      setAnswer(response);
    } catch (err: any) {
      console.error('[AIContextualBar] Erro ao consultar IA:', err);
      setError(err.message || 'Erro ao consultar assistente');
    } finally {
      setIsAnswering(false);
    }
  }, [currentUser, sessionId, isAnswering, onSuggestionSelect]);

  // ── Render ──────────────────────────────────────────────────────

  // Se não há sugestões e não está carregando, não renderiza nada
  if (!loadingSuggestions && suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Cabeçalho */}
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <div className="w-1 h-4 bg-primary rounded-full"></div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Assistente IA • Sugestões para esta tela
        </span>
        {loadingSuggestions && (
          <div className="flex gap-0.5 ml-1">
            <span className="w-1 h-1 bg-primary rounded-full animate-bounce"></span>
            <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.15s]"></span>
            <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.3s]"></span>
          </div>
        )}
      </div>

      {/* Chips de Sugestão */}
      <div className="flex flex-wrap gap-1.5">
        {loadingSuggestions ? (
          // Skeleton loading
          <>
            <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
            <div className="h-7 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
            <div className="h-7 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
          </>
        ) : (
          suggestions.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSuggestionClick(s)}
              disabled={isAnswering}
              className={`
                group inline-flex items-center gap-1.5 
                px-3 py-1.5 rounded-lg text-xs font-medium
                border transition-all duration-200
                ${
                  isAnswering && selectedSuggestion?.id === s.id
                    ? 'bg-primary/20 border-primary/40 text-primary'
                    : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-primary/10 hover:border-primary/30 hover:text-primary'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              title={s.prompt}
            >
              <span className="material-symbols-outlined text-[14px] !leading-none">
                {s.icon}
              </span>
              <span className="truncate max-w-[160px]">{s.label}</span>
            </button>
          ))
        )}
      </div>

      {/* Resposta Inline */}
      {(selectedSuggestion || isAnswering || error) && (
        <div
          ref={answerRef}
          className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          {/* Label da sugestão selecionada */}
          {selectedSuggestion && (
            <div className="flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-xs text-primary">
                {selectedSuggestion.icon}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {selectedSuggestion.label}
              </span>
            </div>
          )}

          {/* Conteúdo */}
          {isAnswering && !answer && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.3s]"></span>
              </div>
              <span className="text-xs italic">Consultando assistente...</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-500">
              <span className="material-symbols-outlined text-base mt-0.5">error_outline</span>
              <div>
                <p className="font-medium text-xs">Erro</p>
                <p className="text-xs text-red-400 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {answer && (
            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {answer}
            </div>
          )}

          {/* Ações */}
          {answer && (
            <div className="flex items-center gap-3 mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/50">
              <button
                onClick={() => {
                  setSelectedSuggestion(null);
                  setAnswer('');
                  setError(null);
                }}
                className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-xs">close</span>
                Dispensar
              </button>
              <button
                onClick={() => {
                  fireSuggestionSelected(selectedSuggestion?.prompt || '', selectedSuggestion?.label || '');
                }}
                className="text-[11px] text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-xs">open_in_new</span>
                Abrir no chat
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIContextualBar;
