import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'uk.wuzi.assist',
  appName: 'Project J.A.R.V.I.S v1',
  webDir: 'dist',
  plugins: {
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true
    }
  }
}

export default config;
