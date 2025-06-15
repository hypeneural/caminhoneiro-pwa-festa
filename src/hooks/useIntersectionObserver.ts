import { useEffect, useRef, useState, useCallback } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
  skip?: boolean;
}

interface IntersectionObserverEntry {
  isIntersecting: boolean;
  intersectionRatio: number;
  target: Element;
  boundingClientRect: DOMRectReadOnly;
  intersectionRect: DOMRectReadOnly;
  rootBounds: DOMRectReadOnly | null;
  time: number;
}

export function useIntersectionObserver<T extends Element = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {}
) {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = false,
    skip = false
  } = options;

  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const elementRef = useRef<T>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const observe = useCallback(() => {
    if (skip || !elementRef.current) return;

    const element = elementRef.current;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry as any);
        setIsIntersecting(entry.isIntersecting);
        
        if (triggerOnce && entry.isIntersecting) {
          observerRef.current?.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current.observe(element);
  }, [threshold, rootMargin, triggerOnce, skip]);

  const unobserve = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  useEffect(() => {
    observe();
    return unobserve;
  }, [observe, unobserve]);

  useEffect(() => {
    return () => {
      unobserve();
    };
  }, [unobserve]);

  return {
    ref: elementRef,
    entry,
    isIntersecting,
    observe,
    unobserve,
  };
}

// Hook for multiple zones (visible, buffer, prefetch)
export function useAdvancedIntersectionObserver<T extends Element = HTMLDivElement>() {
  const visibleZone = useIntersectionObserver<T>({
    threshold: 0.1,
    rootMargin: '0px',
  });

  const bufferZone = useIntersectionObserver<T>({
    threshold: 0,
    rootMargin: '100px',
  });

  const prefetchZone = useIntersectionObserver<T>({
    threshold: 0,
    rootMargin: '300px',
    triggerOnce: true,
  });

  return {
    visible: visibleZone,
    buffer: bufferZone,
    prefetch: prefetchZone,
  };
}