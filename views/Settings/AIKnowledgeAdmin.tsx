import React, { useState, useEffect } from 'react';
import { aiService } from '../../services/aiService';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';

export const AIKnowledgeAdmin: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [content, setContent] = useState('');
  const [sourceType, setSourceType] = useState('manual');
  const [isLoading, setIsLoading] = useState(false);
  const [knowledgeList, setKnowledgeList] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);

  const fetchKnowledge = async () => {
    setFetching(true);
    try {
      const data = await aiService.listKnowledge();
      setKnowledgeList(data);
    } catch (error) {
      toast.error("Erro ao carregar conhecimentos");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error("O conteúdo não pode estar vazio");
      return;
    }

    setIsLoading(true);
    try {
      await aiService.addKnowledge(content, sourceType);
      toast.success("Conhecimento adicionado ao RAG!");
      setContent('');
      fetchKnowledge();
    } catch (error) {
      toast.error("Falha ao salvar conhecimento");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este conhecimento?")) return;
    
    try {
      await aiService.deleteKnowledge(id);
      toast.success("Excluído com sucesso");
      fetchKnowledge();
    } catch (error) {
      toast.error("Falha ao excluir");
    }
  };

  return (
    <div className="p-4 space-y-6 pb-20 animate-in fade-in slide-in-from-right duration-300">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Admin AI (RAG)</h2>
          <p className="text-xs text-slate-500">Alimente o cérebro do assistente</p>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            Tipo de Documento
          </label>
          <select 
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
          >
            <option value="manual">Manual Técnico</option>
            <option value="business_rule">Regra de Negócio</option>
            <option value="faq">FAQ / Perguntas</option>
            <option value="safety">Segurança</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            Conteúdo (Texto)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Cole aqui o texto do manual ou regra de negócio..."
            className="w-full h-40 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm resize-none focus:ring-1 focus:ring-primary outline-none"
          />
        </div>

        <Button 
          onClick={handleSave} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Gerando Embeddings...' : 'Salvar no RAG'}
        </Button>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-white px-1">Conhecimentos Atuais</h3>
        {fetching ? (
          <div className="text-center py-10 text-slate-500">Carregando...</div>
        ) : knowledgeList.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
            Nenhum conhecimento cadastrado.
          </div>
        ) : (
          <div className="space-y-3">
            {knowledgeList.map((item) => (
              <div key={item.id} className="bg-white dark:bg-surface-dark p-3 rounded-xl border border-slate-200 dark:border-slate-800 group relative">
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] uppercase font-bold rounded">
                    {item.source_type}
                  </span>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                  {item.content}
                </p>
                <div className="mt-2 text-[10px] text-slate-400">
                  {new Date(item.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
