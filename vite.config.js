import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ command }) => {
  const tanstackGridEntry = command === 'serve'
    ? './packages/tanstack-grid/src/index.ts'
    : './packages/tanstack-grid/dist/index.js';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@react-grids-playground/tanstack-grid': fileURLToPath(new URL(tanstackGridEntry, import.meta.url)),
      },
    },
  };
});
