import { useState, useCallback } from 'react';

interface FormErrors {
    [key: string]: string | undefined;
}

/**
 * Custom hook for form state management
 * @param initialValues - Initial form values
 * @param validate - Validation function
 * @returns Form state and handlers
 */
export const useForm = <T extends Record<string, any>>(
    initialValues: T,
    validate?: (values: T) => FormErrors
) => {
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * Handle input change
     */
    const handleChange = useCallback((name: keyof T, value: any) => {
        setValues(prev => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (errors[name as string]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    }, [errors]);

    /**
     * Handle input blur
     */
    const handleBlur = useCallback((name: keyof T) => {
        setTouched(prev => ({ ...prev, [name]: true }));

        // Validate field on blur
        if (validate) {
            const fieldErrors = validate(values);
            if (fieldErrors[name as string]) {
                setErrors(prev => ({ ...prev, [name]: fieldErrors[name as string] }));
            }
        }
    }, [validate, values]);

    /**
     * Handle form submission
     */
    const handleSubmit = useCallback(async (
        onSubmit: (values: T) => Promise<void> | void
    ) => {
        // Validate all fields
        if (validate) {
            const formErrors = validate(values);
            setErrors(formErrors);

            if (Object.keys(formErrors).some(key => formErrors[key])) {
                return;
            }
        }

        setIsSubmitting(true);
        try {
            await onSubmit(values);
        } catch (error) {
            console.error('Form submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    }, [validate, values]);

    /**
     * Reset form to initial values
     */
    const reset = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
    }, [initialValues]);

    /**
     * Set form values programmatically
     */
    const setFormValues = useCallback((newValues: Partial<T>) => {
        setValues(prev => ({ ...prev, ...newValues }));
    }, []);

    return {
        values,
        errors,
        touched,
        isSubmitting,
        handleChange,
        handleBlur,
        handleSubmit,
        reset,
        setFormValues
    };
};
