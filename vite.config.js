import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { PROXY_TARGETS } from './proxy-targets.js';

// Khi chạy trên máy, server của Vite đóng vai proxy; trên Cloudflare là functions/proxy/[[path]].js.
const proxy = Object.fromEntries(
  Object.entries(PROXY_TARGETS).map(([name, target]) => {
    const prefix = `/proxy/${name}`;
    return [
      prefix,
      {
        target,
        changeOrigin: true,
        rewrite: (path) => path.slice(prefix.length),
        // Giống proxy-handler.js: đánh dấu phản hồi đã đi qua proxy.
        configure: (p) => p.on('proxyRes', (res) => (res.headers['x-mach-proxy'] = '1')),
      },
    ];
  }),
);

export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
});
