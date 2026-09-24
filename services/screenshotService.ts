/**
 * Screenshot Service
 *
 * Captura a tela atual do SIGES e converte para base64.
 * Usa html-to-image para captura DOM → PNG.
 * Compressão via Canvas API (reutiliza padrão do imageCompressionService).
 */

import { toPng, toJpeg } from 'html-to-image';

/** PNG 1x1 transparente — placeholder para imagens remotas que falham ao embutir */
const TRANSPARENT_PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

/** URLs do CSS das fontes usadas no app (fetch com CORS — evita ler cssRules cross-origin) */
const FONT_CSS_URLS = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap',
];

let fontEmbedCssCache: string | null = null;

/**
 * Monta o CSS de fontes embutido buscando o CSS do Google Fonts via fetch
 * (CORS liberado) e convertendo os arquivos de fonte em data URLs.
 * Evita que o html-to-image tente ler cssRules de stylesheets cross-origin
 * (SecurityError: Google Fonts, Leaflet etc.).
 */
async function buildFontEmbedCSS(): Promise<string> {
  if (fontEmbedCssCache !== null) return fontEmbedCssCache;

  let css = '';
  for (const url of FONT_CSS_URLS) {
    try {
      const res = await fetch(url);
      if (res.ok) css += `\n${await res.text()}`;
    } catch {
      // ignora falha ao baixar CSS desta fonte
    }
  }

  const urlMatches = [...css.matchAll(/url\((['"]?)([^)'"]+)\1\)/g)];
  for (const match of urlMatches) {
    const fontUrl = match[2];
    if (fontUrl.startsWith('data:')) continue;
    try {
      const res = await fetch(fontUrl);
      if (!res.ok) continue;
      const blob = await res.blob();
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Falha ao ler arquivo de fonte'));
        reader.onloadend = () => resolve(String(reader.result));
        reader.readAsDataURL(blob);
      });
      css = css.split(match[0]).join(`url(${dataUrl})`);
    } catch {
      // ignora falha ao embutir este arquivo de fonte
    }
  }

  fontEmbedCssCache = css;
  return css;
}

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
  /** Embute as fontes do documento na captura (ex: Material Symbols). Default: false */
  embedFonts?: boolean;
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
    embedFonts = false,
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

  // Fontes: com embedFonts usa CSS próprio (fetch CORS-safe, com cache);
  // sem embedFonts, string vazia (não coleta — uso rápido na IA).
  let fontEmbedCSS = '';
  if (embedFonts) {
    try {
      fontEmbedCSS = await buildFontEmbedCSS();
    } catch {
      fontEmbedCSS = '';
    }
  }

  const onImageErrorHandler: OnErrorEventHandler = () => undefined;

  const fontOptions = { fontEmbedCSS };

  // Tenta capturar com opções progressivamente mais simples
  const attempts = [
    {
      width: maxWidth,
      pixelRatio,
      quality,
      backgroundColor: '#ffffff',
      inlineImages: false,
      style: { overflow: 'visible' as const, height: 'auto' },
      imagePlaceholder: TRANSPARENT_PX,
      onImageErrorHandler,
      ...fontOptions,
    },
    {
      width: maxWidth,
      pixelRatio: 1,
      backgroundColor: '#ffffff',
      imagePlaceholder: TRANSPARENT_PX,
      onImageErrorHandler,
      ...fontOptions,
    },
    {
      width: 800,
      pixelRatio: 1,
      backgroundColor: '#ffffff',
      imagePlaceholder: TRANSPARENT_PX,
      onImageErrorHandler,
      ...fontOptions,
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
          img.onerror = () => reject(new Error('Imagem rasterizada é inválida'));
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
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(`Falha ao rasterizar a captura${lastError?.type ? ` (${lastError.type})` : ''}`);
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
 * Ajusta uma imagem para um tamanho exato (ex: 360x450) sem distorcer:
 * escala preservando proporção (contain) e centraliza sobre fundo.
 */
export function fitImageTo(
  dataUrl: string,
  width: number,
  height: number,
  backgroundColor: string = '#ffffff'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Não foi possível criar canvas para ajustar a imagem'));
        return;
      }

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      const scale = Math.min(width / img.width, height / img.height);
      const drawWidth = img.width * scale;
      const drawHeight = img.height * scale;
      ctx.drawImage(img, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Erro ao carregar imagem para ajustar o tamanho'));
    img.src = dataUrl;
  });
}

/**
 * Captura um card como PNG pronto para compartilhar (exato 360x450).
 * Tenta embutir as fontes (ícones Material corretos); se falhar, refaz
 * sem embedFonts como último recurso.
 */
export async function captureCardImage(target: string): Promise<string> {
  try {
    const capture = await captureScreen({
      target,
      maxWidth: 360,
      pixelRatio: 2,
      embedFonts: true,
    });
    return await fitImageTo(capture.dataUrl, 360, 450);
  } catch {
    const capture = await captureScreen({
      target,
      maxWidth: 360,
      pixelRatio: 2,
      embedFonts: false,
    });
    return await fitImageTo(capture.dataUrl, 360, 450);
  }
}

/**
 * Verifica se o browser suporta captura de tela.
 */
export function isScreenshotSupported(): boolean {
  return typeof window !== 'undefined' 
    && typeof document !== 'undefined'
    && typeof MutationObserver !== 'undefined';
}
