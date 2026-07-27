import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';

const SESSION_POLL_INTERVAL = 1500;
const SESSION_POLL_MAX_WAIT = 15000;

interface ResetPasswordScreenProps {
    onSuccess: () => void;
    onBack: () => void;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ onSuccess, onBack }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [sessionReady, setSessionReady] = useState(false);
    const [sessionTimedOut, setSessionTimedOut] = useState(false);
    const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mountedRef = useRef(true);

    const cleanupPoll = useCallback(() => {
        if (pollRef.current) {
            clearTimeout(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    // Wait for Supabase to establish the recovery session via polling
    useEffect(() => {
        mountedRef.current = true;
        let elapsed = 0;

        const pollSession = async () => {
            if (!mountedRef.current) return;
            try {
                const { supabase } = await import('../../services/supabase');
                const { data: { session }, error } = await supabase.auth.getSession();

                if (session) {
                    setSessionReady(true);
                    return;
                }

                elapsed += SESSION_POLL_INTERVAL;

                if (elapsed >= SESSION_POLL_MAX_WAIT) {
                    console.error('[ResetPassword] Session not established after', SESSION_POLL_MAX_WAIT, 'ms');
                    setSessionTimedOut(true);
                    return;
                }

                pollRef.current = setTimeout(pollSession, SESSION_POLL_INTERVAL);
            } catch (e) {
                console.error('[ResetPassword] Session poll error:', e);
                elapsed += SESSION_POLL_INTERVAL;
                if (elapsed >= SESSION_POLL_MAX_WAIT) {
                    setSessionTimedOut(true);
                    return;
                }
                pollRef.current = setTimeout(pollSession, SESSION_POLL_INTERVAL);
            }
        };

        pollSession();

        return () => {
            mountedRef.current = false;
            cleanupPoll();
        };
    }, [cleanupPoll]);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { supabase } = await import('../../services/supabase');

            // Ensure session is loaded before calling updateUser
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setError('Sessão de recuperação não encontrada. Solicite um novo link de recuperação.');
                setLoading(false);
                return;
            }

            const { data, error: updateError } = await supabase.auth.updateUser({ password });

            if (updateError) {
                throw updateError;
            }

            setSuccess(true);
            setTimeout(() => {
                onSuccess();
            }, 2000);
        } catch (err: any) {
            console.error('Update password error:', err);
            const msg = (err?.message || err?.error_description || String(err)).toLowerCase();

            if (msg.includes('same_password') || msg.includes('different from the old')) {
                setError('A nova senha deve ser diferente da senha atual.');
            } else if (msg.includes('weak_password') || msg.includes('at least 6') || msg.includes('should be at least')) {
                setError('A senha deve ter pelo menos 6 caracteres.');
            } else if (msg.includes('token') && (msg.includes('expired') || msg.includes('invalid'))) {
                setError('O link de recuperação expirou ou é inválido. Solicite um novo link.');
            } else if (msg.includes('session') && (msg.includes('missing') || msg.includes('not found'))) {
                setError('Sessão de recuperação não encontrada. Solicite um novo link de recuperação.');
            } else {
                setError('Ocorreu um erro ao redefinir a senha. Tente novamente ou solicite um novo link.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 dark:bg-background-dark p-6 font-inter transition-colors duration-300 relative safe-area-top safe-area-bottom">
                <div className="w-full max-w-[400px] space-y-8 text-center animate-in zoom-in duration-300">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Senha alterada!</h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Sua senha foi atualizada com sucesso. Redirecionando para o login...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Waiting for recovery session to be established
    if (!sessionReady && !sessionTimedOut) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 dark:bg-background-dark p-6 font-inter transition-colors duration-300 relative safe-area-top safe-area-bottom">
                <div className="w-full max-w-[400px] space-y-8 text-center">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="w-48 h-24 flex items-center justify-center">
                            <img src="/siges_logo.png" alt="Siges Logo" className="max-w-full max-h-full object-contain" />
                        </div>
                        <Loading size="md" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Preparando ambiente de recuperação...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Session could not be established
    if (sessionTimedOut) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 dark:bg-background-dark p-6 font-inter transition-colors duration-300 relative safe-area-top safe-area-bottom">
                <div className="w-full max-w-[400px] space-y-8 text-center">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-red-600 text-4xl">error</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Link expirado ou inválido</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Não foi possível validar o link de recuperação. Solicite um novo link de recuperação de senha.
                        </p>
                    </div>
                    <Button
                        onClick={onBack}
                        fullWidth
                        className="h-12 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-primary/20"
                    >
                        Solicitar novo link
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 dark:bg-background-dark p-6 font-inter transition-colors duration-300 relative safe-area-top safe-area-bottom">
            <div className="w-full max-w-[400px] space-y-8">
                <div className="flex flex-col items-center space-y-6">
                    <div className="w-48 h-24 flex items-center justify-center">
                        <img src="/siges_logo.png" alt="Siges Logo" className="max-w-full max-h-full object-contain" />
                    </div>

                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Nova senha</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Crie uma nova senha forte para acessar sua conta.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-900/10 border border-red-900/20 rounded-xl text-red-600 dark:text-red-400 text-sm animate-shake text-center font-medium">
                            {error}
                        </div>
                    )}

                    <Input
                        label="Nova Senha"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        leftIcon={<span className="material-symbols-outlined text-[22px]">lock</span>}
                        required
                        rightIcon={
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors focus:outline-none"
                            >
                                <span className="material-symbols-outlined text-[22px]">
                                    {showPassword ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        }
                    />

                    <Input
                        label="Confirmar Nova Senha"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        leftIcon={<span className="material-symbols-outlined text-[22px]">lock_reset</span>}
                        required
                    />

                    <Button
                        type="submit"
                        loading={loading}
                        fullWidth
                        className="h-14 bg-primary hover:bg-blue-600 text-white rounded-xl text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4"
                    >
                        Redefinir senha
                    </Button>
                </form>
            </div>
        </div>
    );
};
