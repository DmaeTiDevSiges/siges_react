import React, { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { User } from '../../types';
import { dataService } from '../../services/dataService';
import { detectFacesInImage } from '../../services/ai/faceDetector';
import { evaluateProfileFace, PROFILE_FACE_MESSAGES, type ProfileFaceReason } from '../../services/ai/profileFaceRules';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { UserAvatar } from '../ui/UserAvatar';

/**
 * Revisão das fotos de perfil ATUAIS (etapa 4): roda no navegador do administrador
 * o mesmo detector e as mesmas regras do envio pelo perfil, grava o resultado em
 * users.img_face_verified e permite avisar quem teve a foto recusada.
 */

type Scope = 'pending' | 'all';

interface ReviewResult {
    user: User;
    /** null = não foi possível abrir a imagem (fica como não verificada). */
    reason: ProfileFaceReason | null;
    ok: boolean;
}

interface ProfilePhotoReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    currentUserId?: string;
    onChecked: (userId: string, verified: boolean, reason: string) => void;
}

const loadImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });

const REASON_LABEL: Record<ProfileFaceReason, string> = {
    ok: 'Aprovada',
    no_face: 'Sem rosto',
    multiple_faces: 'Mais de um rosto',
    face_too_small: 'Rosto pequeno',
    low_confidence: 'Rosto não reconhecido',
};

export const ProfilePhotoReviewModal: React.FC<ProfilePhotoReviewModalProps> = ({ isOpen, onClose, users, currentUserId, onChecked }) => {
    const [scope, setScope] = useState<Scope>('pending');
    const [running, setRunning] = useState(false);
    const [progress, setProgress] = useState({ done: 0, total: 0 });
    const [results, setResults] = useState<ReviewResult[] | null>(null);
    const [notifying, setNotifying] = useState(false);
    const cancelRef = useRef(false);

    const withPhoto = useMemo(() => users.filter(u => u.hasPhoto && u.avatarCheckUrl), [users]);
    const pending = useMemo(() => withPhoto.filter(u => u.imgFaceVerified == null), [withPhoto]);
    const withoutPhoto = users.length - withPhoto.length;
    const targets = scope === 'pending' ? pending : withPhoto;

    const rejected = (results || []).filter(r => r.reason && !r.ok);
    const approved = (results || []).filter(r => r.ok);
    const unreadable = (results || []).filter(r => r.reason === null);

    const close = () => {
        if (running) cancelRef.current = true;
        setResults(null);
        setProgress({ done: 0, total: 0 });
        onClose();
    };

    const run = async () => {
        cancelRef.current = false;
        setRunning(true);
        setResults([]);
        setProgress({ done: 0, total: targets.length });
        const collected: ReviewResult[] = [];

        for (const user of targets) {
            if (cancelRef.current) break;
            let result: ReviewResult;
            try {
                const img = await loadImage(user.avatarCheckUrl as string);
                let faces;
                try {
                    faces = await detectFacesInImage(img);
                } catch {
                    toast.error('Não foi possível carregar o detector de rosto. Tente novamente.');
                    break;
                }
                const verdict = evaluateProfileFace(faces, img.naturalWidth, img.naturalHeight);
                await dataService.recordProfileFaceCheck(user.id, verdict.ok, verdict.reason);
                onChecked(user.id, verdict.ok, verdict.reason);
                result = { user, reason: verdict.reason, ok: verdict.ok };
            } catch {
                result = { user, reason: null, ok: false };
            }
            collected.push(result);
            setResults([...collected]);
            setProgress(p => ({ ...p, done: p.done + 1 }));
        }

        setRunning(false);
    };

    const notifyRejected = async () => {
        if (!currentUserId || rejected.length === 0) return;
        setNotifying(true);
        try {
            const sent = await dataService.notifyProfilePhotoRejected(
                rejected.map(r => ({ userId: r.user.id, message: PROFILE_FACE_MESSAGES[r.reason as ProfileFaceReason] })),
                currentUserId,
            );
            toast.success(`${sent} usuário(s) avisado(s) para trocar a foto.`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erro ao enviar os avisos');
        } finally {
            setNotifying(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={close} title="Revisar fotos de perfil" maxWidth="lg">
            <div className="space-y-4">
                {results === null ? (
                    <>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Verifica se cada foto tem <strong>exatamente um rosto</strong>, de tamanho adequado — as mesmas regras do envio pelo perfil.
                            O resultado fica gravado no cadastro do usuário.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {([['pending', `Não verificadas (${pending.length})`], ['all', `Todas com foto (${withPhoto.length})`]] as [Scope, string][]).map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setScope(value)}
                                    className={`px-3 py-2.5 rounded-xl text-sm font-bold border transition-colors ${scope === value
                                        ? 'bg-primary/10 border-primary text-primary'
                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        {withoutPhoto > 0 && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {withoutPhoto} usuário(s) estão sem foto — use o filtro "Foto pendente" na lista para vê-los.
                            </p>
                        )}
                        <Button type="button" variant="primary" fullWidth disabled={targets.length === 0} onClick={run}>
                            <span className="material-symbols-outlined text-[18px]">face</span>
                            Verificar {targets.length} foto(s)
                        </Button>
                    </>
                ) : (
                    <>
                        <div>
                            <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                                <span>{running ? 'Verificando…' : 'Concluído'}</span>
                                <span>{progress.done}/{progress.total}</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div className="h-full bg-primary transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-2">
                                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{approved.length}</div>
                                <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">Aprovadas</div>
                            </div>
                            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-2">
                                <div className="text-lg font-black text-red-600 dark:text-red-400">{rejected.length}</div>
                                <div className="text-[11px] font-bold text-red-700 dark:text-red-300">Recusadas</div>
                            </div>
                            <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-2">
                                <div className="text-lg font-black text-slate-600 dark:text-slate-300">{unreadable.length}</div>
                                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Não abriram</div>
                            </div>
                        </div>

                        {(rejected.length > 0 || unreadable.length > 0) && (
                            <ul className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-100 dark:border-slate-800">
                                {[...rejected, ...unreadable].map(r => (
                                    <li key={r.user.id} className="flex items-center gap-3 p-2">
                                        <UserAvatar src={r.user.avatarUrl} name={r.user.nameFull || ''} size="sm" />
                                        <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{r.user.nameFull}</span>
                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${r.reason
                                            ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                            {r.reason ? REASON_LABEL[r.reason] : 'Imagem não abriu'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="flex gap-3">
                            {running ? (
                                <Button type="button" variant="secondary" fullWidth onClick={() => { cancelRef.current = true; }}>
                                    Parar
                                </Button>
                            ) : (
                                <>
                                    <Button type="button" variant="secondary" fullWidth onClick={close}>Fechar</Button>
                                    {rejected.length > 0 && (
                                        <Button type="button" variant="primary" fullWidth loading={notifying} onClick={notifyRejected}>
                                            <span className="material-symbols-outlined text-[18px]">notifications</span>
                                            Avisar {rejected.length}
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};
