import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';

export const IS_NATIVE = Capacitor.isNativePlatform();

export const scanBarcode = async (): Promise<string | null> => {
    if (!IS_NATIVE) {
        console.warn('Scanner only works on native platforms');
        return null;
    }

    try {
        const isSupported = await BarcodeScanner.isSupported();
        if (!isSupported.supported) {
            throw new Error('Barcode scanning not supported on this device');
        }

        const isPermissionGranted = await BarcodeScanner.checkPermissions();
        if (isPermissionGranted.camera !== 'granted') {
            const permission = await BarcodeScanner.requestPermissions();
            if (permission.camera !== 'granted') {
                throw new Error('Camera permission denied');
            }
        }

        const { barcodes } = await BarcodeScanner.scan({
            formats: [BarcodeFormat.QrCode, BarcodeFormat.Code128, BarcodeFormat.Ean13, BarcodeFormat.Ean8],
        });

        if (barcodes.length > 0) {
            return barcodes[0].displayValue;
        }

        return null;
    } catch (error) {
        console.error('Error scanning barcode:', error);
        throw error;
    }
};
