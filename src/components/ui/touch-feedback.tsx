import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TouchFeedbackProps {
  children: React.ReactNode;
  className?: string;
  haptic?: boolean;
  scale?: number;
  disabled?: boolean;
}

export function TouchFeedback({ 
  children, 
  className, 
  haptic = true, 
  scale = 0.95,
  disabled = false 
}: TouchFeedbackProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = useCallback(() => {
    if (disabled) return;
    setIsPressed(true);
    
    // Haptic feedback for supported devices
    if (haptic && 'vibrate' in navigator && navigator.vibrate) {
      try {
        navigator.vibrate(10);
      } catch (error) {
        // Ignore vibration errors
      }
    }
  }, [disabled, haptic]);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleTouchCancel = useCallback(() => {
    setIsPressed(false);
  }, []);

  return (
    <motion.div
      className={cn("select-none", className)}
      animate={{ 
        scale: isPressed ? scale : 1,
        opacity: disabled ? 0.6 : 1
      }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 30,
        duration: 0.1 
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
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

  const handleClick = useCallback((event: React.MouseEvent) => {
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
  }, []);

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