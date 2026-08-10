import React from 'react';

interface SkeletonProps {
    className?: string;
    count?: number;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    count = 1,
    variant = 'text',
    width,
    height
}) => {
    const baseClasses = "animate-pulse bg-slate-200 dark:bg-slate-700/50";

    const variantClasses = {
        text: "rounded-lg h-4",
        circular: "rounded-full",
        rectangular: "rounded-xl"
    };

    const style: React.CSSProperties = {
        width: width || undefined,
        height: height || undefined
    };

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={`${baseClasses} ${variantClasses[variant]}`}
                    style={style}
                />
            ))}
        </div>
    );
};

export const NotificationSkeleton: React.FC = () => (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-700/50">
        <Skeleton variant="circular" width={56} height={56} />
        <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="90%" />
            <Skeleton variant="text" width="30%" />
        </div>
    </div>
);

export const DashboardSkeleton: React.FC = () => (
    <div className="space-y-4 p-4">
        <Skeleton variant="rectangular" height={120} className="rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
            <Skeleton variant="rectangular" height={100} className="rounded-2xl" />
            <Skeleton variant="rectangular" height={100} className="rounded-2xl" />
        </div>
        <Skeleton variant="rectangular" height={200} className="rounded-2xl" />
    </div>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
    <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <Skeleton variant="rectangular" width={48} height={48} className="rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="80%" />
                </div>
            </div>
        ))}
    </div>
);
