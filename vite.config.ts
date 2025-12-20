import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // This ensures process.env.API_KEY works in the browser
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Polyfill strict process.env for other libs if necessary, though simpler is better
      'process.env': JSON.stringify(env)
    },
    build: {
      outDir: 'dist',
    }
  };
});