/**
 * Screenshot Service
 *
 * Captura a tela atual do SIGES e converte para base64.
 * Usa html-to-image para captura DOM → PNG.
 * Compressão via Canvas API (reutiliza padrão do imageCompressionService).
 */

import { toPng, toJpeg } from 'html-to-image';

/** Opções de captura */
interface CaptureOptions {
  /** Largura máxima em pixels (default: 1024) */
  maxWidth?: number;
  /** Qualidade da compressão 0-1 (default: 0.7) */
  quality?: number;
  /** Pixel ratio (default: 1 para economizar tokens) */
  pixelRatio?: number;
  /** Elemento alvo (se não informado, captura <main>) */
  target?: HTMLElement | string | null;
}

/** Resultado da captura */
export interface ScreenshotResult {
  /** Imagem em base64 (data:image/png;base64,...) */
  dataUrl: string;
  /** Apenas o base64 puro (sem prefixo) */
  base64: string;
  /** Largura da imagem capturada */
  width: number;
  /** Altura da imagem capturada */
  height: number;
}

/**
 * Captura a tela atual e retorna como base64.
 *
 * @param options - Opções de captura
 * @returns ScreenshotResult com a imagem capturada
 */
export async function captureScreen(options: CaptureOptions = {}): Promise<ScreenshotResult> {
  const {
    maxWidth = 1024,
    quality = 0.7,
    pixelRatio = 1,
    target = null,
  } = options;

  // Resolve o elemento alvo
  let element: HTMLElement | null = null;

  if (target instanceof HTMLElement) {
    element = target;
  } else if (typeof target === 'string') {
    element = document.getElementById(target);
  }

  // Fallback: busca o conteúdo dentro do <main> (filho direto, exclui bubble/chat)
  if (!element) {
    const main = document.querySelector('main');
    if (main) {
      // Tenta pegar só o div de conteúdo (filho com w-full h-full)
      element = main.querySelector(':scope > div.w-full')
        || main.querySelector(':scope > div:nth-child(2)')
        || main;
    } else {
      element = document.body;
    }
  }

  if (!element) {
    throw new Error('Não foi possível encontrar o elemento para capturar a tela.');
  }

  // Esconde temporarymente elementos fixed (chat bubble, modais, etc.)
  const fixedElements: { el: HTMLElement; prev: string }[] = [];
  element.querySelectorAll('*').forEach((node) => {
    const htmlEl = node as HTMLElement;
    const computed = window.getComputedStyle(htmlEl);
    if (computed.position === 'fixed' && computed.display !== 'none') {
      fixedElements.push({ el: htmlEl, prev: htmlEl.style.display });
      htmlEl.style.display = 'none';
    }
  });

  // Tenta capturar com opções progressivamente mais simples
  const attempts = [
    {
      width: maxWidth,
      pixelRatio,
      quality,
      backgroundColor: '#ffffff',
      skipFonts: true,
      fontEmbedCSS: '',
      inlineImages: false,
      style: { overflow: 'visible' as const, height: 'auto' },
    },
    {
      width: maxWidth,
      pixelRatio: 1,
      backgroundColor: '#ffffff',
      skipFonts: true,
      fontEmbedCSS: '',
    },
    {
      width: 800,
      pixelRatio: 1,
      backgroundColor: '#ffffff',
      skipFonts: true,
      fontEmbedCSS: '',
    },
  ];

  let lastError: any = null;

  try {
    for (const attemptOptions of attempts) {
      try {
        // Tenta PNG primeiro, depois JPEG como fallback
        let dataUrl: string;
        try {
          dataUrl = await toPng(element, attemptOptions);
        } catch {
          dataUrl = await toJpeg(element, { ...attemptOptions, quality: 0.8 });
        }

        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = dataUrl;
        });

        const base64 = dataUrl.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

        return {
          dataUrl,
          base64,
          width: img.width,
          height: img.height,
        };
      } catch (error: any) {
        lastError = error;
        console.warn('[ScreenshotService] Tentativa de captura falhou:', error?.message);
      }
    }

    throw lastError;
  } finally {
    // Restaura elementos fixed
    fixedElements.forEach(({ el, prev }) => {
      el.style.display = prev;
    });
  }
}

/**
 * Comprime uma imagem base64 para reduzir tamanho.
 * Útil antes de enviar para a API Gemini (economiza tokens).
 */
export async function compressScreenshot(
  dataUrl: string,
  maxWidth: number = 1024,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Reduz proporcionalmente
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Não foi possível criar canvas para compressão'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => reject(new Error('Erro ao carregar imagem para compressão'));
    img.src = dataUrl;
  });
}

/**
 * Verifica se o browser suporta captura de tela.
 */
export function isScreenshotSupported(): boolean {
  return typeof window !== 'undefined' 
    && typeof document !== 'undefined'
    && typeof MutationObserver !== 'undefined';
}
