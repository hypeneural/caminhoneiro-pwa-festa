import React from 'react';
import { cn } from '@/lib/utils';

interface SimpleCarouselProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemWidth?: string;
  gap?: string;
  className?: string;
}

export function SimpleCarousel<T>({
  items,
  renderItem,
  itemWidth = "w-80",
  gap = "gap-4",
  className
}: SimpleCarouselProps<T>) {
  return (
    <div 
      className={cn(
        "flex overflow-x-auto scrollbar-hide scroll-smooth",
        gap,
        className
      )}
    >
      {items.map((item, index) => (
        <div 
          key={index} 
          className={cn("flex-shrink-0", itemWidth)}
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}