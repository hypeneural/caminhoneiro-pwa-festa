import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  threshold?: number;
}

export function PullToRefresh({ 
  children, 
  onRefresh, 
  disabled = false,
  threshold = 80 
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const y = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Transform values for animations
  const pullDistance = useTransform(y, [0, threshold], [0, threshold]);
  const iconRotation = useTransform(y, [0, threshold], [0, 180]);
  const opacity = useTransform(y, [0, threshold / 2, threshold], [0, 0.5, 1]);

  const handlePanStart = useCallback(() => {
    if (disabled || isRefreshing) return;
    
    // Only start pull if at top of scroll
    const container = containerRef.current;
    if (container && container.scrollTop === 0) {
      setIsPulling(true);
    }
  }, [disabled, isRefreshing]);

  const handlePan = useCallback((event: any, info: PanInfo) => {
    if (disabled || isRefreshing || !isPulling) return;

    const newY = Math.max(0, Math.min(info.offset.y, threshold * 1.5));
    y.set(newY);
  }, [disabled, isRefreshing, isPulling, threshold, y]);

  const handlePanEnd = useCallback(async (event: any, info: PanInfo) => {
    if (disabled || isRefreshing || !isPulling) return;

    setIsPulling(false);

    if (info.offset.y >= threshold) {
      setIsRefreshing(true);
      
      // Haptic feedback on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(25);
      }

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }

    // Animate back to 0
    y.set(0);
  }, [disabled, isRefreshing, isPulling, threshold, onRefresh, y]);

  // Auto-reset on refresh complete
  useEffect(() => {
    if (!isRefreshing) {
      y.set(0);
    }
  }, [isRefreshing, y]);

  return (
    <div ref={containerRef} className="relative h-full overflow-hidden">
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center"
        style={{
          y: pullDistance,
          opacity,
          height: threshold
        }}
        initial={{ y: -threshold }}
      >
        <div className="bg-background/95 backdrop-blur-sm rounded-full p-3 shadow-lg border border-border/50">
          <motion.div
            style={{ rotate: isRefreshing ? 360 : iconRotation }}
            animate={isRefreshing ? { rotate: 360 } : {}}
            transition={isRefreshing ? { 
              duration: 1, 
              repeat: Infinity, 
              ease: "linear" 
            } : {}}
          >
            <RefreshCw className="w-5 h-5 text-primary" />
          </motion.div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        className="h-full"
        style={{ y: pullDistance }}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        drag="y"
        dragConstraints={{ top: 0, bottom: threshold * 1.5 }}
        dragElastic={0.2}
      >
        {children}
      </motion.div>
    </div>
  );
}