import { useEffect, useRef, useState, useCallback } from 'react';

interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  
  // Additional metrics
  ttfb: number | null; // Time to First Byte
  fcp: number | null; // First Contentful Paint
  
  // Memory metrics
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  
  // Frame rate
  averageFPS: number;
  currentFPS: number;
  
  // Network
  connectionType: string;
  
  // Custom metrics
  renderTime: number;
  interactionDelay: number;
}

interface PerformanceBudget {
  lcp: number; // 2.5s
  fid: number; // 100ms
  cls: number; // 0.1
  memoryUsage: number; // 50MB
  bundleSize: number; // 500KB
}

const DEFAULT_BUDGET: PerformanceBudget = {
  lcp: 2500,
  fid: 100,
  cls: 0.1,
  memoryUsage: 50 * 1024 * 1024, // 50MB
  bundleSize: 500 * 1024, // 500KB
};

class PerformanceTracker {
  private static instance: PerformanceTracker;
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];
  private frameCounter = 0;
  private lastFrameTime = 0;
  private fpsSamples: number[] = [];
  private budget: PerformanceBudget = DEFAULT_BUDGET;

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  constructor() {
    this.initObservers();
    this.startFPSMonitoring();
    this.initMemoryMonitoring();
  }

  private initObservers() {
    if (!('PerformanceObserver' in window)) return;

    // LCP Observer
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.metrics.lcp = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (e) {
      console.warn('LCP observer not supported');
    }

    // FID Observer
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.fid = entry.processingStart - entry.startTime;
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (e) {
      console.warn('FID observer not supported');
    }

    // CLS Observer
    try {
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.metrics.cls = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (e) {
      console.warn('CLS observer not supported');
    }

    // Navigation Observer
    try {
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.ttfb = entry.responseStart - entry.requestStart;
          this.metrics.fcp = entry.loadEventEnd - entry.loadEventStart;
        });
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);
    } catch (e) {
      console.warn('Navigation observer not supported');
    }
  }

  private startFPSMonitoring() {
    const measureFPS = (timestamp: number) => {
      if (this.lastFrameTime) {
        const delta = timestamp - this.lastFrameTime;
        const fps = 1000 / delta;
        
        this.fpsSamples.push(fps);
        if (this.fpsSamples.length > 60) { // Keep last 60 samples (1 second at 60fps)
          this.fpsSamples.shift();
        }
        
        this.metrics.currentFPS = fps;
        this.metrics.averageFPS = this.fpsSamples.reduce((a, b) => a + b, 0) / this.fpsSamples.length;
      }
      
      this.lastFrameTime = timestamp;
      this.frameCounter++;
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  private initMemoryMonitoring() {
    const updateMemoryMetrics = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.metrics.usedJSHeapSize = memory.usedJSHeapSize;
        this.metrics.totalJSHeapSize = memory.totalJSHeapSize;
        this.metrics.jsHeapSizeLimit = memory.jsHeapSizeLimit;
      }

      // Connection type
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        this.metrics.connectionType = connection?.effectiveType || 'unknown';
      }
    };

    updateMemoryMetrics();
    setInterval(updateMemoryMetrics, 5000); // Update every 5 seconds
  }

  measureRenderTime(componentName: string, renderFn: () => void): number {
    const start = performance.now();
    renderFn();
    const end = performance.now();
    const duration = end - start;
    
    this.metrics.renderTime = duration;
    
    if (duration > 16.67) { // More than one frame at 60fps
      console.warn(`Slow render detected in ${componentName}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  measureInteractionDelay(callback: () => void): Promise<number> {
    return new Promise((resolve) => {
      const start = performance.now();
      
      // Use scheduler if available, otherwise setTimeout
      if ('scheduler' in window && 'postTask' in (window as any).scheduler) {
        (window as any).scheduler.postTask(() => {
          callback();
          const end = performance.now();
          const delay = end - start;
          this.metrics.interactionDelay = delay;
          resolve(delay);
        });
      } else {
        setTimeout(() => {
          callback();
          const end = performance.now();
          const delay = end - start;
          this.metrics.interactionDelay = delay;
          resolve(delay);
        }, 0);
      }
    });
  }

  getMetrics(): PerformanceMetrics {
    return this.metrics as PerformanceMetrics;
  }

  checkBudget(): { passed: boolean; violations: string[] } {
    const violations: string[] = [];
    
    if (this.metrics.lcp && this.metrics.lcp > this.budget.lcp) {
      violations.push(`LCP: ${this.metrics.lcp}ms > ${this.budget.lcp}ms`);
    }
    
    if (this.metrics.fid && this.metrics.fid > this.budget.fid) {
      violations.push(`FID: ${this.metrics.fid}ms > ${this.budget.fid}ms`);
    }
    
    if (this.metrics.cls && this.metrics.cls > this.budget.cls) {
      violations.push(`CLS: ${this.metrics.cls} > ${this.budget.cls}`);
    }
    
    if (this.metrics.usedJSHeapSize > this.budget.memoryUsage) {
      violations.push(`Memory: ${(this.metrics.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB > ${(this.budget.memoryUsage / 1024 / 1024).toFixed(1)}MB`);
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }

  setBudget(budget: Partial<PerformanceBudget>) {
    this.budget = { ...this.budget, ...budget };
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

export function usePerformanceMonitor(componentName?: string) {
  const tracker = useRef(PerformanceTracker.getInstance());
  const [state, setState] = useState({
    metrics: {} as PerformanceMetrics,
    budget: DEFAULT_BUDGET,
    isViolatingBudget: false,
    violations: [] as string[],
  });

  const updateMetrics = useCallback(() => {
    const metrics = tracker.current.getMetrics();
    const budgetCheck = tracker.current.checkBudget();
    
    setState(prevState => ({
      ...prevState,
      metrics,
      isViolatingBudget: !budgetCheck.passed,
      violations: budgetCheck.violations,
    }));
  }, []);

  const measureRender = useCallback((renderFn: () => void) => {
    return tracker.current.measureRenderTime(componentName || 'Unknown', renderFn);
  }, [componentName]);

  const measureInteraction = useCallback((callback: () => void) => {
    return tracker.current.measureInteractionDelay(callback);
  }, []);

  const setBudget = useCallback((budget: Partial<PerformanceBudget>) => {
    tracker.current.setBudget(budget);
    setState(prevState => ({ ...prevState, budget: { ...prevState.budget, ...budget } }));
  }, []);

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(updateMetrics, 1000);
    updateMetrics(); // Initial update
    
    return () => clearInterval(interval);
  }, [updateMetrics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't cleanup the singleton, just disconnect component-specific observers
    };
  }, []);

  return {
    metrics: state.metrics,
    budget: state.budget,
    isViolatingBudget: state.isViolatingBudget,
    violations: state.violations,
    measureRender,
    measureInteraction,
    setBudget,
    updateMetrics,
  };
}