
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { CircularGauge } from '../../../components/ui/CircularGauge';

// Fix for default Leaflet marker icons in some environments (like Vite/Capacitor)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

import 'leaflet/dist/leaflet.css';

interface Unit {
    id: string;
    description: string;
    // Both naming conventions supported (db may return either)
    latitude?: number | string | null;
    longitude?: number | string | null;
    unit_latitude?: number | string | null;
    unit_longitude?: number | string | null;
    percentage: number;
    lastReportedAt?: string | null;
}

interface UnitsAvailabilityMapProps {
    units: Unit[];
    onUnitClick: (unitId: number) => void;
    className?: string;
    unitTagDescription?: string;
    unitTagPercentage?: number;
}

export const UnitsAvailabilityMap: React.FC<UnitsAvailabilityMapProps> = ({ units, onUnitClick, className = '', unitTagDescription, unitTagPercentage = 0 }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<L.Map | null>(null);
    const markersRef = useRef<L.Marker[]>([]);
    // Keep callback ref to avoid restarting the map on every render
    const onUnitClickRef = useRef(onUnitClick);
    useEffect(() => { onUnitClickRef.current = onUnitClick; }, [onUnitClick]);

    useEffect(() => {
        if (!mapRef.current) return;

        // Initialize map if it doesn't exist
        if (!leafletMap.current) {
            leafletMap.current = L.map(mapRef.current, {
                zoomControl: false,
                attributionControl: false
            }).setView([-29.98, -51.18], 16); // Default center (usually overridden by bounds)

            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; CartoDB',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(leafletMap.current);

            // Force recalculation multiple times for Android WebView
            setTimeout(() => leafletMap.current?.invalidateSize(), 100);
            setTimeout(() => leafletMap.current?.invalidateSize(), 500);
            setTimeout(() => leafletMap.current?.invalidateSize(), 1500);

            L.control.zoom({
                position: 'bottomright'
            }).addTo(leafletMap.current);
        }

        // Force tile recalculation in case the container was hidden during initialization
        setTimeout(() => leafletMap.current?.invalidateSize(), 100);

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
            const lat = unit.unit_latitude ?? unit.latitude;
            const lng = unit.unit_longitude ?? unit.longitude;

            if (lat === undefined || lat === null || lng === undefined || lng === null) return;
            
            const latitude = typeof lat === 'string' ? parseFloat(lat) : Number(lat);
            const longitude = typeof lng === 'string' ? parseFloat(lng) : Number(lng);

            if (isNaN(latitude) || isNaN(longitude)) return;

            validCoords++;
            const latLng = L.latLng(latitude, longitude);
            bounds.extend(latLng);

            // Circular Progress calculation for Marker
            const size = 42;
            const strokeWidth = 3.5;
            const radius = (size - strokeWidth) / 2;
            const circumference = radius * 2 * Math.PI;
            const offset = circumference - (unit.percentage / 100) * circumference;
            
            const markerHtml = `
                <div class="relative group flex items-center justify-center" style="width: ${size}px; height: ${size}px;">
                    <svg class="transform -rotate-90 absolute" width="${size}" height="${size}" style="pointer-events: none;">
                        <circle
                            class="text-slate-100 dark:text-slate-800"
                            stroke-width="${strokeWidth}"
                            stroke="currentColor"
                            fill="transparent"
                            r="${radius}"
                            cx="${size / 2}"
                            cy="${size / 2}"
                        />
                        <circle
                            style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset}; transition: stroke-dashoffset 0.7s ease-out;"
                            class="${unit.percentage >= 85 ? 'text-emerald-500' : unit.percentage > 50 ? 'text-amber-500' : 'text-rose-500'}"
                            stroke-width="${strokeWidth}"
                            stroke-linecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="${radius}"
                            cx="${size / 2}"
                            cy="${size / 2}"
                        />
                    </svg>
                    <div class="w-8 h-8 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 active:scale-95">
                        <span class="text-[9px] font-black ${unit.percentage >= 85 ? 'text-emerald-500' : unit.percentage > 50 ? 'text-amber-500' : 'text-rose-500'}">
                            ${unit.percentage}%
                        </span>
                    </div>
                </div>
            `;

            const icon = L.divIcon({
                className: 'custom-unit-marker',
                html: markerHtml,
                iconSize: [size, size],
                iconAnchor: [size / 2, size / 2]
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
                    onUnitClickRef.current(Number(unit.id));
                    leafletMap.current?.setView(latLng, 19, { animate: true });
                });

            markersRef.current.push(marker);
        });

        if (validCoords > 0) {
            leafletMap.current.fitBounds(bounds, { padding: [50, 50] });
        }

        return cleanup;
    }, [units]); // onUnitClick excluded intentionally — handled via ref to prevent map re-init

    // Force invalidateSize on mount and window resize
    useEffect(() => {
        const handleResize = () => {
            if (leafletMap.current) {
                leafletMap.current.invalidateSize();
            }
        };

        window.addEventListener('resize', handleResize);
        
        // Use ResizeObserver for the container itself
        const observer = new ResizeObserver(() => {
            leafletMap.current?.invalidateSize();
        });

        if (mapRef.current) {
            observer.observe(mapRef.current);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            observer.disconnect();
        };
    }, []);

    return (
        <div className={`relative w-full h-full min-h-[400px] rounded-[32px] overflow-hidden border border-slate-200 dark:border-white/5 shadow-inner bg-slate-100 dark:bg-slate-900 ${className}`} style={{ transform: 'translateZ(0)', willChange: 'transform' }}>
            <div ref={mapRef} className="absolute inset-0 z-0 bg-transparent" />
            
            {/* Legend Overlay */}
            <div className="absolute top-4 left-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-4 rounded-[28px]! border border-slate-200/50 dark:border-white/10 shadow-xl z-5000 flex flex-col gap-4 min-w-[180px]">
                <div className="flex items-center gap-4">
                    <CircularGauge 
                        percentage={unitTagPercentage} 
                        size={52}
                        strokeWidth={4.5}
                        color={unitTagPercentage >= 85 ? 'text-emerald-500' : unitTagPercentage > 50 ? 'text-amber-400' : 'text-rose-500'}
                        labelSize="text-[11px]"
                    />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-0.5 leading-tight">
                            Disponibilidade
                        </span>
                        <span className="text-[12px] font-black text-primary uppercase tracking-tight leading-tight whitespace-nowrap">
                            {unitTagDescription || 'Geral'}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30" />
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">Alta (≥ 85%)</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/30" />
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">Alerta (51-84%)</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/30" />
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">Crítica (≤ 50%)</span>
                    </div>
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
