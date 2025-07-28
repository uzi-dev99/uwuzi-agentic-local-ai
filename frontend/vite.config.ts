import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      plugins: [react()],
      define: {
        // Variables de entorno eliminadas - ahora usamos VITE_BACKEND_API_URL
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
