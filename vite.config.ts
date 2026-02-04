import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
/* Fix: Import fileURLToPath to define __dirname in ESM environment */
import { fileURLToPath } from 'url';

// Fix: Manually define __dirname because it is not available in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});