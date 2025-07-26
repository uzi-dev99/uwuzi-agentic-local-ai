import { initToolbar } from '@stagewise/toolbar';

const stagewiseConfig = {
  plugins: [],
};

if (
  process.env.NODE_ENV === 'development' &&
  !(window as any).__STAGEWISE_TOOLBAR_INITIALIZED__
) {
  (window as any).__STAGEWISE_TOOLBAR_INITIALIZED__ = true;
  initToolbar(stagewiseConfig);
}
