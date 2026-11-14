import React from 'react';
import { Card } from '../../../components/ui/Card';

interface ProfileSignatureTabProps {
    isOwner: boolean;
    isAdmin: boolean;
    /** uuid do usuário do perfil: sem ele não dá para excluir a assinatura. */
    userUuid?: string;
    signatureUrl?: string;
    isSavingSignature: boolean;
    signatureUploadProgress: number;
    onOpenPad: () => void;
    onRequestDelete: () => void;
}

/** Aba "Assinatura" do perfil (JSX movido do ProfileScreen; os setters viraram callbacks). */
export const ProfileSignatureTab: React.FC<ProfileSignatureTabProps> = ({
    isOwner, isAdmin, userUuid, signatureUrl, isSavingSignature, signatureUploadProgress, onOpenPad, onRequestDelete,
}) => (
    <section className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Assinatura Digital</h3>

        {/* Qualquer usuário cria/altera a PRÓPRIA assinatura (antes: só líderes);
            admin altera de qualquer um. RLS 20261113 permite a própria linha. */}
        {(isOwner || isAdmin) ? (
            <Card className="p-5 flex flex-col gap-4 relative overflow-hidden group hover:border-primary/30 transition-all border-dashed border-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-[18px]">badge</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Assinatura Padrão</span>
                    </div>
                    {signatureUrl && (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">
                                <span className="material-symbols-outlined text-[14px]">verified</span>
                                <span className="text-[8px] font-black uppercase tracking-widest">Salva</span>
                            </div>
                            <button
                                onClick={() => {
                                    if (!userUuid) return;
                                    onRequestDelete();
                                }}
                                disabled={isSavingSignature}
                                className="w-6 h-6 flex items-center justify-center bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                title="Excluir assinatura"
                            >
                                <span className="material-symbols-outlined text-[14px]">delete</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="h-28 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden transition-colors group-hover:bg-slate-100/50 dark:group-hover:bg-slate-900">
                    {signatureUrl ? (
                        <img
                            src={signatureUrl}
                            alt="Assinatura Padrão"
                            className="max-h-full p-2 object-contain dark:invert transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-2 opacity-30">
                            <span className="material-symbols-outlined text-2xl">pending_actions</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Aguardando</span>
                        </div>
                    )}
                </div>

                {!signatureUrl ? (
                    <button
                        onClick={() => onOpenPad()}
                        disabled={isSavingSignature}
                        className="w-full py-3 text-[10px] font-black uppercase tracking-widest bg-primary text-white hover:bg-primary-dark rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98]"
                    >
                        Assinar Agora
                    </button>
                ) : (
                    <button
                        onClick={() => onOpenPad()}
                        disabled={isSavingSignature}
                        className="w-full py-3 text-[10px] font-black uppercase tracking-widest bg-primary text-white hover:bg-primary-dark rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98]"
                    >
                        Alterar Assinatura
                    </button>
                )}

                {isSavingSignature && (
                    <div className="space-y-1">
                        <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${signatureUploadProgress}%` }}
                            />
                        </div>
                        <p className="text-[8px] text-center text-slate-400 font-bold uppercase tracking-widest">
                            Processando...
                        </p>
                    </div>
                )}

                <p className="text-[8px] text-center font-bold text-slate-400 uppercase tracking-widest">
                    Será aplicada automaticamente nas visitas
                </p>
            </Card>
        ) : (
            <div className="bg-white dark:bg-card-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-3xl text-slate-400">draw</span>
                    </div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{signatureUrl ? 'Assinatura cadastrada' : 'Sem assinatura'}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Só o próprio usuário ou um administrador pode criar ou alterar a assinatura.</p>
                </div>
            </div>
        )}
    </section>
);
