import { DepOptimizationOptions } from 'vite';

export const optimizeDepsConfig: DepOptimizationOptions = {
  include: [
    'react',
    'react-dom',
    'react-router-dom',
    'framer-motion',
    '@tanstack/react-query',
    'lucide-react',
  ],
  exclude: ['@vite/client', '@vite/env'],
};

export const esbuildConfig = {
  logOverride: { 'this-is-undefined-in-esm': 'silent' as const },
  legalComments: 'none' as const,
};