import React, { useState, useEffect } from 'react';
import { Client } from '../../../types';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { ButtonSave } from '../../../components/ui/ButtonSave';
import { Modal } from '../../../components/ui/Modal';

// Extend window for Google Maps
declare global {
    interface Window {
        google: any;
    }
}

interface ClientFormProps {
    initialClient?: Partial<Client>;
    onSave: (client: Partial<Client>) => Promise<void> | void;
    onCancel: () => void;
}

const formatCPFCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
        return numbers
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    } else {
        return numbers
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    }
};

const formatMobile = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
        .substring(0, 11)
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
};

export const ClientForm: React.FC<ClientFormProps> = ({ initialClient, onSave, onCancel }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({
        name: initialClient?.name || '',
        code: initialClient?.code || '',
        email: initialClient?.email || '',
        mobile: initialClient?.mobile || '',
        address: initialClient?.address || '',
        status: initialClient?.status || 'active',
        logoUrl: initialClient?.logoUrl || '',
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

    useEffect(() => {
        // Only attempt to initialize if google maps script is loaded
        if (!window.google || !window.google.maps || !window.google.maps.places) return;

        const input = document.getElementById('address-input') as HTMLInputElement;
        if (!input) return;

        const autocomplete = new window.google.maps.places.Autocomplete(input, {
            types: ['address'],
            componentRestrictions: { country: 'br' }
        });

        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.formatted_address) {
                setForm(prev => ({ ...prev, address: place.formatted_address }));
            }
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;

        try {
            setIsSaving(true);
            // Artificial delay for premium effect visibility
            await new Promise(resolve => setTimeout(resolve, 1000));
            await onSave(form as Partial<Client>);
        } catch (error) {
            console.error("Error saving client form", error);
            setModal({
                isOpen: true,
                title: 'Erro',
                message: 'Não foi possível salvar os dados do cliente.',
                type: 'error'
            });
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
                    placeholder="Ex: João Silva"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                />

                <Input
                    label="CPF / CNPJ"
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: formatCPFCNPJ(e.target.value) })}
                    required
                />

                <Input
                    label="E-mail"
                    placeholder="exemplo@email.com"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                />

                <Input
                    label="Celular"
                    placeholder="(00) 00000-0000"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: formatMobile(e.target.value) })}
                />

                <Input
                    id="address-input"
                    label="Endereço"
                    placeholder="Buscando endereço..."
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                />

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Foto
                    </label>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-4">
                            <label htmlFor="logo-upload" className="cursor-pointer group relative">
                                <div
                                    className="h-24 w-24 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-cover bg-center overflow-hidden shrink-0 transition-colors group-hover:border-primary/50"
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
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setForm({ ...form, logoUrl: reader.result as string });
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {initialClient && (
                    <Select
                        label="Situação"
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
                    >
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                    </Select>
                )}
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

