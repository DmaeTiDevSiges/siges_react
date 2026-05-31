import React, { useEffect, useState, useRef } from 'react';
import { Company, User, OrderVisit, OrderVisitTeam } from '../../types';
import { dataService } from '../../services/dataService';
import { Map as LeafletMap, Marker } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { OptimizedImage } from '../../components/ui/OptimizedImage';
import { getInitials } from '../../utils/formatters';

interface UsersTrackerProps {
    company: Company;
    onBack?: () => void;
}

export const UsersTracker: React.FC<UsersTrackerProps> = ({ company, onBack }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [leaders, setLeaders] = useState<User[]>([]);
    const [todayVisits, setTodayVisits] = useState<OrderVisit[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLeaderId, setSelectedLeaderId] = useState<string | null>(null);
    const [visitStatusFilter, setVisitStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
    
    const [selectedVisitIds, setSelectedVisitIds] = useState<Set<string>>(new Set());
    const [unitsData, setUnitsData] = useState<Record<string, { lat: number, lng: number, imageUrl?: string }>>({});
    const [visitsTeams, setVisitsTeams] = useState<Record<string, OrderVisitTeam[]>>({});
    
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMapRef = useRef<LeafletMap | null>(null);
    const markersRef = useRef<Map<string, Marker>>(new Map());
    const polylinesRef = useRef<L.Polyline[]>([]);
    const routesCacheRef = useRef<Map<string, { geometry: [number, number][], lastPos: [number, number] }>>(new Map());
    const unitMarkersRef = useRef<Map<string, L.Marker>>(new Map());
    const isFirstLoadRef = useRef(true);

    // Paleta de cores para visitas selecionadas (cada visita ganha uma cor única)
    const VISIT_COLORS = [
        '#6366F1', // Indigo
        '#F59E0B', // Amber
        '#10B981', // Emerald
        '#EF4444', // Red
        '#8B5CF6', // Violet
        '#06B6D4', // Cyan
        '#F97316', // Orange
        '#EC4899', // Pink
    ];

    // Mapeia visitId -> cor (persistente enquanto selecionado)
    const visitColorMapRef = useRef<Map<string, string>>(new Map());

    const getVisitColor = (visitId: string, allSelected: Set<string>): string => {
        if (!visitColorMapRef.current.has(visitId)) {
            // Remove cores de visitas que não estão mais selecionadas
            visitColorMapRef.current.forEach((_, id) => {
                if (!allSelected.has(id)) visitColorMapRef.current.delete(id);
            });
            const usedColors = new Set(visitColorMapRef.current.values());
            const nextColor = VISIT_COLORS.find(c => !usedColors.has(c)) || VISIT_COLORS[visitColorMapRef.current.size % VISIT_COLORS.length];
            visitColorMapRef.current.set(visitId, nextColor);
        }
        return visitColorMapRef.current.get(visitId)!;
    };

    // 1. Subscribe to users
    useEffect(() => {
        const loadInitialData = async () => {
            const [allUsers, allLeaders, visits] = await Promise.all([
                dataService.getUsersByCompany(company.id),
                dataService.getLeadersByCompany(company.id),
                dataService.getTodayVisitsByCompany(company.id)
            ]);
            setUsers(allUsers);
            setLeaders(allLeaders);
            setTodayVisits(visits);

            // Fetch teams in bulk for all today's visits
            const visitIds = visits.map(v => v.id);
            if (visitIds.length > 0) {
                const teams = await dataService.getOrdersVisitsTeamsBulk(visitIds);
                setVisitsTeams(teams);
            }

            // Fetch coordinates for unique units involved in today's visits
            const uniqueUnitIds = [...new Set(visits.map(v => v.unitId).filter(Boolean) as string[])];
            if (uniqueUnitIds.length > 0) {
                // We fetch unit details for these IDs (coordinates are needed for routes)
                // In a production app, we'd have a bulk fetcher, for now we can iterate or use a query
                try {
                    const { data: units, error } = await dataService.getUnitsByIds(uniqueUnitIds);
                    if (!error && units) {
                        const coordsMap: Record<string, { lat: number, lng: number, imageUrl?: string }> = {};
                        units.forEach((u: any) => {
                            if (u.latitude && u.longitude) {
                                coordsMap[u.id] = { 
                                    lat: u.latitude, 
                                    lng: u.longitude,
                                    imageUrl: dataService.getPublicImageUrl(u.img_file_path, u.img_file_name) 
                                };
                            }
                        });
                        setUnitsData(coordsMap);
                    }
                } catch (e) {
                    console.error("Error loading units coordinates:", e);
                }
            }
        };
        loadInitialData();

        const userSub = dataService.subscribeToUsers(() => {
            loadInitialData();
        });

        const visitSub = dataService.subscribeToOrdersVisits(() => {
            loadInitialData();
        });

        return () => {
            userSub.unsubscribe();
            visitSub.unsubscribe();
        }
    }, [company.id]);

    // 2. Initialize Map (Run once)
    useEffect(() => {
        if (!mapRef.current) return;
        if (leafletMapRef.current) return; // Already initialized

        console.log("Initializing Leaflet Map...");

        try {
            // Fix for default marker icons
            // @ts-ignore
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            });
        } catch (e) {
            console.error("Error patching Leaflet icons:", e);
        }

        const mapInstance = L.map(mapRef.current, { zoomControl: false }).setView([-30.0346, -51.2177], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapInstance);

        L.control.zoom({ position: 'topright' }).addTo(mapInstance);

        leafletMapRef.current = mapInstance;

        // Cleanup on unmount
        return () => {
            mapInstance.remove();
            leafletMapRef.current = null;
        };
    }, []);

    const filteredVisits = todayVisits
        .filter(visit => {
            const matchesSearch = !searchQuery || 
                (visit.unitDescription || visit.clientName || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = visitStatusFilter === 'all' || 
                (visitStatusFilter === 'open' ? !visit.ovEndedAt : !!visit.ovEndedAt);
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            const dateA = a.ovStartedAt ? new Date(a.ovStartedAt).getTime() : 0;
            const dateB = b.ovStartedAt ? new Date(b.ovStartedAt).getTime() : 0;
            return dateB - dateA; // Ordem Decrescente
        });

    const filteredUsers = users.filter(user => {
        // Se nada estiver selecionado, o mapa deve ficar limpo
        if (selectedVisitIds.size === 0) return false;

        const matchesSearch = !searchQuery || 
            (user.nameShort || user.nameFull || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLeader = !selectedLeaderId || user.id === selectedLeaderId;
        
        // Se houver visitas selecionadas, mostramos APENAS os técnicos dessas visitas
        const isInFilteredVisits = todayVisits.some(visit => selectedVisitIds.has(visit.id) && visit.ovTeamLeadId === user.id);
        
        return matchesSearch && matchesLeader && isInFilteredVisits;
    });

    const toggleVisitSelection = (visitId: string) => {
        const visit = todayVisits.find(v => v.id === visitId);
        if (!visit || !!visit.ovEndedAt) return; // Só permite selecionar se NÃO estiver encerrada

        setSelectedVisitIds(prev => {
            const next = new Set(prev);
            if (next.has(visitId)) {
                next.delete(visitId);
            } else {
                next.add(visitId);
            }
            return next;
        });
    };

    // 2. Clear selections of visits that were ended
    useEffect(() => {
        if (selectedVisitIds.size === 0) return;
        
        setSelectedVisitIds(prev => {
            const next = new Set(prev);
            let changed = false;
            next.forEach(id => {
                const visit = todayVisits.find(v => v.id === id);
                if (!visit || !!visit.ovEndedAt) {
                    next.delete(id);
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    }, [todayVisits]);

    // 3. Update Markers (Run when filteredUsers change)
    useEffect(() => {
        const map = leafletMapRef.current;
        if (!map) return;

        // Clear existing markers that are no longer in filtered list
        const filteredUserIds = new Set(filteredUsers.map(u => u.id));
        markersRef.current.forEach((marker, userId) => {
            if (!filteredUserIds.has(userId)) {
                marker.remove();
                markersRef.current.delete(userId);
            }
        });

        // Clear existing unit markers
        unitMarkersRef.current.forEach(m => m.remove());
        unitMarkersRef.current.clear();

        const bounds = L.latLngBounds([]);
        const statusBorderColors = {
            available: '#EAB308', // Yellow
            busy: '#22C55E',      // Green
            unavailable: '#94A3B8' // Slate (Gray)
        };
        let hasHelpers = false;

        filteredUsers.forEach(user => {
            if (user.latitude && user.longitude) {
                hasHelpers = true;
                const lat = user.latitude;
                const lng = user.longitude;

                // Encontra a visita selecionada deste usuário para pegar a cor
                const userVisit = todayVisits.find(v => selectedVisitIds.has(v.id) && v.ovTeamLeadId === user.id);
                const visitColor = userVisit ? getVisitColor(userVisit.id, selectedVisitIds) : '#22C55E';

                const hasAvatar = user.avatarUrl && !user.avatarUrl.includes('noImageUser.png');
                const initials = getInitials(user.nameShort || user.nameFull);
                const avatarContent = hasAvatar
                    ? `<div style="background-image: url('${user.avatarUrl}'); width: 100%; height: 100%; background-size: cover; background-position: center;"></div>`
                    : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f0f7ff; color: #5a7b9a; font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 13px; font-weight: 800; letter-spacing: -0.02em; text-transform: uppercase;">${initials}</div>`;

                const iconHtml = `
                    <div style="display:flex;flex-direction:column;align-items:center;">
                        <div style="width:38px;height:38px;border-radius:50%;border:4px solid ${visitColor};box-shadow:0 4px 16px ${visitColor}55;overflow:hidden;display:flex;align-items:center;justify-content:center;background:white;">
                            ${avatarContent}
                        </div>
                        <div style="margin-top:3px;background:${visitColor};color:white;font-size:9px;font-weight:800;padding:1px 5px;border-radius:4px;white-space:nowrap;box-shadow:0 2px 6px ${visitColor}44;font-family:'Inter',sans-serif;">
                            ${user.nameShort || 'Técnico'}
                        </div>
                    </div>
                `;

                const icon = L.divIcon({ className: '', html: iconHtml, iconSize: [38, 60], iconAnchor: [19, 19] });

                if (markersRef.current.has(user.id)) {
                    const marker = markersRef.current.get(user.id);
                    if (marker) {
                        const currentPos = marker.getLatLng();
                        if (currentPos.lat !== lat || currentPos.lng !== lng) marker.setLatLng([lat, lng]);
                        marker.setIcon(icon);
                    }
                } else {
                    const marker = L.marker([lat, lng], { icon })
                        .addTo(map)
                        .bindTooltip(user.nameShort || user.nameFull || '', {
                            direction: 'top',
                            className: 'leaflet-tooltip-premium',
                            offset: [0, -15],
                            sticky: true
                        });
                    markersRef.current.set(user.id, marker);
                }
                bounds.extend([lat, lng]);
            }
        });

        // Add markers for all filtered units
        filteredVisits.forEach(visit => {
            if (selectedVisitIds.size === 0 || !selectedVisitIds.has(visit.id)) return;

            if (visit?.unitId && unitsData[visit.unitId]) {
                const data = unitsData[visit.unitId];
                const visitColor = getVisitColor(visit.id, selectedVisitIds);
                const initials = getInitials(visit.unitDescription || 'U');
                const avatarContent = data.imageUrl
                    ? `<div style="background-image: url('${data.imageUrl}'); width: 100%; height: 100%; background-size: cover; background-position: center;"></div>`
                    : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: ${visitColor}18; color: ${visitColor}; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 800;">${initials}</div>`;

                const unitIcon = L.divIcon({
                    className: '',
                    html: `
                        <div style="display: flex; flex-direction: column; align-items: center;">
                            <div style="width: 34px; height: 34px; border-radius: 8px; border: 3px solid ${visitColor}; box-shadow: 0 4px 14px ${visitColor}55; overflow: hidden; background: white; transform: scale(1.05);">
                                ${avatarContent}
                            </div>
                            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 7px solid ${visitColor}; margin-top: -1px;"></div>
                            <div style="margin-top:2px;background:${visitColor};color:white;font-size:8px;font-weight:800;padding:1px 5px;border-radius:4px;white-space:nowrap;max-width:90px;overflow:hidden;text-overflow:ellipsis;box-shadow:0 2px 6px ${visitColor}44;font-family:'Inter',sans-serif;">
                                ${(visit.unitDescription || 'Unidade').substring(0, 14)}
                            </div>
                        </div>
                    `,
                    iconSize: [40, 65],
                    iconAnchor: [20, 47]
                });

                const marker = L.marker([data.lat, data.lng], { icon: unitIcon, zIndexOffset: 1000 })
                    .addTo(map)
                    .bindTooltip(visit.unitDescription || 'Unidade', {
                        direction: 'top',
                        className: 'leaflet-tooltip-premium',
                        offset: [0, -45],
                        sticky: true
                    });

                unitMarkersRef.current.set(visit.id, marker);
                bounds.extend([data.lat, data.lng]);
            }
        });

        // Only auto-fit bounds on the very first load, leader change, or SELECTION change
        if ((hasHelpers || selectedVisitIds.size > 0) && (isFirstLoadRef.current || selectedLeaderId || selectedVisitIds.size > 0)) {
            map.fitBounds(bounds, { 
                paddingTopLeft: [50, 220], 
                paddingBottomRight: [50, 220] 
            });
            isFirstLoadRef.current = false;
        }
    }, [filteredUsers, selectedLeaderId, selectedVisitIds]);

    // 4. Update Routes (Polylines based on OSRM for realistic street paths)
    // Ref para evitar disparos múltiplos simultâneos e gerenciar o timeout
    const loadRoutesTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const map = leafletMapRef.current;
        if (!map || selectedVisitIds.size === 0) {
            polylinesRef.current.forEach(p => p.remove());
            polylinesRef.current = [];
            return;
        }

        // Debounce de 1000ms para evitar spam no OSRM durante movimentação real-time
        if (loadRoutesTimeoutRef.current) clearTimeout(loadRoutesTimeoutRef.current);

        loadRoutesTimeoutRef.current = setTimeout(async () => {
            console.log('[Routes] Inicidando carregador de rotas debounced. Visits:', [...selectedVisitIds]);
            
            // Vamos gerenciar quais polylines remover/adicionar de forma seletiva futuramente.
            // Por enquanto, limpamos apenas no início do disparo debounced.
            polylinesRef.current.forEach(p => p.remove());
            polylinesRef.current = [];

            for (const visitId of selectedVisitIds) {
                const visit = todayVisits.find(v => v.id === visitId);
                if (!visit || !visit.unitId) continue;

                const user = users.find(u => String(u.id) === String(visit.ovTeamLeadId));
                const unitCoords = unitsData[visit.unitId];
                if (!unitCoords) continue;

                const hasUserCoords = user?.latitude && user?.longitude;
                const startLat = hasUserCoords ? user!.latitude! : unitCoords.lat + 0.005;
                const startLng = hasUserCoords ? user!.longitude! : unitCoords.lng + 0.005;

                const currentPos: [number, number] = [startLat, startLng];
                // Chave de cache mais robusta
                const posKey = `${startLat.toFixed(5)},${startLng.toFixed(5)}`;
                const unitKey = `${unitCoords.lat.toFixed(5)},${unitCoords.lng.toFixed(5)}`;
                const cacheKey = `${visitId}-${posKey}-${unitKey}`;
                
                const cached = routesCacheRef.current.get(cacheKey);

                let geometry: [number, number][] = [];

                if (cached) {
                    geometry = cached.geometry;
                } else {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 5000); // Reduzido para 5s para evitar lag

                        const url = `/osrm/route/v1/driving/${startLng},${startLat};${unitCoords.lng},${unitCoords.lat}?overview=full&geometries=geojson`;
                        
                        const response = await fetch(url, { signal: controller.signal });
                        clearTimeout(timeoutId);

                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        const data = await response.json();

                        if (data.routes && data.routes.length > 0) {
                            geometry = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number]);
                            routesCacheRef.current.set(cacheKey, { geometry, lastPos: currentPos });
                            console.log(`[Routes] OSRM v=${visitId} carregada com sucesso.`);
                        } else {
                            geometry = [currentPos, [unitCoords.lat, unitCoords.lng]];
                        }
                    } catch (e: any) {
                        const reason = e?.name === 'AbortError' ? 'timeout (5s)' : e?.message;
                        console.warn(`[Routes] OSRM v=${visitId} falhou (${reason}), usando linha reta.`);
                        geometry = [currentPos, [unitCoords.lat, unitCoords.lng]];
                    }
                }

                if (geometry.length > 0) {
                    const visitColor = getVisitColor(visitId, selectedVisitIds);
                    
                    const shadow = L.polyline(geometry, { color: visitColor, weight: 9, opacity: 0.15, lineCap: 'round' }).addTo(map);
                    const main = L.polyline(geometry, { color: visitColor, weight: 5, opacity: 0.85, lineCap: 'round', className: 'routing-line' }).addTo(map);
                    const dash = L.polyline(geometry, { color: 'white', weight: 2, opacity: 0.5, dashArray: '8, 12', lineCap: 'round' }).addTo(map);

                    polylinesRef.current.push(shadow, main, dash);
                }
            }
        }, 1000);

        return () => {
            if (loadRoutesTimeoutRef.current) clearTimeout(loadRoutesTimeoutRef.current);
        };
    }, [selectedVisitIds, users, unitsData, todayVisits]);

    return (
        <div className="relative h-full w-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
            {/* Map Area - Foundation Layer */}
            <div className="absolute inset-0 z-0">
                <div ref={mapRef} className="h-full w-full" />
            </div>

            {/* Header section - Overlay Layer (Search and Filters only) */}
            {/* Header section removed as requested */}



            {/* Footer section with Horizontal Visits List - Overlay Layer */}
            <div className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 right-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/30 dark:border-slate-700/30 p-3 z-10 shadow-[0_8px_32px_rgba(0,0,0,0.15)] rounded-2xl transition-all">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-white">Visitas de Hoje</span>
                        <div className="flex gap-1">
                            <button 
                                onClick={() => setVisitStatusFilter('all')}
                                className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold transition-colors ${visitStatusFilter === 'all' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'}`}
                            >Tudo</button>
                            <button 
                                onClick={() => setVisitStatusFilter('open')}
                                className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold transition-colors ${visitStatusFilter === 'open' ? 'bg-green-100 text-green-700 dark:bg-green-900/40' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'}`}
                            >Em Aberto</button>
                             <button 
                                onClick={() => setVisitStatusFilter('closed')}
                                className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold transition-colors ${visitStatusFilter === 'closed' ? 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'}`}
                            >Encerradas</button>
                        </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                        {filteredVisits.length} visitas
                    </span>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                    {filteredVisits.length === 0 ? (
                        <div className="flex w-full items-center justify-center py-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                            <span className="text-xs text-slate-400 italic">Nenhuma visita encontrada</span>
                        </div>
                    ) : (
                        filteredVisits.map(visit => {
                            const isClosed = !!visit.ovEndedAt;
                            const isSelected = selectedVisitIds.has(visit.id);

                            return (
                                <button 
                                    key={visit.id}
                                    onClick={() => toggleVisitSelection(visit.id)}
                                    className={`flex flex-col shrink-0 min-w-[280px] w-fit max-w-[400px] p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border transition-all relative overflow-hidden text-left ${visit.ovEndedAt ? 'opacity-60 cursor-default grayscale-[0.2]' : 'active:scale-[0.98] hover:shadow-lg cursor-pointer'} ${isSelected ? 'shadow-lg' : 'border-slate-200/50 dark:border-slate-700/50 shadow-sm'}`}
                                    style={isSelected ? { borderColor: getVisitColor(visit.id, selectedVisitIds), boxShadow: `0 4px 20px ${getVisitColor(visit.id, selectedVisitIds)}33`, outline: `2px solid ${getVisitColor(visit.id, selectedVisitIds)}44` } : {}}
                                >
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isClosed ? 'bg-slate-400 dark:bg-slate-600' : ''}`} style={!isClosed ? { backgroundColor: isSelected ? getVisitColor(visit.id, selectedVisitIds) : '#22C55E' } : {}} />
                                    
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                            <div className={`w-2 h-2 rounded-full ${isClosed ? 'bg-slate-400' : 'bg-green-500 animate-pulse'}`} />
                                            <span className="text-[10px] font-bold text-slate-800 dark:text-white truncate">
                                                {visit.unitDescription || 'Unidade N/D'}
                                            </span>
                                        </div>
                                        <span className="text-[9px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md shrink-0">
                                            {visit.ovMask || `#${visit.id}`}
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-2 mb-2">
                                        {/* Serviçõs Solicitados */}
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight py-1 italic">
                                            {visit.requestedServices || 'Manutenção Geral'}
                                        </p>

                                    </div>

                                    <div className="mt-auto pt-2 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {/* Avatar do Líder Deslocado para o Rodapé */}
                                            {(() => {
                                                const leaderTeam = (visitsTeams[visit.id] || []).find(m => m.isLeader);
                                                if (!leaderTeam) return null;
                                                
                                                // Busca o status em tempo real do líder na lista geral de usuários para garantir sincronia com o mapa
                                                const currentUser = users.find(u => u.id === leaderTeam.userId);
                                                
                                                const statusBorderColors = {
                                                    available: '#EAB308', // Amarelo (Disponível)
                                                    busy: '#22C55E',      // Verde (Em atividade)
                                                    unavailable: '#94A3B8' // Cinza (Indisponível)
                                                };

                                                const userStatus = currentUser 
                                                    ? (currentUser.isAvailable 
                                                        ? (currentUser.ovIdInProgress && Number(currentUser.ovIdInProgress) > 0 ? 'busy' : 'available')
                                                        : 'unavailable')
                                                    : 'unavailable';
                                                
                                                const borderColor = statusBorderColors[userStatus as keyof typeof statusBorderColors];

                                                return (
                                                    <div className="relative group/leader">
                                                        {leaderTeam.userAvatarUrl ? (
                                                            <img 
                                                                src={leaderTeam.userAvatarUrl} 
                                                                alt={leaderTeam.userName}
                                                                className="h-5 w-5 rounded-full object-cover ring-2 shadow-sm"
                                                                style={{ borderColor: borderColor, outline: `2px solid ${borderColor}` }}
                                                            />
                                                        ) : (
                                                            <div 
                                                                className="h-5 w-5 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[7px] font-bold shadow-sm"
                                                                style={{ color: borderColor, borderColor: borderColor, outline: `2px solid ${borderColor}` }}
                                                            >
                                                                {getInitials(leaderTeam.userName || 'L')}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                                                {isClosed ? 'Encerrada' : 'Em andamento'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[10px] text-slate-400">schedule</span>
                                            <span className="text-[9px] text-slate-400 font-medium">
                                                {isClosed 
                                                    ? (visit.ovEndedAt ? new Date(visit.ovEndedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A') 
                                                    : (visit.ovStartedAt ? new Date(visit.ovStartedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A')}
                                            </span>
                                        </div>
                                    </div>
                                    
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
