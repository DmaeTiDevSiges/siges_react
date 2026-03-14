import React, { useEffect, useState, useRef } from 'react';
import { Company, User } from '../../types';
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
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMapRef = useRef<LeafletMap | null>(null);
    const markersRef = useRef<Map<string, Marker>>(new Map());
    const isFirstLoadRef = useRef(true);

    // 1. Subscribe to users
    useEffect(() => {
        const loadUsers = async () => {
            const allUsers = await dataService.getUsersByCompany(company.id);
            setUsers(allUsers);
        };
        loadUsers();

        const subscription = dataService.subscribeToUsers((payload) => {
            loadUsers();
        });

        return () => {
            subscription.unsubscribe();
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

        const mapInstance = L.map(mapRef.current).setView([-30.0346, -51.2177], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapInstance);

        leafletMapRef.current = mapInstance;

        // Cleanup on unmount
        return () => {
            mapInstance.remove();
            leafletMapRef.current = null;
        };
    }, []);

    // 3. Update Markers (Run when users change)
    useEffect(() => {
        const map = leafletMapRef.current;
        if (!map) return;

        const bounds = L.latLngBounds([]);
        const statusBorderColors = {
            available: '#EAB308', // Yellow
            busy: '#22C55E',      // Green
            unavailable: '#94A3B8' // Slate (Gray)
        };
        let hasHelpers = false;

        users.forEach(user => {
            if (user.latitude && user.longitude) {
                hasHelpers = true;
                const lat = user.latitude;
                const lng = user.longitude;

                const userStatus = user.isAvailable
                    ? (user.ovIdInProgress && Number(user.ovIdInProgress) > 0 ? 'busy' : 'available')
                    : 'unavailable';
                const borderColor = statusBorderColors[userStatus];

                if (markersRef.current.has(user.id)) {
                    // Update existing marker position without recreating it (prevents flickering)
                    const marker = markersRef.current.get(user.id);
                    if (marker) {
                        const currentPos = marker.getLatLng();
                        if (currentPos.lat !== lat || currentPos.lng !== lng) {
                            marker.setLatLng([lat, lng]);
                        }

                        // Update icon to reflect status changes even if position is same
                        const hasAvatar = user.avatarUrl && !user.avatarUrl.includes('noImageUser.png');
                        const initials = getInitials(user.nameShort || user.nameFull);
                        const avatarContent = hasAvatar
                            ? `<div style="background-image: url('${user.avatarUrl}'); width: 100%; height: 100%; background-size: cover; background-position: center;"></div>`
                            : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f0f7ff; color: #5a7b9a; font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 13px; font-weight: 800; letter-spacing: -0.02em; text-transform: uppercase;">${initials}</div>`;

                        const icon = L.divIcon({
                            className: '',
                            html: `<div style="width: 38px; height: 38px; border-radius: 50%; border: 4px solid ${borderColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.15); overflow: hidden; display: flex; align-items: center; justify-content: center; background: white;">${avatarContent}</div>`,
                            iconSize: [38, 38],
                            iconAnchor: [19, 19]
                        });
                        marker.setIcon(icon);
                    }
                } else {
                    // Create new marker
                    const hasAvatar = user.avatarUrl && !user.avatarUrl.includes('noImageUser.png');
                    const initials = getInitials(user.nameShort || user.nameFull);

                    const avatarContent = hasAvatar
                        ? `<div style="background-image: url('${user.avatarUrl}'); width: 100%; height: 100%; background-size: cover; background-position: center;"></div>`
                        : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f0f7ff; color: #5a7b9a; font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 13px; font-weight: 800; letter-spacing: -0.02em; text-transform: uppercase;">${initials}</div>`;

                    const icon = L.divIcon({
                        className: '',
                        html: `<div style="width: 38px; height: 38px; border-radius: 50%; border: 4px solid ${borderColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.15); overflow: hidden; display: flex; align-items: center; justify-content: center; background: white;">${avatarContent}</div>`,
                        iconSize: [38, 38],
                        iconAnchor: [19, 19]
                    });

                    const marker = L.marker([lat, lng], { icon })
                        .addTo(map)
                        .bindPopup(`<b>${user.nameShort || user.nameFull}</b><br>${user.email}`);

                    markersRef.current.set(user.id, marker);
                }
                bounds.extend([lat, lng]);
            }
        });

        // Only auto-fit bounds on the very first load of markers
        if (hasHelpers && isFirstLoadRef.current) {
            map.fitBounds(bounds, { padding: [50, 50] });
            isFirstLoadRef.current = false;
        }
    }, [users]);

    return (
        <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-slate-900 absolute inset-0">
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4 z-10 shadow-sm relative shrink-0">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                    <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">arrow_back</span>
                </button>
                <div className="flex items-center gap-3">
                    {company.logoUrl && <OptimizedImage src={company.logoUrl} alt={company.name} className="w-8 h-8 rounded object-cover" preset="thumbnail" />}
                    <h1 className="text-lg font-bold text-slate-800 dark:text-white">Rastreamento - {company.name}</h1>
                </div>
                <div className="ml-auto text-sm text-slate-500">
                    {users.filter(u => u.latitude).length} usuários com localização
                </div>
            </div>
            <div className="flex-1 relative z-0 min-h-0 h-full">
                <div ref={mapRef} className="h-full w-full" style={{ minHeight: '400px' }} />
            </div>
        </div>
    );
};
