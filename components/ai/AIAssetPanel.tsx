/**
 * AIAssetPanel — Assistente IA para Página do Ativo
 * 
 * Painel dedicado para equipes de campo obterem dados sobre
 * últimas visitas, movimentações e manutenções de um ativo.
 * 
 * Combina sugestões contextuais + chat inline + abertura para chat completo.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { aiService } from '../../services/aiService';
import { useAuth } from '../../contexts/AuthContext';
import { fireSuggestionSelected } from '../../services/aiSuggestionEngine';

// ─── Tipos ──────────────────────────────────────────────────────────

interface AIAssetPanelProps {
  assetCode: string;
  assetId: number | string;
  assetDescription?: string;
  unitDescription?: string;
  onOpenChat?: (prompt: string) => void;
}

interface Suggestion {
  id: string;
  label: string;
  prompt: string;
  icon: string;
}

// ─── Sugestões para Field Team ──────────────────────────────────────

const getFieldTeamSuggestions = (
  assetCode: string,
  assetDescription?: string
): Suggestion[] => {
  const assetRef = assetDescription 
    ? `${assetCode} (${assetDescription})` 
    : assetCode;

  return [
    {
      id: 'last_visit',
      label: 'Última visita',
      prompt: `Quando foi a última visita técnica ao ativo ${assetRef}? O que foi feito?`,
      icon: 'history',
    },
    {
      id: 'movements',
      label: 'Movimentações',
      prompt: `O ativo ${assetRef} já foi movido entre unidades? Quais foram as movimentações?`,
      icon: 'swap_horiz',
    },
    {
      id: 'recent_maintenance',
      label: 'Manutenções recentes',
      prompt: `Quais manutenções foram feitas no ativo ${assetRef} nos últimos 30 dias?`,
      icon: 'build',
    },
    {
      id: 'current_status',
      label: 'Status atual',
      prompt: `Qual o status e localização atual do ativo ${assetRef}?`,
      icon: 'info',
    },
    {
      id: 'costs',
      label: 'Custos',
      prompt: `Quanto já foi gasto em manutenção no ativo ${assetRef}?`,
      icon: 'payments',
    },
  ];
};

// ─── Componente ─────────────────────────────────────────────────────

export const AIAssetPanel: React.FC<AIAssetPanelProps> = ({
  assetCode,
  assetId,
  assetDescription,
  unitDescription,
  onOpenChat,
}) => {
  const { currentUser } = useAuth();
  
  // Estado das sugestões
  const [suggestions] = useState<Suggestion[]>(() => 
    getFieldTeamSuggestions(assetCode, assetDescription)
  );
  
  // Estado do chat inline
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [answer, setAnswer] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Estado do input livre
  const [customInput, setCustomInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  
  const answerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Foca no input quando abre
  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  // ── Enviar mensagem ──────────────────────────────────────────────

  const sendMessage = useCallback(async (message: string) => {
    if (isAnswering || !message.trim()) return;

    setSelectedSuggestion({ id: 'custom', label: 'Pergunta', prompt: message, icon: 'chat' });
    setAnswer('');
    setError(null);
    setIsAnswering(true);
    setShowInput(false);
    setCustomInput('');

    try {
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

      const response = await aiService.chat(sid, message, currentUser?.uuid || '', {
        code: assetCode,
        id: assetId,
        description: assetDescription,
        unit: unitDescription,
      });
      setAnswer(response);
    } catch (err: any) {
      console.error('[AIAssetPanel] Error:', err);
      setError(err.message || 'Erro ao consultar assistente');
    } finally {
      setIsAnswering(false);
    }
  }, [currentUser, sessionId, isAnswering, assetCode, assetId, assetDescription, unitDescription]);

  // ── Handlers ─────────────────────────────────────────────────────

  const handleSuggestionClick = useCallback((suggestion: Suggestion) => {
    sendMessage(suggestion.prompt);
  }, [sendMessage]);

  const handleCustomSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(customInput);
  }, [customInput, sendMessage]);

  const handleOpenChat = useCallback(() => {
    const prompt = selectedSuggestion?.prompt || `Informações sobre o ativo ${assetCode}`;
    fireSuggestionSelected(prompt, 'Chat do Ativo');
    onOpenChat?.(prompt);
  }, [selectedSuggestion, assetCode, onOpenChat]);

  const handleDismiss = useCallback(() => {
    setSelectedSuggestion(null);
    setAnswer('');
    setError(null);
  }, []);

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-1 h-4 bg-primary rounded-full"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Assistente do Ativo
          </span>
        </div>
        <button
          onClick={() => setShowInput(!showInput)}
          className="text-[10px] text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[12px]">edit</span>
          Perguntar
        </button>
      </div>

      {/* Chips de Pergunta */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 hide-scrollbar">
        {suggestions.map((s) => (
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
              whitespace-nowrap
            `}
            title={s.prompt}
          >
            <span className="material-symbols-outlined text-[14px] !leading-none">
              {s.icon}
            </span>
            <span className="truncate max-w-[120px]">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Estilos para esconder a barra de rolagem */}
      <style>{`
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
          height: 0;
          width: 0;
        }
      `}</style>

      {/* Input Livre */}
      {showInput && (
        <form onSubmit={handleCustomSubmit} className="mt-2 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder={`Pergunte sobre o ativo ${assetCode}...`}
            disabled={isAnswering}
            className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isAnswering || !customInput.trim()}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[14px]">send</span>
          </button>
        </form>
      )}

      {/* Resposta Inline */}
      {(selectedSuggestion || isAnswering || error) && (
        <div
          ref={answerRef}
          className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          {/* Label */}
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

          {/* Loading */}
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

          {/* Erro */}
          {error && (
            <div className="flex items-start gap-2 text-sm text-red-500">
              <span className="material-symbols-outlined text-base mt-0.5">error_outline</span>
              <div>
                <p className="font-medium text-xs">Erro</p>
                <p className="text-xs text-red-400 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Resposta */}
          {answer && (
            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {answer}
            </div>
          )}

          {/* Ações */}
          {answer && (
            <div className="flex items-center gap-3 mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/50">
              <button
                onClick={handleDismiss}
                className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-xs">close</span>
                Dispensar
              </button>
              <button
                onClick={handleOpenChat}
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

export default AIAssetPanel;
