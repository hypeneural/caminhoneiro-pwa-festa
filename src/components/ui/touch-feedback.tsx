
import React, { useState } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TouchFeedbackProps extends Omit<HTMLMotionProps<"div">, "whileTap" | "transition"> {
  children: React.ReactNode;
  className?: string;
  scale?: number;
  haptic?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export function TouchFeedback({ 
  children, 
  className, 
  scale = 0.97,
  haptic,
  onClick,
  ...props 
}: TouchFeedbackProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (haptic && navigator.vibrate) {
      navigator.vibrate(50);
    }
    onClick?.(e);
  };

  return (
    <motion.div
      whileTap={{ scale }}
      transition={{ duration: 0.1 }}
      className={cn('touch-none', className)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Ripple effect component
export function RippleEffect({ 
  children, 
  className,
  rippleColor = "currentColor" 
}: { 
  children: React.ReactNode; 
  className?: string;
  rippleColor?: string;
}) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleClick = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const newRipple = {
      id: Date.now(),
      x,
      y
    };

    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  };

  return (
    <div 
      className={cn("relative overflow-hidden", className)}
      onClick={handleClick}
    >
      {children}
      {ripples.map(ripple => (
        <motion.div
          key={ripple.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            backgroundColor: rippleColor,
            opacity: 0.3
          }}
          initial={{ 
            width: 0, 
            height: 0, 
            x: 0, 
            y: 0 
          }}
          animate={{ 
            width: 200, 
            height: 200, 
            x: -100, 
            y: -100,
            opacity: 0
          }}
          transition={{ duration: 0.6 }}
        />
      ))}
    </div>
  );
}
