import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import remarkFrontmatter from 'remark-frontmatter';
import path from 'node:path';

export default defineConfig({
  plugins: [
    { enforce: 'pre', ...mdx({ remarkPlugins: [remarkFrontmatter] }) },
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@sims': path.resolve(__dirname, 'sims'),
      '@content': path.resolve(__dirname, 'content'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
