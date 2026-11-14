import React from 'react';
import { Skeleton } from '../../../components/ui/Skeleton';

export const VisitsDashboardSkeleton: React.FC = () => (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark" role="status" aria-label="Carregando painel de visitas">
        <div className="shrink-0 border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0f172a]">
            <div className="flex flex-wrap items-center gap-3">
                <Skeleton variant="rectangular" width="min(100%, 520px)" height={48} />
                <Skeleton variant="rectangular" width={180} height={48} />
                <Skeleton variant="circular" width={44} height={44} className="ml-auto" />
            </div>
            <div className="mt-3">
                <Skeleton variant="rectangular" width={220} height={44} />
            </div>
        </div>
        <div className="flex-1 overflow-hidden p-4">
            <div className="mb-5 flex gap-4 overflow-hidden py-2">
                {[0, 1, 2, 3].map(card => (
                    <div
                        key={card}
                        className="h-[110px] min-w-[160px] rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/40"
                    >
                        <div className="flex items-start justify-between">
                            <Skeleton variant="rectangular" width={36} height={36} />
                            <Skeleton variant="text" width={38} height={22} />
                        </div>
                        <Skeleton variant="text" width="70%" className="mt-4" />
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map(card => (
                    <div
                        key={card}
                        className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/40"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <Skeleton variant="text" width="45%" />
                            <Skeleton variant="rectangular" width={70} height={28} />
                        </div>
                        <Skeleton variant="text" width="72%" className="mt-4" />
                        <Skeleton variant="text" width="54%" className="mt-2" />
                        <div className="mt-5 flex gap-2">
                            <Skeleton variant="rectangular" width={72} height={24} />
                            <Skeleton variant="rectangular" width={88} height={24} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);
