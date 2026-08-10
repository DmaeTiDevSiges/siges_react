import { contextBridge } from 'electron';

// Expose protected methods that allow the renderer process to use
// selected Node.js features without exposing the entire environment.
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
});
