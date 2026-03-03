import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2022',
  },
  server: {
    port: 3000,
    open: true,
  },
  preview: {
    port: 8080,
  },
});
