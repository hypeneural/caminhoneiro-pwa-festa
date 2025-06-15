import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface VirtualScrollerProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  horizontal?: boolean;
  gap?: number;
}

export function VirtualScroller<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className,
  horizontal = false,
  gap = 0
}: VirtualScrollerProps<T>) {
  const [scrollOffset, setScrollOffset] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const visibleRange = useMemo(() => {
    const itemSize = itemHeight + gap;
    const containerSize = containerHeight;
    
    const startIndex = Math.max(0, Math.floor(scrollOffset / itemSize) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.floor((scrollOffset + containerSize) / itemSize) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollOffset, itemHeight, containerHeight, items.length, overscan, gap]);

  const virtualItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    const itemSize = itemHeight + gap;
    
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
      offsetY: (startIndex + index) * itemSize,
    }));
  }, [items, visibleRange, itemHeight, gap]);

  const totalSize = items.length * (itemHeight + gap) - gap;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollOffset(scrollTop);
  }, []);

  // Throttled scroll handler for better performance
  const throttledScroll = useCallback(
    throttle(handleScroll, 16), // 60fps
    [handleScroll]
  );

  return (
    <div
      ref={scrollElementRef}
      className={cn(
        "overflow-auto",
        horizontal ? "overflow-x-auto overflow-y-hidden" : "overflow-y-auto overflow-x-hidden",
        className
      )}
      style={{
        height: containerHeight,
        width: horizontal ? containerHeight : undefined,
      }}
      onScroll={throttledScroll}
    >
      <div
        style={{
          height: horizontal ? itemHeight : totalSize,
          width: horizontal ? totalSize : '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map(({ item, index, offsetY }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: horizontal ? 0 : offsetY,
              left: horizontal ? offsetY : 0,
              height: itemHeight,
              width: horizontal ? itemHeight : '100%',
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Utility function for throttling
function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}