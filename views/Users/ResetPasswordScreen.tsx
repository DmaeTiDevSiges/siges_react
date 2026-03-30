import React, { useState } from 'react';
import { dataService } from '../../services/dataService';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

interface ResetPasswordScreenProps {
    onSuccess: () => void;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ onSuccess }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

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
            await dataService.updatePassword(password);
            setSuccess(true);
            setTimeout(() => {
                onSuccess();
            }, 2000);
        } catch (err: any) {
            console.error('Update password error:', err);
            setError('Falha ao atualizar a senha. O link pode ter expirado.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-background-dark p-6 font-inter transition-colors duration-300 relative safe-area-top safe-area-bottom">
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

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-background-dark p-6 font-inter transition-colors duration-300 relative safe-area-top safe-area-bottom">
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
