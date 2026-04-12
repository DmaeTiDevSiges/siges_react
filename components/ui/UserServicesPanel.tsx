import React, { useState } from 'react';

interface ServiceCardProps {
    icon: string;
    label: string;
    count: number;
    color: string;
    bgColor: string;
    isSelected: boolean;
    onClick: () => void;
}

interface UserServicesPanelProps {
    autorizadosCount?: number;
    agendadasCount?: number;
    suspensosCount?: number;
    selectedService?: string;
    onServiceSelect?: (serviceType: string) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ icon, label, count, color, bgColor, isSelected, onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`bg-white dark:bg-card-dark rounded-[16px] p-4 shadow-sm border-2 transition-all cursor-pointer shrink-0 w-[160px] md:w-full ${isSelected
                ? 'border-primary dark:border-primary'
                : 'border-slate-200 dark:border-slate-700'
                }`}
        >
            <div className="flex flex-col gap-3">
                {/* Label */}
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    {label}
                </p>

                {/* Icon and Count */}
                <div className="flex items-center justify-between">
                    {/* Icon Circle */}
                    <div className={`w-12 h-12 ${bgColor} rounded-[16px] flex items-center justify-center shrink-0`}>
                        <span className={`material-symbols-outlined text-2xl ${color}`}>
                            {icon}
                        </span>
                    </div>

                    {/* Count */}
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        {count}
                    </p>
                </div>
            </div>
        </div>
    );
};

export const UserServicesPanel: React.FC<UserServicesPanelProps> = ({
    autorizadosCount = 0,
    agendadasCount = 0,
    suspensosCount = 0,
    selectedService: externalSelectedService,
    onServiceSelect
}) => {
    const [internalSelectedService, setInternalSelectedService] = useState<string>(externalSelectedService || 'autorizados');

    // Sync with external status if it changes
    React.useEffect(() => {
        if (externalSelectedService && externalSelectedService !== internalSelectedService) {
            setInternalSelectedService(externalSelectedService);
        }
    }, [externalSelectedService]);


    const services = [
        {
            id: 'autorizados',
            icon: 'check_circle',
            label: 'Autorizados',
            count: autorizadosCount,
            color: 'text-blue-400',
            bgColor: 'bg-blue-400/10 border-2 border-blue-400/50 shadow-[0_0_10px_rgba(96,165,250,0.2)]'
        },
        {
            id: 'suspensos',
            icon: 'do_not_disturb_on',
            label: 'Suspensos',
            count: suspensosCount,
            color: 'text-rose-400',
            bgColor: 'bg-rose-400/10 border-2 border-rose-400/50 shadow-[0_0_10px_rgba(251,113,133,0.2)]'
        },
        {
            id: 'agendadas',
            icon: 'calendar_month',
            label: 'Agendados',
            count: agendadasCount,
            color: 'text-orange-400',
            bgColor: 'bg-orange-400/10 border-2 border-orange-400/50 shadow-[0_0_10px_rgba(251,146,60,0.2)]'
        }
    ];

    const handleServiceClick = (serviceId: string) => {
        setInternalSelectedService(serviceId);
        if (onServiceSelect) {
            onServiceSelect(serviceId);
        }
    };

    return (
        <div className="py-3">
            {/* Services Grid / Horizontal Scroll */}
            <div className="overflow-x-auto no-scrollbar md:overflow-visible">
                <div className="flex md:grid md:grid-cols-4 gap-3 px-4 pb-2">
                    {services.map((service) => (
                        <ServiceCard
                            key={service.id}
                            icon={service.icon}
                            label={service.label}
                            count={service.count}
                            color={service.color}
                            bgColor={service.bgColor}
                            isSelected={internalSelectedService === service.id}
                            onClick={() => handleServiceClick(service.id)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
