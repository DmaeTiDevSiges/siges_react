import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { aiSsCreationService, SSSuggestion } from '../../services/aiSsCreationService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface AINaturalLanguageFormProps {
  onApply: (suggestion: SSSuggestion) => void;
  disabled?: boolean;
}

export const AINaturalLanguageForm: React.FC<AINaturalLanguageFormProps> = ({
  onApply,
  disabled = false,
}) => {
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SSSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const handleAnalyze = async () => {
    const trimmed = message.trim();
    if (!trimmed || trimmed.length < 5) {
      toast.error('Digite pelo menos 5 caracteres');
      return;
    }

    setLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const result = await aiSsCreationService.suggestFromNaturalLanguage(trimmed, {
        id: currentUser?.id,
        nameShort: currentUser?.nameShort,
      });

      setSuggestion(result);

      if (result.confidence < 0.3) {
        toast.warning('Confiança baixa na interpretação. Verifique os campos preenchidos.');
      }
    } catch (err: any) {
      const msg = err?.message || 'Erro ao analisar texto';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!suggestion) return;
    onApply(suggestion);
    toast.success('Campos preenchidos pela IA');
    setMessage('');
    setSuggestion(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  const confidenceColor = (c: number) => {
    if (c >= 0.7) return 'text-green-600';
    if (c >= 0.4) return 'text-yellow-600';
    return 'text-red-500';
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800/50 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="material-symbols-outlined text-white text-xl">auto_awesome</span>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Criar com Linguagem Natural
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Descreva o problema e a IA preenche os campos
            </p>
          </div>
        </div>
        <span className="material-symbols-outlined text-slate-400 text-xl transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          expand_more
        </span>
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Input */}
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Ex: "Manutenção preventiva no ar da loja Center, urgente"'
              rows={2}
              disabled={loading || disabled}
              className="w-full px-4 py-3 pr-24 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl text-sm resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:opacity-50"
            />
            <div className="absolute right-2 bottom-2">
              <Button
                onClick={handleAnalyze}
                disabled={!message.trim() || loading || disabled}
                loading={loading}
                className="h-9 px-3 text-xs font-bold rounded-lg"
              >
                <span className="material-symbols-outlined text-[16px] mr-1">search</span>
                Analisar
              </Button>
            </div>
          </div>

          {/* Hint */}
          <p className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">
            Ctrl+Enter para analisar
          </p>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl">
              <span className="material-symbols-outlined text-red-500 text-lg">error</span>
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Suggestion Preview */}
          {suggestion && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Campos sugeridos
                </h4>
                <span className={`text-[10px] font-bold ${confidenceColor(suggestion.confidence)}`}>
                  {Math.round(suggestion.confidence * 100)}% confiança
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {suggestion.clientName && (
                  <FieldPreview icon="business" label="Cliente" value={suggestion.clientName} />
                )}
                {suggestion.unitDescription && (
                  <FieldPreview icon="location_on" label="Unidade" value={suggestion.unitDescription} />
                )}
                {suggestion.sectorDescription && (
                  <FieldPreview icon="pin_drop" label="Setor" value={suggestion.sectorDescription} />
                )}
                {suggestion.orderTypeDescription && (
                  <FieldPreview icon="construction" label="Tipo" value={suggestion.orderTypeDescription} />
                )}
                {suggestion.priorityDescription && (
                  <FieldPreview icon="priority_high" label="Prioridade" value={suggestion.priorityDescription} />
                )}
              </div>

              {suggestion.requestedServices && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Descrição</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3">
                    {suggestion.requestedServices}
                  </p>
                </div>
              )}

              <Button
                onClick={handleApply}
                className="w-full h-10 text-sm font-bold rounded-xl"
              >
                <span className="material-symbols-outlined text-[16px] mr-2">check</span>
                Usar esta sugestão
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Sub-componente para preview de campo
const FieldPreview: React.FC<{ icon: string; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
    <span className="material-symbols-outlined text-slate-400 text-[14px] mt-0.5">{icon}</span>
    <div className="min-w-0">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-xs text-slate-700 dark:text-slate-300 truncate">{value}</p>
    </div>
  </div>
);
