/**
 * App Shell Architecture - Core PWA Foundation
 * Manages critical resources, routing, and performance optimization
 */

export interface AppShellConfig {
  criticalRoutes: string[];
  staticAssets: string[];
  apiEndpoints: string[];
  cacheFirst: string[];
  networkFirst: string[];
}

export const APP_SHELL_CONFIG: AppShellConfig = {
  criticalRoutes: ['/', '/galeria', '/mapa', '/programacao', '/noticias', '/vocesabia'],
  staticAssets: [
    '/manifest.json',
    '/pwa-192x192.png',
    '/pwa-512x512.png',
    '/favicon.ico'
  ],
  apiEndpoints: [
    '/api/tracker',
    '/api/news',
    '/api/photos',
    '/api/stories'
  ],
  cacheFirst: [
    'images',
    'fonts',
    'static-assets'
  ],
  networkFirst: [
    'api',
    'html',
    'tracker-data'
  ]
};

class AppShellManager {
  private static instance: AppShellManager;
  private isInitialized = false;
  private criticalResourcesLoaded = false;

  static getInstance(): AppShellManager {
    if (!AppShellManager.instance) {
      AppShellManager.instance = new AppShellManager();
    }
    return AppShellManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Preload critical CSS
      await this.loadCriticalCSS();
      
      // Preconnect to external domains
      this.setupPreconnections();
      
      // Initialize performance monitoring
      this.initPerformanceObserver();
      
      this.isInitialized = true;
      console.log('🚀 App Shell initialized successfully');
    } catch (error) {
      console.error('❌ App Shell initialization failed:', error);
    }
  }

  private async loadCriticalCSS(): Promise<void> {
    // Critical CSS is already inlined in index.html
    // This could be extended for dynamic critical CSS loading
    return Promise.resolve();
  }

  private setupPreconnections(): void {
    const preconnectDomains = [
      'https://images.unsplash.com',
      'https://api.festadocaminhoneiro.com.br',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ];

    preconnectDomains.forEach(domain => {
      if (!document.querySelector(`link[href="${domain}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    });
  }

  private initPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      // Monitor Core Web Vitals
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            this.trackNavigationTiming(entry as PerformanceNavigationTiming);
          }
        }
      });

      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
    }
  }

  private trackNavigationTiming(entry: PerformanceNavigationTiming): void {
    const metrics = {
      ttfb: entry.responseStart - entry.requestStart,
      fcp: entry.loadEventEnd - entry.loadEventStart,
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart
    };

    console.log('📊 Navigation Metrics:', metrics);
  }

  // Resource hints management
  preloadRoute(route: string): void {
    if (APP_SHELL_CONFIG.criticalRoutes.includes(route)) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    }
  }

  // Memory management
  cleanup(): void {
    // Cleanup non-critical resources when memory is low
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      if (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize > 0.8) {
        console.warn('🧠 High memory usage detected, cleaning up...');
        this.clearNonCriticalCaches();
      }
    }
  }

  private clearNonCriticalCaches(): void {
    // Clear old cached data that's not critical
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('non-critical') || cacheName.includes('old-')) {
            caches.delete(cacheName);
          }
        });
      });
    }
  }
}

export const appShell = AppShellManager.getInstance();