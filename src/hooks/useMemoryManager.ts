import { useEffect, useRef, useCallback } from 'react';
import { useAdvancedState } from './useAdvancedState';

interface MemoryPool<T> {
  available: T[];
  inUse: Set<T>;
  factory: () => T;
  reset: (item: T) => void;
  maxSize: number;
}

interface MemoryStats {
  totalHeapSize: number;
  usedHeapSize: number;
  heapSizeLimit: number;
  usage: number; // percentage
  isLowMemory: boolean;
  pressureLevel: 'normal' | 'moderate' | 'critical';
}

class MemoryManager {
  private static instance: MemoryManager;
  private pools: Map<string, MemoryPool<any>> = new Map();
  private cleanupCallbacks: Set<() => void> = new Set();
  private gcTimer: NodeJS.Timeout | null = null;
  private pressureObserver: any = null;

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  constructor() {
    this.initMemoryPressureObserver();
    this.startGarbageCollectionTimer();
    this.initUnloadHandler();
  }

  private initMemoryPressureObserver() {
    // Use experimental Memory Pressure API if available
    if ('MemoryPressureObserver' in window) {
      try {
        this.pressureObserver = new (window as any).MemoryPressureObserver((entries: any[]) => {
          entries.forEach((entry) => {
            if (entry.level === 'critical') {
              this.emergencyCleanup();
            } else if (entry.level === 'moderate') {
              this.moderateCleanup();
            }
          });
        });
        this.pressureObserver.observe();
      } catch (error) {
        console.warn('MemoryPressureObserver not supported:', error);
      }
    }

    // Fallback: monitor heap size manually
    this.startMemoryMonitoring();
  }

  private startMemoryMonitoring() {
    const checkMemory = () => {
      const stats = this.getMemoryStats();
      
      if (stats.usage > 0.9) {
        this.emergencyCleanup();
      } else if (stats.usage > 0.7) {
        this.moderateCleanup();
      }
    };

    setInterval(checkMemory, 5000); // Check every 5 seconds
  }

  private startGarbageCollectionTimer() {
    // Regular cleanup every 30 seconds
    this.gcTimer = setInterval(() => {
      this.garbageCollect();
    }, 30000);
  }

  private initUnloadHandler() {
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // Handle page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.moderateCleanup();
      }
    });
  }

  createPool<T>(
    name: string,
    factory: () => T,
    reset: (item: T) => void,
    maxSize: number = 50
  ): MemoryPool<T> {
    const pool: MemoryPool<T> = {
      available: [],
      inUse: new Set(),
      factory,
      reset,
      maxSize,
    };

    this.pools.set(name, pool);
    return pool;
  }

  acquire<T>(poolName: string): T | null {
    const pool = this.pools.get(poolName) as MemoryPool<T>;
    if (!pool) return null;

    let item: T;
    
    if (pool.available.length > 0) {
      item = pool.available.pop()!;
    } else {
      item = pool.factory();
    }

    pool.inUse.add(item);
    return item;
  }

  release<T>(poolName: string, item: T): void {
    const pool = this.pools.get(poolName) as MemoryPool<T>;
    if (!pool || !pool.inUse.has(item)) return;

    pool.inUse.delete(item);
    pool.reset(item);

    if (pool.available.length < pool.maxSize) {
      pool.available.push(item);
    }
    // If pool is full, let item be garbage collected
  }

  addCleanupCallback(callback: () => void): () => void {
    this.cleanupCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.cleanupCallbacks.delete(callback);
    };
  }

  getMemoryStats(): MemoryStats {
    const defaultStats: MemoryStats = {
      totalHeapSize: 0,
      usedHeapSize: 0,
      heapSizeLimit: 0,
      usage: 0,
      isLowMemory: false,
      pressureLevel: 'normal',
    };

    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      
      return {
        totalHeapSize: memory.totalJSHeapSize,
        usedHeapSize: memory.usedJSHeapSize,
        heapSizeLimit: memory.jsHeapSizeLimit,
        usage,
        isLowMemory: usage > 0.8,
        pressureLevel: usage > 0.9 ? 'critical' : usage > 0.7 ? 'moderate' : 'normal',
      };
    }

    return defaultStats;
  }

  private garbageCollect() {
    // Clear old items from pools
    this.pools.forEach((pool) => {
      // Keep only half of available items
      const keepCount = Math.floor(pool.available.length / 2);
      pool.available.splice(keepCount);
    });

    // Clear weak references and cached data
    this.cleanupCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.warn('Cleanup callback failed:', error);
      }
    });
  }

  private moderateCleanup() {
    console.log('🧠 Moderate memory pressure detected, cleaning up...');
    
    // Clear 70% of pool items
    this.pools.forEach((pool) => {
      const keepCount = Math.floor(pool.available.length * 0.3);
      pool.available.splice(keepCount);
    });

    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
  }

  private emergencyCleanup() {
    console.warn('🚨 Critical memory pressure detected, emergency cleanup!');
    
    // Clear all available pool items
    this.pools.forEach((pool) => {
      pool.available.length = 0;
    });

    // Run all cleanup callbacks
    this.cleanupCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.warn('Emergency cleanup callback failed:', error);
      }
    });

    // Clear caches
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          if (cacheName.includes('non-critical')) {
            caches.delete(cacheName);
          }
        });
      });
    }

    // Force garbage collection
    if ('gc' in window) {
      (window as any).gc();
    }
  }

  cleanup() {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
      this.gcTimer = null;
    }

    if (this.pressureObserver) {
      this.pressureObserver.disconnect();
      this.pressureObserver = null;
    }

    this.pools.clear();
    this.cleanupCallbacks.clear();
  }
}

export function useMemoryManager() {
  const manager = useRef(MemoryManager.getInstance());
  const { state, setState } = useAdvancedState({
    stats: {
      totalHeapSize: 0,
      usedHeapSize: 0,
      heapSizeLimit: 0,
      usage: 0,
      isLowMemory: false,
      pressureLevel: 'normal' as const,
    },
    pools: new Map(),
  });

  const updateStats = useCallback(() => {
    const stats = manager.current.getMemoryStats();
    setState({ stats });
  }, [setState]);

  const createPool = useCallback(<T>(
    name: string,
    factory: () => T,
    reset: (item: T) => void,
    maxSize?: number
  ) => {
    return manager.current.createPool(name, factory, reset, maxSize);
  }, []);

  const acquire = useCallback(<T>(poolName: string): T | null => {
    return manager.current.acquire<T>(poolName);
  }, []);

  const release = useCallback(<T>(poolName: string, item: T) => {
    manager.current.release(poolName, item);
  }, []);

  const addCleanupCallback = useCallback((callback: () => void) => {
    return manager.current.addCleanupCallback(callback);
  }, []);

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(updateStats, 2000);
    updateStats(); // Initial update
    
    return () => clearInterval(interval);
  }, [updateStats]);

  // Component cleanup
  useEffect(() => {
    const cleanup = addCleanupCallback(() => {
      // Component-specific cleanup
      setState({ pools: new Map() });
    });

    return cleanup;
  }, [addCleanupCallback, setState]);

  return {
    stats: state.stats,
    createPool,
    acquire,
    release,
    addCleanupCallback,
    updateStats,
  };
}
