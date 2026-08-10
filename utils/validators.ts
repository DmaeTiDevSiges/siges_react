/**
 * Validation utility functions
 */

/**
 * Validate email format
 * @param email - Email string to validate
 * @returns True if email is valid
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate CPF (Brazilian tax ID)
 * @param cpf - CPF string to validate
 * @returns True if CPF is valid
 */
export const isValidCPF = (cpf: string): boolean => {
    // Remove non-numeric characters
    const cleanCPF = cpf.replace(/\D/g, '');

    // Check length
    if (cleanCPF.length !== 11) return false;

    // Check if all digits are the same
    if (/^(\d)\1+$/.test(cleanCPF)) return false;

    // Validate check digits
    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
        sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;

    return true;
};

/**
 * Validate phone number (Brazilian format)
 * @param phone - Phone string to validate
 * @returns True if phone is valid
 */
export const isValidPhone = (phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, '');
    // Accept 10 digits (landline) or 11 digits (mobile)
    return cleanPhone.length === 10 || cleanPhone.length === 11;
};

/**
 * Check if string is empty or only whitespace
 * @param value - String to check
 * @returns True if string is empty or whitespace
 */
export const isEmpty = (value?: string | null): boolean => {
    return !value || value.trim().length === 0;
};

/**
 * Validate required field
 * @param value - Value to validate
 * @param fieldName - Name of the field for error message
 * @returns Error message if invalid, undefined if valid
 */
export const validateRequired = (value: any, fieldName: string): string | undefined => {
    if (value === null || value === undefined || (typeof value === 'string' && isEmpty(value))) {
        return `${fieldName} é obrigatório`;
    }
    return undefined;
};
