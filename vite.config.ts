import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  // Try to read version from app_version.txt
  let buildId = new Date().getTime().toString();
  try {
    const versionPath = path.resolve(__dirname, 'public/app_version.txt');
    if (fs.existsSync(versionPath)) {
      const data = JSON.parse(fs.readFileSync(versionPath, 'utf-8'));
      buildId = data.version;
    }
  } catch (e) {
    console.warn('Could not read app_version.txt, using current timestamp');
  }

  return {
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