
import React, { useState } from 'react';
import { AssetTag } from '../../../../types';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Button } from '../../../../components/ui/Button';

interface AssetTagFormProps {
    initialTag?: AssetTag;
    onSave: (tag: Partial<AssetTag>) => Promise<void>;
    onCancel: () => void;
}

export const AssetTagForm: React.FC<AssetTagFormProps> = ({ initialTag, onSave, onCancel }) => {
    const [code, setCode] = useState(initialTag?.code || '');
    const [description, setDescription] = useState(initialTag?.description || '');
    const [isAvailable, setIsAvailable] = useState(initialTag?.isAvailable ?? true);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({ code, description, isAvailable });
        } catch (error) {
            console.error('Failed to save asset tag', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
                <Input
                    label="Código"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ex: SET01"
                    required
                />
                <Input
                    label="Descrição"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Manutenção Central"
                    required
                />
                <Select
                    label="Situação"
                    value={isAvailable ? 'active' : 'inactive'}
                    onChange={(e) => setIsAvailable(e.target.value === 'active')}
                    options={[
                        { value: 'active', label: 'Ativo' },
                        { value: 'inactive', label: 'Inativo' }
                    ]}
                />
            </div>

            <div className="flex gap-3 pt-4">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                    className="flex-1"
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    className="flex-1"
                >
                    Salvar
                </Button>
            </div>
        </form>
    );
};
