import React from 'react';
import { MdPauseCircle, MdPlayArrow } from 'react-icons/md';

interface UserUnavailableScreenProps {
    onBecomeAvailable: () => void;
}

export const UserUnavailableScreen: React.FC<UserUnavailableScreenProps> = ({ onBecomeAvailable }) => {
    React.useEffect(() => {
        onBecomeAvailable();
    }, [onBecomeAvailable]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
            <div className="text-slate-500 animate-pulse font-medium">
                Atualizando disponibilidade...
            </div>
        </div>
    );
};
