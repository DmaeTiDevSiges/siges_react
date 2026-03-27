
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker icons in some environments (like Vite)
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Unit {
    id: string;
    description: string;
    latitude: number;
    longitude: number;
    percentage: number;
    lastReportedAt?: string | null;
}

interface UnitsAvailabilityMapProps {
    units: Unit[];
    onUnitClick: (unitId: number) => void;
    className?: string;
}

export const UnitsAvailabilityMap: React.FC<UnitsAvailabilityMapProps> = ({ units, onUnitClick, className = '' }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<L.Map | null>(null);
    const markersRef = useRef<L.Marker[]>([]);

    useEffect(() => {
        if (!mapRef.current) return;

        // Initialize map if it doesn't exist
        if (!leafletMap.current) {
            leafletMap.current = L.map(mapRef.current, {
                zoomControl: false,
                attributionControl: false
            }).setView([-29.98, -51.18], 16); // Default center (usually overridden by bounds)

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
            }).addTo(leafletMap.current);

            L.control.zoom({
                position: 'bottomright'
            }).addTo(leafletMap.current);
        }

        // Cleanup function for markers
        const cleanup = () => {
            markersRef.current.forEach(m => m.remove());
            markersRef.current = [];
        };

        cleanup();

        if (units.length === 0) return;

        const bounds = L.latLngBounds([]);
        let validCoords = 0;

        units.forEach(unit => {
            if (!unit.latitude || !unit.longitude) return;

            validCoords++;
            const latLng = L.latLng(Number(unit.latitude), Number(unit.longitude));
            bounds.extend(latLng);

            // Determine border color based on percentage
            const color = unit.percentage >= 85 ? '#10b981' : unit.percentage > 50 ? '#fbbf24' : '#f43f5e';
            
            const markerHtml = `
                <div class="relative group">
                    <div class="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95" style="border: 3px solid ${color};">
                        <span class="text-[10px] font-black ${unit.percentage >= 85 ? 'text-emerald-500' : unit.percentage > 50 ? 'text-amber-500' : 'text-rose-500'}">
                            ${unit.percentage}%
                        </span>
                    </div>
                </div>
            `;

            const icon = L.divIcon({
                className: 'custom-unit-marker',
                html: markerHtml,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            });

            const marker = L.marker(latLng, { icon })
                .addTo(leafletMap.current!)
                .bindTooltip(unit.description, { 
                    direction: 'top', 
                    offset: [0, -15],
                    className: 'custom-unit-tooltip'
                })
                .on('mouseover', (e) => {
                    // Bring hovered marker to the front when overlapping
                    e.target.setZIndexOffset(1000);
                    const el = e.target.getElement();
                    if (el) {
                        const inner = el.querySelector('div > div');
                        if (inner instanceof HTMLElement) inner.style.transform = 'scale(1.15)';
                    }
                })
                .on('mouseout', (e) => {
                    // Restore original depth
                    e.target.setZIndexOffset(0);
                    const el = e.target.getElement();
                    if (el) {
                        const inner = el.querySelector('div > div');
                        if (inner instanceof HTMLElement) inner.style.transform = 'scale(1)';
                    }
                })
                .on('click', () => {
                    onUnitClick(Number(unit.id));
                    leafletMap.current?.setView(latLng, 19, { animate: true });
                });

            markersRef.current.push(marker);
        });

        if (validCoords > 0) {
            leafletMap.current.fitBounds(bounds, { padding: [50, 50] });
        }

        return cleanup;
    }, [units, onUnitClick]);

    return (
        <div className={`relative w-full h-[500px] rounded-3xl overflow-hidden border border-slate-200 dark:border-white/5 shadow-inner bg-slate-100 dark:bg-slate-900 ${className}`}>
            <div ref={mapRef} className="w-full h-full z-0" />
            
            {/* Legend Overlay */}
            <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-3 rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg z-[1000] flex flex-col gap-2">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status de Disponibilidade</span>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                    <span className="text-[9px] font-bold text-slate-700 dark:text-slate-200">Alta (≥ 85%)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                    <span className="text-[9px] font-bold text-slate-700 dark:text-slate-200">Alerta (51-84%)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
                    <span className="text-[9px] font-bold text-slate-700 dark:text-slate-200">Crítica (≤ 50%)</span>
                </div>
            </div>

            <style>{`
                .custom-unit-marker {
                    background: transparent !important;
                    border: none !important;
                }
                .custom-unit-tooltip {
                    background: rgba(15, 23, 42, 0.9) !important;
                    border: none !important;
                    border-radius: 8px !important;
                    color: white !important;
                    font-size: 10px !important;
                    font-weight: 800 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                    padding: 4px 8px !important;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
                    backdrop-filter: blur(4px);
                }
                .custom-unit-tooltip::before {
                    border-top-color: rgba(15, 23, 42, 0.9) !important;
                }
                .leaflet-container {
                    font-family: inherit;
                }
            `}</style>
        </div>
    );
};
