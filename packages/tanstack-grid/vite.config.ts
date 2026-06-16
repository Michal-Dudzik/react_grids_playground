import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index',
      cssFileName: 'styles',
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@tanstack/react-table',
        'antd',
        '@ant-design/icons',
        '@dnd-kit/core',
        '@dnd-kit/modifiers',
        '@dnd-kit/sortable',
        '@dnd-kit/utilities',
        'clsx',
      ],
    },
  },
});
