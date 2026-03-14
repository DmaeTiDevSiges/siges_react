import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { IconButton } from './IconButton';

interface BarcodeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (result: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onScan }) => {
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Initialize scanner
            const scanner = new Html5QrcodeScanner(
                'reader',
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    formatsToSupport: [
                        Html5QrcodeSupportedFormats.QR_CODE,
                        Html5QrcodeSupportedFormats.CODE_128,
                        Html5QrcodeSupportedFormats.EAN_13,
                        Html5QrcodeSupportedFormats.EAN_8
                    ]
                },
                /* verbose= */ false
            );

            scanner.render(
                (decodedText) => {
                    scanner.clear();
                    onScan(decodedText);
                    onClose();
                },
                (errorMessage) => {
                    // console.log(errorMessage);
                }
            );

            scannerRef.current = scanner;

            return () => {
                if (scannerRef.current) {
                    scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
                }
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/10">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Leitor de Código</h3>
                    <IconButton icon="close" onClick={onClose} variant="ghost" />
                </div>

                <div className="p-6">
                    <div id="reader" className="overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800"></div>

                    <p className="mt-4 text-xs text-slate-500 text-center font-bold uppercase tracking-widest leading-relaxed">
                        Posicione o código (QR ou Barcode) em frente à câmera para realizar a leitura automática.
                    </p>
                </div>

            </div>
        </div>
    );
};
