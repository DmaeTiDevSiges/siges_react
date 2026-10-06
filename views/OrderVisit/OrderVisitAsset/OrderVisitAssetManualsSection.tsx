import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { dataService } from '../../../services/dataService';
import { technicalManualsService } from '../../../services/assets/technicalManualsService';
import { getPublicImageUrl } from '../../../services/media/imageUtils';
import { Loading } from '../../../components/ui/Loading';
import { PhotoViewer } from '../../../components/ui/PhotoViewer';
import type { TechnicalManual, TechnicalManualFile } from '../../../types';

interface OrderVisitAssetManualsSectionProps {
    /** ID do ativo (assets.id) — a seção mostra os manuais vinculados a ele */
    assetId: string;
    /** ID do ativo na visita (ov_asset_id) — usado para filtrar arquivos relevantes (futuro) */
    assetCode?: string;
    /** Callback para abrir o assistente do ativo com uma pergunta (chips) */
    onAskAssistant?: (prompt: string) => void;
}

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

const fileExt = (fileName: string) => fileName.split('.').pop()?.toLowerCase() || '';

const getFileMeta = (file: TechnicalManualFile) => {
    const ext = fileExt(file.docFileName);
    const isImage = file.fileType === 'image' || IMAGE_EXTS.includes(ext);
    if (isImage) return { isImage, ext: ext.toUpperCase(), icon: 'image', color: 'bg-orange-500/10 text-orange-500' };
    if (ext === 'pdf' || file.fileType === 'pdf') return { isImage, ext: 'PDF', icon: 'description', color: 'bg-red-500/10 text-red-500' };
    if (['doc', 'docx'].includes(ext) || file.fileType === 'doc') return { isImage, ext: ext.toUpperCase(), icon: 'article', color: 'bg-blue-500/10 text-blue-500' };
    if (['xls', 'xlsx', 'csv'].includes(ext) || file.fileType === 'excel') return { isImage, ext: ext.toUpperCase(), icon: 'table_chart', color: 'bg-emerald-500/10 text-emerald-500' };
    return { isImage, ext: ext.toUpperCase(), icon: 'draft', color: 'bg-slate-500/10 text-slate-500' };
};

/**
 * Seção "Manuais" do relatório do ativo (visita).
 * Mostra APENAS os manuais vinculados a este ativo, com arquivos
 * agrupados por categoria e atalhos para o assistente do ativo.
 */
export const OrderVisitAssetManualsSection: React.FC<OrderVisitAssetManualsSectionProps> = ({ assetId, assetCode, onAskAssistant }) => {
    const [manuals, setManuals] = useState<(TechnicalManual & { files: TechnicalManualFile[] })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedManualId, setSelectedManualId] = useState<string | null>(null);
    const [viewerImages, setViewerImages] = useState<string[] | null>(null);
    const [viewerIndex, setViewerIndex] = useState(0);
    const loadedRef = useRef<string | null>(null);

    const load = useCallback(async () => {
        if (!assetId || loadedRef.current === assetId) return;
        loadedRef.current = assetId;
        setIsLoading(true);
        setError(null);
        try {
            const manualsData = await dataService.getManualsWithFilesForAssets([assetId]);
            setManuals(manualsData);
        } catch (err) {
            console.error('[OrderVisitAssetManualsSection] Error loading manuals:', err);
            loadedRef.current = null; // permite retry
            setError('Erro ao carregar os manuais do ativo.');
        } finally {
            setIsLoading(false);
        }
    }, [assetId]);

    useEffect(() => {
        loadedRef.current = null;
        setManuals([]);
        setSelectedManualId(null);
        load();
    }, [assetId, load]);

    const selectedManual = useMemo(
        () => manuals.find(m => m.id === selectedManualId) || null,
        [manuals, selectedManualId]
    );

    const groupedFiles = useMemo(() => {
        if (!selectedManual) return [];
        const groups = new Map<string, TechnicalManualFile[]>();
        (selectedManual.files || []).forEach(f => {
            const key = f.tmCategoryDescription || 'Geral';
            const list = groups.get(key) || [];
            list.push(f);
            groups.set(key, list);
        });
        return Array.from(groups.entries());
    }, [selectedManual]);

    const handleOpenFile = (file: TechnicalManualFile) => {
        const meta = getFileMeta(file);
        const url = getPublicImageUrl(file.docFilePath, file.docFileName);
        if (!url) return;
        if (meta.isImage) {
            const imageFiles = (selectedManual?.files || []).filter(f => getFileMeta(f).isImage);
            setViewerImages(imageFiles.map(f => getPublicImageUrl(f.docFilePath, f.docFileName) || ''));
            setViewerIndex(Math.max(0, imageFiles.findIndex(f => f.id === file.id)));
        } else {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    const manualLabel = (m: TechnicalManual & { files: TechnicalManualFile[] }) =>
        m.code ? `${m.code} - ${m.description}` : m.description;

    // ── Loading ─────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <Loading size="sm" text="Carregando manuais..." />
            </div>
        );
    }

    // ── Erro ────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="text-center py-6">
                <span className="material-symbols-outlined text-3xl text-red-300 mb-2">cloud_off</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{error}</p>
                <button
                    onClick={() => { loadedRef.current = null; load(); }}
                    className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest"
                >
                    Tentar novamente
                </button>
            </div>
        );
    }

    // ── Sem manuais (estado compacto — não polui o relatório) ──────
    if (manuals.length === 0) {
        return (
            <div className="text-center py-6 text-slate-400">
                <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-700 mb-2">menu_book</span>
                <p className="text-xs font-bold text-slate-400">Nenhum manual técnico vinculado a este ativo</p>
            </div>
        );
    }

    // ── Detalhe do manual ──────────────────────────────────────────
    if (selectedManual) {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <button
                    onClick={() => setSelectedManualId(null)}
                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-primary mb-3 transition-colors"
                >
                    <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                    Manuais do ativo
                </button>

                <div className="bg-white dark:bg-card-dark rounded-xl p-4 border border-slate-100 dark:border-white/5 mb-3">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">{selectedManual.description}</h4>
                    {selectedManual.code && (
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{selectedManual.code}</p>
                    )}
                </div>

                {groupedFiles.map(([category, files]) => (
                    <div key={category} className="mb-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 px-1">{category}</p>
                        <div className="space-y-1.5">
                            {files.map(file => {
                                const meta = getFileMeta(file);
                                return (
                                    <button
                                        key={file.id}
                                        onClick={() => handleOpenFile(file)}
                                        className="w-full flex items-center gap-3 p-3 bg-white dark:bg-card-dark rounded-xl border border-slate-100 dark:border-white/5 hover:border-primary/40 transition-colors text-left"
                                    >
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
                                            <span className="material-symbols-outlined text-[18px]">{meta.icon}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate">{file.docFileName}</p>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">{meta.ext}</p>
                                        </div>
                                        <span className="material-symbols-outlined text-slate-400">{meta.isImage ? 'visibility' : 'open_in_new'}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {(selectedManual.files || []).length > 0 && onAskAssistant && (
                    <div className="mt-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl p-3 border border-indigo-100 dark:border-indigo-800/20">
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">support_agent</span>
                            Dúvida sobre este manual?
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            <button
                                onClick={() => onAskAssistant(`Consultando o manual "${manualLabel(selectedManual)}", como soluciono problemas neste equipamento? Liste os procedimentos de troubleshooting.`)}
                                className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                            >
                                Troubleshooting
                            </button>
                            <button
                                onClick={() => onAskAssistant(`Consultando o manual "${manualLabel(selectedManual)}", quais são os procedimentos de manutenção preventiva recomendados?`)}
                                className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                            >
                                Manutenção preventiva
                            </button>
                        </div>
                    </div>
                )}

                {viewerImages && (
                    <PhotoViewer images={viewerImages} initialIndex={viewerIndex} onClose={() => setViewerImages(null)} />
                )}
            </div>
        );
    }

    // ── Lista de manuais do ativo ─────────────────────────────────
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-2">
                {manuals.map(manual => {
                    const fileCount = manual.files?.length || 0;
                    return (
                        <button
                            key={manual.id}
                            onClick={() => setSelectedManualId(manual.id)}
                            className="w-full flex items-center gap-3 p-3.5 bg-white dark:bg-card-dark rounded-xl border border-slate-100 dark:border-white/5 hover:border-primary/40 active:scale-[0.99] transition-all text-left"
                        >
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-primary text-[18px]">menu_book</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                {manual.code && (
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{manual.code}</p>
                                )}
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug truncate">{manual.description}</h4>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${fileCount > 0 ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                    {fileCount}
                                </span>
                                <span className="material-symbols-outlined text-slate-300 text-[16px]">chevron_right</span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {onAskAssistant && (
                <button
                    onClick={() => onAskAssistant(`Com base nos manuais técnicos do ativo ${assetCode || ''}, quais os procedimentos de solução de problemas e pontos de inspeção?`.trim())}
                    className="w-full mt-3 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/20 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                >
                    <span className="material-symbols-outlined text-[16px]">support_agent</span>
                    Perguntar ao assistente sobre os manuais
                </button>
            )}
        </div>
    );
};
