import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';
import { pwaConfig } from './config/pwa.config';
import { buildConfig } from './config/build.config';
import { optimizeDepsConfig, esbuildConfig } from './config/optimization.config';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/radio/metadata': {
        target: 'https://s03.svrdedicado.org:6860',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => '/stats?json=1',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request:', req.method, req.url);
            proxyReq.setHeader('Origin', 'http://localhost:8080');
            proxyReq.setHeader('Referer', 'http://localhost:8080');
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
    cors: true,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA(pwaConfig)
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: buildConfig,
  optimizeDeps: optimizeDepsConfig,
  esbuild: esbuildConfig,
}));
