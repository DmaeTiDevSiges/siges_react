import React from 'react';
import { Unit } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { Avatar } from '../ui/Avatar';
import { Marker } from '../ui/Marker';

interface UnitCardDetailProps {
    unit: Unit;
}

export const UnitCardDetail: React.FC<UnitCardDetailProps> = ({ unit }) => {
    return (
        <div className="group relative bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl dark:shadow-2xl/20 mt-[-90px] z-10 mx-1 overflow-hidden">

            {/* Gradient Accent - Always visible or subtle animation? Let's keep it consistent but static or subtle */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary via-primary-dark to-primary opacity-100" />

            <div className="p-4">
                {/* Top Row: Avatar + Title + Client */}
                <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight text-left">
                                {unit.descriptionFull || unit.description}
                            </h3>
                        </div>

                        {/* Client Info */}
                        {unit.clientName && (
                            <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-primary text-[14px]">business</span>
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-left">
                                    {unit.clientName}
                                </span>
                            </div>
                        )}
                    </div>

                    <Avatar
                        src={unit.logoUrl}
                        alt={unit.description}
                        fallbackIcon="apartment"
                        shape="rounded"
                        className="h-16 w-16 rounded-[12px]! object-cover! bg-slate-50! dark:bg-slate-900! shadow-sm border border-slate-100 dark:border-slate-800 shrink-0"
                    />
                </div>

                {/* Info Section */}
                <div className="space-y-2">
                    {/* System Hierarchy */}
                    {(unit.systemParentName || unit.systemName || unit.subTypeName) && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium text-left">
                            {[unit.systemParentName, unit.systemName, unit.subTypeName]
                                .filter(Boolean)
                                .join(' / ')}
                        </p>
                    )}

                    {/* UC Info & Status */}
                    <div className="flex items-center justify-between gap-2">
                        {unit.installationCodePowerSupply ? (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg w-fit">
                                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[14px]">bolt</span>
                                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 text-left">
                                    UC: {unit.installationCodePowerSupply}
                                </span>
                            </div>
                        ) : (
                            <div />
                        )}
                        <StatusBadge status={unit.status} size="sm" />
                    </div>
                </div>

                {/* Address & Marker - No chevron */}
                {unit.addressFull && (
                    <div className="flex items-start gap-3 mt-3 pt-3 border-t border-slate-50 dark:border-slate-800/50">
                        <Marker
                            latitude={unit.latitude}
                            longitude={unit.longitude}
                            address={unit.addressFull}
                        />
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed flex-1 text-left">
                            {unit.addressFull}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
