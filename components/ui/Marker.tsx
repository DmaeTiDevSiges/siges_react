
import React from 'react';

interface MarkerProps {
    onClick?: (e: React.MouseEvent) => void;
    className?: string;
    latitude?: number | string | null;
    longitude?: number | string | null;
    address?: string;
}

export const Marker: React.FC<MarkerProps> = ({ onClick, className = '', latitude, longitude, address }) => {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClick) {
            onClick(e);
        } else {
            const query = latitude && longitude
                ? `${latitude},${longitude}`
                : encodeURIComponent(address || '');
            if (query) {
                window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
            }
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`
                relative flex items-center justify-center 
                w-10 h-10 rounded-full 
                bg-[#f8fbff] dark:bg-slate-900/40
                border border-primary/30 dark:border-primary/40
                shadow-[0_4px_12px_rgba(19,127,236,0.08)]
                hover:shadow-[0_8px_20px_rgba(19,127,236,0.15)]
                hover:border-primary/60
                hover:scale-105
                active:scale-95 transition-all duration-300 
                group/marker shrink-0 ${className}
            `}
            title="Ver no mapa"
        >
            <span className="material-symbols-outlined text-primary text-[20px] transition-transform duration-300 group-hover/marker:scale-110">
                location_on
            </span>

            {/* Soft inner glow to match the 'glassy' look of the reference */}
            <div className="absolute inset-0 rounded-full bg-primary/5 opacity-40 pointer-events-none" />
        </button>
    );
};
