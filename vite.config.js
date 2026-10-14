import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Makes the static og:image absolute (crawlers need a full URL) using SITE_URL.
const absoluteOg = (site) => ({
  name: 'absolute-og',
  transformIndexHtml: (html) => (site ? html.replace('content="/temple-og.jpg"', `content="${site.replace(/\/$/, '')}/temple-og.jpg"`) : html),
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), absoluteOg(env.SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''))],
    server: { port: 5173, proxy: { '/api': { target: 'http://localhost:3001', xfwd: true } } },
    build: { target: 'es2020', chunkSizeWarningLimit: 700 },
  };
});
