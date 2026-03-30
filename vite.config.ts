import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  // Try to read version from version.json
  let buildId = new Date().getTime().toString();
  try {
    const versionPath = path.resolve(__dirname, 'public/version.json');
    if (fs.existsSync(versionPath)) {
      const data = JSON.parse(fs.readFileSync(versionPath, 'utf-8'));
      buildId = data.version;
    }
  } catch (e) {
    console.warn('Could not read version.json, using current timestamp');
  }

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/osrm': {
          target: 'https://routing.openstreetmap.de',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/osrm/, '/routed-car'),
          secure: false,
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.warn('[OSRM Proxy] error:', err.message);
            });
          }
        }
      }
    },
    preview: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true
    },
    plugins: [react()],
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