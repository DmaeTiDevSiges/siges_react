import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Company } from '../../types';

interface ForgotPasswordScreenProps {
    onBack: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onBack }) => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [companyId, setCompanyId] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        dataService.getCompanies().then(data => {
            setCompanies(data.filter(cc => cc.status === 'active'));
        }).catch(console.error);
    }, []);

    const handleResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!companyId) {
            setError('Selecione uma empresa.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const company = companies.find(cc => cc.id === companyId);
            const fullEmail = `${username}${company?.emailSuffix || ''}`;

            await dataService.resetPassword(fullEmail);
            setSuccess(true);
        } catch (err: any) {
            console.error('Reset request error:', err);
            setError('Ocorreu um erro ao tentar enviar o e-mail de recuperação. Verifique seus dados.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-background-dark p-6 font-inter transition-colors duration-300 relative safe-area-top safe-area-bottom">
                <div className="w-full max-w-[400px] space-y-8 text-center">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-green-600 text-4xl">mail</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">E-mail enviado!</h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Se o usuário existir, enviamos um link de recuperação para o e-mail cadastrado em nossa base.
                        </p>
                    </div>
                    <Button onClick={onBack} fullWidth className="h-12 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold mt-4 shadow-lg shadow-primary/20">
                        Voltar para o Login
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-background-dark p-6 font-inter transition-colors duration-300 relative safe-area-top safe-area-bottom">
            <div className="w-full max-w-[400px] space-y-8">
                {/* Header Area */}
                <div className="flex flex-col items-center space-y-6">
                    <div className="w-48 h-24 flex items-center justify-center">
                        <img src="/siges_logo.png" alt="Siges Logo" className="max-w-full max-h-full object-contain" />
                    </div>

                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Recuperar senha</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Informe os dados abaixo para receber um e-mail com instruções para redefinição.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleResetRequest} className="space-y-6">
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
                        <option value="" className="bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white">Código ou nome da empresa</option>
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

                    <div className="flex flex-col gap-3">
                        <Button
                            type="submit"
                            loading={loading}
                            fullWidth
                            className="h-14 bg-primary hover:bg-blue-600 text-white rounded-xl text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Enviar link
                        </Button>
                        <button
                            type="button"
                            onClick={onBack}
                            className="text-primary text-sm font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2 focus:outline-none"
                        >
                            Voltar para o Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
