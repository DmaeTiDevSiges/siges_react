import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import QRCode from 'react-qr-code';

/**
 * QR Code (nível H, igual ao da tela) como PNG data URL, para o @react-pdf/renderer,
 * que não renderiza componentes DOM. Gera o SVG com o react-qr-code e rasteriza num canvas.
 */
export const qrCodeDataUrl = async (value: string, size = 600): Promise<string> => {
    const svg = renderToStaticMarkup(
        React.createElement(QRCode, { value, size, level: 'H', bgColor: '#ffffff', fgColor: '#000000' }),
    );
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Falha ao gerar o QR Code'));
        image.src = svgUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas indisponível');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    return canvas.toDataURL('image/png');
};
