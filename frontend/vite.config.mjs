import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const r = (p = '') => path.resolve(import.meta.dirname, 'src', p);

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://127.0.0.1:5001', changeOrigin: true }
    }
  },
  resolve: {
    alias: {
      utils: r('utils'),
      api: r('api'),
      views: r('views'),
      components: r('components'),
      '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs'
    }
  },
  define: { global: 'window' }
});
