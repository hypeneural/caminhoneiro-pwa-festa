import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useMemoryManager } from '@/hooks/useMemoryManager';
import { cn } from '@/lib/utils';

interface VirtualCarouselProps<T> {
  items: T[];
  renderItem: (item: T, index: number, isVisible: boolean) => React.ReactNode;
  itemWidth: number;
  gap?: number;
  className?: string;
  overscan?: number;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showIndicators?: boolean;
  onItemChange?: (index: number) => void;
}

export function VirtualCarousel<T>({
  items,
  renderItem,
  itemWidth,
  gap = 16,
  className,
  overscan = 2,
  autoPlay = false,
  autoPlayInterval = 3000,
  showIndicators = true,
  onItemChange,
}: VirtualCarouselProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  
  const { ref: intersectionRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
  });
  
  const { createPool, acquire, release, stats } = useMemoryManager();

  // Create memory pool for item elements
  useEffect(() => {
    createPool(
      'carousel-items',
      () => document.createElement('div'),
      (element) => {
        element.innerHTML = '';
        element.className = '';
      },
      items.length * 2
    );
  }, [createPool, items.length]);

  // Calculate visible range based on scroll offset
  const visibleRange = useMemo(() => {
    const containerWidth = containerRef.current?.clientWidth || 0;
    const itemSize = itemWidth + gap;
    
    const startIndex = Math.max(0, Math.floor(scrollOffset / itemSize) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollOffset + containerWidth) / itemSize) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollOffset, itemWidth, gap, items.length, overscan]);

  // Virtual items to render
  const virtualItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      originalIndex: startIndex + index,
      isVisible: Math.abs((startIndex + index) - currentIndex) <= 1,
    }));
  }, [items, visibleRange, currentIndex]);

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && isIntersecting && !isDragging) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
      }, autoPlayInterval);
    } else if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [autoPlay, isIntersecting, isDragging, items.length, autoPlayInterval]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const scrollLeft = e.currentTarget.scrollLeft;
    setScrollOffset(scrollLeft);
    
    // Update current index based on scroll position
    const itemSize = itemWidth + gap;
    const newIndex = Math.round(scrollLeft / itemSize);
    
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      onItemChange?.(newIndex);
    }
  }, [isDragging, itemWidth, gap, currentIndex, onItemChange]);

  // Smooth scroll to index
  const scrollToIndex = useCallback((index: number) => {
    if (!containerRef.current) return;
    
    const itemSize = itemWidth + gap;
    const scrollLeft = index * itemSize;
    
    containerRef.current.scrollTo({
      left: scrollLeft,
      behavior: 'smooth',
    });
    
    setCurrentIndex(index);
    onItemChange?.(index);
  }, [itemWidth, gap, onItemChange]);

  // Touch/drag handlers
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    } else if (e.key === 'ArrowRight' && currentIndex < items.length - 1) {
      scrollToIndex(currentIndex + 1);
    }
  }, [currentIndex, items.length, scrollToIndex]);

  // Calculate total width
  const totalWidth = items.length * (itemWidth + gap) - gap;

  return (
    <div
      ref={intersectionRef as React.RefObject<HTMLDivElement>}
      className={cn("relative", className)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Virtual carousel"
    >
      {/* Memory usage indicator (dev only) */}
      {process.env.NODE_ENV === 'development' && stats.isLowMemory && (
        <div className="absolute top-0 right-0 z-10 bg-red-500 text-white text-xs px-2 py-1 rounded">
          Low Memory: {(stats.usage * 100).toFixed(1)}%
        </div>
      )}

      {/* Carousel container */}
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
        onScroll={handleScroll}
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchEnd={handleDragEnd}
        style={{
          scrollBehavior: isDragging ? 'auto' : 'smooth',
        }}
      >
        {/* Virtual spacer for smooth scrolling */}
        <div style={{ width: totalWidth, height: 1, position: 'relative' }}>
          {virtualItems.map(({ item, originalIndex, isVisible }) => (
            <div
              key={originalIndex}
              style={{
                position: 'absolute',
                left: originalIndex * (itemWidth + gap),
                width: itemWidth,
                top: 0,
              }}
            >
              <AnimatePresence mode="wait">
                {isVisible && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderItem(item, originalIndex, isVisible)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Indicators */}
      {showIndicators && items.length > 1 && (
        <div className="flex justify-center gap-2 mt-4" role="tablist">
          {items.map((_, index) => (
            <button
              key={index}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`Go to item ${index + 1}`}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                index === currentIndex
                  ? "bg-primary scale-125"
                  : "bg-muted hover:bg-muted-foreground/50"
              )}
              onClick={() => scrollToIndex(index)}
            />
          ))}
        </div>
      )}

      {/* Navigation buttons */}
      <button
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => scrollToIndex(currentIndex - 1)}
        disabled={currentIndex === 0}
        aria-label="Previous item"
      >
        ←
      </button>
      
      <button
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => scrollToIndex(currentIndex + 1)}
        disabled={currentIndex === items.length - 1}
        aria-label="Next item"
      >
        →
      </button>
    </div>
  );
}