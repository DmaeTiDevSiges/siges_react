
import React, { useState, useEffect } from 'react';
import { AssetTag, AssetTagSub } from '../../../../types';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Button } from '../../../../components/ui/Button';
import { dataService } from '../../../../services/dataService';

interface AssetTagSubFormProps {
    initialTagSub?: AssetTagSub;
    onSave: (tagSub: Omit<AssetTagSub, 'id'>) => Promise<void>;
    onCancel: () => void;
}

export const AssetTagSubForm: React.FC<AssetTagSubFormProps> = ({ initialTagSub, onSave, onCancel }) => {
    const [code, setCode] = useState(initialTagSub?.code || '');
    const [description, setDescription] = useState(initialTagSub?.description || '');
    const [parentId, setParentId] = useState(initialTagSub?.parentId || '');
    const [isAvailable, setIsAvailable] = useState(initialTagSub?.isAvailable ?? true);
    const [parents, setParents] = useState<AssetTag[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingParents, setFetchingParents] = useState(true);

    useEffect(() => {
        const fetchParents = async () => {
            try {
                const data = await dataService.getAssetTags('all');
                setParents(data);
                if (!parentId && data.length > 0) {
                    setParentId(data[0].id);
                }
            } catch (error) {
                console.error('Failed to load asset tags', error);
            } finally {
                setFetchingParents(false);
            }
        };
        fetchParents();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!parentId) return;
        setLoading(true);
        try {
            await onSave({ code, description, isAvailable, parentId });
        } catch (error) {
            console.error('Failed to save asset tag sub', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
                <Select
                    label="Setor"
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    options={parents.map(p => ({ value: p.id, label: p.description }))}
                    disabled={fetchingParents}
                    required
                />
                <Input
                    label="Código"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ex: POS01"
                    required
                />
                <Input
                    label="Descrição"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Prateleira A"
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
                    disabled={!parentId || fetchingParents}
                    className="flex-1"
                >
                    Salvar
                </Button>
            </div>
        </form>
    );
};
