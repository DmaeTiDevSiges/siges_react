import React, { useState, useEffect } from 'react';
import { Unit, Asset, OrderVisitAssetView } from '../../../../types';
import { IconButton } from '../../../../components/ui/IconButton';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { Avatar } from '../../../../components/ui/Avatar';
import { Marker } from '../../../../components/ui/Marker';
import { UnitCardDetail } from '../../../../components/units/UnitCardDetail';
import { dataService } from '../../../../services/dataService';
import { usePermissions } from '../../../../contexts/PermissionsContext';
import { Modal } from '../../../../components/ui/Modal';
import { AssetCard } from '../../../../components/assets/AssetCard';
import { AssetsListPDFButton } from '../../../../components/reports/AssetsListPDFButton';
import { toast } from 'sonner';

interface UnitDetailsProps {
    unit: Unit;
    onBack: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onViewUnits?: () => void;
    onNewOrder?: () => void;
    onSelectAsset?: (asset: Asset) => void;
}

// Subcomponent for Circular Gauge
const CircularGauge: React.FC<{ percentage: number; size?: number; strokeWidth?: number; color?: string }> = ({
    percentage,
    size = 48, // Reduced to fit the ServiceCard icon slot
    strokeWidth = 4,
    color = 'text-emerald-500'
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-slate-200 dark:text-slate-800"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={`${color} transition-all duration-500 ease-out`}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] font-black leading-none">{percentage}%</span>
            </div>
        </div>
    );
};

export const UnitDetails: React.FC<UnitDetailsProps> = ({
    unit,
    onBack,
    onEdit,
    onDelete,
    onViewUnits,
    onNewOrder,
    onSelectAsset
}) => {
    const { canView, canEdit } = usePermissions();
    const [selectedSector, setSelectedSector] = useState<string | null>(null);
    const [sectors, setSectors] = useState<any[]>([]);
    const [availabilityItems, setAvailabilityItems] = useState<any[]>([]);
    const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
    const [selectedSystemTab, setSelectedSystemTab] = useState(() => {
        return localStorage.getItem(`unit_sector_${unit.id}`) || 'Tratamento Preliminar';
    });
    const [isAssetsModalOpen, setIsAssetsModalOpen] = useState(false);
    const [modalAssets, setModalAssets] = useState<Asset[]>([]);
    const [isLoadingAssets, setIsLoadingAssets] = useState(false);
    const [selectedTagName, setSelectedTagName] = useState('');
    const [selectedTagDetails, setSelectedTagDetails] = useState('');
    const [isMovedAssetsModalOpen, setIsMovedAssetsModalOpen] = useState(false);
    const [movedAssets, setMovedAssets] = useState<OrderVisitAssetView[]>([]);
    const [isLoadingMovedAssets, setIsLoadingMovedAssets] = useState(false);
    const [movedTagName, setMovedTagName] = useState('');
    const [movedTagDetails, setMovedTagDetails] = useState('');

    // Persist sector selection
    useEffect(() => {
        if (selectedSystemTab && selectedSystemTab !== 'Tratamento Preliminar') {
            localStorage.setItem(`unit_sector_${unit.id}`, selectedSystemTab);
        }
    }, [selectedSystemTab, unit.id]);

    // Restore modal state if returning from asset details
    useEffect(() => {
        const savedModal = localStorage.getItem(`unit_modal_${unit.id}`);
        if (savedModal) {
            try {
                const { tagId, tagName, tagDetails } = JSON.parse(savedModal);
                handleShowAssets(tagId, tagName, tagDetails);
            } catch (e) {
                console.error("Error restoring modal state", e);
            }
        }
    }, [unit.id]);

    const handleShowAssets = async (tagId: string, tagName: string, tagDetails: string) => {
        setIsLoadingAssets(true);
        setSelectedTagName(tagName);
        setSelectedTagDetails(tagDetails);
        setIsAssetsModalOpen(true);

        // Save state for restoration if user navigates to asset details
        localStorage.setItem(`unit_modal_${unit.id}`, JSON.stringify({ tagId, tagName, tagDetails }));

        try {
            const assets = await dataService.getAssets('all', '', unit.id, tagId);
            setModalAssets(assets);
        } catch (error) {
            console.error('Error loading assets', error);
            toast.error('Erro ao carregar ativos');
        } finally {
            setIsLoadingAssets(false);
        }
    };

    const handleShowMovedAssets = async (unitAssetTagId: string, tagName: string, tagDetails: string) => {
        setIsLoadingMovedAssets(true);
        setMovedTagName(tagName);
        setMovedTagDetails(tagDetails);
        setIsMovedAssetsModalOpen(true);

        try {
            const assets = await dataService.getMovedAssetsByUnitAssetTagId(unitAssetTagId);
            setMovedAssets(assets);
        } catch (error) {
            console.error('Error loading moved assets', error);
            toast.error('Erro ao carregar ativos movidos');
        } finally {
            setIsLoadingMovedAssets(false);
        }
    };

    const handleMovedAssetClick = (ova: OrderVisitAssetView) => {
        const asset: Asset = {
            id: ova.assetId,
            code: ova.code,
            description: ova.description,
            brand: ova.brand,
            model: ova.model,
            serial: ova.serial,
            location: ova.location,
            unitId: ova.beforeUnitId,
            unitDescriptionFull: ova.beforeUnitDescription,
            statusId: ova.beforeStatusId,
            statusCode: ova.beforeStatusDescription,
            statusColor: ova.beforeStatusColor,
            statusAt: ova.beforeStatusAt,
            imgUrl: ova.imgUrl,
        };
        onSelectAsset?.(asset);
    };

    if (!canView('units')) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-background-light dark:bg-slate-950">
                <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-red-500 text-[40px]">lock</span>
                </div>
                <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-2">Acesso Negado</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mb-6">
                    Você não tem permissão para visualizar os detalhes desta unidade.
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

    useEffect(() => {
        const loadSectors = async () => {
            if (unit?.id) {
                try {
                    const data = await dataService.getUnitAssetTags(unit.id);
                    setSectors(data);
                    if (data.length > 0) {
                        setSelectedSector(data[0].id);
                    }
                } catch (error) {
                    console.error('Failed to load sectors', error);
                }
            }
        };
        loadSectors();
    }, [unit?.id]);

    useEffect(() => {
        const loadAvailability = async () => {
            if (unit?.id && selectedSector) {
                setIsLoadingAvailability(true);
                try {
                    const data = await dataService.getUnitAssetTagsItems(unit.id, selectedSector);
                    setAvailabilityItems(data);
                } catch (error) {
                    console.error('Failed to load availability items', error);
                } finally {
                    setIsLoadingAvailability(false);
                }
            } else {
                setAvailabilityItems([]);
            }
        };
        loadAvailability();
    }, [unit?.id, selectedSector]);

    // Mock data for the specific image layout
    const stats = [
        { label: 'SERVIÇOS', value: '3', icon: 'construction', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
        { label: 'ALERTAS', value: '1', icon: 'warning', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
        { label: 'TÉCNICOS', value: '4', icon: 'groups', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    ];

    const recentAlerts = [
        { id: '1', type: 'critical', message: 'Nível crítico no reservatório de entrada', time: '10 min atrás' },
        { id: '2', type: 'warning', message: 'Manutenção preventiva agendada para amanhã', time: '2h atrás' },
    ];


    const operationalSystems = [
        { name: 'Tratamento Preliminar', status: 'online', components: 8 },
        { name: 'Decantação Primária', status: 'maintenance', components: 4 },
        { name: 'Tratamento Biológico', status: 'online', components: 12 },
        { name: 'Desinfecção', status: 'standby', components: 6 },
    ];



    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-slate-950 text-slate-900 dark:text-white relative">
            <div className={`flex-1 overflow-y-auto no-scrollbar relative transition-all duration-500 ${isHeaderExpanded ? 'overflow-hidden' : ''}`}>
                {/* Hero Cover Image */}
                <div
                    onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
                    className={`w-full relative border-b border-slate-100 dark:border-slate-800 overflow-hidden transition-all duration-700 ease-in-out cursor-pointer group ${isHeaderExpanded ? 'h-[75vh] md:h-[85vh]' : 'aspect-video md:aspect-auto md:h-[350px]'
                        } `}
                >
                    <Avatar
                        src={unit.logoUrl}
                        alt={unit.description}
                        shape="rounded"
                        className="w-full! h-full! rounded-none! border-none! shadow-none! transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Subtle Overlay */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

                    {/* Expand Indicator */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black/20 backdrop-blur-md rounded-full p-4 border border-white/20">
                            <span className="material-symbols-outlined text-white text-3xl">
                                {isHeaderExpanded ? 'close_fullscreen' : 'expand_content'}
                            </span>
                        </div>
                    </div>

                    {/* Top Actions: Menu */}
                    <div className="absolute top-4 right-4 z-30" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                            <IconButton
                                icon="more_vert"
                                onClick={() => setShowMenu(!showMenu)}
                                variant="soft"
                                className="bg-white/80! dark:bg-slate-900/80! backdrop-blur-md shadow-lg text-slate-700! dark:text-slate-200!"
                            />

                            {showMenu && (
                                <>
                                    <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-card-dark rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 z-30 py-1 overflow-hidden">
                                        {onEdit && canEdit('units') && (
                                            <button
                                                onClick={() => { setShowMenu(false); onEdit(); }}
                                                className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[20px] text-slate-400">edit</span>
                                                <span className="font-medium">Editar</span>
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Expand/Collapse Label */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 opacity-0 group-hover:opacity-100">
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                            {isHeaderExpanded ? 'Toque para fechar' : 'Toque para expandir'}
                        </span>
                    </div>
                </div>

                <div className={`p-4 space-y-8 pb-32 relative md:max-w-5xl md:mx-auto transition-all duration-700 ease-in-out ${isHeaderExpanded ? 'translate-y-20 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
                    }`}>
                    {/* Unit Card Styled like UnitsSearch (Chevron removed) */}
                    <UnitCardDetail unit={unit} />

                    {/* Setores (Sectors) - From User Image 2 */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Setores</h3>
                            <div className="flex items-center gap-2">
                                <AssetsListPDFButton
                                    unitId={unit.id}
                                    unitName={unit.description}
                                />
                                <IconButton
                                    icon="storage"
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl! border-blue-500/30! text-blue-500! hover:bg-blue-500/10!"
                                />
                                <IconButton
                                    icon="table_chart"
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl! border-indigo-500/30! text-indigo-500! hover:bg-indigo-500/10!"
                                />
                                <IconButton
                                    icon="add"
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl! border-primary/30! text-primary! hover:bg-primary/10!"
                                />
                            </div>
                        </div>

                        <div className="flex overflow-x-auto no-scrollbar gap-4 -mx-5 px-5 pb-2">
                            {sectors.map((sector) => (
                                <div
                                    key={sector.id}
                                    onClick={() => setSelectedSector(sector.id)}
                                    className={`shrink-0 w-[130px] h-[130px] bg-white dark:bg-card-dark rounded-xl p-3 shadow-sm border-2 transition-all cursor-pointer flex flex-col items-center justify-between hover:border-primary/50 group ${selectedSector === sector.id
                                        ? 'border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/10'
                                        : 'border-slate-200 dark:border-slate-800'
                                        }`}
                                >
                                    {/* Label with specific Image 2 layout (centered text at top) */}
                                    <div className="flex flex-col items-center text-center min-h-[28px] justify-start mt-1">
                                        <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate w-full">
                                            {sector.name}
                                        </h4>
                                        {sector.subtitle && (
                                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                                                {sector.subtitle}
                                            </p>
                                        )}
                                    </div>

                                    {/* Gauge (acting as the icon/visual focus) */}
                                    <div className="flex justify-center py-1">
                                        <CircularGauge
                                            percentage={sector.progress}
                                            color={
                                                sector.progress <= 50 ? "text-red-500 dark:text-red-400" :
                                                    sector.progress <= 85 ? "text-orange-500 dark:text-orange-400" :
                                                        "text-green-500 dark:text-green-400"
                                            }
                                        />
                                    </div>

                                    {/* Footer (Time) */}
                                    <div className="text-center">
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                            {sector.lastUpdate}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {/* Add Sector Card */}
                            <div
                                className="shrink-0 w-[130px] h-[130px] bg-slate-50/50 dark:bg-slate-900/30 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col items-center justify-between cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
                            >
                                <div className="flex flex-col items-center text-center min-h-[28px] justify-start mt-1">
                                    <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Novo Setor</h4>
                                    <p className="text-[9px] font-bold text-transparent select-none mt-0.5 line-clamp-1">Spacer</p>
                                </div>

                                <div className="flex justify-center py-1">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 group-hover:text-primary transition-colors">add</span>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                        Adicionar
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Availability Section (Disponibilidade) - New */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Disponibilidade</h3>
                            <button className="w-10 h-10 flex items-center justify-center bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-transform">
                                <span className="material-symbols-outlined text-[24px]">description</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {isLoadingAvailability ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : availabilityItems.length === 0 ? (
                                <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                                    Nenhum item de disponibilidade encontrado.
                                </div>
                            ) : availabilityItems.map((item) => (
                                <div key={item.id} className="group relative bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30 active:scale-[0.98] cursor-pointer overflow-hidden">
                                    {/* Gradient Accent */}
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary via-primary-dark to-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                                    {/* Header with Title and Icon+Date */}
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider mb-1">
                                                {item.name}
                                            </h4>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight">
                                                {item.details}
                                            </p>
                                            {item.subtitle && (
                                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1">
                                                    {item.subtitle}
                                                </p>
                                            )}
                                        </div>

                                        {/* Icon and Date on the right */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                                    {item.time}
                                                </span>
                                                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                                    {item.relativeTime}
                                                </span>
                                            </div>
                                            <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${item.status === 'ready'
                                                ? 'bg-linear-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-500/40 dark:shadow-teal-500/30'
                                                : 'bg-linear-to-br from-slate-400 to-slate-500 shadow-lg shadow-slate-500/40 dark:shadow-slate-500/30'
                                                }`}>
                                                {/* Glow effect */}
                                                <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                                <span className="material-symbols-outlined text-white text-[28px] relative z-10 drop-shadow-sm" style={{ fontVariationSettings: '"FILL" 1, "wght" 400' }}>
                                                    thumb_down
                                                </span>
                                            </div>
                                        </div>


                                    </div>

                                    {/* Footer Actions */}
                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                        <button className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 border-2 border-blue-600 rounded-2xl text-blue-600 active:scale-95 transition-transform hover:bg-blue-50 dark:hover:bg-slate-700">
                                            <span className="material-symbols-outlined text-[24px]">more_vert</span>
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleShowMovedAssets(item.id, item.name, item.details); }}
                                                className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 border-2 border-orange-500/30 rounded-2xl text-orange-500 active:scale-95 transition-transform hover:bg-orange-50 dark:hover:bg-slate-700"
                                                title="Ativos movidos deste setor"
                                            >
                                                <span className="material-symbols-outlined text-[24px]">swap_vert</span>
                                            </button>
                                            <button
                                                onClick={() => handleShowAssets(item.id, item.name, item.details)}
                                                className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 border-2 border-blue-600/30 rounded-2xl text-blue-600 active:scale-95 transition-transform hover:bg-blue-50 dark:hover:bg-slate-700"
                                            >
                                                <span className="material-symbols-outlined text-[24px]">directions_car</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Assets Modal */}
                    <Modal
                        isOpen={isAssetsModalOpen}
                        onClose={() => {
                            setIsAssetsModalOpen(false);
                            localStorage.removeItem(`unit_modal_${unit.id}`);
                        }}
                        title={
                            <div className="flex flex-col py-1">
                                <span className="text-[13px] font-black text-slate-400 dark:text-slate-500 uppercase leading-tight tracking-wide">
                                    {selectedTagName}
                                </span>
                                {selectedTagDetails && (
                                    <span className="text-[19px] font-black text-slate-900 dark:text-white uppercase leading-none mt-1.5 tracking-tight">
                                        {selectedTagDetails}
                                    </span>
                                )}
                            </div>
                        }
                        maxWidth="lg"
                        noPadding
                    >
                        <div className="p-3 min-h-[300px]">
                            {isLoadingAssets ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                                    <p className="text-slate-500 font-bold animate-pulse">CARREGANDO ATIVOS...</p>
                                </div>
                            ) : modalAssets.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">inventory_2</span>
                                    <p className="text-slate-500 font-bold">Nenhum ativo encontrado para este setor.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 max-h-[70vh] overflow-y-auto no-scrollbar pb-6">
                                    {modalAssets.map(asset => (
                                        <AssetCard
                                            key={asset.id}
                                            asset={asset}
                                            onClick={() => onSelectAsset?.(asset)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </Modal>

                    {/* Moved Assets Modal */}
                    <Modal
                        isOpen={isMovedAssetsModalOpen}
                        onClose={() => setIsMovedAssetsModalOpen(false)}
                        title={
                            <div className="flex flex-col py-1">
                                <span className="text-[13px] font-black text-slate-400 dark:text-slate-500 uppercase leading-tight tracking-wide">
                                    {movedTagName}
                                </span>
                                {movedTagDetails && (
                                    <span className="text-[19px] font-black text-slate-900 dark:text-white uppercase leading-none mt-1.5 tracking-tight">
                                        {movedTagDetails}
                                    </span>
                                )}
                                <span className="text-[13px] font-black text-orange-400 dark:text-orange-500 uppercase leading-tight tracking-wide flex items-center gap-1.5 mt-1">
                                    ATIVOS MOVIDOS
                                    <span className="material-symbols-outlined text-[14px]">swap_vert</span>
                                </span>
                            </div>
                        }
                        maxWidth="lg"
                        noPadding
                    >
                        <div className="p-3 min-h-[300px]">
                            {isLoadingMovedAssets ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
                                    <p className="text-slate-500 font-bold animate-pulse">CARREGANDO ATIVOS MOVIDOS...</p>
                                </div>
                            ) : movedAssets.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">move_item</span>
                                    <p className="text-slate-500 font-bold">Nenhum ativo movido encontrado para este setor.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 max-h-[70vh] overflow-y-auto no-scrollbar pb-6">
                                    {movedAssets.map(ova => (
                                        <div
                                            key={ova.id}
                                            onClick={() => handleMovedAssetClick(ova)}
                                            className="group relative bg-white dark:bg-slate-900 rounded-[12px] border border-orange-200 dark:border-orange-900/40 shadow-sm overflow-hidden p-4 cursor-pointer active:scale-[0.98] transition-all hover:border-orange-400 dark:hover:border-orange-500"
                                        >
                                            <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-orange-400 to-orange-500" />
                                            <div className="flex items-stretch justify-between gap-3 mb-3">
                                                <div
                                                    className="text-white rounded-[12px] px-4 py-2 flex items-center shadow-sm"
                                                    style={{ backgroundColor: ova.beforeStatusColor || '#f97316' }}
                                                >
                                                    <div className="flex flex-col leading-tight">
                                                        <span className="text-[14px] font-bold tracking-tight uppercase">{ova.code}</span>
                                                        <div className="flex items-center gap-2.5 mt-[10px]">
                                                            <span className="text-[9px] font-black uppercase tracking-wider">{ova.beforeStatusDescription || 'MOVIDO'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end justify-center gap-1">
                                                    <span className="inline-flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full">
                                                        <span className="material-symbols-outlined text-[11px]">swap_vert</span>
                                                        MOVIDO
                                                    </span>
                                                </div>
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight uppercase mb-2">{ova.description}</h3>
                                            {ova.afterUnitDescription && (
                                                <div className="flex flex-col gap-[2px]">
                                                    <span className="text-[9px] text-orange-400 dark:text-orange-500 font-extrabold uppercase leading-none">Destino</span>
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase leading-tight">
                                                        {ova.afterUnitDescription}
                                                        {ova.afterUnitAssetTagDescription ? ` › ${ova.afterUnitAssetTagDescription}` : ''}
                                                    </span>
                                                </div>
                                            )}
                                            {ova.movedComments && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">{ova.movedComments}</p>
                                            )}
                                            <div className="mt-3 pt-3 border-t border-orange-100 dark:border-orange-900/30 flex items-center justify-between">
                                                <span className="text-[10px] text-slate-400 font-bold">{ova.ovMask || ova.orderMask || ''}</span>
                                                <span className="text-[10px] text-slate-400 font-bold">{ova.oTeamLeaderNameShort || ''}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Modal>

                </div>
            </div>
        </div>
    );
};
