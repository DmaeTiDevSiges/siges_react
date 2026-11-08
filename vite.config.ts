import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, '.', '');
  const isDev = command === 'serve';
  const isElectronBuild = mode === 'electron' || process.env.BUILD_TARGET === 'electron';
  // Try to read version_app_mask from app_version.txt
  let buildId = '0.0.1';
  try {
    const versionPath = path.resolve(__dirname, 'public/app_version.txt');
    if (fs.existsSync(versionPath)) {
      const data = JSON.parse(fs.readFileSync(versionPath, 'utf-8'));
      buildId = data.version_app_mask || '0.0.1';
    }
  } catch (e) {
    console.warn('Could not read app_version.txt, using default version');
  }

  // Detector de rosto (foto de perfil): o WASM do MediaPipe é servido pelo próprio
  // app, sem CDN — funciona offline no APK. Copiado de node_modules a cada dev/build
  // (9 MB; fora do git). Só a variante SIMD: WebViews/navegadores atuais suportam.
  // O modelo (public/mediapipe/blaze_face_short_range.tflite) fica versionado.
  try {
    const srcDir = path.resolve(__dirname, 'node_modules/@mediapipe/tasks-vision/wasm');
    const dstDir = path.resolve(__dirname, 'public/mediapipe/wasm');
    fs.mkdirSync(dstDir, { recursive: true });
    for (const file of ['vision_wasm_internal.js', 'vision_wasm_internal.wasm']) {
      const src = path.join(srcDir, file);
      const dst = path.join(dstDir, file);
      if (fs.existsSync(src) && (!fs.existsSync(dst) || fs.statSync(dst).size !== fs.statSync(src).size)) {
        fs.copyFileSync(src, dst);
      }
    }
  } catch (e) {
    console.warn('Could not copy MediaPipe wasm to public/mediapipe/wasm', e);
  }

  // Only use Electron plugins for explicit Electron builds.
  const plugins: PluginOption[] = [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    })
  ];
  
  if (!isDev && isElectronBuild) {
    plugins.push(
      electron([
        {
          entry: 'electron/main.ts',
          vite: {
            build: {
              outDir: 'dist-electron',
              rollupOptions: {
                external: ['electron'],
              },
            },
          },
        },
        {
          entry: 'electron/preload.ts',
          onstart(options) {
            options.reload();
          },
          vite: {
            build: {
              outDir: 'dist-electron',
              rollupOptions: {
                external: ['electron'],
              },
            },
          },
        },
      ])
    );
    plugins.push(renderer());
  }

  return {
    base: mode === 'android' ? './' : '/',
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/osrm': {
          target: 'https://router.project-osrm.org',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/osrm/, ''),
          secure: false,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          }
        },
        '/webhook': {
          target: 'https://services-n8n-webhook.2unk5k.easypanel.host',
          changeOrigin: true,
          secure: false,
        },
        '/realtime': {
          target: 'https://vps.supabase.siges-app.com.br',
          changeOrigin: true,
          secure: false,
          ws: true,
        }
      }
    },
    preview: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true
    },
    plugins,
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@react-pdf') || id.includes('pdfkit') || id.includes('blob-stream') || id.includes('fontkit')) {
                return 'pdf-vendor';
              }
              if (id.includes('xlsx')) {
                return 'excel-vendor';
              }
              if (id.includes('leaflet')) {
                return 'maps-vendor';
              }
              if (id.includes('@supabase')) {
                return 'supabase-vendor';
              }
              if (id.includes('react-icons')) {
                return 'icons-vendor';
              }
              // SDKs pesados usados só em fluxos específicos (upload / IA):
              // chunks próprios, baixados sob demanda (import() em r2Service).
              if (id.includes('@aws-sdk') || id.includes('@smithy') || id.includes('@aws-crypto')) {
                return 'aws-vendor';
              }
              if (id.includes('@google/genai') || id.includes('@google/generative-ai')) {
                return 'ai-vendor';
              }
              // Demais libs ficam em "vendor". NÃO retornar undefined aqui: libs
              // compartilhadas sem chunk definido são absorvidas pelos chunks
              // nomeados acima (pdf/aws/maps) e os tornam carregados na abertura.
              return 'vendor';
            }
          }
        }
      }
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      '__BUILD_ID__': JSON.stringify(buildId)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
