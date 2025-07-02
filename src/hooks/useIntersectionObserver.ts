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

export function useIntersectionObserver<T extends Element>(
  options: IntersectionObserverInit = { threshold: 0 }
): { ref: React.RefObject<T>; isIntersecting: boolean } {
  const elementRef = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
      observer.disconnect();
    };
  }, [options]);

  return { ref: elementRef, isIntersecting: isVisible };
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
  });

  return {
    visible: visibleZone,
    buffer: bufferZone,
    prefetch: prefetchZone,
  };
}