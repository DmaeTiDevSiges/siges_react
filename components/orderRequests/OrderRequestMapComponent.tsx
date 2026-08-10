import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix for default Leaflet marker icons in Vite/Capacitor
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

interface OrderMapComponentProps {
    latitude: number;
    longitude: number;
    title?: string;
    leaderLatitude?: number;
    leaderLongitude?: number;
    leaderName?: string;
    leaderAvatarUrl?: string;
    unitAvatarUrl?: string;
    leaderIsAvailable?: boolean;
    leaderOvIdInProgress?: number;
    className?: string;
}

export const OrderMapComponent: React.FC<OrderMapComponentProps> = ({
    latitude,
    longitude,
    title,
    leaderLatitude,
    leaderLongitude,
    leaderName,
    leaderAvatarUrl,
    unitAvatarUrl,
    leaderIsAvailable,
    leaderOvIdInProgress,
    className = ''
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<L.Map | null>(null);
    const markersRef = useRef<L.Marker[]>([]);
    const routingControlRef = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current) return;

        // Initialize map if it doesn't exist
        if (!leafletMap.current) {
            leafletMap.current = L.map(mapRef.current, {
                zoomControl: false,
                attributionControl: false
            }).setView([latitude, longitude], 15);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
            }).addTo(leafletMap.current);

            // Add zoom control to bottom right
            L.control.zoom({
                position: 'bottomright'
            }).addTo(leafletMap.current);
        }

        // Cleanup function for markers and routing
        const cleanup = () => {
            markersRef.current.forEach(m => m.remove());
            markersRef.current = [];

            if (routingControlRef.current && leafletMap.current) {
                try {
                    leafletMap.current.removeControl(routingControlRef.current);
                } catch (e) {
                    console.warn('Error removing routing control', e);
                }
                routingControlRef.current = null;
            }
        };

        // Run cleanup before adding new elements
        cleanup();

        const unitLatLng = L.latLng(latitude, longitude);

        // Setup bounds - start with unit
        const bounds = L.latLngBounds(unitLatLng, unitLatLng);

        // Unit Marker (Avatar or Rose Icon)
        const unitHtml = unitAvatarUrl
            ? `<div class="w-10 h-10 bg-white rounded-full border-2 border-white shadow-xl overflow-hidden ring-2 ring-rose-500 relative z-50">
                <img src="${unitAvatarUrl}" class="w-full h-full object-cover" />
               </div>`
            : `<div class="w-8 h-8 bg-rose-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center relative z-50">
                <span class="material-symbols-outlined text-white text-[18px]">location_on</span>
               </div>`;

        const unitIcon = L.divIcon({
            className: 'custom-div-icon',
            html: unitHtml,
            iconSize: unitAvatarUrl ? [40, 40] : [32, 32],
            iconAnchor: unitAvatarUrl ? [20, 40] : [16, 32]
        });

        const unitMarker = L.marker(unitLatLng, { icon: unitIcon })
            .addTo(leafletMap.current)
            .bindPopup(title || 'Unidade');

        markersRef.current.push(unitMarker);

        // Leader Marker (Avatar or Blue Icon) if available
        if (leaderLatitude && leaderLongitude) {
            const leaderLatLng = L.latLng(leaderLatitude, leaderLongitude);

            const statusBorderColors = {
                available: '#EAB308', // Yellow
                busy: '#22C55E',      // Green
                unavailable: '#94A3B8' // Slate (Gray)
            };

            const leaderStatus = leaderIsAvailable
                ? (leaderOvIdInProgress && leaderOvIdInProgress > 0 ? 'busy' : 'available')
                : 'unavailable';
            const borderColor = statusBorderColors[leaderStatus];

            const leaderHtml = leaderAvatarUrl
                ? `<div class="w-10 h-10 bg-white rounded-full shadow-xl overflow-hidden relative z-50" style="border: 4px solid ${borderColor};">
                    <img src="${leaderAvatarUrl}" class="w-full h-full object-cover" />
                   </div>`
                : `<div class="w-10 h-10 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center relative z-50">
                    <span class="material-symbols-outlined text-white text-[20px]">engineering</span>
                   </div>`;

            const leaderIcon = L.divIcon({
                className: 'custom-div-icon',
                html: leaderHtml,
                iconSize: [40, 40],
                iconAnchor: [20, 40]
            });

            const leaderMarker = L.marker(leaderLatLng, { icon: leaderIcon })
                .addTo(leafletMap.current)
                .bindPopup(leaderName || 'Líder de Equipe');

            markersRef.current.push(leaderMarker);
            bounds.extend(leaderLatLng);

            // Add Routing
            const Routing = (L as any).Routing;
            if (Routing) {
                routingControlRef.current = Routing.control({
                    waypoints: [
                        leaderLatLng,
                        unitLatLng
                    ],
                    lineOptions: {
                        styles: [{ color: '#3b82f6', opacity: 0.8, weight: 6 }],
                        extendToWaypoints: true,
                        missingRouteTolerance: 0
                    },
                    createMarker: () => null, // Suppress default markers
                    addWaypoints: false,
                    draggableWaypoints: false,
                    fitSelectedRoutes: true,
                    show: false, // Hide instruction panel
                    collapsible: true
                }).addTo(leafletMap.current);
            } else {
                // Fallback if Routing is not loaded, just fit bounds
                leafletMap.current.fitBounds(bounds, { padding: [50, 50] });
            }
        } else {
            leafletMap.current.setView(unitLatLng, 15);
        }

        // Return cleanup for unmount (or re-effect)
        return cleanup;

    }, [latitude, longitude, title, leaderLatitude, leaderLongitude, leaderName, leaderAvatarUrl, unitAvatarUrl, leaderIsAvailable, leaderOvIdInProgress]);

    return (
        <div className={`relative w-full h-[300px] rounded-2xl overflow-hidden shadow-inner border border-slate-100 dark:border-white/5 ${className}`}>
            <div ref={mapRef} className="w-full h-full z-0" />

            {/* Overlay gradient for aesthetics */}
            <div className="absolute inset-0 pointer-events-none border-8 border-white/10 dark:border-slate-900/10 rounded-2xl" />

            {/* Custom CSS to hide routing container just in case show:false doesn't catch everything or for cleaner look */}
            <style>{`
                .leaflet-routing-container { display: none !important; }
            `}</style>
        </div>
    );
};
