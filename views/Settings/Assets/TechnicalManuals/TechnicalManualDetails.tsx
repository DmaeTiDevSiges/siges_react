import React, { useState, useEffect, useRef } from 'react';
import { TechnicalManual, TechnicalManualFile, TechnicalManualAsset, TechnicalManualCategory } from '../../../../types';
import { dataService } from '../../../../services/dataService';
import { getPublicImageUrl } from '../../../../services/media/imageUtils';
import { OptimizedImage } from '../../../../components/ui/OptimizedImage';
import { Button } from '../../../../components/ui/Button';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { Select } from '../../../../components/ui/Select';
import { Loading } from '../../../../components/ui/Loading';
import { Modal } from '../../../../components/ui/Modal';
import { TabsBar } from '../../../../components/ui/TabsBar';
import { toast } from 'sonner';
import { usePermissions } from '../../../../contexts/PermissionsContext';
import { manualRagService, IndexResult, isGeminiConfigured } from '../../../../services/ai/manualRagService';

interface TechnicalManualDetailsProps {
    manual: TechnicalManual;
    onEdit: () => void;
    onDelete: () => void;
    onSelectAsset?: (assetId: string) => void;
}

export const TechnicalManualDetails: React.FC<TechnicalManualDetailsProps> = ({
    manual,
    onEdit,
    onDelete,
    onSelectAsset
}) => {
    const { canEdit, canDelete } = usePermissions();
    const canEditManual = canEdit('technicals_manuals_create_edit_delete');
    const canDeleteManual = canDelete('technicals_manuals_create_edit_delete');
    const [activeTab, setActiveTab] = useState<'files' | 'assets'>('files');
    const [files, setFiles] = useState<TechnicalManualFile[]>([]);
    const [assets, setAssets] = useState<TechnicalManualAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showAssociateModal, setShowAssociateModal] = useState(false);
    const [searchAssets, setSearchAssets] = useState('');
    const [availableAssets, setAvailableAssets] = useState<{ id: string; code: string; description: string; tagDescription?: string; tagSubDescription?: string; statusDescription?: string }[]>([]);
    const [loadingAssets, setLoadingAssets] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<string | null>(null);
    const [assetToDissociate, setAssetToDissociate] = useState<string | null>(null);
    const [dissociatingAssetId, setDissociatingAssetId] = useState<string | null>(null);
    const [filterClientId, setFilterClientId] = useState('');
    const [filterUnitId, setFilterUnitId] = useState('');
    const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
    const [units, setUnits] = useState<{ id: string; description: string }[]>([]);
    const [loadingClients, setLoadingClients] = useState(false);
    const [loadingUnits, setLoadingUnits] = useState(false);
    const [associatingAssetId, setAssociatingAssetId] = useState<string | null>(null);
    const [showMenuActions, setShowMenuActions] = useState(false);
    const [ragStatus, setRagStatus] = useState<Record<string, { chunks: number; indexing?: boolean }>>({});
    const [bulkIndexing, setBulkIndexing] = useState<{ total: number; done: number; current?: string; errors: number; skipped: number; cancelled: boolean } | null>(null);
    const bulkCancelRef = useRef(false);
    const geminiConfigured = isGeminiConfigured();
    const [categories, setCategories] = useState<TechnicalManualCategory[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const menuActionsRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [filesData, assetsData] = await Promise.all([
                dataService.getTechnicalManualFiles(manual.id),
                dataService.getAssociatedAssets(manual.id)
            ]);
            setFiles(filesData);
            setAssets(assetsData);

            // Status RAG por arquivo (chunks já indexados)
            const statuses: Record<string, { chunks: number }> = {};
            await Promise.all(filesData.map(async f => {
                statuses[f.id] = { chunks: await manualRagService.getFileChunkCount(f.id) };
            }));
            setRagStatus(statuses);
        } catch (error) {
            console.error('Error loading details:', error);
            toast.error('Erro ao carregar detalhes');
        } finally {
            setLoading(false);
        }
    };

    const handleIndexFile = async (file: { id: string; docFileName: string; docFilePath: string; fileType: string; tmCategoryDescription?: string }) => {
        setRagStatus(prev => ({ ...prev, [file.id]: { ...(prev[file.id] || { chunks: 0 }), indexing: true } }));
        try {
            const result: IndexResult = await manualRagService.indexFile(
                { ...file, tmId: manual.id } as any,
                manual.id,
                manual.code ? `${manual.code} - ${manual.description}` : manual.description
            );
            if (result.status === 'skipped') {
                // Tipo sem texto (imagem/planilha) — silencioso no upload automático,
                // só atualiza o status. Admin ainda pode ver o botão IA no arquivo.
                setRagStatus(prev => ({ ...prev, [file.id]: { chunks: 0 } }));
            } else if (result.status === 'completed' || result.status === 'partial') {
                toast.success(`IA: ${result.message}`);
            } else {
                toast.error(`IA: ${result.message}`);
            }
            setRagStatus(prev => ({ ...prev, [file.id]: { chunks: result.chunks } }));
            return result;
        } catch (err: any) {
            console.error('Error indexing file:', err);
            toast.error(err?.message || 'Erro ao indexar arquivo');
            setRagStatus(prev => ({ ...prev, [file.id]: { chunks: prev[file.id]?.chunks || 0 } }));
            return { status: 'error' as const, chunks: 0, message: err?.message || 'Erro desconhecido' };
        }
    };

    /**
     * Indexa em lote todos os arquivos do manual (acervo antigo).
     * Sequencial para não estourar cota da API Gemini; cancelável.
     */
    const handleIndexAllFiles = async () => {
        if (bulkIndexing) return;
        const indexable = files.filter(f => !['image', 'excel'].includes(f.fileType));
        if (indexable.length === 0) {
            toast.info('Nenhum arquivo com texto para indexar (apenas imagens/planilhas).');
            return;
        }

        bulkCancelRef.current = false;
        setBulkIndexing({ total: indexable.length, done: 0, errors: 0, skipped: 0, cancelled: false });

        let errors = 0;
        let skipped = 0;
        for (let i = 0; i < indexable.length; i++) {
            if (bulkCancelRef.current) break;
            const file = indexable[i];
            setBulkIndexing(prev => prev ? { ...prev, current: file.docFileName, done: i } : prev);
            const result = await handleIndexFile(file);
            if (result && (result as IndexResult).status === 'error') errors++;
            if (result && (result as IndexResult).status === 'skipped') skipped++;
        }

        setBulkIndexing(prev => prev ? { ...prev, done: indexable.length, current: undefined, cancelled: bulkCancelRef.current } : prev);
        if (bulkCancelRef.current) {
            toast.info('Indexação em lote cancelada.');
        } else {
            toast.success(`Indexação concluída: ${indexable.length - errors - skipped} OK${errors ? `, ${errors} com erro` : ''}${skipped ? `, ${skipped} ignorados` : ''}.`);
        }

        // deixa o resumo visível por alguns segundos antes de fechar o painel
        setTimeout(() => setBulkIndexing(null), 4000);
    };

    const handleCancelBulkIndexing = () => {
        bulkCancelRef.current = true;
    };

    useEffect(() => {
        loadData();
    }, [manual.id]);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const cats = await dataService.getTechnicalManualCategories();
                setCategories(cats);
            } catch (error) {
                console.error('Error loading categories:', error);
            }
        };
        loadCategories();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuActionsRef.current && !menuActionsRef.current.contains(event.target as Node)) {
                setShowMenuActions(false);
            }
        };
        if (showMenuActions) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenuActions]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/webp', 'image/gif',
            'application/pdf',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain', 'text/csv', 'application/octet-stream'
        ];

        const allowedExtensions = ['.txt', '.csv', '.gpc'];
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
            toast.error('Tipo de arquivo não suportado. Use imagens, PDF, Word, Excel, TXT, CSV ou GPC.');
            return;
        }

        setUploading(true);
        let uploadedFile: TechnicalManualFile | null = null;
        try {
            uploadedFile = await dataService.uploadTechnicalManualFile(manual.id, file, manual.companyId || '1', selectedCategoryId || undefined);
            toast.success('Arquivo enviado com sucesso!');
            await loadData();
        } catch (error) {
            console.error('Error uploading file:', error);
            toast.error('Erro ao enviar arquivo');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }

        // RAG automático: indexa o conteúdo do arquivo recém-enviado para o
        // assistente da visita (background — não bloqueia o upload).
        if (uploadedFile) {
            handleIndexFile(uploadedFile);
        }
    };

    const handleDeleteFile = async (fileId: string) => {
        setFileToDelete(fileId);
    };

    const confirmDeleteFile = async () => {
        if (!fileToDelete) return;
        try {
            // Remove também os chunks RAG do arquivo (best-effort)
            try { await manualRagService.deleteFileIndex(fileToDelete); } catch {}
            await dataService.deleteTechnicalManualFile(fileToDelete);
            toast.success('Arquivo excluído!');
            loadData();
        } catch (error) {
            console.error('Error deleting file:', error);
            toast.error('Erro ao excluir arquivo');
        } finally {
            setFileToDelete(null);
        }
    };

    const handleDissociateAsset = async (assetId: string) => {
        setAssetToDissociate(assetId);
    };

    const confirmDissociateAsset = async () => {
        if (!assetToDissociate) return;
        setDissociatingAssetId(assetToDissociate);
        try {
            await dataService.dissociateAsset(manual.id, assetToDissociate);
            toast.success('Ativo desvinculado!');
            loadData();
        } catch (error) {
            console.error('Error dissociating asset:', error);
            toast.error('Erro ao desvincular ativo');
        } finally {
            setAssetToDissociate(null);
            setDissociatingAssetId(null);
        }
    };

    const handleAssociateAsset = async (assetId: string) => {
        setAssociatingAssetId(assetId);
        try {
            await dataService.associateAsset(manual.id, assetId);
            toast.success('Ativo vinculado!');
            loadData();
        } catch (error) {
            console.error('Error associating asset:', error);
            toast.error('Erro ao vincular ativo');
        } finally {
            setAssociatingAssetId(null);
        }
    };

    const loadAvailableAssets = async (search: string = '', clientId?: string, unitId?: string) => {
        setLoadingAssets(true);
        try {
            const assets = await dataService.getAssetsByTypeForAssociation(manual.assetTypeId, search, undefined, clientId, unitId);
            setAvailableAssets(assets);
        } catch (error) {
            console.error('Error loading assets:', error);
        } finally {
            setLoadingAssets(false);
        }
    };

    const loadClients = async () => {
        setLoadingClients(true);
        try {
            const data = await dataService.getClients();
            setClients(data.map(c => ({ id: c.id, name: c.name })));
        } catch (error) {
            console.error('Error loading clients:', error);
        } finally {
            setLoadingClients(false);
        }
    };

    const loadUnits = async (clientId?: string) => {
        setLoadingUnits(true);
        try {
            let data;
            if (clientId) {
                data = await dataService.getUnitsByClient(clientId);
            } else {
                data = await dataService.getUnits();
            }
            setUnits(data.map(u => ({ id: u.id, description: u.descriptionFull || u.description })).sort((a, b) => a.description.localeCompare(b.description)));
        } catch (error) {
            console.error('Error loading units:', error);
        } finally {
            setLoadingUnits(false);
        }
    };

    useEffect(() => {
        if (showAssociateModal) {
            loadClients();
        }
    }, [showAssociateModal]);

    useEffect(() => {
        if (showAssociateModal && filterClientId) {
            setFilterUnitId('');
            loadUnits(filterClientId);
        } else if (showAssociateModal) {
            setUnits([]);
            setFilterUnitId('');
        }
    }, [filterClientId]);

    useEffect(() => {
        if (showAssociateModal && filterClientId && filterUnitId) {
            loadAvailableAssets(searchAssets, filterClientId, filterUnitId);
        } else {
            setAvailableAssets([]);
        }
    }, [showAssociateModal, searchAssets, filterClientId, filterUnitId]);

    const getFileIcon = (fileType: string, fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (fileType === 'image' || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) {
            return { icon: 'image', color: 'bg-orange-500/10 text-orange-500' };
        }
        if (fileType === 'pdf' || ext === 'pdf') {
            return { icon: 'description', color: 'bg-red-500/10 text-red-500' };
        }
        if (fileType === 'doc' || ['doc', 'docx'].includes(ext || '')) {
            return { icon: 'article', color: 'bg-blue-500/10 text-blue-500' };
        }
        if (fileType === 'excel' || ['xls', 'xlsx'].includes(ext || '')) {
            return { icon: 'table_chart', color: 'bg-emerald-500/10 text-emerald-500' };
        }
        return { icon: 'draft', color: 'bg-slate-500/10 text-slate-500' };
    };

    const formatFileSize = (fileName: string) => {
        return fileName.split('.').pop()?.toUpperCase() || '';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loading size="md" text="Carregando detalhes..." />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            {/* Header */}
            <div className="p-4 pb-0">
                <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                            {manual.code && (
                                <h1 className="text-lg font-bold text-slate-900 dark:text-white">{manual.code}</h1>
                            )}
                            <h1 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{manual.description}</h1>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary uppercase">
                                    {manual.assetTypeDescription}
                                </span>
                                <span className="text-[10px] text-slate-400">•</span>
                                <span className="text-[10px] text-slate-500">{manual.assetTypeDescription}</span>
                            </div>
                        </div>
                        <div className="relative" ref={menuActionsRef}>
                            {(canEditManual || canDeleteManual) && (
                            <button
                                onClick={() => setShowMenuActions(!showMenuActions)}
                                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 ${showMenuActions
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-95'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    {showMenuActions ? 'close' : 'more_vert'}
                                </span>
                            </button>
                            )}
                            {showMenuActions && (
                                <div className="absolute right-0 top-full mt-2 min-w-[180px] bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="py-1.5">
                                        {canEditManual && (
                                        <button
                                            onClick={() => { setShowMenuActions(false); onEdit(); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-left"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                            <span>Editar</span>
                                        </button>
                                        )}
                                        {canDeleteManual && (
                                        <button
                                            onClick={() => {
                                                setShowMenuActions(false);
                                                if (files.length > 0 || assets.length > 0) {
                                                    toast.error('Não é possível excluir. Remova todos os arquivos e ativos vinculados primeiro.');
                                                    return;
                                                }
                                                onDelete();
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all text-left ${files.length > 0 || assets.length > 0
                                                ? 'text-slate-400 cursor-not-allowed'
                                                : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                            <span>Excluir</span>
                                        </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-4 mt-4">
                <TabsBar
                    tabs={[
                        { id: 'files', label: `Arquivos (${files.length})` },
                        { id: 'assets', label: `Ativos (${assets.length})` }
                    ]}
                    activeTab={activeTab}
                    onTabChange={(tabId: string) => setActiveTab(tabId as 'assets' | 'files')}
                />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 pb-32">
                {activeTab === 'files' && (
                    <div className="space-y-4">
                        {/* Category Selector */}
                        <Select
                            label="Categoria do Arquivo"
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                        >
                            <option value="">Sem categoria</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.description}</option>
                            ))}
                        </Select>

                        {/* Upload Button */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.gpc"
                            onChange={handleFileUpload}
                        />
                        <Button
                            variant="primary"
                            fullWidth
                            onClick={() => fileInputRef.current?.click()}
                            loading={uploading}
                            disabled={uploading || !selectedCategoryId}
                        >
                            <span className="material-symbols-outlined text-sm mr-2">upload</span>
                            Adicionar Arquivo
                        </Button>
                        <p className="text-xs text-slate-400 text-center mt-1">
                            Formatos: JPG, PNG, PDF, Word, Excel, TXT, CSV, GPC
                        </p>

                        {/* Bulk RAG Indexing (acervo antigo) */}
                        {canEditManual && files.length > 0 && !bulkIndexing && (
                            <Button
                                variant="dashed"
                                fullWidth
                                onClick={handleIndexAllFiles}
                                disabled={!geminiConfigured}
                            >
                                <span className="material-symbols-outlined text-sm mr-2">database</span>
                                Indexar todos para IA ({files.filter(f => !['image', 'excel'].includes(f.fileType)).length})
                            </Button>
                        )}
                        {bulkIndexing && (
                            <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/20">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                                        Indexando arquivos {bulkIndexing.cancelled ? '(cancelando...)' : ''}
                                    </p>
                                    {!bulkIndexing.cancelled && (
                                        <button
                                            onClick={handleCancelBulkIndexing}
                                            className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                                <div className="h-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full overflow-hidden mb-2">
                                    <div
                                        className="h-full bg-indigo-500 transition-all duration-500"
                                        style={{ width: `${Math.round((bulkIndexing.done / Math.max(1, bulkIndexing.total)) * 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    {bulkIndexing.done}/{bulkIndexing.total}{bulkIndexing.current ? ` — ${bulkIndexing.current}` : ''}
                                </p>
                            </div>
                        )}

                        {/* Files List */}
                        {files.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                Nenhum arquivo adicionado
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {files.map((file) => {
                                    const fileIcon = getFileIcon(file.fileType, file.docFileName);
                                    const isImage = file.fileType === 'image' || ['jpg', 'jpeg', 'png', 'webp'].includes(file.docFileName.split('.').pop() || '');

                                    return (
                                        <div key={file.id} className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                            {/* Image Preview */}
                                            {isImage && (
                                                <div className="w-full h-40 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                    <OptimizedImage
                                                        src={getPublicImageUrl(file.docFilePath, file.docFileName, { width: 600, height: 300, resize: 'cover' })}
                                                        alt={file.docFileName}
                                                        className="w-full h-full object-cover"
                                                        preset="medium"
                                                    />
                                                </div>
                                            )}

                                            <div className="p-4 flex items-center gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 truncate">{file.docFileName}</h4>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                            {formatFileSize(file.docFileName)}
                                                        </p>
                                                        {file.tmCategoryDescription && (
                                                            <>
                                                                <span className="text-[10px] text-slate-300">•</span>
                                                                <span className="text-[10px] font-bold text-primary/70 uppercase tracking-wider">
                                                                    {file.tmCategoryDescription}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 items-center">
                                                    {/* RAG: status + botão indexar (admin) */}
                                                    {canEditManual && (
                                                        <button
                                                            onClick={() => handleIndexFile(file)}
                                                            disabled={ragStatus[file.id]?.indexing}
                                                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-50"
                                                            title={ragStatus[file.id]?.chunks > 0 ? 'Reindexar conteúdo para o assistente' : 'Indexar conteúdo para o assistente'}
                                                        >
                                                            {ragStatus[file.id]?.indexing ? (
                                                                <span className="material-symbols-outlined text-indigo-500 animate-spin text-[16px]">progress_activity</span>
                                                            ) : (
                                                                <span className="material-symbols-outlined text-indigo-500 text-[16px]">database</span>
                                                            )}
                                                            <span className="text-indigo-500">
                                                                {ragStatus[file.id]?.chunks > 0 ? `${ragStatus[file.id].chunks}` : 'IA'}
                                                            </span>
                                                        </button>
                                                    )}
                                                    <a
                                                        href={getPublicImageUrl(file.docFilePath, file.docFileName)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-slate-500">download</span>
                                                    </a>
                                                    {canDeleteManual && (
                                                    <button
                                                        onClick={() => handleDeleteFile(file.id)}
                                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-red-500">delete</span>
                                                    </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'assets' && (
                    <div className="space-y-4">
                        <Button
                            variant="primary"
                            fullWidth
                            onClick={() => setShowAssociateModal(true)}
                        >
                            <span className="material-symbols-outlined text-sm mr-2">link</span>
                            Vincular Ativo
                        </Button>

                        {assets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                <span className="material-symbols-outlined text-5xl mb-3">link_off</span>
                                <p className="text-sm font-medium">Nenhum ativo vinculado</p>
                                <p className="text-xs text-slate-400 mt-1">Clique em "Vincular Ativo" para adicionar</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {assets.map((asset) => {
                                    const sectorPosition = [asset.tagDescription, asset.tagSubDescription].filter(Boolean).join(' / ');
                                    return (
                                        <div key={asset.id} className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-slate-200 dark:border-slate-800 relative">
                                            {asset.assetStatusName && (
                                                <span className="absolute bottom-4 right-4 text-[10px] font-bold text-slate-400 uppercase">
                                                    {asset.assetStatusName}
                                                </span>
                                            )}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <button
                                                            onClick={() => onSelectAsset?.(asset.assetId)}
                                                            className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 active:scale-95 active:bg-primary/30 transition-all duration-150"
                                                        >
                                                            {asset.assetCode}
                                                        </button>
                                                    </div>
                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug pr-16">
                                                        {asset.assetDescription}
                                                    </h4>
                                                    {asset.clientName && (
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1.5">
                                                            {asset.clientName}
                                                        </p>
                                                    )}
                                                    {asset.unitDescription && (
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                                                            {asset.unitDescription}
                                                        </p>
                                                    )}
                                                    {sectorPosition && (
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1.5">
                                                            {sectorPosition}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleDissociateAsset(asset.assetId)}
                                                    disabled={dissociatingAssetId === asset.assetId}
                                                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 active:scale-90 disabled:opacity-50"
                                                    title="Desvincular"
                                                >
                                                    {dissociatingAssetId === asset.assetId ? (
                                                        <span className="material-symbols-outlined text-red-500 animate-spin">progress_activity</span>
                                                    ) : (
                                                        <span className="material-symbols-outlined text-red-500">link_off</span>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Associate Asset Modal */}
            <Modal
                isOpen={showAssociateModal}
                onClose={() => { setShowAssociateModal(false); setSearchAssets(''); setFilterClientId(''); setFilterUnitId(''); }}
                title="Vincular Ativos"
                maxWidth="md"
                noPadding
                hideCancelButton
            >
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500 mb-3">
                        Tipo de ativo: <span className="text-primary font-bold">{manual.assetTypeDescription}</span>
                    </p>
                    <div className="flex flex-col gap-2 mb-3">
                        <Select
                            value={filterClientId}
                            onChange={(e) => setFilterClientId(e.target.value)}
                            placeholder="Selecione um cliente"
                            options={clients.map(c => ({ value: c.id, label: c.name }))}
                        />
                        <Select
                            value={filterUnitId}
                            onChange={(e) => setFilterUnitId(e.target.value)}
                            placeholder="Selecione uma unidade"
                            disabled={!filterClientId}
                            options={units.map(u => ({ value: u.id, label: u.description }))}
                        />
                    </div>
                    <SearchInput
                        value={searchAssets}
                        onChange={(e) => setSearchAssets(e.target.value)}
                        placeholder={filterClientId && filterUnitId ? "Buscar ativo por código ou descrição..." : "Selecione cliente e unidade para buscar"}
                        disabled={!filterClientId || !filterUnitId}
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {loadingAssets ? (
                        <div className="flex justify-center py-8">
                            <Loading size="sm" text="Buscando ativos..." />
                        </div>
                    ) : availableAssets.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            {!filterClientId || !filterUnitId
                                ? 'Selecione cliente e unidade para listar os ativos'
                                : searchAssets ? 'Nenhum ativo encontrado' : 'Nenhum ativo disponível para este tipo'
                            }
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {availableAssets.map((asset) => {
                                const isAssociated = assets.some(a => a.assetId === asset.id);
                                const sectorPosition = [asset.tagDescription, asset.tagSubDescription].filter(Boolean).join(' / ');
                                return (
                                    <div
                                        key={asset.id}
                                        className={`p-4 rounded-xl border transition-colors relative ${isAssociated
                                            ? 'bg-primary/5 border-primary/20'
                                            : 'bg-white dark:bg-surface-dark border-slate-200 dark:border-slate-800 hover:border-primary'
                                            }`}
                                    >
                                        {asset.statusDescription && (
                                            <span className="absolute bottom-4 right-4 text-[10px] font-bold text-slate-400 uppercase">
                                                {asset.statusDescription}
                                            </span>
                                        )}
                                        <div className="flex items-start gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary">
                                                        {asset.code}
                                                    </span>
                                                </div>
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug pr-16">
                                                    {asset.description}
                                                </h4>
                                                {sectorPosition && (
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase mt-1.5 inline-block">
                                                        {sectorPosition}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="shrink-0">
                                                {isAssociated ? (
                                                    <button
                                                        onClick={() => handleDissociateAsset(asset.id)}
                                                        disabled={dissociatingAssetId === asset.id}
                                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 active:scale-90 disabled:opacity-50"
                                                        title="Desvincular"
                                                    >
                                                        {dissociatingAssetId === asset.id ? (
                                                            <span className="material-symbols-outlined text-red-500 animate-spin">progress_activity</span>
                                                        ) : (
                                                            <span className="material-symbols-outlined text-red-500">link_off</span>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAssociateAsset(asset.id)}
                                                        disabled={associatingAssetId === asset.id}
                                                        className="p-2 hover:bg-primary/10 rounded-lg transition-all duration-200 active:scale-90 disabled:opacity-50"
                                                    >
                                                        {associatingAssetId === asset.id ? (
                                                            <span className="material-symbols-outlined text-primary animate-spin">progress_activity</span>
                                                        ) : (
                                                            <span className="material-symbols-outlined text-primary">add_link</span>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Modal>

            {/* Confirm Delete File Modal */}
            <Modal
                isOpen={!!fileToDelete}
                onClose={() => setFileToDelete(null)}
                onConfirm={confirmDeleteFile}
                title="Excluir Arquivo"
                message="Tem certeza que deseja excluir este arquivo? Esta ação não pode ser desfeita."
                type="error"
                confirmLabel="Excluir"
                cancelLabel="Cancelar"
            />

            {/* Confirm Dissociate Asset Modal */}
            <Modal
                isOpen={!!assetToDissociate}
                onClose={() => setAssetToDissociate(null)}
                onConfirm={confirmDissociateAsset}
                title="Desvincular Ativo"
                message="Tem certeza que deseja desvincular este ativo do documento técnico?"
                type="warning"
                confirmLabel="Desvincular"
                cancelLabel="Cancelar"
            />
        </div>
    );
};
