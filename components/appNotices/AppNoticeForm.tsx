import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../ui/Modal';
import {
  CreateSystemNoticeInput,
  System,
  SystemNotice,
  SystemNoticeCategory,
  SystemNoticeSeverity,
} from '../../types';
import { appNoticesService } from '../../services/core/appNoticesService';
import { dataService } from '../../services/dataService';
import { resolveNoticeSystemParentIds } from '../../utils/appNoticeSystemScope';

interface AppNoticeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: CreateSystemNoticeInput) => Promise<void>;
  notice?: SystemNotice | null;
  loading?: boolean;
}

export const AppNoticeForm: React.FC<AppNoticeFormProps> = ({
  isOpen,
  onClose,
  onSave,
  notice,
  loading = false,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [categoryId, setCategoryId] = useState<number>(0);
  const [severityId, setSeverityId] = useState<number>(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewStartDate, setViewStartDate] = useState('');
  const [viewEndDate, setViewEndDate] = useState('');
  const [dashboards, setDashboards] = useState<string[]>(['dashboard', 'orders', 'units']);
  const [systemParentIds, setSystemParentIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<SystemNoticeCategory[]>([]);
  const [severities, setSeverities] = useState<SystemNoticeSeverity[]>([]);
  const [systems, setSystems] = useState<System[]>([]);

  // Hidrata o formulário uma única vez por abertura/aviso. Sem isso, o
  // recarregamento assíncrono de categorias/severidades (novas referências de
  // array) reexecutava a hidratação e sobrescrevia os sistemas que o usuário
  // acabou de marcar/desmarcar.
  const hydratedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadFormOptions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      hydratedKeyRef.current = null;
      return;
    }

    const hydrationKey = notice ? `notice:${notice.id}` : 'new';
    if (hydratedKeyRef.current === hydrationKey) return;

    if (notice) {
      setTitle(notice.title);
      setMessage(notice.message);
      setCategoryId(notice.categoryId);
      setSeverityId(notice.severityId);
      setStartDate(notice.startDate.slice(0, 16));
      setEndDate(notice.endDate.slice(0, 16));
      setViewStartDate(notice.viewStartDate?.slice(0, 16) || '');
      setViewEndDate(notice.viewEndDate?.slice(0, 16) || '');
      setDashboards(notice.dashboards?.length ? notice.dashboards : ['dashboard', 'orders', 'units']);
      setSystemParentIds(resolveNoticeSystemParentIds(notice.systemParentIds));
    } else {
      resetForm();
    }

    hydratedKeyRef.current = hydrationKey;
  }, [notice, isOpen]);

  const loadFormOptions = async () => {
    const [cats, sevs, systemList] = await Promise.all([
      appNoticesService.getCategories(),
      appNoticesService.getSeverities(),
      dataService.getSystemsParent().catch((error) => {
        console.error('Error loading parent systems for notice form:', error);
        return [] as System[];
      }),
    ]);
    setCategories(cats);
    setSeverities(sevs);
    setSystems(
      [...systemList].sort((a, b) =>
        a.description.localeCompare(b.description, 'pt-BR', { sensitivity: 'base' })
      )
    );

    if (!notice && cats.length > 0 && sevs.length > 0) {
      setCategoryId((current) => (current > 0 ? current : cats[0].id));
      setSeverityId((current) => (current > 0 ? current : sevs[0].id));
    }
  };

  const resetForm = () => {
    setTitle('');
    setMessage('');
    if (categories.length > 0) setCategoryId(categories[0].id);
    if (severities.length > 0) setSeverityId(severities[0].id);
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    setStartDate(local.toISOString().slice(0, 16));
    const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const endLocal = new Date(end.getTime() - offset * 60000);
    setEndDate(endLocal.toISOString().slice(0, 16));
    setViewStartDate(local.toISOString().slice(0, 16));
    setViewEndDate(endLocal.toISOString().slice(0, 16));
    setDashboards(['dashboard', 'orders', 'units']);
    setSystemParentIds([]);
  };

  const toggleSystemParent = (systemParentId: number) => {
    setSystemParentIds((prev) =>
      prev.includes(systemParentId)
        ? prev.filter((id) => id !== systemParentId)
        : [...prev, systemParentId]
    );
  };

  const handleSave = async () => {
    if (
      !title.trim() || !message.trim() || !startDate || !endDate ||
      !viewStartDate || !viewEndDate || !categoryId || !severityId ||
      dashboards.length === 0 || systemParentIds.length === 0
    ) {
      return;
    }
    if (viewEndDate <= viewStartDate || endDate <= startDate) {
      return;
    }

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        message: message.trim(),
        categoryId,
        severityId,
        startDate: startDate.replace('T', ' ') + ':00',
        endDate: endDate.replace('T', ' ') + ':00',
        viewStartDate: viewStartDate.replace('T', ' ') + ':00',
        viewEndDate: viewEndDate.replace('T', ' ') + ':00',
        dashboards,
        systemParentIds,
      });
      onClose();
    } catch (error) {
      console.error('Error saving notice:', error);
    } finally {
      setSaving(false);
    }
  };

  const selectedCategory = categories.find(c => c.id === categoryId);
  const selectedSeverity = severities.find(s => s.id === severityId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={notice ? 'Editar Aviso' : 'Novo Aviso'}
      maxWidth="lg"
      confirmLabel={notice ? 'Salvar Alterações' : 'Criar Aviso'}
      onConfirm={handleSave}
      confirmLoading={saving}
      loading={loading || categories.length === 0}
    >
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Título *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Alerta de Chuva Forte"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Mensagem *
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Descreva o aviso..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
            maxLength={1500}
          />
          <p className="text-xs text-slate-500 mt-1">{message.length}/1500</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Categoria *
            </label>
            <div className="relative">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {selectedCategory && (
                <div
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full pointer-events-none"
                  style={{ backgroundColor: selectedCategory.color }}
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Severidade *
            </label>
            <div className="relative">
              <select
                value={severityId}
                onChange={(e) => setSeverityId(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none"
              >
                {severities.map((sev) => (
                  <option key={sev.id} value={sev.id}>
                    {sev.label}
                  </option>
                ))}
              </select>
              {selectedSeverity && (
                <div
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full pointer-events-none"
                  style={{ backgroundColor: selectedSeverity.color }}
                />
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Sistemas *
          </label>
          <div className="flex flex-wrap gap-2">
            {systems.map((system) => {
              const systemParentId = Number(system.id);
              const selected = systemParentIds.includes(systemParentId);
              return (
                <button
                  key={system.id}
                  type="button"
                  onClick={() => toggleSystemParent(systemParentId)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    selected
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary/50'
                  }`}
                >
                  {system.description}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            A MO Extra deste aviso fica restrita às unidades dos sistemas selecionados.
          </p>
          {systemParentIds.length === 0 && (
            <p className="text-xs font-semibold text-amber-600 mt-1">
              Selecione pelo menos um sistema.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Vigência Início *
            </label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Vigência Fim *
            </label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Visualização Início *
            </label>
            <input
              type="datetime-local"
              value={viewStartDate}
              onChange={(e) => setViewStartDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Visualização Fim *
            </label>
            <input
              type="datetime-local"
              value={viewEndDate}
              onChange={(e) => setViewEndDate(e.target.value)}
              min={viewStartDate}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Seção "Painéis de exibição" desativada: o filtro por painel não é aplicado
            hoje porque App.tsx passa dashboard={undefined} para o Layout (AppNoticeTicker).
            O campo `dashboards` continua sendo salvo com o padrão ['dashboard','orders','units'].
            Para reativar: restaurar a UI + DASHBOARD_OPTIONS e passar a chave real do painel
            em App.tsx (<Layout dashboard={...} />). */}
      </div>
    </Modal>
  );
};
