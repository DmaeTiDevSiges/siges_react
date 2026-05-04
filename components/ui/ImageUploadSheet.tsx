
import React from 'react';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';

interface ImageUploadSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectGallery: () => void;
    onTakeCamera: () => void;
    title?: string;
}

export const ImageUploadSheet: React.FC<ImageUploadSheetProps> = ({
    isOpen,
    onClose,
    onSelectGallery,
    onTakeCamera,
    title = "Selecione origem"
}) => {
    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            showCloseButton={false}
            height="auto"
        >
            <div className="p-6">
                <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-6" />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 text-center md:text-left">{title}</h3>

                <div className="space-y-2">
                    <button
                        className="w-full text-left py-4 px-3 text-sm font-black text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all rounded-xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800 flex items-center justify-between group"
                        onClick={() => {
                            onSelectGallery();
                            onClose();
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 transition-transform group-hover:scale-110">
                                <span className="material-symbols-outlined text-xl">collections</span>
                            </div>
                            <span>Escolher da Galeria</span>
                        </div>
                        <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                    </button>
                    
                    <button
                        className="w-full text-left py-4 px-3 text-sm font-black text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all rounded-xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800 flex items-center justify-between group"
                        onClick={() => {
                            onTakeCamera();
                            onClose();
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 transition-transform group-hover:scale-110">
                                <span className="material-symbols-outlined text-xl">photo_camera</span>
                            </div>
                            <span>Tirar Foto Agora</span>
                        </div>
                        <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                    </button>
                </div>

                <Button
                    variant="ghost"
                    className="w-full mt-6 py-4 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest border border-slate-100 dark:border-slate-800 rounded-xl"
                    onClick={onClose}
                >
                    Cancelar
                </Button>
            </div>
        </BottomSheet>
    );
};
