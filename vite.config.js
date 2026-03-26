import { defineConfig } from 'vite';
export default defineConfig({
  base: '/multiverse-metaverse/',
  root: '.',
  build: { outDir: 'dist', assetsInlineLimit: 0 },
  server: { host: true },
});
