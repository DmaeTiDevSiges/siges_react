import React, { useState } from 'react';
import { ManusVisit, ManusReport, ManusImage } from '../../types/manus';

interface ImageClassification {
    reportIndex: number;
    imageIndex: number;
    url: string;
    classification: 'A' | 'D' | 'X'; // A=Antes, D=Depois, X=Desconsiderar
}

interface ManusImageSelectionModalProps {
    visit: ManusVisit;
    onConfirm: (classifications: ImageClassification[]) => void;
    onCancel: () => void;
}

export const ManusImageSelectionModal: React.FC<ManusImageSelectionModalProps> = ({ visit, onConfirm, onCancel }) => {
    // Initialize classifications based on current API values if available, or default
    const [classifications, setClassifications] = useState<ImageClassification[]>(() => {
        const initial: ImageClassification[] = [];
        visit.Reports?.forEach((report, rIdx) => {
            report.Images?.forEach((img, iIdx) => {
                const sectionDoc = ((img as any).CustomerComments || img.CommentsCustomer || "").toUpperCase().trim();
                let initialClass: 'A' | 'D' | 'X' = 'X';
                
                if (sectionDoc.startsWith('A')) initialClass = 'A';
                else if (sectionDoc.startsWith('D')) initialClass = 'D';

                initial.push({
                    reportIndex: rIdx,
                    imageIndex: iIdx,
                    url: img.Url || (img as any).PhotoUrl,
                    classification: initialClass
                });
            });
        });
        return initial;
    });

    const handleClassificationChange = (rIdx: number, iIdx: number, value: 'A' | 'D' | 'X') => {
        if (value === 'A' || value === 'D') {
            const count = classifications.filter(c => c.reportIndex === rIdx && c.classification === value).length;
            const current = classifications.find(c => c.reportIndex === rIdx && c.imageIndex === iIdx);
            
            // Only block if we are changing TO A/D and already have 3. 
            // If the image is ALREADY A and we click A again, or if it's A and we change to D, the logic below handles it.
            if (count >= 3 && current?.classification !== value) {
                alert(`Limite atingido: Você só pode selecionar no máximo 3 imagens para "${value === 'A' ? 'Antes' : 'Depois'}" deste ativo.`);
                return;
            }
        }

        setClassifications(prev => prev.map(c => 
            (c.reportIndex === rIdx && c.imageIndex === iIdx) ? { ...c, classification: value } : c
        ));
    };

    return (
        <div className="fixed inset-0 z-300 flex items-center justify-center p-4 md:p-6" onClick={onCancel}>
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" />
            
            <div 
                className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Classificação de Imagens</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Visita Manus: {visit.OrderMask}</p>
                    </div>
                    <button 
                        onClick={onCancel}
                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                    {visit.Reports?.map((report, rIdx) => (
                        <div key={rIdx} className="space-y-4">
                            {/* Asset info card style */}
                            <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Ativo</span>
                                    <span className="text-sm font-black text-slate-800 dark:text-slate-100">{report.AssetCode} - {report.AssetDescription}</span>
                                    <div className="flex gap-4 mt-2">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Localização</span>
                                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{report.Localization}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{report.AssetStatus}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Images Grid */}
                            <div className="space-y-3">
                                {report.Images?.map((img, iIdx) => {
                                    const currentClass = classifications.find(c => c.reportIndex === rIdx && c.imageIndex === iIdx)?.classification;
                                    const imgUrl = img.Url || (img as any).PhotoUrl;

                                    return (
                                        <div key={iIdx} className="flex gap-4 p-3 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 items-center">
                                            {/* Thumbnail */}
                                            <div className="w-[100px] h-[100px] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-white/10">
                                                <img 
                                                    src={imgUrl} 
                                                    alt="Manus" 
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            {/* Controls */}
                                            <div className="flex-1 flex flex-col gap-2 pl-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">CONDIÇÃO</span>
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <button
                                                        onClick={() => handleClassificationChange(rIdx, iIdx, 'A')}
                                                        className={`w-full py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                                            currentClass === 'A' 
                                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 active:scale-[0.98]' 
                                                            : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                                                        }`}
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">{currentClass === 'A' ? 'check_circle' : 'circle'}</span>
                                                        Antes
                                                    </button>
                                                    <button
                                                        onClick={() => handleClassificationChange(rIdx, iIdx, 'D')}
                                                        className={`w-full py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                                            currentClass === 'D' 
                                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 active:scale-[0.98]' 
                                                            : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                                                        }`}
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">{currentClass === 'D' ? 'check_circle' : 'circle'}</span>
                                                        Depois
                                                    </button>
                                                    <button
                                                        onClick={() => handleClassificationChange(rIdx, iIdx, 'X')}
                                                        className={`w-full py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                                            currentClass === 'X' 
                                                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 active:scale-[0.98]' 
                                                            : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                                                        }`}
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">{currentClass === 'X' ? 'check_circle' : 'circle'}</span>
                                                        Ignorar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                    <button
                        onClick={() => onConfirm(classifications)}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">rule_folder</span>
                        Confirmar e Importar
                    </button>
                </div>
            </div>
        </div>
    );
};
