import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Company, User, OrderVisit, OrderVisitTeam } from '../../types';
import { dataService } from '../../services/dataService';
import { Map as LeafletMap, Marker } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { OptimizedImage } from '../../components/ui/OptimizedImage';
import { getInitials } from '../../utils/formatters';
import { haversineDistance, formatDistance } from '../../utils/geo';
import { UsersTeamsLeadersByCompanyId } from '../../components/UsersTeamsLeadersByCompanyId';
import { Capacitor } from '@capacitor/core';

const getRelativeTime = (isoString?: string): string => {
    if (!isoString) return 'Sem dados';
    const diff = Date.now() - new Date(isoString).getTime();
    if (isNaN(diff) || diff < 0) return 'Agora';
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `há ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `há ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours} h`;
    const days = Math.floor(hours / 24);
    return `há ${days} dia${days > 1 ? 's' : ''}`;
};

const getRelativeTimeShort = (isoString?: string): string => {
    if (!isoString) return '·';
    const diff = Date.now() - new Date(isoString).getTime();
    if (isNaN(diff) || diff < 0) return 'agora';
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
};

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
    const [routeDistances, setRouteDistances] = useState<Record<string, number>>({});

    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMapRef = useRef<LeafletMap | null>(null);
    const markersRef = useRef<Map<string, Marker>>(new Map());
    const polylinesRef = useRef<L.Polyline[]>([]);
    const routesCacheRef = useRef<Map<string, { geometry: [number, number][], lastPos: [number, number], distance: number }>>(new Map());
    const unitMarkersRef = useRef<Map<string, L.Marker>>(new Map());
    const pinnedMarkersRef = useRef<Map<string, L.Marker>>(new Map());
    const isFirstLoadRef = useRef(true);
    const preselectDoneRef = useRef(false);
    const prevSelectedVisitIdsRef = useRef<Set<string>>(new Set());
    const prevSelectedLeaderIdRef = useRef<string | null>(null);
    const prevPinnedTechIdsRef = useRef<Set<string>>(new Set());
    const routeAbortRef = useRef<Map<string, AbortController>>(new Map());
    const pullStartRef = useRef<number | null>(null);
    const pullDistRef = useRef(0);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isFooterCollapsed, setIsFooterCollapsed] = useState(false);
    const [pinnedTechIds, setPinnedTechIds] = useState<Set<string>>(new Set());

    const VISIT_COLORS = [
        '#6366F1', '#F59E0B', '#10B981', '#EF4444',
        '#8B5CF6', '#06B6D4', '#F97316', '#EC4899',
    ];

    const visitColorMapRef = useRef<Map<string, string>>(new Map());

    const getVisitColor = (visitId: string, allSelected: Set<string>): string => {
        if (!visitColorMapRef.current.has(visitId)) {
            visitColorMapRef.current.forEach((_, id) => {
                if (!allSelected.has(id)) visitColorMapRef.current.delete(id);
            });
            const usedColors = new Set(visitColorMapRef.current.values());
            const nextColor = VISIT_COLORS.find(c => !usedColors.has(c)) || VISIT_COLORS[visitColorMapRef.current.size % VISIT_COLORS.length];
            visitColorMapRef.current.set(visitId, nextColor);
        }
        return visitColorMapRef.current.get(visitId)!;
    };

    // Filter counts
    const filterCounts = {
        all: todayVisits.length,
        open: todayVisits.filter(v => !v.ovEndedAt).length,
        closed: todayVisits.filter(v => !!v.ovEndedAt).length,
    };

    // Data loading
    const loadInitialData = useCallback(async () => {
        const [allUsers, allLeaders, visits] = await Promise.all([
            dataService.getUsersByCompany(company.id),
            dataService.getLeadersByCompany(company.id),
            dataService.getTodayVisitsByCompany(company.id)
        ]);
        setUsers(allUsers);
        setLeaders(allLeaders);
        setTodayVisits(visits);

        // Pre-select open visits on first load so technicians appear selected by default
        if (!preselectDoneRef.current) {
            preselectDoneRef.current = true;
            const openVisitIds = visits.filter(v => !v.ovEndedAt).map(v => v.id);
            if (openVisitIds.length > 0) {
                setSelectedVisitIds(new Set(openVisitIds));
            }
        }

        const visitIds = visits.map(v => v.id);
        if (visitIds.length > 0) {
            const teams = await dataService.getOrdersVisitsTeamsBulk(visitIds);
            setVisitsTeams(teams);
        }

        const uniqueUnitIds = [...new Set(visits.map(v => v.unitId).filter(Boolean) as string[])];
        if (uniqueUnitIds.length > 0) {
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
    }, [company.id]);

    // #7 Pull-to-refresh handlers
    const handlePullTouchStart = useCallback((e: React.TouchEvent) => {
        pullStartRef.current = e.touches[0].clientY;
    }, []);

    const handlePullTouchMove = useCallback((e: React.TouchEvent) => {
        if (pullStartRef.current === null) return;
        const dist = e.touches[0].clientY - pullStartRef.current;
        if (dist > 0 && dist < 120) {
            pullDistRef.current = dist;
            setPullDistance(dist);
        }
    }, []);

    const handlePullTouchEnd = useCallback(async () => {
        if (pullDistRef.current > 60) {
            setIsRefreshing(true);
            await loadInitialData();
            setIsRefreshing(false);
        }
        pullDistRef.current = 0;
        pullStartRef.current = null;
        setPullDistance(0);
    }, [loadInitialData]);

    // Subscribe to real-time updates
    useEffect(() => {
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
            // Cancel any in-flight route requests
            routeAbortRef.current.forEach(ctrl => ctrl.abort());
            routeAbortRef.current.clear();
        };
    }, [loadInitialData]);

    // Initialize Map
    useEffect(() => {
        if (!mapRef.current) return;
        if (leafletMapRef.current) return;

        try {
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

        const mapInstance = L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: false,
        }).setView([-30.0346, -51.2177], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
        }).addTo(mapInstance);

        L.control.zoom({ position: 'topright' }).addTo(mapInstance);

        setTimeout(() => {
            mapInstance.invalidateSize();
            const container = mapInstance.getContainer();
            container.style.border = 'none';
            container.style.outline = 'none';
        }, 0);

        leafletMapRef.current = mapInstance;

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
            return dateB - dateA;
        });

    const filteredUsers = users.filter(user => {
        if (selectedVisitIds.size === 0) return false;
        const matchesSearch = !searchQuery ||
            (user.nameShort || user.nameFull || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLeader = !selectedLeaderId || user.id === selectedLeaderId;
        const isInFilteredVisits = todayVisits.some(visit => selectedVisitIds.has(visit.id) && visit.ovTeamLeadId === user.id);
        return matchesSearch && matchesLeader && isInFilteredVisits;
    });

    const toggleVisitSelection = (visitId: string) => {
        const visit = todayVisits.find(v => v.id === visitId);
        if (!visit || !!visit.ovEndedAt) return;

        setSelectedVisitIds(prev => {
            const next = new Set(prev);
            if (next.has(visitId)) {
                next.delete(visitId);
                // Cancel route for deselected visit
                const ctrl = routeAbortRef.current.get(visitId);
                if (ctrl) { ctrl.abort(); routeAbortRef.current.delete(visitId); }
                routesCacheRef.current.forEach((_, key) => {
                    if (key.startsWith(visitId + '-')) routesCacheRef.current.delete(key);
                });
            } else {
                next.add(visitId);
            }
            return next;
        });

        // Centralizar no mapa: técnico + unidade
        const isDeselecting = selectedVisitIds.has(visitId);
        if (!isDeselecting) {
            const map = leafletMapRef.current;
            if (map) {
                const bounds = L.latLngBounds([]);
                const user = users.find(u => String(u.id) === String(visit.ovTeamLeadId));
                if (user?.latitude && user?.longitude) {
                    bounds.extend([user.latitude, user.longitude]);
                }
                const unitCoords = unitsData[visit.unitId];
                if (unitCoords) {
                    bounds.extend([unitCoords.lat, unitCoords.lng]);
                }
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { paddingTopLeft: [50, 220], paddingBottomRight: [50, 220], maxZoom: 16 });
                }
            }
        }
    };

    // Clear ended visits from selection
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

    // Update Markers
    useEffect(() => {
        const map = leafletMapRef.current;
        if (!map) return;

        const filteredUserIds = new Set(filteredUsers.map(u => u.id));
        markersRef.current.forEach((marker, userId) => {
            if (!filteredUserIds.has(userId)) {
                marker.remove();
                markersRef.current.delete(userId);
            }
        });

        unitMarkersRef.current.forEach(m => m.remove());
        unitMarkersRef.current.clear();

        const bounds = L.latLngBounds([]);
        let hasHelpers = false;

        filteredUsers.forEach(user => {
            if (user.latitude && user.longitude) {
                hasHelpers = true;
                const lat = user.latitude;
                const lng = user.longitude;

                const userVisit = todayVisits.find(v => selectedVisitIds.has(v.id) && v.ovTeamLeadId === user.id);
                const visitColor = userVisit ? getVisitColor(userVisit.id, selectedVisitIds) : '#22C55E';

                const hasAvatar = user.avatarUrl && !user.avatarUrl.includes('noImageUser.png');
                const initials = getInitials(user.nameShort || user.nameFull);
                const avatarContent = hasAvatar
                    ? `<div style="background-image: url('${user.avatarUrl}'); width: 100%; height: 100%; background-size: cover; background-position: center;"></div>`
                    : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f0f7ff; color: #5a7b9a; font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 13px; font-weight: 800; letter-spacing: -0.02em; text-transform: uppercase;">${initials}</div>`;

                // #1 Pulse animation + #3 Relative time badge
                const timeLabel = getRelativeTimeShort(user.trackerHeartbeatAt);
                const iconHtml = `
                    <div style="display:flex;flex-direction:column;align-items:center;">
                        <div style="background:${visitColor};color:white;font-size:9px;font-weight:800;padding:2px 6px;border-radius:5px;white-space:nowrap;box-shadow:0 2px 8px ${visitColor}44;font-family:'Inter',sans-serif;">
                            ${user.nameShort || 'Técnico'}
                        </div>
                        <div style="position:relative;margin-top:3px;">
                            <div class="tracker-pulse-ring" style="--pulse-color:${visitColor};width:40px;height:40px;border-radius:50%;border:3.5px solid ${visitColor};overflow:hidden;display:flex;align-items:center;justify-content:center;background:white;box-shadow:0 3px 12px ${visitColor}44;">
                                ${avatarContent}
                            </div>
                            <div style="position:absolute;bottom:-4px;right:-4px;background:${visitColor};color:white;font-size:8px;font-weight:800;padding:1px 4px;border-radius:6px;line-height:1.3;box-shadow:0 2px 6px ${visitColor}55;font-family:'Inter',sans-serif;white-space:nowrap;">
                                ${timeLabel}
                            </div>
                        </div>
                    </div>
                `;

                const icon = L.divIcon({ className: '', html: iconHtml, iconSize: [40, 65], iconAnchor: [20, 55] });

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
                        .bindTooltip(getRelativeTime(user.trackerHeartbeatAt), {
                            direction: 'top',
                            className: 'leaflet-tooltip-premium',
                            offset: [0, -20],
                            sticky: true
                        });
                    markersRef.current.set(user.id, marker);
                }
                bounds.extend([lat, lng]);
            }
        });

        // Unit markers
        filteredVisits.forEach(visit => {
            if (selectedVisitIds.size === 0 || !selectedVisitIds.has(visit.id)) return;

            if (visit?.unitId && unitsData[visit.unitId]) {
                const data = unitsData[visit.unitId];
                const visitColor = getVisitColor(visit.id, selectedVisitIds);
                const initials = getInitials(visit.unitDescription || 'U');
                const avatarContent = data.imageUrl
                    ? `<div style="background-image: url('${data.imageUrl}'); width: 100%; height: 100%; background-size: cover; background-position: center;"></div>`
                    : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: ${visitColor}18; color: ${visitColor}; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 800;">${initials}</div>`;

                // #10 Show distance on unit marker
                const dist = routeDistances[visit.id];

                const unitIcon = L.divIcon({
                    className: '',
                    html: `
                        <div style="display: flex; flex-direction: column; align-items: center;">
                            <div style="background:${visitColor};color:white;font-size:8px;font-weight:800;padding:1px 5px;border-radius:4px;white-space:nowrap;max-width:90px;overflow:hidden;text-overflow:ellipsis;box-shadow:0 2px 6px ${visitColor}44;font-family:'Inter',sans-serif;">
                                ${(visit.unitDescription || 'Unidade').substring(0, 14)}
                            </div>
                            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 7px solid ${visitColor}; margin-top: -1px;"></div>
                            <div style="width: 34px; height: 34px; border-radius: 8px; border: 3px solid ${visitColor}; box-shadow: 0 4px 14px ${visitColor}55; overflow: hidden; background: white; transform: scale(1.05);">
                                ${avatarContent}
                            </div>
                            ${dist ? `<div style="margin-top:3px;background:white;color:${visitColor};font-size:8px;font-weight:800;padding:1px 4px;border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.15);font-family:'Inter',sans-serif;">${formatDistance(dist)}</div>` : ''}
                        </div>
                    `,
                    iconSize: [40, 75],
                    iconAnchor: [20, 50]
                });

                const marker = L.marker([data.lat, data.lng], { icon: unitIcon, zIndexOffset: 1000 })
                    .addTo(map)
                    .bindTooltip(visit.unitDescription || 'Unidade', {
                        direction: 'top',
                        className: 'leaflet-tooltip-premium',
                        offset: [0, -50],
                        sticky: true
                    });

                unitMarkersRef.current.set(visit.id, marker);
                bounds.extend([data.lat, data.lng]);
            }
        });

        const selectionChanged =
            selectedLeaderId !== prevSelectedLeaderIdRef.current ||
            selectedVisitIds.size !== prevSelectedVisitIdsRef.current.size ||
            [...selectedVisitIds].some(id => !prevSelectedVisitIdsRef.current.has(id));

        if ((hasHelpers || selectedVisitIds.size > 0) && (isFirstLoadRef.current || selectionChanged)) {
            map.fitBounds(bounds, {
                paddingTopLeft: [50, 220],
                paddingBottomRight: [50, 220]
            });
            isFirstLoadRef.current = false;
            prevSelectedLeaderIdRef.current = selectedLeaderId;
            prevSelectedVisitIdsRef.current = new Set(selectedVisitIds);
        }
    }, [filteredUsers, selectedLeaderId, selectedVisitIds, routeDistances]);

    // Pinned technician markers (toggled from avatar bar)
    useEffect(() => {
        const map = leafletMapRef.current;
        if (!map) return;

        // Remove markers no longer pinned
        pinnedMarkersRef.current.forEach((marker, userId) => {
            if (!pinnedTechIds.has(userId)) {
                marker.remove();
                pinnedMarkersRef.current.delete(userId);
            }
        });

        // Add/update markers for pinned technicians
        pinnedTechIds.forEach(techId => {
            const tech = users.find(u => u.id === techId);
            if (!tech?.latitude || !tech?.longitude) return;

            const hasAvatar = tech.avatarUrl && !tech.avatarUrl.includes('noImageUser.png');
            const initials = getInitials(tech.nameShort || tech.nameFull);
            const avatarContent = hasAvatar
                ? `<div style="background-image: url('${tech.avatarUrl}'); width: 100%; height: 100%; background-size: cover; background-position: center;"></div>`
                : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f0f7ff; color: #5a7b9a; font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 800; text-transform: uppercase;">${initials}</div>`;

            const timeLabel = getRelativeTimeShort(tech.trackerHeartbeatAt);

            const iconHtml = `
                <div style="display:flex;flex-direction:column;align-items:center;">
                    <div style="background:#6366F1;color:white;font-size:8px;font-weight:800;padding:2px 5px;border-radius:5px;white-space:nowrap;box-shadow:0 2px 8px #6366F144;font-family:'Inter',sans-serif;">
                        ${tech.nameShort || 'Técnico'}
                    </div>
                    <div style="position:relative;margin-top:3px;">
                        <div style="width:38px;height:38px;border-radius:50%;border:3.5px solid #6366F1;overflow:hidden;display:flex;align-items:center;justify-content:center;background:white;box-shadow:0 3px 12px #6366F144;">
                            ${avatarContent}
                        </div>
                        <div style="position:absolute;bottom:-4px;right:-4px;background:#6366F1;color:white;font-size:8px;font-weight:800;padding:1px 4px;border-radius:6px;line-height:1.3;box-shadow:0 2px 6px #6366F155;font-family:'Inter',sans-serif;white-space:nowrap;">
                            ${timeLabel}
                        </div>
                    </div>
                </div>
            `;

            const icon = L.divIcon({ className: '', html: iconHtml, iconSize: [38, 60], iconAnchor: [19, 55] });

            if (pinnedMarkersRef.current.has(techId)) {
                const marker = pinnedMarkersRef.current.get(techId);
                marker?.setLatLng([tech.latitude, tech.longitude]);
            } else {
                const marker = L.marker([tech.latitude, tech.longitude], { icon, zIndexOffset: 2000 })
                    .addTo(map);
                pinnedMarkersRef.current.set(techId, marker);
            }
        });

        // Só ajusta o mapa quando pinnedTechIds realmente mudou (não por atualização de GPS)
        const prev = prevPinnedTechIdsRef.current;
        const pinnedChanged =
            pinnedTechIds.size !== prev.size ||
            [...pinnedTechIds].some(id => !prev.has(id));

        if (pinnedChanged) {
            prevPinnedTechIdsRef.current = new Set(pinnedTechIds);

            const map2 = leafletMapRef.current;
            if (!map2) return;

            if (pinnedTechIds.size > 0) {
                // Há técnicos marcados — centraliza em todos eles
                const bounds = L.latLngBounds([]);
                pinnedTechIds.forEach(techId => {
                    const tech = users.find(u => u.id === techId);
                    if (tech?.latitude && tech?.longitude) {
                        bounds.extend([tech.latitude, tech.longitude]);
                    }
                });
                if (bounds.isValid()) {
                    map2.fitBounds(bounds, {
                        paddingTopLeft: [60, 220],
                        paddingBottomRight: [60, 180],
                        maxZoom: 16,
                        animate: true,
                    });
                }
            } else {
                // Nenhum marcado — volta a mostrar todos os usuários visíveis no mapa
                const bounds = L.latLngBounds([]);
                markersRef.current.forEach((_, userId) => {
                    const user = users.find(u => u.id === userId);
                    if (user?.latitude && user?.longitude) {
                        bounds.extend([user.latitude, user.longitude]);
                    }
                });
                if (bounds.isValid()) {
                    map2.fitBounds(bounds, {
                        paddingTopLeft: [50, 220],
                        paddingBottomRight: [50, 100],
                        animate: true,
                    });
                }
            }
        }
    }, [pinnedTechIds, users]);

    // #11 Update Routes with AbortController
    const loadRoutesTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const map = leafletMapRef.current;
        if (!map || selectedVisitIds.size === 0) {
            polylinesRef.current.forEach(p => p.remove());
            polylinesRef.current = [];
            return;
        }

        if (loadRoutesTimeoutRef.current) clearTimeout(loadRoutesTimeoutRef.current);

        loadRoutesTimeoutRef.current = setTimeout(async () => {
            polylinesRef.current.forEach(p => p.remove());
            polylinesRef.current = [];
            setRouteDistances({});

            const newDistances: Record<string, number> = {};

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
                const posKey = `${startLat.toFixed(5)},${startLng.toFixed(5)}`;
                const unitKey = `${unitCoords.lat.toFixed(5)},${unitCoords.lng.toFixed(5)}`;
                const cacheKey = `${visitId}-${posKey}-${unitKey}`;

                const cached = routesCacheRef.current.get(cacheKey);

                let geometry: [number, number][] = [];
                let distance = 0;

                if (cached) {
                    geometry = cached.geometry;
                    distance = cached.distance;
                } else {
                    // Cancel any previous request for this visit
                    const prevCtrl = routeAbortRef.current.get(visitId);
                    if (prevCtrl) prevCtrl.abort();

                    const controller = new AbortController();
                    routeAbortRef.current.set(visitId, controller);

                    try {
                        const url = `/osrm/route/v1/driving/${startLng},${startLat};${unitCoords.lng},${unitCoords.lat}?overview=full&geometries=geojson`;
                        const response = await fetch(url, { signal: controller.signal });

                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        const data = await response.json();

                        if (data.routes && data.routes.length > 0) {
                            geometry = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number]);
                            distance = data.routes[0].distance || haversineDistance(startLat, startLng, unitCoords.lat, unitCoords.lng);
                            routesCacheRef.current.set(cacheKey, { geometry, lastPos: currentPos, distance });
                        } else {
                            geometry = [currentPos, [unitCoords.lat, unitCoords.lng]];
                            distance = haversineDistance(startLat, startLng, unitCoords.lat, unitCoords.lng);
                        }
                    } catch (e: any) {
                        if (e?.name === 'AbortError') continue;
                        geometry = [currentPos, [unitCoords.lat, unitCoords.lng]];
                        distance = haversineDistance(startLat, startLng, unitCoords.lat, unitCoords.lng);
                    } finally {
                        routeAbortRef.current.delete(visitId);
                    }
                }

                newDistances[visitId] = distance;

                if (geometry.length > 0) {
                    const visitColor = getVisitColor(visitId, selectedVisitIds);
                    const shadow = L.polyline(geometry, { color: visitColor, weight: 9, opacity: 0.15, lineCap: 'round' }).addTo(map);
                    const main = L.polyline(geometry, { color: visitColor, weight: 5, opacity: 0.85, lineCap: 'round', className: 'routing-line' }).addTo(map);
                    const dash = L.polyline(geometry, { color: 'white', weight: 2, opacity: 0.5, dashArray: '8, 12', lineCap: 'round' }).addTo(map);
                    polylinesRef.current.push(shadow, main, dash);
                }
            }

            setRouteDistances(newDistances);
        }, 800);

        return () => {
            if (loadRoutesTimeoutRef.current) clearTimeout(loadRoutesTimeoutRef.current);
        };
    }, [selectedVisitIds, users, unitsData, todayVisits]);

    return (
        <div className="absolute inset-0 w-full h-full">
            {/* Map Area */}
            <div ref={mapRef} className="absolute inset-0" style={{ border: 'none', outline: 'none' }} />

            {/* Technician avatars bar - all leaders with status border */}
            {(() => {
                // Avatares "selecionados" = pins manuais + técnicos com visita selecionada no mapa
                const combinedPinnedIds = new Set(pinnedTechIds);
                selectedVisitIds.forEach(visitId => {
                    const visit = todayVisits.find(v => v.id === visitId);
                    if (visit?.ovTeamLeadId) combinedPinnedIds.add(visit.ovTeamLeadId);
                });

                return (
                    <div className="absolute top-4 left-4 z-20 max-w-[calc(100%-2rem)]">
                        <UsersTeamsLeadersByCompanyId
                            companyId={company.id}
                            pinnedUserIds={combinedPinnedIds}
                            titleContent={
                                <>
                                    <div className="flex items-center gap-2">
                                        {Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android' && onBack && (
                                            <button
                                                onClick={onBack}
                                                className="mr-2 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 active:bg-white/40 active:scale-95 transition-all"
                                            >
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                        )}
                                        <p className="text-xl font-black text-white select-none">Visitas em tempo real</p>
                                    </div>
                                    {/* Avatar da empresa */}
                                    {company.logoUrl && !company.logoUrl.includes('placeholder') ? (
                                        <img src={company.logoUrl} alt={company.name} className="w-10 h-10 rounded-xl object-cover border-2 border-white/30" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-xl bg-slate-700 border-2 border-white/30 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-white/70 text-[20px]">apartment</span>
                                        </div>
                                    )}
                                </>
                            }
                            onUserClick={(userId) => {
                                // Técnico com visita aberta → seleciona/deseleciona a visita (igual ao card inferior)
                                const openVisit = todayVisits.find(v => v.ovTeamLeadId === userId && !v.ovEndedAt);
                                if (openVisit) {
                                    toggleVisitSelection(openVisit.id);
                                    return;
                                }
                                // Sem visita aberta → pin/unpin manual
                                setPinnedTechIds(prev => {
                                    const next = new Set(prev);
                                    if (next.has(userId)) {
                                        next.delete(userId);
                                    } else {
                                        next.add(userId);
                                    }
                                    return next;
                                });
                            }}
                        />
                    </div>
                );
            })()}

            {/* #7 Pull-to-refresh indicator */}
            {(pullDistance > 0 || isRefreshing) && (
                <div className="absolute top-14 left-0 right-0 z-15 flex justify-center pointer-events-none" style={{ transform: `translateY(${isRefreshing ? 20 : Math.min(pullDistance * 0.5, 40)}px)` }}>
                    <div className={`bg-white/90 dark:bg-slate-800/90 rounded-full px-4 py-2 shadow-lg flex items-center gap-2 ${isRefreshing ? 'opacity-100' : 'opacity-70'}`}>
                        <svg className={`w-4 h-4 text-primary ${isRefreshing ? 'ptr-spinner' : ''}`} style={{ transform: isRefreshing ? undefined : `rotate(${pullDistance * 3}deg)` }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 12a9 9 0 11-6.219-8.56" />
                        </svg>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            {isRefreshing ? 'Atualizando...' : pullDistance > 60 ? 'Solte para atualizar' : 'Puxe para baixo'}
                        </span>
                    </div>
                </div>
            )}

            {/* Footer section with Visits List */}
            <div
                className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 right-4 bg-white/25 dark:bg-slate-800/30 backdrop-blur-md border border-white/20 dark:border-slate-700/20 z-10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] rounded-2xl transition-all"
                onTouchStart={handlePullTouchStart}
                onTouchMove={handlePullTouchMove}
                onTouchEnd={handlePullTouchEnd}
            >
                {/* Header and Summary Row */}
                <div className="flex items-center gap-3 p-2 overflow-x-auto no-scrollbar w-full">
                    <span className="text-xs font-bold text-slate-800 dark:text-white shrink-0 ml-1">Visitas de Hoje</span>
                    
                    {/* Divisor */}
                    <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 shrink-0" />

                    {!isFooterCollapsed ? (
                        <div className="flex gap-1 shrink-0">
                            <button
                                onClick={() => setVisitStatusFilter('all')}
                                className={`px-3 py-2 rounded-full text-[10px] uppercase font-bold transition-colors min-h-[44px] ${visitStatusFilter === 'all' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'}`}
                            >Tudo ({filterCounts.all})</button>
                            <button
                                onClick={() => setVisitStatusFilter('open')}
                                className={`px-3 py-2 rounded-full text-[10px] uppercase font-bold transition-colors min-h-[44px] ${visitStatusFilter === 'open' ? 'bg-green-100 text-green-700 dark:bg-green-900/40' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'}`}
                            >Em Aberto ({filterCounts.open})</button>
                            <button
                                onClick={() => setVisitStatusFilter('closed')}
                                className={`px-3 py-2 rounded-full text-[10px] uppercase font-bold transition-colors min-h-[44px] ${visitStatusFilter === 'closed' ? 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'}`}
                            >Encerradas ({filterCounts.closed})</button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 shrink-0">
                            {filterCounts.open > 0 && (
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200/50 dark:border-green-800/30">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-green-700 dark:text-green-300">Em Aberto <span className="text-[11px] font-black text-green-600 dark:text-green-200">{filterCounts.open}</span></span>
                                </div>
                            )}
                            {filterCounts.closed > 0 && (
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/30">
                                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Encerradas <span className="text-[11px] font-black text-slate-600 dark:text-slate-300">{filterCounts.closed}</span></span>
                                </div>
                            )}
                            {selectedVisitIds.size > 0 && (
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200/50 dark:border-indigo-800/30">
                                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300">Selecionadas <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-200">{selectedVisitIds.size}</span></span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex-1 min-w-[20px]" />

                    <div className="flex items-center gap-2 shrink-0 pr-1">
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                            {filteredVisits.length} visita{filteredVisits.length !== 1 ? 's' : ''}
                        </span>
                        <button
                            onClick={() => setIsFooterCollapsed(prev => !prev)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors shrink-0"
                        >
                            <span className="material-symbols-outlined text-[16px] text-slate-500 dark:text-slate-300">
                                {isFooterCollapsed ? 'expand_less' : 'expand_more'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Expanded cards list */}
                {!isFooterCollapsed && (
                    <div className="flex gap-3 overflow-x-auto px-3 pb-3 pt-0 no-scrollbar">
                        {filteredVisits.length === 0 ? (
                            <div className="flex w-full items-center justify-center py-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                <span className="text-xs text-slate-400 italic">Nenhuma visita encontrada</span>
                            </div>
                        ) : (
                            filteredVisits.map(visit => {
                                const isClosed = !!visit.ovEndedAt;
                                const isSelected = selectedVisitIds.has(visit.id);
                                const visitColor = isSelected ? getVisitColor(visit.id, selectedVisitIds) : undefined;
                                const dist = routeDistances[visit.id];

                                return (
                                    <button
                                        key={visit.id}
                                        onClick={() => toggleVisitSelection(visit.id)}
                                        className={`flex flex-col shrink-0 min-w-[280px] w-fit max-w-[400px] p-4 backdrop-blur-md rounded-2xl border transition-all relative overflow-hidden text-left visit-card-selected
                                            ${isClosed ? 'opacity-60 cursor-default grayscale-[0.2] bg-slate-100/50 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-700/50' : 'active:scale-[0.98] hover:shadow-lg cursor-pointer bg-white/50 dark:bg-slate-900/50'}
                                            ${isSelected ? 'shadow-xl ring-2' : 'shadow-sm border-slate-200/50 dark:border-slate-700/50'}`}
                                        style={isSelected ? {
                                            borderColor: visitColor,
                                            boxShadow: `0 4px 24px ${visitColor}30`,
                                            ['--tw-ring-color' as any]: `${visitColor}55`,
                                            outline: `2px solid ${visitColor}33`,
                                        } : {}}
                                    >
                                        <div
                                            className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${isClosed ? 'bg-slate-400 dark:bg-slate-600' : ''}`}
                                            style={!isClosed ? { backgroundColor: isSelected ? visitColor! : '#22C55E' } : {}}
                                        />

                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-1.5 overflow-hidden">
                                                <div className={`w-2 h-2 rounded-full ${isClosed ? 'bg-slate-400' : 'bg-green-500 animate-pulse'}`} />
                                                <span className="text-[10px] font-bold text-slate-800 dark:text-white truncate">
                                                    {visit.unitDescription || 'Unidade N/D'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {dist && (
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: `${visitColor}15`, color: visitColor }}>
                                                        {formatDistance(dist)}
                                                    </span>
                                                )}
                                                <span className="text-[9px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                                                    {visit.ovMask || `#${visit.id}`}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 mb-2">
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight py-1 italic">
                                                {visit.requestedServices || 'Manutenção Geral'}
                                            </p>
                                        </div>

                                        <div className="mt-auto pt-2 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {(() => {
                                                    const leaderTeam = (visitsTeams[visit.id] || []).find(m => m.isLeader);
                                                    if (!leaderTeam) return null;

                                                    const currentUser = users.find(u => u.id === leaderTeam.userId);

                                                    const statusBorderColors = {
                                                        available: '#EAB308',
                                                        busy: '#22C55E',
                                                        unavailable: '#94A3B8'
                                                    };

                                                    const userStatus = currentUser
                                                        ? (currentUser.isAvailable
                                                            ? (currentUser.ovIdInProgress && Number(currentUser.ovIdInProgress) > 0 ? 'busy' : 'available')
                                                            : 'unavailable')
                                                        : 'unavailable';

                                                    const borderColor = statusBorderColors[userStatus as keyof typeof statusBorderColors];
                                                    const trackerLabel = getRelativeTime(currentUser?.trackerHeartbeatAt);

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
                                                            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded-md bg-slate-800 dark:bg-slate-700 px-2 py-1 text-[9px] font-semibold text-white shadow-lg opacity-0 group-hover/leader:opacity-100 transition-opacity duration-200 z-50">
                                                                <span className="material-symbols-outlined text-[9px] align-middle mr-0.5">location_on</span>
                                                                {trackerLabel}
                                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700" />
                                                            </div>
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
                                                        ? (visit.ovEndedAt ? new Date(visit.ovEndedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A')
                                                        : (visit.ovStartedAt ? new Date(visit.ovStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A')}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
