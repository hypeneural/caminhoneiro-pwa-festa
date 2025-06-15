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
