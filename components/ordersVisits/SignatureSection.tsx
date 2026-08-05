import React, { useState, useEffect, useRef } from 'react';
import { OrderVisit, User } from '../../types';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { SignaturePad } from '../ui/SignaturePad';
import { dataService } from '../../services/dataService';
import { toast } from 'sonner';
import { Loading } from '../ui/Loading';


interface SignatureSectionProps {
    visit: OrderVisit;
    onRefresh: () => void;
    isEditable?: boolean;
    currentUser?: User | null;
}

export const SignatureSection: React.FC<SignatureSectionProps> = ({ visit, onRefresh, isEditable = true, currentUser }) => {
    const [signingType, setSigningType] = useState<'leader' | 'requester' | null>(null);
    const [deletingType, setDeletingType] = useState<'leader' | 'requester' | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isApplyingDefault, setIsApplyingDefault] = useState(false);
    const autoApplyAttempted = useRef(false);
    const [isLandscape, setIsLandscape] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(orientation: landscape)').matches ||
               window.matchMedia('(max-height: 500px)').matches;
    });

    useEffect(() => {
        const mqPortrait = window.matchMedia('(orientation: portrait)');
        const mqLandscape = window.matchMedia('(orientation: landscape)');
        const mqSmallHeight = window.matchMedia('(max-height: 500px)');

        const update = () => {
            setIsLandscape(mqLandscape.matches || mqSmallHeight.matches);
        };

        mqPortrait.addEventListener('change', update);
        mqLandscape.addEventListener('change', update);
        mqSmallHeight.addEventListener('change', update);

        return () => {
            mqPortrait.removeEventListener('change', update);
            mqLandscape.removeEventListener('change', update);
            mqSmallHeight.removeEventListener('change', update);
        };
    }, []);

    // Auto-apply default leader signature when visit has no leader signature
    useEffect(() => {
        if (
            autoApplyAttempted.current ||
            !isEditable ||
            visit.ovSignatureLeaderPath ||
            !currentUser?.signatureImagePath ||
            !currentUser?.signatureImageName
        ) {
            return;
        }

        autoApplyAttempted.current = true;

        const applyDefaultSignature = async () => {
            try {
                setIsApplyingDefault(true);
                const signatureUrl = dataService.getUserSignatureUrl(
                    currentUser.signatureImagePath!,
                    currentUser.signatureImageName!
                );
                const response = await fetch(signatureUrl);
                const blob = await response.blob();

                const reader = new FileReader();
                reader.onloadend = async () => {
                    try {
                        const base64 = reader.result as string;
                        await dataService.saveOrderVisitSignature(visit.id, 'leader', base64);
                        toast.success('Assinatura padrão aplicada automaticamente');
                        onRefresh();
                    } catch (error) {
                        console.error('Erro ao aplicar assinatura padrão:', error);
                    } finally {
                        setIsApplyingDefault(false);
                    }
                };
                reader.readAsDataURL(blob);
            } catch (error) {
                console.error('Erro ao buscar assinatura padrão:', error);
                setIsApplyingDefault(false);
            }
        };

        applyDefaultSignature();
    }, [visit, currentUser, isEditable, onRefresh]);

    const handleSaveSignature = async (base64: string) => {
        if (!signingType || !isEditable) return;
        
        try {
            setIsSaving(true);
            await dataService.saveOrderVisitSignature(visit.id, signingType, base64);
            toast.success(`Assinatura do ${signingType === 'leader' ? 'Líder' : 'Requisitante'} salva com sucesso!`);
            setSigningType(null);
            onRefresh();
        } catch (error) {
            console.error('Erro ao salvar assinatura:', error);
            toast.error('Falha ao salvar assinatura digital.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteSignature = async () => {
        if (!deletingType || !isEditable) return;

        try {
            await dataService.deleteOrderVisitSignature(visit.id, deletingType);
            toast.success('Assinatura removida');
            setDeletingType(null);
            onRefresh();
        } catch (error) {
            console.error('Erro ao excluir assinatura:', error);
            toast.error('Falha ao excluir assinatura.');
        }
    };

    const leaderSignatureUrl = visit.ovSignatureLeaderName 
        ? dataService.getSignatureUrl(visit.ovSignatureLeaderPath!, visit.ovSignatureLeaderName!) 
        : null;

    const requesterSignatureUrl = visit.ovSignatureRequesterName 
        ? dataService.getSignatureUrl(visit.ovSignatureRequesterPath!, visit.ovSignatureRequesterName!) 
        : null;

    const canDelete = isEditable && visit.ovProcessingId !== 5;

    return (
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Assinaturas Digitais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* LÍDER */}
                <Card className="p-5 flex flex-col gap-4 relative overflow-hidden group hover:border-primary/30 transition-all border-dashed border-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-400 text-[18px]">badge</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Líder da Equipe</span>
                        </div>
                        {leaderSignatureUrl && (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">
                                    <span className="material-symbols-outlined text-[14px]">verified</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest">Assinado</span>
                                </div>
                                {canDelete && (
                                    <button 
                                        onClick={() => setDeletingType('leader')}
                                        className="w-6 h-6 flex items-center justify-center bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                        title="Excluir assinatura"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">delete</span>
                                    </button>
                                )}
                                {(!isEditable || visit.ovProcessingId === 5) && (
                                    <span className="material-symbols-outlined text-slate-300 text-[16px]" title="Registro Arquivado">lock</span>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div className="h-28 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center justify-center overflow-hidden transition-colors group-hover:bg-slate-100/50 dark:group-hover:bg-slate-900/80">
                        {leaderSignatureUrl ? (
                            <img 
                                src={leaderSignatureUrl} 
                                alt="Assinatura Líder" 
                                className="max-h-full p-2 object-contain brightness-0 dark:invert transition-transform duration-500 group-hover:scale-105" 
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2 opacity-30">
                                <span className="material-symbols-outlined text-2xl">pending_actions</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest">Aguardando</span>
                            </div>
                        )}
                    </div>

                    {canDelete && !leaderSignatureUrl && (
                        <button 
                            onClick={() => setSigningType('leader')}
                            className="w-full py-3 text-[10px] font-black uppercase tracking-widest bg-primary text-white hover:bg-primary-dark rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98]"
                        >
                            Assinar Agora
                        </button>
                    )}
                    
                    {leaderSignatureUrl && (
                        <div className="text-[8px] text-center font-bold text-slate-400 uppercase tracking-widest">
                            Data: {new Date(visit.ovSignatureLeaderAt!).toLocaleString('pt-BR')}
                        </div>
                    )}
                </Card>

                {/* REQUISITANTE */}
                <Card className="p-5 flex flex-col gap-4 relative overflow-hidden group hover:border-indigo-500/30 transition-all border-dashed border-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-400 text-[18px]">person_check</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Requisitante / Cliente / Contratado</span>
                        </div>
                        {requesterSignatureUrl && (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">
                                    <span className="material-symbols-outlined text-[14px]">verified</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest">Assinado</span>
                                </div>
                                {canDelete && (
                                    <button 
                                        onClick={() => setDeletingType('requester')}
                                        className="w-6 h-6 flex items-center justify-center bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                        title="Excluir assinatura"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">delete</span>
                                    </button>
                                )}
                                {(!isEditable || visit.ovProcessingId === 5) && (
                                    <span className="material-symbols-outlined text-slate-300 text-[16px]" title="Registro Arquivado">lock</span>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div className="h-28 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center justify-center overflow-hidden transition-colors group-hover:bg-slate-100/50 dark:group-hover:bg-slate-900/80">
                        {requesterSignatureUrl ? (
                            <img 
                                src={requesterSignatureUrl} 
                                alt="Assinatura Requisitante" 
                                className="max-h-full p-2 object-contain brightness-0 dark:invert transition-transform duration-500 group-hover:scale-105" 
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2 opacity-30">
                                <span className="material-symbols-outlined text-2xl">pending_actions</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest">Aguardando</span>
                            </div>
                        )}
                    </div>

                    {canDelete && !requesterSignatureUrl && (
                        <button 
                            onClick={() => setSigningType('requester')}
                            className="w-full py-3 text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 active:scale-[0.98]"
                        >
                            Coletar Assinatura
                        </button>
                    )}
                    
                    {requesterSignatureUrl && (
                        <div className="text-[8px] text-center font-bold text-slate-400 uppercase tracking-widest">
                            Data: {new Date(visit.ovSignatureRequesterAt!).toLocaleString('pt-BR')}
                        </div>
                    )}
                </Card>
            </div>

            <Modal
                isOpen={!!signingType}
                onClose={() => !isSaving && setSigningType(null)}
                title={`Coleta de Assinatura`}
                maxWidth={isLandscape ? '4xl' : 'sm'}
                fullScreenMobile={isLandscape}
                noPadding={isLandscape}
                hideHeader={isLandscape}
                className={isLandscape ? 'pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))]' : ''}
            >
                {isSaving ? (
                    <div className={`flex flex-col items-center justify-center ${isLandscape ? 'h-[200px]' : 'h-[300px]'} gap-4`}>
                        <div className="relative">
                            <div className="h-16 w-16 rounded-full border-4 border-slate-100 dark:border-slate-800 animate-pulse"></div>
                            <Loading size="xs" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500 animate-pulse">Processando Assinatura</span>
                    </div>
                ) : (
                    <div className={isLandscape ? 'h-[65vh] sm:h-[75vh] flex flex-col' : 'h-[55vh] sm:h-[60vh] flex flex-col'}>
                        <SignaturePad
                            onSave={handleSaveSignature}
                            onCancel={() => setSigningType(null)}
                            title={signingType === 'leader' ? "Assinatura do Líder" : "Assinatura do Requisitante"}
                        />
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={!!deletingType}
                onClose={() => setDeletingType(null)}
                title="Excluir Assinatura"
                message={`Deseja realmente excluir a assinatura do ${deletingType === 'leader' ? 'Líder' : 'Requisitante'}?`}
                type="warning"
                confirmLabel="Excluir"
                onConfirm={handleDeleteSignature}
            />
        </section>
    );
};
