import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ag.siges',
  appName: 'Siges',
  webDir: 'dist',
  plugins: {
    Keyboard: {
      resize: 'body',
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#ffffff',
      overlaysWebView: false,
    },
  },
};

export default config;
