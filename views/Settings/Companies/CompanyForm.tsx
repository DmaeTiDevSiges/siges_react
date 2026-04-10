import React, { useState } from 'react';
import { Company } from '../../../types';
import { Input } from '../../../components/ui/Input';
import { ButtonSave } from '../../../components/ui/ButtonSave';
import { Modal } from '../../../components/ui/Modal';
import { ImageEditorModal } from '../../../components/ui/ImageEditorModal';

interface CompanyFormProps {
    initialCompany?: Partial<Company>;
    onSave: (company: Partial<Company>) => Promise<void> | void;
    onCancel: () => void;
}

export const CompanyForm: React.FC<CompanyFormProps> = ({ initialCompany, onSave, onCancel }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({
        name: initialCompany?.name || '',
        code: initialCompany?.code || '',
        emailSuffix: initialCompany?.emailSuffix || '',
        status: initialCompany?.status || 'active',
        logoUrl: initialCompany?.logoUrl || '',
    });
    const [modal, setModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'info' | 'warning' | 'error' | 'success';
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingImage, setEditingImage] = useState<File | string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.logoUrl) {
            setModal({
                isOpen: true,
                title: 'Atenção',
                message: 'O logo é obrigatório.',
                type: 'warning'
            });
            return;
        }

        try {
            setIsSaving(true);
            // Artificial delay to ensure the premium loading effect is visible
            await new Promise(resolve => setTimeout(resolve, 1000));
            await onSave(form as Partial<Company>);
        } catch (error) {
            console.error("Error saving form", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark relative">
            {isSaving && (
                <div className="absolute top-0 left-0 right-0 h-1 z-50 overflow-hidden bg-primary/20">
                    <div className="h-full bg-primary animate-loading-bar w-[40%]" />
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-6 overflow-y-auto pb-10">
                <Input
                    label="Nome completo"
                    placeholder="Ex: ACME Ltda"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                />

                <Input
                    label="Nome reduzido"
                    placeholder="Ex: ACME"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    required
                />

                <Input
                    label="Sufixo de Email"
                    placeholder="Ex: @acme.com"
                    value={form.emailSuffix}
                    onChange={(e) => setForm({ ...form, emailSuffix: e.target.value })}
                    required
                />

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Logo
                    </label>
                    <p className="text-xs text-slate-500">
                        JPG ou PNG. Max 500x500px.
                    </p>

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-4">
                            <label
                                htmlFor="logo-upload"
                                className="cursor-pointer group relative"
                            >
                                <div
                                    className="h-24 w-24 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-cover bg-center overflow-hidden shrink-0 transition-colors group-hover:border-primary/50"
                                    style={form.logoUrl ? { backgroundImage: `url(${form.logoUrl})` } : {}}
                                >
                                    {!form.logoUrl && (
                                        <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">add_photo_alternate</span>
                                    )}
                                    {form.logoUrl && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="material-symbols-outlined text-white">edit</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    id="logo-upload"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setEditingImage(file);
                                            setIsEditorOpen(true);
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                </div>

                <ImageEditorModal
                    isOpen={isEditorOpen}
                    imageFile={editingImage || ''}
                    preventAnnotation={true}
                    onClose={() => {
                        setIsEditorOpen(false);
                        setEditingImage(null);
                    }}
                    onSave={(file) => {
                        setIsEditorOpen(false);
                        setEditingImage(null);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            setForm({ ...form, logoUrl: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                    }}
                />
            </form>

            <ButtonSave
                onSave={handleSubmit}
                onCancel={onCancel}
                isSaving={isSaving}
            />

            <Modal
                isOpen={modal.isOpen}
                onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
                title={modal.title}
                message={modal.message}
                type={modal.type}
            />
        </div>
    );
};
