import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Company } from '../../types';

interface LoginScreenProps {
    onLoginSuccess: () => void;
    onForgotPassword: () => void;
    isDarkMode?: boolean;
    onThemeToggle?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onForgotPassword, isDarkMode, onThemeToggle }) => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [companyId, setCompanyId] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        dataService.getCompanies().then(data => {
            setCompanies(data.filter(cc => cc.status === 'active'));
        }).catch(console.error);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!companyId) {
            setError('Selecione uma empresa.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const company = companies.find(cc => cc.id === companyId);
            // Remove espaços em branco antes e depois do username
            const trimmedUsername = username.trim();
            const fullEmail = `${trimmedUsername}${company?.emailSuffix || ''}`;

            await dataService.signIn(fullEmail, password);
            onLoginSuccess();
        } catch (err: any) {
            console.error('Login error:', err);
            setError('Usuário ou senha inválidos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-background-dark p-6 font-inter transition-colors duration-300 relative safe-area-top safe-area-bottom">
            <div className="w-full max-w-[400px] space-y-8">
                {/* Logo Area */}
                <div className="flex flex-col items-center space-y-6">
                    <div className="w-48 h-24 flex items-center justify-center">
                        <img src="/siges_logo.png" alt="Siges Logo" className="max-w-full max-h-full object-contain" />
                    </div>

                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Bem-vindo de volta</h1>
                    </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-900/10 border border-red-900/20 rounded-xl text-red-600 dark:text-red-400 text-sm animate-shake text-center font-medium">
                            {error}
                        </div>
                    )}

                    <Select
                        label="Empresa"
                        value={companyId}
                        onChange={(e) => setCompanyId(e.target.value)}
                        leftIcon={<span className="material-symbols-outlined text-[22px]">business</span>}
                        required
                    >
                        <option value="" className="bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white">Selecione a empresa</option>
                        {companies.map(c => (
                            <option key={c.id} value={c.id} className="bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white">{c.name}</option>
                        ))}
                    </Select>

                    <Input
                        label="Usuário"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Nome de usuário"
                        leftIcon={<span className="material-symbols-outlined text-[22px]">person</span>}
                        required
                    />


                    <div className="space-y-2">
                        <Input
                            label="Senha"
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
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={onForgotPassword}
                                className="text-primary text-sm font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none"
                            >
                                Esqueceu a senha?
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        loading={loading}
                        fullWidth
                        className="h-14 bg-primary hover:bg-blue-600 text-white rounded-xl text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4"
                    >
                        Entrar
                    </Button>
                </form>
            </div>
        </div>
    );
};
