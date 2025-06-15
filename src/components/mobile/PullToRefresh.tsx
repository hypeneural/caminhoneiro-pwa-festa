import React, { useState, useRef, useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);

  const y = useSpring(0, { stiffness: 300, damping: 30 });
  const pullProgress = useTransform(y, [0, threshold], [0, 1]);
  const iconRotation = useTransform(pullProgress, [0, 1], [0, 180]);

  const handleTouchStart = (e: TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    if (diff > 0 && containerRef.current?.scrollTop === 0) {
      e.preventDefault();
      currentYRef.current = Math.min(diff, threshold * 1.5);
      y.set(currentYRef.current);
      
      // Haptic feedback at threshold
      if (currentYRef.current >= threshold && navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling || isRefreshing) return;

    setIsPulling(false);

    if (currentYRef.current >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }

    y.set(0);
    currentYRef.current = 0;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, isRefreshing]);

  return (
    <div ref={containerRef} className="relative h-full overflow-auto">
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-1/2 transform -translate-x-1/2 z-50"
        style={{ y: useTransform(y, v => v - 60) }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isPulling || isRefreshing ? 1 : 0 }}
      >
        <div className="bg-background/90 backdrop-blur-md rounded-full p-3 shadow-lg border border-border/50">
          <motion.div
            style={{ rotate: isRefreshing ? 0 : iconRotation }}
            animate={isRefreshing ? { rotate: 360 } : {}}
            transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
          >
            <RefreshCw 
              className={`w-5 h-5 ${
                currentYRef.current >= threshold ? 'text-trucker-green' : 'text-muted-foreground'
              }`} 
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
};