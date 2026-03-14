import React, { useEffect, useRef } from 'react';

interface LoadMoreProps {
    current: number;
    total: number;
    onLoadMore: () => void;
    loading?: boolean;
    pageSize?: number;
}

export const LoadMore: React.FC<LoadMoreProps> = ({
    current,
    total,
    onLoadMore,
    loading = false,
    pageSize = 10
}) => {
    const observerRef = useRef<HTMLDivElement>(null);
    const hasMore = current < total;
    const remaining = total - current;
    const nextAmount = Math.min(pageSize, remaining);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    onLoadMore();
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        const currentRef = observerRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [hasMore, loading, onLoadMore]);

    if (total === 0) return null;

    return (
        <div ref={observerRef} className="flex flex-col items-center gap-3 py-6 px-4">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Exibindo <span className="text-slate-900 dark:text-white font-bold">{current}</span> de <span className="text-slate-900 dark:text-white font-bold">{total}</span> registros
            </p>

            {hasMore && (
                <button
                    onClick={onLoadMore}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:border-primary dark:hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 text-primary font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    {loading ? (
                        <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                    ) : (
                        <span className="material-symbols-outlined text-[20px] group-hover:translate-y-0.5 transition-transform">expand_more</span>
                    )}
                    Carregar mais {nextAmount} registros
                </button>
            )}

            {!hasMore && total > pageSize && (
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-sm italic">
                    <span className="h-px w-8 bg-slate-200 dark:bg-slate-800" />
                    Não há mais registros
                    <span className="h-px w-8 bg-slate-200 dark:bg-slate-800" />
                </div>
            )}
        </div>
    );
};
