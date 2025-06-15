import { BuildOptions } from 'vite';

export const buildConfig: BuildOptions = {
  rollupOptions: {
    output: {
      manualChunks: undefined, // Disable manual chunking to avoid dependency issues
    },
  },
  target: 'esnext',
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.info'],
      passes: 2,
    },
    mangle: {
      safari10: true,
    },
  },
  cssCodeSplit: true,
  sourcemap: false,
  chunkSizeWarningLimit: 1000,
};