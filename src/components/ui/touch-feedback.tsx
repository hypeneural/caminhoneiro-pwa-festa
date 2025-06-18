import React, { useState } from 'react';
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TouchFeedbackProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function TouchFeedback({ children, className = '', disabled = false, onClick }: TouchFeedbackProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = () => {
    if (disabled) return;
    setIsPressed(true);
    
    // Só tenta vibrar se o navegador suportar e tiver permissão
    try {
      if (navigator.vibrate && document.hasFocus()) {
        navigator.vibrate(10);
      }
    } catch (error) {
      // Ignora erros de vibração silenciosamente
    }
  };

  const handleTouchEnd = () => {
    if (disabled) return;
    setIsPressed(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    onClick?.();
  };

  return (
    <div
      className={`
        transition-transform duration-100 active:scale-[0.97]
        ${isPressed ? 'scale-[0.97]' : 'scale-100'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onClick={handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
    >
      {children}
    </div>
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