
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface TagSegmentationProps {
  selectedTag: string;
  onTagChange: (tag: string) => void;
}

const tags = [
  { id: 'all', label: 'Todas', color: 'bg-trucker-blue' },
  { id: 'transportadora1', label: 'Transportadora 1', color: 'bg-green-600' },
  { id: 'transportadora2', label: 'Transportadora 2', color: 'bg-blue-600' },
  { id: 'bencao', label: 'Benção do Padre', color: 'bg-purple-600' },
  { id: 'sao-cristovao', label: 'São Cristóvão', color: 'bg-amber-600' },
  { id: 'pavilhao', label: 'Pavilhão', color: 'bg-red-600' }
];

export function TagSegmentation({ selectedTag, onTagChange }: TagSegmentationProps) {
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleTouchStart = () => setIsDragging(true);
    const handleTouchEnd = () => setTimeout(() => setIsDragging(false), 100);
    
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('touchstart', handleTouchStart);
      scrollElement.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        scrollElement.removeEventListener('touchstart', handleTouchStart);
        scrollElement.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, []);

  const handleTagClick = (tagId: string) => {
    if (!isDragging) {
      onTagChange(tagId);
    }
  };

  return (
    <div className="bg-background/95 backdrop-blur-sm border-b border-border/50 py-3">
      <ScrollArea className="w-full whitespace-nowrap">
        <div 
          ref={scrollRef}
          className="flex space-x-3 px-4"
        >
          {tags.map((tag) => (
            <motion.button
              key={tag.id}
              onClick={() => handleTagClick(tag.id)}
              className={`
                relative flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-medium
                transition-all duration-200 active:scale-95
                ${selectedTag === tag.id 
                  ? `${tag.color} text-white shadow-lg` 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }
              `}
              whileTap={{ scale: 0.95 }}
              layout
            >
              <span className="relative z-10 whitespace-nowrap">
                {tag.label}
              </span>
              
              {/* Selection indicator */}
              {selectedTag === tag.id && (
                <motion.div
                  layoutId="tagIndicator"
                  className="absolute inset-0 rounded-full bg-white/20"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              {/* Ripple effect */}
              <motion.div
                initial={{ scale: 0, opacity: 0.5 }}
                whileTap={{ scale: 3, opacity: 0 }}
                className={`absolute inset-0 ${tag.color} rounded-full`}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
      
      {/* Gradient fade indicators */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </div>
  );
}
