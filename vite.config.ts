
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Import path module for alias resolution
// FIX: Add fileURLToPath for ESM compatibility to resolve __dirname equivalent
import { fileURLToPath } from 'url';

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
    resolve: {
      alias: {
        // FIX: Replaced __dirname with ESM-compatible equivalent for path resolution.
        '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src'),
      },
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Create smarter chunks for node_modules to reduce individual chunk sizes.
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              if (id.includes('react-dom') || id.includes('react')) {
                return 'vendor-react';
              }
              // All other node_modules will fall into a general vendor chunk.
              return 'vendor';
            }
          }
        }
      }
    }
  };
});
