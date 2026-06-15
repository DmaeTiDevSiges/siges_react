import React from 'react';
import { MdPauseCircle, MdPlayArrow } from 'react-icons/md';

interface UserUnavailableScreenProps {
    onBecomeAvailable: () => void;
}

export const UserUnavailableScreen: React.FC<UserUnavailableScreenProps> = ({ onBecomeAvailable }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 max-w-sm w-full flex flex-col items-center text-center border border-slate-100 dark:border-slate-700">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-6">
                    <MdPauseCircle className="text-slate-400 dark:text-slate-500 text-5xl" />
                </div>

                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                    Modo Indisponível
                </h1>

                <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                    Você está como <span className="font-semibold text-slate-700 dark:text-slate-300">Indisponível</span>.
                    Para acessar as funcionalidades do app, atualize seu status para <span className="font-semibold text-green-600 dark:text-green-400">Disponível</span>.
                </p>

                <button
                    onClick={onBecomeAvailable}
                    className="w-full flex items-center justify-center py-3.5 px-6 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-green-500/20 active:scale-95"
                >
                    <MdPlayArrow className="mr-2 text-xl" />
                    Ficar Disponível
                </button>
            </div>
        </div>
    );
};
