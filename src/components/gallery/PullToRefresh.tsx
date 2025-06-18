import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, useSpring, PanInfo } from 'framer-motion';
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
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use springs for smoother animations
  const y = useMotionValue(0);
  const ySpring = useSpring(y, { damping: 20, stiffness: 200 });
  
  // Transform values for animations
  const pullDistance = useTransform(ySpring, [0, threshold], [0, threshold]);
  const iconRotation = useTransform(ySpring, [0, threshold], [0, 180]);
  const opacity = useTransform(ySpring, [0, threshold / 2, threshold], [0, 0.5, 1]);
  const scale = useTransform(ySpring, [0, threshold], [0.8, 1]);
  const borderOpacity = useTransform(ySpring, [0, threshold], [0, 0.1]);

  const handlePanStart = useCallback(() => {
    if (disabled || isRefreshing) return;
    
    // Only start pull if at top of scroll
    const container = containerRef.current;
    if (container && container.scrollTop <= 0) {
      setIsPulling(true);
      console.log('Pull started');
    }
  }, [disabled, isRefreshing]);

  const handlePan = useCallback((event: any, info: PanInfo) => {
    if (disabled || isRefreshing || !isPulling) return;

    const newY = Math.max(0, Math.min(info.offset.y, threshold * 1.5));
    y.set(newY);
    
    console.log('Pulling:', { y: newY, threshold });
  }, [disabled, isRefreshing, isPulling, threshold, y]);

  const handlePanEnd = useCallback(async (event: any, info: PanInfo) => {
    if (disabled || isRefreshing || !isPulling) return;

    setIsPulling(false);
    console.log('Pull ended:', { offset: info.offset.y, threshold });

    if (info.offset.y >= threshold) {
      setIsRefreshing(true);
      
      // Haptic feedback on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(25);
      }

      try {
        console.log('Starting refresh');
        await onRefresh();
        console.log('Refresh completed');
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        y.set(0);
      }
    } else {
      // Animate back to 0 if threshold not reached
      y.set(0);
    }
  }, [disabled, isRefreshing, isPulling, threshold, onRefresh, y]);

  // Auto-reset on refresh complete
  useEffect(() => {
    if (!isRefreshing) {
      y.set(0);
    }
  }, [isRefreshing, y]);

  return (
    <div 
      ref={containerRef} 
      className="relative h-full overflow-auto overscroll-y-contain"
      style={{ 
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y'
      }}
    >
      {/* Pull indicator */}
      <motion.div
        className="absolute left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
        style={{
          y: pullDistance,
          opacity,
          height: threshold,
          scale
        }}
        initial={{ y: -threshold }}
      >
        <motion.div 
          className="bg-background/95 backdrop-blur-sm rounded-full p-3"
          style={{
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: `rgba(0,0,0,${borderOpacity.get()})`
          }}
        >
          <motion.div
            style={{ rotate: isRefreshing ? 360 : iconRotation }}
            animate={isRefreshing ? { 
              rotate: 360 
            } : undefined}
            transition={isRefreshing ? { 
              duration: 1, 
              repeat: Infinity, 
              ease: "linear" 
            } : undefined}
          >
            <RefreshCw className="w-5 h-5 text-primary" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        className="min-h-full"
        style={{ y: pullDistance }}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        drag="y"
        dragConstraints={{ top: 0, bottom: threshold * 1.5 }}
        dragElastic={0.2}
        dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
      >
        {children}
      </motion.div>
    </div>
  );
}