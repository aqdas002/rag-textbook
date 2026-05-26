import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import path from 'node:path';

// On GitHub Pages we live at https://<user>.github.io/<repo>/. The base path
// must match for all asset URLs to resolve. Set VITE_BASE_PATH in CI for the
// deploy build; default to '/' for local dev.
const base = process.env.VITE_BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [
    // remark-gfm adds GitHub-Flavored Markdown: tables, strikethrough, task lists,
    // autolinks. Without it, every `| col | col |` line renders as raw text.
    { enforce: 'pre', ...mdx({ remarkPlugins: [remarkFrontmatter, remarkGfm] }) },
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@sims': path.resolve(__dirname, 'sims'),
      '@content': path.resolve(__dirname, 'content'),
    },
  },
  server: {
    // WSL on /mnt/c — Windows filesystem doesn't fire native fs events to WSL,
    // so HMR misses changes to MDX/sim files unless we poll.
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
