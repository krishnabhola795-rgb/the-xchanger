import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xchanger.app',
  appName: 'The Xchangers',
  webDir: 'public',
  server: {
    url: 'https://the-xchanger.vercel.app',
    cleartext: true
  }
};

export default config;