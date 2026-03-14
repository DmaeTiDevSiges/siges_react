import React from 'react';
import { CgFileDocument } from 'react-icons/cg';

interface ButtonReportedDisabledProps {
    className?: string;
}

export const ButtonReportedDisabled: React.FC<ButtonReportedDisabledProps> = ({ className = '' }) => {
    return (
        <button
            disabled
            className={`
                w-[50px] h-[50px] 
                rounded-xl 
                bg-orange-50 dark:bg-orange-500/10 
                flex items-center justify-center 
                opacity-50 cursor-not-allowed
                shadow-sm
                ${className}
            `}
        >
            <CgFileDocument size={24} className="text-orange-500" />
        </button>
    );
};
