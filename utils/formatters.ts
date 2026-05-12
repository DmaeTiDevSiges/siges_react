/**
 * Utility functions for text formatting and manipulation
 */

/**
 * Get initials from a full name
 * @param name - Full name to extract initials from
 * @returns Initials (max 2 characters) or '?' if name is empty
 * @example getInitials('João Silva') // 'JS'
 */
export const getInitials = (name?: string): string => {
    if (!name) return '?';

    const parts = name.trim().split(' ').filter(n => n.length > 0);

    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
    }

    return name.trim().slice(0, 2).toUpperCase();
};

/**
 * Format currency value to Brazilian Real
 * @param value - Numeric value to format
 * @returns Formatted currency string
 * @example formatCurrency(1000) // 'R$ 1.000,00'
 */
export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

/**
 * Format date to Brazilian format
 * @param date - Date string or Date object
 * @returns Formatted date string (DD/MM/YYYY)
 */
export const formatDate = (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pt-BR').format(d);
};

/**
 * Format date and time to Brazilian format (SEMPRE: dd/mm/aaaa HH:mm h)
 * @param date - Date string or Date object
 * @returns Formatted datetime string (DD/MM/YYYY HH:mm h)
 */
export const formatDateTime = (date: string | Date | null | undefined): string => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'N/A';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes} h`;
};

/**
 * Truncate text to specified length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
};

/**
 * Format date to relative time (agora há pouco, 1 hora atrás, etc)
 * @param date - Date string or Date object
 * @returns Relative time string
 */
export const formatRelativeTime = (date: string | Date | null | undefined): string => {
    if (!date) return 'Nunca';

    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'agora há pouco';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''} atrás`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hora${diffInHours > 1 ? 's' : ''} atrás`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `${diffInDays} dia${diffInDays > 1 ? 's' : ''} atrás`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
        return `${diffInWeeks} semana${diffInWeeks > 1 ? 's' : ''} atrás`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `${diffInMonths} mês${diffInMonths > 1 ? 'es' : ''} atrás`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} ano${diffInYears > 1 ? 's' : ''} atrás`;
};

/**
 * Get color for a priority code
 * @param priorityCode - Priority code (AT, MD, BX)
 * @returns Tailwind class for background color
 */
export const getPriorityColor = (priorityCodeOrColor?: string | number): string => {
    if (!priorityCodeOrColor) return '#64748b'; // Default slate-500
    
    const val = String(priorityCodeOrColor).toLowerCase();
    
    // If it's already a hex color, return it
    if (val.startsWith('#')) return val;
    
    switch (val) {
        // Raw DB color names
        case 'red':    return '#f43f5e'; // rose-500
        case 'orange': return '#f97316'; // orange-500
        case 'green':  return '#22c55e'; // green-500
        case 'blue':   return '#3b82f6'; // blue-500
        case 'yellow': return '#eab308'; // yellow-500
        // Priority codes
        case 'at':     return '#f43f5e'; // Alta - rose-500
        case 'md':     return '#f97316'; // Média - orange-500
        case 'bx':     return '#22c55e'; // Baixa - green-500
        // Numeric IDs (based on DB screenshot)
        case '1':      return '#f43f5e'; // Alta
        case '2':      return '#f97316'; // Média
        case '3':      return '#22c55e'; // Baixa
        default:       return '#64748b'; // slate-500
    }
};


/**
 * Get configuration (icon, color, label) for a status ID
 * @param statusId - Status ID from database
 * @returns Object with icon name, text color class, background color class, and bar color class
 */
export const getStatusConfig = (statusId?: number | string) => {
    const id = Number(statusId);
    switch (id) {
        case 1: // Pendente (SS)
            return { icon: 'assignment_late', color: 'text-orange-500', bgColor: 'bg-orange-500/10', barColor: 'bg-orange-500', label: 'Pendentes' };
        case 2: // Avaliação
            return { icon: 'assignment_late', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', barColor: 'bg-yellow-500', label: 'Avaliação' };
        case 3: // Autorizada
            return { icon: 'check_circle', color: 'text-blue-500', bgColor: 'bg-blue-500/10', barColor: 'bg-blue-500', label: 'Autorizadas' };
        case 4: // Agendada
            return { icon: 'calendar_month', color: 'text-indigo-500', bgColor: 'bg-indigo-500/10', barColor: 'bg-indigo-500', label: 'Agendadas' };
        case 5: // Execução
            return { icon: 'engineering', color: 'text-green-500', bgColor: 'bg-green-500/10', barColor: 'bg-green-500', label: 'Execução' };
        case 6: // Suspensa
            return { icon: 'pause_circle', color: 'text-red-500', bgColor: 'bg-red-500/10', barColor: 'bg-red-500', label: 'Suspensas' };
        case 7: // Cancelada
            return { icon: 'cancel', color: 'text-rose-600', bgColor: 'bg-rose-600/10', barColor: 'bg-rose-600', label: 'Canceladas' };
        default:
            return { icon: 'task_alt', color: 'text-slate-500', bgColor: 'bg-slate-500/10', barColor: 'bg-slate-500', label: 'Status' };
    }
};
