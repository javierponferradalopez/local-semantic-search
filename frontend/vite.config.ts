import {fileURLToPath} from 'node:url';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

const BACKEND_ORIGIN = 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {'@': fileURLToPath(new URL('./src', import.meta.url))}
  },
  server: {
    proxy: {'/resources': BACKEND_ORIGIN, '/files': BACKEND_ORIGIN}
  }
});
