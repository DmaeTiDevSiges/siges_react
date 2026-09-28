import React, { useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { Modal } from '../../../components/ui/Modal';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { usePermissions } from '../../../contexts/PermissionsContext';
import { dataService } from '../../../services/dataService';
import { User } from '../../../types';
import { MaterialsImportTemplate, MATERIALS_IMPORT_COLUMNS } from '../../../utils/MaterialsImportTemplate';
import type {
    MaterialsImportError,
    MaterialsImportResult,
    MaterialsImportRow
} from '../../../services/materials/materialsImportService';
import { MATERIALS_IMPORT_COMPANY_ID } from '../../../services/materials/materialsImportService';

type ImportStep = 'upload' | 'validation' | 'confirm' | 'result';

interface MaterialImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser?: User;
    /** Chamado após importação bem-sucedida (para recarregar a lista). */
    onImported?: () => void;
}

const STEP_TITLES: Record<ImportStep, string> = {
    upload: 'Importar Materiais',
    validation: 'Validação do Arquivo',
    confirm: 'Confirmar Importação',
    result: 'Resultado da Importação'
};

export const MaterialImportModal: React.FC<MaterialImportModalProps> = ({
    isOpen,
    onClose,
    currentUser,
    onImported
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<ImportStep>('upload');
    const [fileName, setFileName] = useState('');
    const [parsing, setParsing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [validRows, setValidRows] = useState<MaterialsImportRow[]>([]);
    const [errors, setErrors] = useState<MaterialsImportError[]>([]);
    const [warehouseByCode, setWarehouseByCode] = useState<Map<string, string>>(new Map());
    const [result, setResult] = useState<MaterialsImportResult | null>(null);
    const [showRequiredFields, setShowRequiredFields] = useState(false);
    const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
    const [validationRejected, setValidationRejected] = useState(0);
    const [dragActive, setDragActive] = useState(false);

    const { canView } = usePermissions();
    /** Enviar arquivo exige a permissão materials_upload (view). */
    const canUpload = canView('materials_upload');
    /** Arrastar e soltar só faz sentido no modo web (desktop/navegador). */
    const dragDropEnabled = !Capacitor.isNativePlatform();

    const busy = parsing || importing;

    const resetState = () => {
        setStep('upload');
        setFileName('');
        setParsing(false);
        setImporting(false);
        setValidRows([]);
        setErrors([]);
        setWarehouseByCode(new Map());
        setResult(null);
        setProgress({ done: 0, total: 0 });
        setValidationRejected(0);
        setDragActive(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleClose = () => {
        if (busy) return;
        onClose();
        resetState();
    };

    const handleFileSelected = async (file: File) => {
        if (busy || !canUpload) return;

        setFileName(file.name);
        setValidRows([]);
        setErrors([]);
        setResult(null);
        setParsing(true);

        try {
            const parsed = await dataService.parseMaterialsCsv(file);

            if (parsed.errors.length > 0 || parsed.rows.length === 0) {
                setErrors(
                    parsed.errors.length > 0
                        ? parsed.errors
                        : [{ line: 1, message: 'Nenhuma linha encontrada no arquivo.' }]
                );
                setStep('validation');
                return;
            }

            const codes = [...new Set(parsed.rows.map(row => row.code).filter(Boolean))];
            const [existingCodes, warehouseMap] = await Promise.all([
                // duplicidade (company_id, code): company_id fixo da importação
                dataService.getExistingMaterialCodes(codes, String(MATERIALS_IMPORT_COMPANY_ID)),
                // almoxarifados do USUÁRIO LOGADO (warehouses.company_id do usuário):
                // códigos iguais podem existir em empresas diferentes
                dataService.getMaterialImportWarehouseMap(currentUser?.companyId)
            ]);

            const validation = dataService.validateMaterialsRows(parsed.rows, {
                existingCodes,
                warehouseByCode: warehouseMap
            });

            setWarehouseByCode(warehouseMap);
            setValidRows(validation.valid);
            setErrors(validation.errors);
            setStep('validation');
        } catch (error) {
            console.error('Erro ao processar arquivo de importação', error);
            setErrors([
                {
                    line: 1,
                    message:
                        error instanceof Error && error.message
                            ? error.message
                            : 'Erro ao processar o arquivo. Tente novamente.'
                }
            ]);
            setStep('validation');
        } finally {
            setParsing(false);
        }
    };

    const handleImport = async () => {
        if (validRows.length === 0 || importing) return;

        setImporting(true);
        // Linhas que já foram reprovadas na validação também contam como indeferidas
        const validationRejectedLines = new Set(errors.map(error => error.line)).size;
        setValidationRejected(validationRejectedLines);
        setProgress({ done: 0, total: validRows.length });

        try {
            const importResult = await dataService.importMaterials(
                validRows,
                warehouseByCode,
                (done, total) => setProgress({ done, total })
            );
            setResult(importResult);
            setStep('result');

            const totalRejected = validationRejectedLines + importResult.rejected;
            if (importResult.stockError) {
                toast.warning('Materiais criados, mas o estoque inicial não pôde ser gravado.');
            } else if (totalRejected > 0) {
                toast.warning(
                    `Importação concluída: ${importResult.materialsCreated} importado(s), ${totalRejected} indeferido(s).`
                );
            } else {
                toast.success(`Importação concluída: ${importResult.materialsCreated} material(is) criado(s).`);
            }
        } catch (error) {
            console.error('Erro ao importar materiais', error);
            toast.error('Erro ao importar materiais. Tente novamente.');
            setStep('validation');
        } finally {
            setImporting(false);
        }
    };

    const handleConclude = () => {
        onImported?.();
        handleClose();
    };

    const ACCEPTED_EXTENSIONS = ['.csv', '.xls', '.xlsx'];

    const isAcceptedFile = (file: File) =>
        ACCEPTED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));

    const handleDragOver = (e: React.DragEvent) => {
        if (!dragDropEnabled || !canUpload || busy) return;
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        if (!dragDropEnabled) return;
        e.preventDefault();
        e.stopPropagation();
        // ignora a saída para filhos do próprio dropzone (evita flicker)
        const next = e.relatedTarget as Node | null;
        if (next && e.currentTarget.contains(next)) return;
        setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        if (!dragDropEnabled) return;
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (!canUpload || busy) return;

        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        if (!isAcceptedFile(file)) {
            toast.error('Formato inválido. Envie um arquivo .csv, .xls ou .xlsx.');
            return;
        }
        handleFileSelected(file);
    };

    const renderUploadStep = () => (
        <div className="space-y-5">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-5">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
                    1. Baixe o modelo com as colunas obrigatórias
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Preencha o modelo e envie o arquivo preenchido. Todas as colunas são obrigatórias.
                    No Linux use o <span className="font-bold">Modelo Planilha (XLSX)</span> — abre no
                    LibreOffice/Calc e em qualquer office (Windows ou Linux).
                </p>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => MaterialsImportTemplate.downloadXlsx()}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
                    >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        Modelo Planilha (XLSX)
                    </button>
                    <button
                        type="button"
                        onClick={() => MaterialsImportTemplate.downloadCsv()}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-primary transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        Modelo CSV
                    </button>
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-5">
                <button
                    type="button"
                    onClick={() => setShowRequiredFields(open => !open)}
                    className="w-full flex items-center justify-between gap-2 text-left"
                >
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        2. Campos obrigatórios
                    </p>
                    <span className="material-symbols-outlined text-[18px] text-slate-400">
                        {showRequiredFields ? 'expand_less' : 'expand_more'}
                    </span>
                </button>

                {showRequiredFields && (
                    <div className="mt-3 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                            {MATERIALS_IMPORT_COLUMNS.map(column => (
                                <div
                                    key={column.field}
                                    className="flex items-start gap-2 text-xs"
                                >
                                    <span className="material-symbols-outlined text-[14px] text-primary mt-0.5">check_circle</span>
                                    <div className="min-w-0">
                                        <span className="font-bold text-slate-700 dark:text-slate-200">
                                            {column.header}
                                        </span>
                                        <span className="text-slate-500 dark:text-slate-400 block leading-snug">
                                            {column.rule}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            Todas as colunas são obrigatórias e a ordem delas não importa. Linhas com erro são ignoradas na importação.
                        </p>
                    </div>
                )}
            </div>

            <div
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed p-5 transition-colors ${
                    dragActive
                        ? 'border-primary bg-primary/10 dark:bg-primary/10'
                        : 'border-slate-300 dark:border-slate-600'
                }`}
            >
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
                    3. Envie o arquivo preenchido
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && canUpload) handleFileSelected(file);
                        e.target.value = '';
                    }}
                />
                <button
                    type="button"
                    disabled={parsing || !canUpload}
                    onClick={() => {
                        if (canUpload) fileInputRef.current?.click();
                    }}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl text-sm font-bold shadow-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${
                        canUpload
                            ? 'bg-primary text-white shadow-primary/20 hover:opacity-90'
                            : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 shadow-transparent'
                    }`}
                >
                    <span className="material-symbols-outlined text-[18px]">
                        {dragActive ? 'file_download' : 'upload_file'}
                    </span>
                    {!canUpload
                        ? 'Sem permissão para importar'
                        : parsing
                            ? 'Processando...'
                            : dragActive
                                ? 'Solte o arquivo aqui'
                                : fileName
                                    ? `Trocar arquivo (${fileName})`
                                    : 'Selecionar arquivo'}
                </button>
                {dragDropEnabled && canUpload && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center font-medium">
                        {dragActive
                            ? 'Solte para enviar o arquivo'
                            : 'Ou arraste e solte o arquivo (.csv, .xls, .xlsx) nesta área'}
                    </p>
                )}
                {!canUpload && (
                    <p className="mt-2 text-xs font-bold text-red-600 dark:text-red-400">
                        Você não tem permissão para enviar arquivos (materials_upload).
                    </p>
                )}
            </div>
        </div>
    );

    const renderValidationStep = () => (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate max-w-full">
                    {fileName}
                </span>
                <div className="flex gap-2">
                    <StatusBadge
                        status={validRows.length > 0 ? 'active' : 'inactive'}
                        label={`${validRows.length} válida(s)`}
                        size="sm"
                    />
                    <StatusBadge
                        status={errors.length > 0 ? 'error' : 'pending'}
                        label={`${errors.length} erro(s)`}
                        size="sm"
                    />
                </div>
            </div>

            {errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4 max-h-40 overflow-y-auto space-y-1">
                    {errors.map((error, index) => (
                        <p key={`${error.line}-${index}`} className="text-xs text-red-600 dark:text-red-400">
                            <span className="font-black">Linha {error.line}:</span> {error.message}
                        </p>
                    ))}
                </div>
            )}

            {validRows.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                    {validRows.map(row => (
                        <div key={row.line} className="flex items-center gap-3 px-3 py-2">
                            <StatusBadge status="active" label="OK" size="sm" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {row.code} — {row.description}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                    {row.unit} · R$ {(row.priceUnit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} · {row.warehouseCode} · Qtd {row.initialQuantity}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex flex-wrap justify-between gap-2 pt-1">
                <button
                    type="button"
                    onClick={() => {
                        setStep('upload');
                        setValidRows([]);
                        setErrors([]);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="px-5 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    Voltar
                </button>
                <button
                    type="button"
                    disabled={validRows.length === 0}
                    onClick={() => setStep('confirm')}
                    className="px-5 py-3 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Importar {validRows.length} material(is)
                </button>
            </div>
        </div>
    );

    const renderConfirmStep = () => {
        const pct = progress.total > 0
            ? Math.round((progress.done / progress.total) * 100)
            : 0;

        return (
            <div className="space-y-5">
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-1">
                    <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                        {validRows.length} material(is) serão criados
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-500">
                        Cada linha também terá estoque inicial gravado no almoxarifado informado.
                        {errors.length > 0 && ` ${errors.length} linha(s) com erro serão ignoradas.`}
                    </p>
                </div>

                {importing && (
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                            <span>Importando registros...</span>
                            <span>{progress.done} / {progress.total}</span>
                        </div>
                        <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-300"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 text-right">
                            {pct}%
                        </p>
                    </div>
                )}

                <div className="flex flex-wrap justify-between gap-2">
                    <button
                        type="button"
                        disabled={importing}
                        onClick={() => setStep('validation')}
                        className="px-5 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        Voltar
                    </button>
                    <button
                        type="button"
                        disabled={importing}
                        onClick={handleImport}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {importing ? 'Importando...' : 'Confirmar importação'}
                    </button>
                </div>
            </div>
        );
    };

    const renderResultStep = () => {
        const totalRejected = validationRejected + (result?.rejected || 0);

        return (
            <div className="space-y-5">
                <div className="flex flex-col items-center text-center py-4">
                    <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                            result?.stockError || totalRejected > 0
                                ? 'bg-amber-50 dark:bg-amber-900/10'
                                : 'bg-green-50 dark:bg-green-900/10'
                        }`}
                    >
                        <span
                            className={`material-symbols-outlined text-4xl ${
                                result?.stockError || totalRejected > 0 ? 'text-amber-500' : 'text-green-500'
                            }`}
                        >
                            {result?.stockError || totalRejected > 0 ? 'warning' : 'check_circle'}
                        </span>
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {result?.materialsCreated || 0} material(is) criado(s)
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {result?.stocksCreated || 0} registro(s) de estoque inicial gravado(s)
                    </p>
                    <p
                        className={`text-sm font-bold mt-1 ${
                            totalRejected > 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-slate-500 dark:text-slate-400'
                        }`}
                    >
                        {totalRejected} registro(s) indeferido(s)
                    </p>
                </div>

                {totalRejected > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4 space-y-2">
                        <p className="text-xs font-bold text-red-600 dark:text-red-400">
                            Indeferidos
                        </p>
                        {validationRejected > 0 && (
                            <p className="text-xs text-red-500 dark:text-red-400">
                                {validationRejected} linha(s) reprovada(s) na validação (erros do arquivo).
                            </p>
                        )}
                        {(result?.rejectedRows.length ?? 0) > 0 && (
                            <div className="max-h-40 overflow-y-auto space-y-1">
                                {result?.rejectedRows.map(rejected => (
                                    <p key={`${rejected.line}-${rejected.message}`} className="text-xs text-red-500 dark:text-red-400">
                                        Linha {rejected.line}: {rejected.message}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {result?.stockError && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4">
                        <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1">
                            Falha ao gravar o estoque inicial
                        </p>
                        <p className="text-xs text-red-500 dark:text-red-400">{result.stockError}</p>
                    </div>
                )}

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={handleConclude}
                        className="px-5 py-3 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
                    >
                        Concluir
                    </button>
                </div>
            </div>
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={STEP_TITLES[step]}
            maxWidth="2xl"
        >
            {step === 'upload' && renderUploadStep()}
            {step === 'validation' && renderValidationStep()}
            {step === 'confirm' && renderConfirmStep()}
            {step === 'result' && renderResultStep()}
        </Modal>
    );
};
