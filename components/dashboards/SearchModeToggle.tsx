import React from 'react';

/**
 * Botão único que alterna o modo de pesquisa dos painéis de SS/OS:
 *   - 'online' (em aberto, com filtros rápidos) → ícone pending_actions, fundo claro
 *   - 'period' (pesquisa por período)           → ícone calendar_month, fundo sólido
 * Cada modo é uma tela; o toque navega para a outra (onToggle).
 * Substitui o par de botões lado a lado (mesma função, metade da largura).
 */
interface SearchModeToggleProps {
    mode: 'online' | 'period';
    onToggle: () => void;
}

export const SearchModeToggle: React.FC<SearchModeToggleProps> = ({ mode, onToggle }) => {
    const isPeriod = mode === 'period';
    const label = isPeriod
        ? 'Pesquisa por período — toque para ver os serviços em aberto'
        : 'Serviços em aberto — toque para pesquisar por período';

    return (
        <button
            type="button"
            onClick={onToggle}
            title={label}
            aria-label={label}
            aria-pressed={isPeriod}
            className={`group relative flex items-center justify-center h-[42px] w-[42px] rounded-xl border shadow-sm shrink-0 cursor-pointer
                transition-[background-color,color,border-color,transform] duration-300 active:scale-95
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
                ${isPeriod
                    ? 'bg-primary border-primary text-white shadow-primary/30'
                    : 'bg-primary/10 border-primary/40 text-primary hover:bg-primary/15'}`}
        >
            {/* key força a troca animada do ícone ao alternar */}
            <span
                key={mode}
                className="material-symbols-outlined text-[20px] animate-mode-swap"
            >
                {isPeriod ? 'calendar_month' : 'pending_actions'}
            </span>
        </button>
    );
};
