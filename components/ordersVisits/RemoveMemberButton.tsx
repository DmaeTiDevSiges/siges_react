import React from 'react';

interface RemoveMemberButtonProps {
    /** Nome acessível do botão (ex.: "Remover João da equipe"). */
    label: string;
    onClick: () => void;
}

/**
 * "Excluir da equipe" no canto do avatar (o contêiner precisa ser `relative`).
 * O botão é maior que o selo desenhado, para o toque acertar com o dedo; a gota
 * de clique (utils/clickPulse) herda dele a cor vermelha.
 */
export const RemoveMemberButton: React.FC<RemoveMemberButtonProps> = ({ label, onClick }) => (
    <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className="group/remove absolute -right-2.5 -top-2.5 flex h-9 w-9 items-center justify-center rounded-full text-danger outline-none"
    >
        <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-danger text-on-danger shadow-md ring-2 ring-surface transition-all duration-200 group-hover/remove:brightness-110 group-focus-visible/remove:ring-fg group-active/remove:scale-90">
            <span className="material-symbols-outlined text-[14px]! font-bold leading-none" aria-hidden="true">close</span>
        </span>
    </button>
);
