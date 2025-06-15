import { useCallback, useEffect, useRef, useState } from 'react';

interface PrefetchState {
  currentRoute: string;
  visitStartTime: number;
}

interface PrefetchOptions {
  priority?: 'low' | 'high';
  delay?: number;
  networkAware?: boolean;
  deviceAware?: boolean;
}

interface UserBehaviorPattern {
  route: string;
  frequency: number;
  lastAccessed: number;
  timeSpent: number;
}

class SmartPrefetcher {
  private static instance: SmartPrefetcher;
  private patterns: Map<string, UserBehaviorPattern> = new Map();
  private prefetchQueue: Set<string> = new Set();
  private isOnline = true;
  private connectionType: string = 'unknown';

  static getInstance(): SmartPrefetcher {
    if (!SmartPrefetcher.instance) {
      SmartPrefetcher.instance = new SmartPrefetcher();
    }
    return SmartPrefetcher.instance;
  }

  constructor() {
    this.initNetworkDetection();
    this.loadPatterns();
  }

  private initNetworkDetection() {
    if ('navigator' in window && 'onLine' in navigator) {
      this.isOnline = navigator.onLine;
      
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.processPrefetchQueue();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }

    // Get connection type if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.connectionType = connection?.effectiveType || 'unknown';
      
      connection?.addEventListener('change', () => {
        this.connectionType = connection.effectiveType || 'unknown';
      });
    }
  }

  private loadPatterns() {
    try {
      const stored = localStorage.getItem('prefetch_patterns');
      if (stored) {
        const patterns = JSON.parse(stored);
        this.patterns = new Map(patterns);
      }
    } catch (error) {
      console.warn('Failed to load prefetch patterns:', error);
    }
  }

  private savePatterns() {
    try {
      const patterns = Array.from(this.patterns.entries());
      localStorage.setItem('prefetch_patterns', JSON.stringify(patterns));
    } catch (error) {
      console.warn('Failed to save prefetch patterns:', error);
    }
  }

  recordVisit(route: string, timeSpent: number = 0) {
    const now = Date.now();
    const existing = this.patterns.get(route);
    
    if (existing) {
      existing.frequency += 1;
      existing.lastAccessed = now;
      existing.timeSpent = (existing.timeSpent + timeSpent) / 2; // Average time
    } else {
      this.patterns.set(route, {
        route,
        frequency: 1,
        lastAccessed: now,
        timeSpent,
      });
    }
    
    this.savePatterns();
  }

  predictNextRoutes(currentRoute: string, limit: number = 3): string[] {
    const allPatterns = Array.from(this.patterns.values());
    
    // Score routes based on frequency, recency, and time spent
    const scored = allPatterns
      .filter(pattern => pattern.route !== currentRoute)
      .map(pattern => {
        const recencyScore = Math.max(0, 1 - (Date.now() - pattern.lastAccessed) / (7 * 24 * 60 * 60 * 1000)); // 7 days decay
        const frequencyScore = Math.min(1, pattern.frequency / 10); // Cap at 10 visits
        const engagementScore = Math.min(1, pattern.timeSpent / 60000); // Cap at 1 minute
        
        return {
          route: pattern.route,
          score: (recencyScore * 0.4) + (frequencyScore * 0.4) + (engagementScore * 0.2),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.route);

    return scored;
  }

  shouldPrefetch(options: PrefetchOptions = {}): boolean {
    const { networkAware = true, deviceAware = true } = options;

    if (!this.isOnline) return false;

    if (networkAware) {
      // Don't prefetch on slow connections
      if (this.connectionType === 'slow-2g' || this.connectionType === '2g') {
        return false;
      }
    }

    if (deviceAware) {
      // Check memory constraints
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        if (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize > 0.7) {
          return false;
        }
      }

      // Check CPU constraints (battery)
      if ('getBattery' in navigator) {
        (navigator as any).getBattery?.().then((battery: any) => {
          if (battery.level < 0.2 && !battery.charging) {
            return false;
          }
        });
      }
    }

    return true;
  }

  async prefetchRoute(route: string, options: PrefetchOptions = {}) {
    if (!this.shouldPrefetch(options) || this.prefetchQueue.has(route)) {
      return;
    }

    this.prefetchQueue.add(route);

    try {
      // Prefetch the route
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      link.as = 'document';
      
      if (options.priority === 'high') {
        link.rel = 'preload';
      }

      document.head.appendChild(link);

      // Remove after timeout
      setTimeout(() => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
        this.prefetchQueue.delete(route);
      }, 30000); // 30 seconds

    } catch (error) {
      console.warn('Failed to prefetch route:', route, error);
      this.prefetchQueue.delete(route);
    }
  }

  private async processPrefetchQueue() {
    // Process any queued prefetches when coming back online
    // Implementation would depend on stored queue
  }
}

export function usePrefetch() {
  const prefetcher = useRef<SmartPrefetcher | null>(null);
  const [state, setState] = useState<PrefetchState>({
    currentRoute: '',
    visitStartTime: Date.now(),
  });

  // Initialize prefetcher safely
  useEffect(() => {
    try {
      prefetcher.current = SmartPrefetcher.getInstance();
    } catch (error) {
      console.warn('Prefetcher initialization failed:', error);
    }
  }, []);

  const recordVisit = useCallback((route: string) => {
    try {
      if (!prefetcher.current) return;
      
      if (state.currentRoute && state.currentRoute !== route) {
        const timeSpent = Date.now() - state.visitStartTime;
        prefetcher.current.recordVisit(state.currentRoute, timeSpent);
      }
      
      setState({
        currentRoute: route,
        visitStartTime: Date.now(),
      });
    } catch (error) {
      console.warn('Failed to record visit:', error);
    }
  }, [state.currentRoute, state.visitStartTime]);

  const prefetchRoute = useCallback((route: string, options?: PrefetchOptions) => {
    try {
      if (!prefetcher.current) return Promise.resolve();
      return prefetcher.current.prefetchRoute(route, options);
    } catch (error) {
      console.warn('Failed to prefetch route:', error);
      return Promise.resolve();
    }
  }, []);

  const prefetchPredicted = useCallback(() => {
    try {
      if (!state.currentRoute || !prefetcher.current) return;
      
      const predicted = prefetcher.current.predictNextRoutes(state.currentRoute);
      predicted.forEach(route => {
        prefetcher.current?.prefetchRoute(route, { priority: 'low', delay: 1000 });
      });
    } catch (error) {
      console.warn('Failed to prefetch predicted routes:', error);
    }
  }, [state.currentRoute]);

  // Auto-prefetch predicted routes
  useEffect(() => {
    const timer = setTimeout(prefetchPredicted, 2000); // Wait 2s before prefetching
    return () => clearTimeout(timer);
  }, [prefetchPredicted]);

  return {
    recordVisit,
    prefetchRoute,
    prefetchPredicted,
    currentRoute: state.currentRoute,
  };
}