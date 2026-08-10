import React, { useState, useEffect, useRef } from 'react';
import { Asset, AssetAttribute, AssetHistoryItem, TechnicalManual, TechnicalManualFile, Material } from '../../types';
import { dataService } from '../../services/dataService';
import { getPublicImageUrl } from '../../services/imageUtils';
import { IconButton } from '../../components/ui/IconButton';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadMore } from '../../components/ui/LoadMore';
import { toast } from 'sonner';
import { formatDateTime, formatCurrency } from '../../utils/formatters';
import { usePermissions } from '../../contexts/PermissionsContext';
import { OptimizedImage } from '../../components/ui/OptimizedImage';
import { PhotoViewer } from '../../components/ui/PhotoViewer';
import { AssetAlertForm } from './AssetAlertForm';
import type { AssetAlertFormHandle } from './AssetAlertForm';
import { AssetAlert } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { AssetDetailsPDFButton } from '../../components/reports/AssetDetailsPDFButton';
import { AssetAlertListItem } from './AssetAlertListItem';

import QRCode from 'react-qr-code';
import { Loading } from '../../components/ui/Loading';
import { TabsBar } from '../../components/ui/TabsBar';



interface AssetDetailsProps {
    asset: Asset;
    onBack: () => void;
    onEdit?: () => void;
    onDuplicate?: () => void;
    onViewReport?: (ovaId: string) => void;
    onMaterialSelect?: (material: Material) => void;
}

const AssetCardDetail: React.FC<{ asset: Asset; onMaterialSelect?: (material: Material) => void }> = ({ asset, onMaterialSelect }) => {
    const status = asset.statusCode || "USO";
    const date = formatDateTime(asset.statusAt);
    const unitDesc = asset.unitDescriptionFull || asset.location || "Não informada";
    const assetLocation = asset.location || "N/I";
    const system = [asset.tagName, asset.tagSubName]
        .filter(Boolean)
        .filter((item, index, self) => self.indexOf(item) === index)
        .join(' - ') || "Sem Tag";

    return (
        <div className="group relative bg-white dark:bg-card-dark rounded-[12px] border border-slate-100 dark:border-slate-800 shadow-xl dark:shadow-2xl/20 mt-[-90px] z-10 mx-1 overflow-hidden p-4 border-l-4" style={{ borderLeftColor: asset.statusColor || '#149185' }}>

            <div className="relative z-10 flex flex-col gap-3">
                {/* Header Row */}
                <div className="flex items-stretch justify-between gap-3">
                    {/* Status Tag */}
                    <div
                        className="text-white rounded-[12px] px-4 py-2 flex items-center shadow-sm"
                        style={{ backgroundColor: asset.statusColor || '#149185' }}
                    >
                        <div className="flex flex-col leading-tight">
                            <span className="text-[14px] font-bold tracking-tight uppercase">{asset.code}</span>
                            <div className="flex items-center gap-2.5 mt-[10px]">
                                <span className="text-[9px] font-black uppercase tracking-wider">{status}</span>
                                <span className="text-[9px] font-black uppercase tracking-wider">{date}</span>
                            </div>
                        </div>
                    </div>

                    {/* Asset Avatar */}
                    <Avatar
                        src={dataService.getPublicImageUrl(asset.imgFilePath, asset.imgFileName, { width: 400, height: 400, resize: 'cover' })}
                        alt={asset.description}
                        size="md"
                        className="border-2 border-slate-50 dark:border-slate-800"
                    />
                </div>

                {/* Main Content */}
                <div className="space-y-1 text-left">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight uppercase">
                        {asset.description}
                    </h3>

                    <div className="space-y-[10px] pt-2">
                        {/* Unidade */}
                        <div className="flex flex-col gap-[2px]">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase leading-none">Unidade</span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase leading-tight">
                                {asset.clientName || "(CLIENTE NÃO INFORMADO)"}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase leading-tight">
                                {unitDesc}
                            </span>
                        </div>

                        {/* Setor e Localização */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-col gap-[2px] flex-1">
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase leading-none">Setor - Posição</span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase leading-tight">{system}</span>
                            </div>
                            <div className="flex flex-col gap-[2px] text-right min-w-[30%]">
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase leading-none">Localização</span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase leading-tight">{assetLocation}</span>
                            </div>
                        </div>

                        {/* Comentários */}
                        {asset.comments && (
                            <div className="flex flex-col gap-[2px]">
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase leading-none">Observações</span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase leading-tight">
                                    {asset.comments}
                                </span>
                            </div>
                        )}

                        {/* Material Relacionado */}
                        {asset.materialDescription && (
                            <div className="flex flex-col gap-[2px]">
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase leading-none">Material Relacionado</span>
                                <button
                                    type="button"
                                    onClick={() => onMaterialSelect?.({ id: asset.materialId, code: asset.materialCode, description: asset.materialDescription, unit: asset.materialUnit } as Material)}
                                    className="text-xs font-bold text-slate-900 dark:text-white uppercase leading-tight text-left hover:underline cursor-pointer"
                                >
                                    {asset.materialCode} — {asset.materialDescription} ({asset.materialUnit})
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const AssetDetails: React.FC<AssetDetailsProps> = ({ asset, onBack, onEdit, onDuplicate, onViewReport, onMaterialSelect }) => {
    const { canView, canCreate, canEdit, canDelete } = usePermissions();
    const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});
    const [activeTab, setActiveTab] = useState('Dados');
    const [showMenu, setShowMenu] = useState(false);
    const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
    const [attributes, setAttributes] = useState<AssetAttribute[]>([]);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [expandedImage, setExpandedImage] = useState<string | null>(null);
    const [alerts, setAlerts] = useState<AssetAlert[]>([]);
    const [isAddingAlert, setIsAddingAlert] = useState(false);
    const [editingAlert, setEditingAlert] = useState<AssetAlert | null>(null);
    const [alertFilter, setAlertFilter] = useState<'abertos' | 'resolvidos' | 'todos'>('abertos');
    const alertFormRef = useRef<AssetAlertFormHandle>(null);

    const tabs = ['Dados', 'Histórico', 'Manuais', 'Componentes', 'Alertas', 'QR CODE'];

    useEffect(() => {
        const fetchAlerts = async () => {
            if (activeTab === 'Alertas') {
                try {
                    const data = await dataService.getAssetAlerts(asset.id);
                    setAlerts(data);
                } catch (error) {
                    console.error('Error fetching alerts:', error);
                }
            }
        };
        fetchAlerts();
    }, [activeTab, asset.id]);

    const handleAlertSave = async (alertData: Partial<AssetAlert>) => {
        try {
            if (editingAlert) {
                await dataService.updateAssetAlert(editingAlert.id, alertData);
                toast.success('Alerta atualizado com sucesso!');
            } else {
                await dataService.createAssetAlert({
                    ...alertData,
                    assetId: asset.id
                });
                toast.success('Alerta criado com sucesso!');
            }
            setIsAddingAlert(false);
            setEditingAlert(null);
            // Refresh list
            const data = await dataService.getAssetAlerts(asset.id);
            setAlerts(data);
        } catch (error) {
            console.error('Error saving alert:', error);
            toast.error('Erro ao salvar alerta.');
        }
    };

    const handleAlertDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este alerta?')) return;
        try {
            await dataService.deleteAssetAlert(id);
            toast.success('Alerta excluído.');
            setAlerts(prev => prev.filter(a => a.id !== id));
        } catch (error) {
            toast.error('Erro ao excluir alerta.');
        }
    };

    if (!canView('assets')) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-background-light dark:bg-background-dark">
                <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-red-500 text-[40px]">lock</span>
                </div>
                <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-2">Acesso Negado</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mb-6">
                    Você não tem permissão para visualizar os detalhes deste ativo.
                    Entre em contato com o administrador se acreditar que isso é um erro.
                </p>
                <button
                    onClick={onBack}
                    className="px-6 py-2 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                >
                    Voltar
                </button>
            </div>
        );
    }

    // Load initial favorite status
    useEffect(() => {
        const checkFavorite = async () => {
            try {
                const followedIds = await dataService.getFollowedAssetIds();
                setIsFavorite(followedIds.includes(asset.id));
            } catch (error) {
                console.error('Error checking favorite status:', error);
            }
        };
        checkFavorite();
    }, [asset.id]);

    const handleToggleFavorite = async () => {
        setIsAnimating(true);
        const newStatus = !isFavorite;
        setIsFavorite(newStatus); // Optimistic

        try {
            const confirmedStatus = await dataService.toggleAssetFollow(asset.id);
            if (confirmedStatus !== newStatus) {
                setIsFavorite(confirmedStatus);
            }
            toast.success(confirmedStatus ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
        } catch (error) {
            console.error('Error toggling favorite:', error);
            setIsFavorite(!newStatus); // Rollback
            toast.error('Erro ao atualizar favorito');
        }
        setTimeout(() => setIsAnimating(false), 400);
    };

    const [history, setHistory] = useState<AssetHistoryItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [historyTotal, setHistoryTotal] = useState(0);
    const [historyPage, setHistoryPage] = useState(0);
    const HISTORY_PAGE_SIZE = 10;

    const assetImageUrl = dataService.getPublicImageUrl(asset.imgFilePath, asset.imgFileName);
    const handleOpenImageViewer = () => {
        if (assetImageUrl) {
            setExpandedImage(assetImageUrl);
        }
    };

    const loadHistory = async (page: number, append: boolean = false) => {
        setIsLoadingHistory(true);
        try {
            const { data, total } = await dataService.getAssetHistory(asset.id, page, HISTORY_PAGE_SIZE);
            setHistory(prev => append ? [...prev, ...data] : data);
            setHistoryTotal(total);
            setHistoryPage(page);
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'Histórico' && history.length === 0) {
            loadHistory(0);
        }
    }, [activeTab, asset.id]);

    // Technical Manuals loaded from DB
    const [techManuals, setTechManuals] = useState<any[]>([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(false);

    useEffect(() => {
        const loadDocs = async () => {
            if (activeTab !== 'Manuais' || !asset.id) return;
            setIsLoadingDocs(true);
            try {
                const manuals = await dataService.getTechnicalManualsByAssetId(asset.id);
                const manualsWithFiles = await Promise.all(
                    manuals.map(async (m: any) => {
                        const files = await dataService.getTechnicalManualFiles(m.id);
                        return { ...m, files };
                    })
                );
                setTechManuals(manualsWithFiles);
            } catch (error) {
                console.error('Error loading technical manuals:', error);
            } finally {
                setIsLoadingDocs(false);
            }
        };
        loadDocs();
    }, [activeTab, asset.id]);

    // Mock components
    const components = [
        { id: '1', name: 'Selo Mecânico', detail: 'John Crane Type 1', status: 'Em estoque', statusColor: 'bg-emerald-500', icon: 'settings_input_component' },
        { id: '2', name: 'Rolamento Dianteiro', detail: 'SKF 6309-2Z', status: 'Estoque Baixo', statusColor: 'bg-orange-500', icon: 'settings_backup_restore' },
    ];

    useEffect(() => {
        const loadDynamicData = async () => {
            if (!asset.typeId) return;
            try {
                const [attrs, values] = await Promise.all([
                    dataService.getAssetAttributesByType(asset.typeId),
                    dataService.getAssetAttributeValues(asset.id)
                ]);
                setAttributes(attrs);
                setAttributeValues(values);
            } catch (error) {
                console.error('Error loading dynamic attributes for details:', error);
            }
        };
        loadDynamicData();
    }, [asset.id, asset.typeId]);

    const filteredAlerts = alerts.filter(alert => {
        if (alertFilter === 'abertos') return !alert.isDone;
        if (alertFilter === 'resolvidos') return alert.isDone;
        return true;
    });

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-white relative">
            <div className={`flex-1 overflow-y-auto no-scrollbar relative transition-all duration-500 ${isHeaderExpanded ? 'overflow-hidden' : ''}`}>
                {/* Floating Top Controls */}
                <div className="absolute top-4 left-4 right-4 z-60 flex justify-end pointer-events-none">

                    {(onEdit || onDuplicate) && (
                        <div className="relative pointer-events-auto">
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                                className={`w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-white hover:bg-black/40 transition-all shadow-lg ${showMenu ? 'bg-black/40' : ''}`}
                            >
                                <span className="material-symbols-outlined">more_vert</span>
                            </button>

                            {showMenu && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                    <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-20 py-2 overflow-hidden animate-in fade-in zoom-in duration-200">
                                        {onEdit && canEdit('assets') && (
                                            <button
                                                onClick={() => { setShowMenu(false); onEdit(); }}
                                                className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-3 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-blue-500">edit</span>
                                                <span className="font-medium">Editar Ativo</span>
                                            </button>
                                        )}
                                        {onDuplicate && canCreate('assets') && (
                                            <button
                                                onClick={() => { setShowMenu(false); onDuplicate(); }}
                                                className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-3 transition-colors border-t border-slate-50 dark:border-slate-800/50"
                                            >
                                                <span className="material-symbols-outlined text-emerald-500">content_copy</span>
                                                <span className="font-medium">Duplicar Ativo</span>
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Hero Cover Image */}
                <div
                    onClick={assetImageUrl ? handleOpenImageViewer : undefined}
                    className={`w-full relative border-b border-slate-100 dark:border-slate-800 overflow-hidden transition-all duration-700 ease-in-out ${assetImageUrl ? 'cursor-pointer' : ''} group ${isHeaderExpanded ? 'h-[75vh] md:h-[85vh]' : 'aspect-video md:aspect-auto md:h-[350px]'
                        }`}
                >
                    <OptimizedImage
                        src={assetImageUrl || ''}
                        alt={asset.description}
                        preset="large"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Subtle Overlay */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                    {/* Expand Indicator */}
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setIsHeaderExpanded(prev => !prev); }}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <div className="bg-black/20 backdrop-blur-md rounded-full p-4 border border-white/20">
                            <span className="material-symbols-outlined text-white text-3xl">
                                {isHeaderExpanded ? 'close_fullscreen' : 'expand_content'}
                            </span>
                        </div>
                    </button>

                    {/* Viewer Hint Label */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 opacity-0 group-hover:opacity-100">
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                            Toque para visualizar e baixar
                        </span>
                    </div>
                </div>

                <div className={`p-4 space-y-8 pb-32 relative md:max-w-5xl md:mx-auto transition-all duration-700 ease-in-out ${isHeaderExpanded ? 'translate-y-20 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
                    }`}>
                    {/* Floating Asset Card */}
                    <AssetCardDetail asset={asset} onMaterialSelect={onMaterialSelect} />



                    {/* Tabs */}
                    <TabsBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

                    {/* Content Sections */}
                    <div className="space-y-10">
                        {/* Technical Data Section */}
                        {activeTab === 'Dados' && (
                            <>
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Dados Técnicos</h3>
                                    </div>

                                    <div
                                        className="grid grid-cols-12 gap-px bg-slate-200 dark:bg-white/5 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 shadow-sm"
                                        style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))' }}
                                    >
                                        {/* Dynamic Attributes */}
                                        {attributes.map((attr, i) => {
                                            const value = attributeValues[attr.fieldKey];
                                            const displayValue = value ? (attr.dataType === 'boolean' ? (value === 'true' ? 'Sim' : 'Não') : value) : '-';
                                            const label = attr.unit ? `${attr.label} (${attr.unit})` : attr.label;
                                            const span = attr.colSpan || 12;

                                            return (
                                                <div
                                                    key={attr.id}
                                                    className={`bg-white dark:bg-[#111827] p-[14px] flex flex-col gap-1 ${i > 0 || true ? 'border-t md:border-t-0 border-slate-100 dark:border-white/5' : ''}`}
                                                    style={{ gridColumn: `span ${span} / span ${span}` }}
                                                >
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">{label}</span>
                                                    <span className="text-sm font-black text-slate-900 dark:text-slate-200 uppercase">{displayValue}</span>
                                                </div>
                                            );
                                        })}

                                        {/* Observations */}
                                        <div
                                            className="col-span-12 bg-white dark:bg-[#111827] p-[14px] flex flex-col gap-2 border-t border-slate-100 dark:border-white/5"
                                            style={{ gridColumn: 'span 12 / span 12' }}
                                        >
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Observações</span>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                                                {asset.comments || 'Nenhuma observação cadastrada para este equipamento.'}
                                            </p>
                                        </div>
                                    </div>
                                </section>


                            </>
                        )}

                        {activeTab === 'QR CODE' && (
                            <section className="animate-in fade-in zoom-in-95 duration-500">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Etiquetas de Identificação</h3>
                                </div>

                                <div className="flex flex-col items-center w-full">
                                    {/* QR Code Large Card */}
                                    <div className="w-full max-w-md bg-white dark:bg-card-dark p-8 rounded-[24px] border border-slate-100 dark:border-white/5 shadow-xl flex flex-col items-center gap-6">
                                        <div className="w-full flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">QR CODE ALTA DENSIDADE</span>
                                            <span className="material-symbols-outlined text-slate-300">qr_code_2</span>
                                        </div>
                                        <div className="bg-white p-6 rounded-3xl shadow-2xl! ring-8 ring-slate-50 dark:ring-white/5">
                                            <QRCode
                                                value={asset.code || asset.id}
                                                size={180}
                                                level="H"
                                            />
                                        </div>
                                        <div className="text-center mt-2">
                                            <p className="text-lg font-black text-slate-900 dark:text-white mb-1">{asset.code}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{asset.description}</p>
                                        </div>
                                        <Button variant="dashed" className="w-full rounded-xl gap-2 mt-4" onClick={() => window.print()}>
                                            <span className="material-symbols-outlined text-lg">print</span>
                                            Imprimir QR Code
                                        </Button>
                                    </div>
                                </div>

                                <div className="mt-8 p-6 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                                    <div className="flex gap-4">
                                        <span className="material-symbols-outlined text-blue-500">info</span>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-900 dark:text-slate-200">Dica de Identificação</p>
                                            <p className="text-[11px] text-slate-500 leading-relaxed">
                                                Utilize etiquetas térmicas de alta resistência para ambientes industriais. O QR Code possui correção de erro nível H, permitindo leitura mesmo com danos parciais à etiqueta.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {activeTab === 'Alertas' && (
                            <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <Modal
                                    isOpen={!!(isAddingAlert || editingAlert)}
                                    onClose={() => { setIsAddingAlert(false); setEditingAlert(null); }}
                                    onConfirm={async () => {
                                        if (alertFormRef.current) {
                                            const success = await alertFormRef.current.submit();
                                            if (success) {
                                                setIsAddingAlert(false);
                                                setEditingAlert(null);
                                            }
                                        }
                                    }}
                                    title={editingAlert ? 'Editar Alerta' : 'Novo Alerta'}
                                    confirmLabel="Salvar"
                                    maxWidth="sm"
                                >
                                    <AssetAlertForm
                                        ref={alertFormRef}
                                        assetId={asset.id}
                                        initialAlert={editingAlert || undefined}
                                        onSave={handleAlertSave}
                                        onCancel={() => { setIsAddingAlert(false); setEditingAlert(null); }}
                                    />
                                </Modal>

                                {!isAddingAlert && !editingAlert && (
                                    <>
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Alertas</h3>
                                            <button
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-full transition-all active:scale-95 border-none cursor-pointer"
                                                onClick={() => setIsAddingAlert(true)}
                                            >
                                                <span className="material-symbols-outlined text-[20px]">add_alert</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest">Incluir Alerta</span>
                                            </button>
                                        </div>

                                        {/* Filtros de Alertas */}
                                        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
                                            {[
                                                { value: 'abertos', label: 'Abertos', activeClass: 'bg-red-600 text-white shadow-md shadow-red-600/20' },
                                                { value: 'resolvidos', label: 'Resolvidos', activeClass: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' },
                                                { value: 'todos', label: 'Todos', activeClass: 'bg-blue-500 text-white shadow-md shadow-blue-500/10' }
                                            ].map(f => (
                                                <button
                                                    key={f.value}
                                                    onClick={() => setAlertFilter(f.value as 'abertos' | 'resolvidos' | 'todos')}
                                                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border-none ${
                                                        alertFilter === f.value
                                                            ? f.activeClass
                                                            : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                                                    }`}
                                                >
                                                    {f.label}
                                                </button>
                                            ))}
                                        </div>

                                        {filteredAlerts.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 px-6 bg-slate-500/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                                                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
                                                    <span className="material-symbols-outlined text-slate-400 text-3xl">notifications_off</span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">
                                                    {alertFilter === 'abertos' ? 'Sem alertas abertos' : alertFilter === 'resolvidos' ? 'Sem alertas resolvidos' : 'Sem alertas ativos'}
                                                </p>
                                                <p className="text-[11px] text-slate-500 text-center max-w-[240px] leading-relaxed">
                                                    {alertFilter === 'abertos' 
                                                        ? 'Não existem alertas pendentes de resolução para este equipamento.' 
                                                        : alertFilter === 'resolvidos' 
                                                            ? 'Não existem alertas resolvidos para este equipamento.' 
                                                            : 'Não existem alertas de criticidade ou indisponibilidade registrados para este equipamento no momento.'}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-4">
                                                {filteredAlerts.map(alert => {
                                                    const enrichedAlert = {
                                                        ...alert,
                                                        assetCode: asset.code,
                                                        assetDescription: asset.description,
                                                        clientName: asset.clientName,
                                                        unitDescription: asset.unitDescriptionFull || asset.location,
                                                        tagName: asset.tagName,
                                                        tagSubName: asset.tagSubName
                                                    };
                                                    return (
                                                        <AssetAlertListItem
                                                            key={alert.id}
                                                            alert={enrichedAlert}
                                                            onEdit={setEditingAlert}
                                                            onDelete={handleAlertDelete}
                                                            onViewReport={onViewReport}
                                                            hideAssetIdentification={true}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                )}
                            </section>
                        )}

                        {/* Recent History Timeline */}
                        {activeTab === 'Histórico' && (() => {
                            const totalServices = history.reduce((sum, item) => sum + (item.servicesValue || 0), 0);
                            const totalMaterials = history.reduce((sum, item) => sum + (item.materialsValue || 0), 0);
                            const totalVehicles = history.reduce((sum, item) => sum + (item.vehiclesValue || 0), 0);
                            const totalCosts = history.reduce((sum, item) => sum + (item.totalValue || 0), 0);
                            
                            return (
                                <section className="relative">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Histórico</h3>
                                        
                                        {(totalCosts > 0 || totalServices > 0) && (
                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="flex flex-col gap-0.5 px-2.5 py-1.5 bg-blue-500/5 border border-blue-500/10 rounded-xl min-w-[70px]">
                                                    <span className="text-[8px] font-black text-blue-500 dark:text-blue-400/70 uppercase leading-none">Serviços</span>
                                                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 leading-none">{formatCurrency(totalServices)}</span>
                                                </div>
                                                <div className="flex flex-col gap-0.5 px-2.5 py-1.5 bg-amber-500/5 border border-amber-500/10 rounded-xl min-w-[70px]">
                                                    <span className="text-[8px] font-black text-amber-500 dark:text-amber-400/70 uppercase leading-none">Materiais</span>
                                                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 leading-none">{formatCurrency(totalMaterials)}</span>
                                                </div>
                                                <div className="flex flex-col gap-0.5 px-2.5 py-1.5 bg-purple-500/5 border border-purple-500/10 rounded-xl min-w-[70px]">
                                                    <span className="text-[8px] font-black text-purple-500 dark:text-purple-400/70 uppercase leading-none">Transp.</span>
                                                    <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 leading-none">{formatCurrency(totalVehicles)}</span>
                                                </div>
                                                <div className="flex flex-col gap-0.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl ml-auto">
                                                    <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-500/70 uppercase leading-none">TOTAL</span>
                                                    <span className="text-[13px] font-black text-emerald-600 dark:text-emerald-500 leading-none tracking-tight">
                                                        {formatCurrency(totalCosts)}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                <div className="space-y-0 relative">
                                    {/* Vertical line is now per-item */}

                                    {isLoadingHistory && history.length === 0 ? (
                                        <div className="flex justify-center p-8">
                                            <Loading size="md" />
                                        </div>
                                    ) : history.length === 0 ? (
                                        <div className="text-center py-8 text-slate-500 text-xs uppercase font-bold">
                                            Nenhum histórico encontrado.
                                        </div>
                                    ) : (
                                        <div className="space-y-0 relative">
                                            {/* Single continuous vertical line background */}
                                            {history.length > 0 && (
                                                <div className="absolute left-[5px] top-3 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800" />
                                            )}

                                            {history.map((item, index) => (
                                                <div key={item.id} className="flex gap-4 pb-12 last:pb-0 relative group">
                                                    <div className="flex flex-col items-center shrink-0 w-3 relative">
                                                        <div className={`z-10 w-3 h-3 rounded-full shrink-0 mt-2 transition-all duration-300 border-2 ${index === 0
                                                            ? 'bg-blue-500 border-blue-200 dark:border-blue-400 scale-125 shadow-[0_0_12px_rgba(59,130,246,0.6)]'
                                                            : 'bg-white dark:bg-[#111827] border-slate-300 dark:border-slate-600'
                                                            }`} />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wide">{item.date}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20">
                                                                <span className="material-symbols-outlined text-[13px] font-black text-emerald-600 dark:text-emerald-400">check_circle</span>
                                                                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Aprovado</span>
                                                            </div>
                                                        </div>

                                                        <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-4 shadow-sm relative group hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer" onClick={() => onViewReport?.(item.id)}>
                                                            <div className="flex justify-between items-center gap-3 mb-4 pb-3 border-b border-slate-50 dark:border-white/5">
                                                                <div className="flex flex-col gap-1.5">
                                                                    {item.team && (
                                                                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wide">{item.team}</span>
                                                                    )}
                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide self-start ${index === 0 ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                                        {item.ovMask || item.orderMask || item.type || 'AT ---'}
                                                                    </span>
                                                                </div>
                                                                {item.providerCompanyLogoUrl && (
                                                                    <div className="flex items-center gap-2">
                                                                        <Avatar src={item.providerCompanyLogoUrl} alt={item.providerCompanyName || 'Provider'} size="sm" className="border border-slate-200 dark:border-slate-700" />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {(item.beforeUnit || item.beforeTag || item.beforeComments || item.beforeImg) && (
                                                                <div className="mb-3 p-2 bg-slate-100 dark:bg-white/5 rounded-md">
                                                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ANTES</h5>
                                                                    <div className="pl-1">
                                                                        {item.beforeUnit && <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{item.beforeUnit}</div>}
                                                                        {item.beforeTag && <div className="text-[10px] text-slate-500 uppercase">{item.beforeTag}</div>}
                                                                        {item.beforeStatus && <div className="text-[10px] text-slate-500 mt-0.5 uppercase">{item.beforeStatus}</div>}
                                                                        <div className="flex items-start gap-3 mt-2">
                                                                            {item.beforeImg && (
                                                                                <div className="w-16 h-16 rounded-md bg-slate-200 dark:bg-black overflow-hidden shrink-0 border border-slate-300 dark:border-white/10 cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => { e.stopPropagation(); setExpandedImage(item.beforeImg!); }}>
                                                                                    <OptimizedImage src={item.beforeImg!} className="w-full h-full object-cover" alt="Antes" preset="thumbnail" loading="lazy" />
                                                                                </div>
                                                                            )}
                                                                            {item.beforeComments && <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight pt-0.5">{item.beforeComments}</p>}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {(item.afterUnit || item.afterTag || item.afterComments || item.afterImg) && (
                                                                <div className="mb-3 p-2 bg-slate-100 dark:bg-white/5 rounded-md">
                                                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">DEPOIS</h5>
                                                                    <div className="pl-1">
                                                                        {item.afterUnit && <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{item.afterUnit}</div>}
                                                                        {item.afterTag && <div className="text-[10px] text-slate-500 uppercase">{item.afterTag}</div>}
                                                                        {item.afterStatus && <div className="text-[10px] text-slate-500 mt-0.5 uppercase">{item.afterStatus}</div>}
                                                                        <div className="flex items-start gap-3 mt-2">
                                                                            {item.afterImg && (
                                                                                <div className="w-16 h-16 rounded-md bg-slate-200 dark:bg-black overflow-hidden shrink-0 border border-slate-300 dark:border-white/10 cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => { e.stopPropagation(); setExpandedImage(item.afterImg!); }}>
                                                                                    <OptimizedImage src={item.afterImg!} className="w-full h-full object-cover" alt="Depois" preset="thumbnail" loading="lazy" />
                                                                                </div>
                                                                            )}
                                                                            {item.afterComments && <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight pt-0.5">{item.afterComments}</p>}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {(item.description && item.description !== 'Sem observações') && (
                                                                <div className="mb-3 px-2">
                                                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">INTERVENÇÕES</h5>
                                                                    <div className="pl-1">
                                                                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase leading-tight">{item.description}</p>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {((item.totalValue != null && item.totalValue > 0) || (item.servicesValue != null && item.servicesValue > 0) || (item.materialsValue != null && item.materialsValue > 0) || (item.vehiclesValue != null && item.vehiclesValue > 0)) && (
                                                                <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/30">
                                                                    <div className="flex flex-col gap-0.5 px-2.5 py-1.5 bg-blue-500/5 border border-blue-500/10 rounded-xl min-w-[70px]">
                                                                        <span className="text-[8px] font-black text-blue-500 dark:text-blue-400/70 uppercase leading-none">Serviços</span>
                                                                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 leading-none">{formatCurrency(item.servicesValue || 0)}</span>
                                                                    </div>
                                                                    <div className="flex flex-col gap-0.5 px-2.5 py-1.5 bg-amber-500/5 border border-amber-500/10 rounded-xl min-w-[70px]">
                                                                        <span className="text-[8px] font-black text-amber-500 dark:text-amber-400/70 uppercase leading-none">Materiais</span>
                                                                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 leading-none">{formatCurrency(item.materialsValue || 0)}</span>
                                                                    </div>
                                                                    <div className="flex flex-col gap-0.5 px-2.5 py-1.5 bg-purple-500/5 border border-purple-500/10 rounded-xl min-w-[70px]">
                                                                        <span className="text-[8px] font-black text-purple-500 dark:text-purple-400/70 uppercase leading-none">Transp.</span>
                                                                        <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 leading-none">{formatCurrency(item.vehiclesValue || 0)}</span>
                                                                    </div>
                                                                    <div className="flex flex-col gap-0.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl ml-auto">
                                                                        <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-500/70 uppercase leading-none">TOTAL</span>
                                                                        <span className="text-[13px] font-black text-emerald-600 dark:text-emerald-500 leading-none tracking-tight">
                                                                            {formatCurrency(item.totalValue || 0)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            <LoadMore
                                                current={history.length}
                                                total={historyTotal}
                                                onLoadMore={() => loadHistory(historyPage + 1, true)}
                                                loading={isLoadingHistory}
                                                pageSize={HISTORY_PAGE_SIZE}
                                            />
                                        </div>
                                    )}
                                </div>
                            </section>
                        );})()}

                        {/* Documentation Section */}
                        {activeTab === 'Manuais' && (
                            <section>
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Manuais Técnicos</h3>
                                {isLoadingDocs ? (
                                    <div className="flex justify-center py-8">
                                        <Loading size="sm" text="Carregando documentos..." />
                                    </div>
                                ) : techManuals.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500">
                                        Nenhum manual técnico associado a este ativo
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {techManuals.map((manual) => (
                                            <div key={manual.id} className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
                                                <div className="p-4 border-b border-slate-100 dark:border-white/5">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 truncate">{manual.description}</h4>
                                                        {manual.code && (
                                                            <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider">{manual.code}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                {manual.files && manual.files.length > 0 && (
                                                    <div className="p-3 space-y-2">
                                                        {manual.files.map((file: TechnicalManualFile) => {
                                                            const isImage = file.fileType === 'image' || ['jpg', 'jpeg', 'png', 'webp'].includes(file.docFileName.split('.').pop() || '');
                                                            const ext = file.docFileName.split('.').pop()?.toUpperCase() || '';
                                                            const iconColor = isImage
                                                                ? 'bg-orange-500/10 text-orange-500'
                                                                : ext === 'PDF'
                                                                    ? 'bg-red-500/10 text-red-500'
                                                                    : ['DOC', 'DOCX'].includes(ext)
                                                                        ? 'bg-blue-500/10 text-blue-500'
                                                                        : 'bg-emerald-500/10 text-emerald-500';
                                                            const icon = isImage ? 'image' : ext === 'PDF' ? 'description' : ['DOC', 'DOCX'].includes(ext) ? 'article' : 'table_chart';

                                                            return (
                                                                <a
                                                                    key={file.id}
                                                                    href={getPublicImageUrl(file.docFilePath, file.docFileName)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                                                                >
                                                                    <div className="flex-1 min-w-0">
                                                                        <h5 className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate">{file.docFileName}</h5>
                                                                        <div className="flex items-center gap-2 mt-0.5">
                                                                            <p className="text-[10px] text-slate-500 uppercase">{ext}</p>
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
                                                                    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">download</span>
                                                                </a>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                                {(!manual.files || manual.files.length === 0) && (
                                                    <div className="p-4 text-center text-xs text-slate-400">
                                                        Nenhum arquivo associado
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Associated Components */}
                        {activeTab === 'Componentes' && (
                            <section>
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Componentes Associados</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {components.map((comp) => (
                                        <div key={comp.id} className="flex items-center gap-4 bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer group">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                                <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-3xl">{comp.icon}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-black text-slate-900 dark:text-slate-200">{comp.name}</h4>
                                                <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider">{comp.detail}</p>
                                                <div className="flex items-center gap-1.5 mt-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${comp.statusColor}`} />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{comp.status}</span>
                                                </div>
                                            </div>
                                            <IconButton icon="chevron_right" variant="ghost" className="text-slate-500! group-hover:text-slate-100!" />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>

            {expandedImage && (
                <PhotoViewer
                    src={expandedImage}
                    onClose={() => setExpandedImage(null)}
                    alt="Detalhe do Histórico"
                />
            )}
        </div >
    );
};
