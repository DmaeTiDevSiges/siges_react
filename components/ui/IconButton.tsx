import React from 'react';

/**
 * Botão só de ícone. O NOME ACESSÍVEL É OBRIGATÓRIO (o ícone sozinho não diz nada
 * a quem usa leitor de tela): passe `ariaLabel` (preferido), `aria-label` ou
 * `title`. Descreva a ação ("Excluir requisito"), não o desenho ("lixeira").
 */
type AccessibleName =
    | { ariaLabel: string }
    | { 'aria-label': string }
    | { title: string };

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & AccessibleName & {
    icon: string;
    variant?: 'ghost' | 'soft' | 'primary' | 'danger' | 'outline';
    color?: string;
    size?: 'sm' | 'md' | 'lg';
    ariaLabel?: string;
};

export const IconButton: React.FC<IconButtonProps> = ({
    icon,
    variant = 'ghost',
    size = 'md',
    className = '',
    color,
    ariaLabel,
    ...props
}) => {
    const baseClasses = "flex items-center justify-center rounded-full transition-all duration-200 active:scale-[0.97] active:brightness-95 font-bold flex-shrink-0 cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:active:brightness-100";

    const variants = {
        ghost: "text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800",
        soft: "bg-primary/10 text-primary hover:bg-primary/20",
        primary: "bg-primary text-white hover:bg-blue-600 shadow-md",
        danger: "bg-white dark:bg-slate-800 border-2 border-[#ff2d55] text-[#ff2d55] hover:bg-red-50 dark:hover:bg-red-900/10 shadow-sm",
        outline: `bg-white dark:bg-slate-800 border-2 shadow-sm ${color ? '' : 'border-primary text-primary hover:bg-blue-50'}`
    };

    const style = color ? { borderColor: color, color: color } : {};
    // Nome acessível: ariaLabel > aria-label > title.
    const accessibleName = ariaLabel ?? props['aria-label'] ?? props.title;

    const sizes = {
        sm: "h-11 w-11",
        md: "h-10 w-10",
        lg: "h-12 w-12",
    };

    // Alvo de toque mínimo de 44 px: o `md` desenha 40 px, mas a área clicável sobe a 44 px
    // com um pseudo-elemento invisível (o desenho continua igual). Só precisa de `relative`
    // se o botão ainda não for posicionado (senão `relative` brigaria com `absolute`/`fixed`).
    const positioned = /(^|\s)(absolute|fixed|sticky|relative)(\s|$)/.test(className);
    const hitArea = size === 'md'
        ? `${positioned ? '' : 'relative '}after:absolute after:-inset-0.5`
        : '';

    return (
        <button
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${hitArea} ${className}`}
            style={style}
            {...props}
            aria-label={accessibleName}
        >
            {/* O texto do ícone ("delete", "close"...) não pode ser lido em voz alta */}
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{icon}</span>
        </button>
    );
};
