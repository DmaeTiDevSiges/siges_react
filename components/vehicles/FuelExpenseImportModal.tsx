import React, { useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';
import { dataService } from '../../services/dataService';
import {
    fuelExpenseImportService,
    FuelExpenseImportError,
    FuelExpenseImportRow
} from '../../services/orders/fuelExpenseImportService';
import { FuelExpenseImportTemplate } from '../../utils/FuelExpenseImportTemplate';
import { User, Vehicle, VehicleCostType } from '../../types';

type ImportStep = 'upload' | 'validation' | 'confirm' | 'result';

interface FuelExpenseImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    companyId?: string;
    currentUser?: User | null;
    onImported?: () => void;
}

const FUEL_CODES = ['FUEL', 'COMBUSTIVEL', 'COMBUSTVEL'];

const normalizeCode = (code: string): string =>
    String(code || '').replace(/[^A-Za-z]/g, '').toUpperCase();

const STEP_TITLES: Record<ImportStep, string> = {
    upload: 'Importar Abastecimentos',
    validation: 'Validação do Arquivo',
    confirm: 'Confirmar Importação',
    result: 'Resultado da Importação'
};

export const FuelExpenseImportModal: React.FC<FuelExpenseImportModalProps> = ({
    isOpen,
    onClose,
    companyId,
    currentUser,
    onImported
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState<ImportStep>('upload');
    const [fileName, setFileName] = useState('');
    const [busy, setBusy] = useState(false);
    const [validRows, setValidRows] = useState<FuelExpenseImportRow[]>([]);
    const [errors, setErrors] = useState<FuelExpenseImportError[]>([]);
    const [result, setResult] = useState<{ imported: number; rejected: FuelExpenseImportError[] } | null>(null);
    const [progress, setProgress] = useState({ done: 0, total: 0 });
    const [dragActive, setDragActive] = useState(false);
    const [resolvedVehicleIds, setResolvedVehicleIds] = useState<Map<number, string>>(new Map());
    const [resolvedCostTypeId, setResolvedCostTypeId] = useState<string | null>(null);
    const effectiveCompanyId = companyId || currentUser?.companyId;
    const dragDropEnabled = !Capacitor.isNativePlatform();

    const resetState = () => {
        setStep('upload');
        setFileName('');
        setBusy(false);
        setValidRows([]);
        setErrors([]);
        setResult(null);
        setProgress({ done: 0, total: 0 });
        setDragActive(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleClose = () => {
        if (busy) return;
        if (result?.imported) onImported?.();
        onClose();
        resetState();
    };

    const handleFileSelected = async (file: File) => {
        setFileName(file.name);
        setValidRows([]);
        setErrors([]);
        setResult(null);
        setResolvedVehicleIds(new Map());
        setResolvedCostTypeId(null);
        setBusy(true);
        try {
            const parsed = await fuelExpenseImportService.parseFile(file);
            if (parsed.errors.length > 0 && parsed.rows.length === 0) {
                setErrors(parsed.errors);
                setStep('validation');
                return;
            }

            const [vehicles, costTypes] = await Promise.all([
                dataService.searchVehicles('', effectiveCompanyId, 1000),
                dataService.getVehicleCostTypes()
            ]);
            const fuelCostType = costTypes.find(
                (type: VehicleCostType) => FUEL_CODES.includes(normalizeCode(type.code))
            );
            const vehicleByPlate = new Map<string, Vehicle[]>();
            vehicles.forEach((vehicle: Vehicle) => {
                const key = fuelExpenseImportService.normalizePlate(vehicle.plates);
                if (!key) return;
                vehicleByPlate.set(key, [...(vehicleByPlate.get(key) || []), vehicle]);
            });

            const resolvedRows: (FuelExpenseImportRow & { vehicleId: string })[] = [];
            const validationErrors = [...parsed.errors];
            parsed.rows.forEach(row => {
                const matches = vehicleByPlate.get(fuelExpenseImportService.normalizePlate(row.plate)) || [];
                if (matches.length !== 1) {
                    validationErrors.push({
                        line: row.line,
                        message: matches.length ? `A placa "${row.plate}" corresponde a mais de um veículo.` :
                            `Veículo disponível não encontrado para a placa "${row.plate}".`
                    });
                    return;
                }
                resolvedRows.push({ ...row, vehicleId: matches[0].id });
            });

            if (!fuelCostType && resolvedRows.length) {
                validationErrors.push({
                    line: 1,
                    message: 'Tipo de despesa de combustível não cadastrado. Crie um tipo com código FUEL antes de importar.'
                });
                setErrors(validationErrors);
                setStep('validation');
                return;
            }

            const periodsByMonth = new Map<string, { vehicleId: string; status: string }[]>();
            const months = [...new Set(resolvedRows.map(row => row.referenceMonth))];
            const periodResults = await Promise.all(
                months.map(async month => [month, await dataService.getRentalPeriods(month)] as const)
            );
            periodResults.forEach(([month, periods]) => periodsByMonth.set(month, periods));

            const unlockedRows = resolvedRows.filter(row => {
                const isLocked = (periodsByMonth.get(row.referenceMonth) || []).some(
                    (period: { vehicleId: string; status: string }) =>
                        period.vehicleId === row.vehicleId && ['ALLOCATED', 'CLOSED'].includes(period.status)
                );
                if (isLocked) {
                    validationErrors.push({
                        line: row.line,
                        message: `A competência ${row.referenceMonth} deste veículo está alocada/fechada.`
                    });
                    return false;
                }
                return true;
            });

            if (fuelCostType) {
                setValidRows(unlockedRows.map(({ vehicleId: _vehicleId, ...row }) => row));
                setResolvedVehicleIds(new Map(unlockedRows.map(row => [row.line, row.vehicleId])));
                setResolvedCostTypeId(fuelCostType.id);
            }
            setErrors(validationErrors);
            setStep('validation');
        } catch (error) {
            console.error('Erro ao processar arquivo de abastecimentos', error);
            setErrors([{
                line: 1,
                message: error instanceof Error && error.message
                    ? error.message
                    : 'Erro ao processar o arquivo. Tente novamente.'
            }]);
            setStep('validation');
        } finally {
            setBusy(false);
        }
    };

    const handleImport = async () => {
        if (!validRows.length || !resolvedCostTypeId || busy) return;
        setBusy(true);
        setProgress({ done: 0, total: validRows.length });
        const rejected: FuelExpenseImportError[] = [];
        let imported = 0;

        for (const row of validRows) {
            try {
                const vehicleId = resolvedVehicleIds.get(row.line);
                if (!vehicleId) throw new Error('Veículo não encontrado para esta linha.');
                await dataService.saveRentalExpense({
                    vehicleId,
                    referenceMonth: row.referenceMonth,
                    costTypeId: resolvedCostTypeId,
                    value: row.totalValue,
                    description: `Abastecimento ${row.plate} — ${row.fuelQuantity.toLocaleString('pt-BR')} L (importado)`,
                    odometer: row.odometer,
                    fuelQuantity: row.fuelQuantity,
                    userId: currentUser?.id,
                    createdAt: new Date(`${row.date}T12:00:00.000Z`).toISOString()
                });
                imported++;
            } catch (error) {
                console.error(`Erro ao importar abastecimento da linha ${row.line}`, error);
                rejected.push({
                    line: row.line,
                    message: error instanceof Error && error.message
                        ? error.message
                        : 'Não foi possível gravar este abastecimento.'
                });
            } finally {
                setProgress(current => ({ ...current, done: current.done + 1 }));
            }
        }

        setResult({ imported, rejected });
        setStep('result');
        if (rejected.length) toast.warning(`Importação concluída: ${imported} importado(s), ${rejected.length} rejeitado(s).`);
        else toast.success(`${imported} abastecimento(s) importado(s) com sucesso.`);
        setBusy(false);
    };

    const handleDragOver = (event: React.DragEvent) => {
        if (!dragDropEnabled || busy) return;
        event.preventDefault();
        setDragActive(true);
    };

    const handleDrop = (event: React.DragEvent) => {
        if (!dragDropEnabled) return;
        event.preventDefault();
        setDragActive(false);
        const file = event.dataTransfer.files?.[0];
        if (!file) return;
        if (!['.csv', '.xls', '.xlsx'].some(extension => file.name.toLowerCase().endsWith(extension))) {
            toast.error('Formato inválido. Envie um arquivo .csv, .xls ou .xlsx.');
            return;
        }
        handleFileSelected(file);
    };

    const renderUploadStep = () => (
        <div className="space-y-4">
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 p-5">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Baixe e preencha o modelo
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Informe data, placa, odômetro, quantidade e valor. A carga em lote não exige fotos.
                </p>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => FuelExpenseImportTemplate.downloadXlsx().catch(error => {
                            console.error('Erro ao baixar modelo XLSX de abastecimentos', error);
                            toast.error('Não foi possível baixar o modelo.');
                        })}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90"
                    >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        Modelo Planilha (XLSX)
                    </button>
                    <button
                        type="button"
                        onClick={() => FuelExpenseImportTemplate.downloadCsv().catch(error => {
                            console.error('Erro ao baixar modelo CSV de abastecimentos', error);
                            toast.error('Não foi possível baixar o modelo.');
                        })}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200"
                    >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        Modelo CSV
                    </button>
                </div>
            </div>
            <div
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`rounded-xl border border-dashed p-5 ${dragActive ? 'border-primary bg-primary/10' : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50'}`}
            >
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">
                    Envie a planilha preenchida
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    className="hidden"
                    onChange={event => {
                        const file = event.target.files?.[0];
                        if (file && ['.csv', '.xls', '.xlsx'].some(extension => file.name.toLowerCase().endsWith(extension))) {
                            handleFileSelected(file);
                        } else if (file) {
                            toast.error('Formato inválido. Envie um arquivo .csv, .xls ou .xlsx.');
                        }
                        event.target.value = '';
                    }}
                />
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50"
                >
                    <span className="material-symbols-outlined text-[18px]">upload_file</span>
                    {busy ? 'Processando...' : fileName ? `Trocar arquivo (${fileName})` : 'Selecionar arquivo'}
                </button>
                {dragDropEnabled && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">
                        Ou arraste um arquivo .csv, .xls ou .xlsx até aqui.
                    </p>
                )}
            </div>
        </div>
    );

    const renderValidationStep = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-500 truncate">{fileName}</span>
                <StatusBadge status={validRows.length ? 'active' : 'inactive'} label={`${validRows.length} válida(s)`} size="sm" />
            </div>
            {errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4 max-h-48 overflow-y-auto space-y-1">
                    {errors.map((error, index) => (
                        <p key={`${error.line}-${index}`} className="text-xs text-red-600 dark:text-red-400">
                            <span className="font-black">Linha {error.line}:</span> {error.message}
                        </p>
                    ))}
                </div>
            )}
            {validRows.length > 0 && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
                    {validRows.map(row => (
                        <div key={row.line} className="px-3 py-2 flex justify-between gap-3 text-xs">
                            <span className="font-bold text-slate-700 dark:text-slate-200">
                                {row.date} · {row.plate} · {row.odometer.toLocaleString('pt-BR')} Km
                            </span>
                            <span className="text-slate-500 dark:text-slate-400">
                                {row.fuelQuantity.toLocaleString('pt-BR')} L · R$ {row.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    ))}
                </div>
            )}
            <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setStep('upload')} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold">
                    Voltar
                </button>
                <button
                    type="button"
                    disabled={!validRows.length}
                    onClick={() => setStep('confirm')}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50"
                >
                    Continuar com {validRows.length} registro(s)
                </button>
            </div>
        </div>
    );

    const renderConfirmStep = () => (
        <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
                Serão gravados {validRows.length} abastecimento(s) com as datas informadas. As fotos não são exigidas para esta importação.
            </p>
            {progress.total > 0 && (
                <p className="text-xs text-slate-500">Importando {progress.done} de {progress.total}...</p>
            )}
            <div className="flex justify-end gap-2">
                <button type="button" disabled={busy} onClick={() => setStep('validation')} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold">
                    Voltar
                </button>
                <button type="button" disabled={busy} onClick={handleImport} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50">
                    {busy ? 'Importando...' : 'Importar'}
                </button>
            </div>
        </div>
    );

    const renderResultStep = () => (
        <div className="space-y-4">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {result?.imported ?? 0} importado(s), {result?.rejected.length ?? 0} rejeitado(s).
            </p>
            {!!result?.rejected.length && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4 max-h-48 overflow-y-auto space-y-1">
                    {result.rejected.map((error, index) => (
                        <p key={`${error.line}-${index}`} className="text-xs text-red-600 dark:text-red-400">
                            <span className="font-black">Linha {error.line}:</span> {error.message}
                        </p>
                    ))}
                </div>
            )}
            <div className="flex justify-end">
                <button type="button" onClick={handleClose} className="px-5 py-3 rounded-xl bg-primary text-white text-sm font-bold">
                    Concluir
                </button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={STEP_TITLES[step]}
            maxWidth="2xl"
            confirmLoading={busy}
        >
            {step === 'upload' && renderUploadStep()}
            {step === 'validation' && renderValidationStep()}
            {step === 'confirm' && renderConfirmStep()}
            {step === 'result' && renderResultStep()}
        </Modal>
    );
};
