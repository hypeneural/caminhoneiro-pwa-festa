import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';

interface FloatingCartButtonProps {
  onCartClick?: () => void;
}

export function FloatingCartButton({ onCartClick }: FloatingCartButtonProps) {
  const { itemCount, formattedTotal, isEmpty, openCart } = useCart();
  const [isVisible, setIsVisible] = useState(false);
  const [lastItemCount, setLastItemCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Show/hide based on cart contents with animation
  useEffect(() => {
    if (!isEmpty) {
      setIsVisible(true);
    } else {
      // Delay hiding to allow exit animation
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isEmpty]);

  // Animate when items are added/removed
  useEffect(() => {
    if (itemCount !== lastItemCount) {
      setIsAnimating(true);
      
      // Reset animation state
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setLastItemCount(itemCount);
      }, 600);
      
      return () => clearTimeout(timer);
    }
  }, [itemCount, lastItemCount]);

  // Pulse effect when cart updates
  useEffect(() => {
    if (itemCount > lastItemCount && buttonRef.current) {
      buttonRef.current.classList.add('animate-pulse');
      const timer = setTimeout(() => {
        buttonRef.current?.classList.remove('animate-pulse');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [itemCount, lastItemCount]);

  const handleClick = () => {
    if (onCartClick) {
      onCartClick();
    } else {
      openCart();
    }
  };

  const itemCountChanged = itemCount !== lastItemCount;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            duration: 0.6, 
            bounce: 0.4 
          }}
          className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50"
        >
          {/* Main Cart Button */}
          <motion.div
            animate={isAnimating ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <Button
              ref={buttonRef}
              onClick={handleClick}
              className="relative h-16 px-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-2xl rounded-full flex items-center gap-4 min-w-[180px] border-2 border-white/20"
              size="lg"
            >
              {/* Cart Icon with Badge */}
              <div className="relative">
                <motion.div
                  animate={itemCountChanged ? { rotate: [0, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <ShoppingCart className="w-6 h-6" />
                </motion.div>
                
                {/* Item Count Badge */}
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.div
                      key={itemCount}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", duration: 0.3 }}
                      className="absolute -top-2 -right-2"
                    >
                      <Badge 
                        className="min-w-[24px] h-6 text-xs rounded-full flex items-center justify-center p-0 bg-red-500 text-white border-2 border-white font-bold"
                      >
                        {itemCount}
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Add Animation when item is added */}
                <AnimatePresence>
                  {itemCount > lastItemCount && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0, y: 0 }}
                      animate={{ 
                        scale: [0, 1.5, 0], 
                        opacity: [0, 1, 0],
                        y: [0, -30, -50]
                      }}
                      transition={{ duration: 0.8 }}
                      className="absolute -top-2 -right-2 pointer-events-none"
                    >
                      <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                        <Plus className="w-3 h-3 text-white" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Text Content */}
              <div className="flex flex-col items-start">
                <motion.span 
                  className="text-xs opacity-90 font-medium"
                  animate={itemCountChanged ? { y: [-2, 2, 0] } : {}}
                >
                  Ver carrinho
                </motion.span>
                <motion.span 
                  key={formattedTotal}
                  initial={itemCountChanged ? { scale: 0.8, opacity: 0 } : {}}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-sm font-bold"
                >
                  {formattedTotal}
                </motion.span>
              </div>

              {/* Arrow Icon */}
              <motion.div
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="ml-1"
              >
                <ArrowUp className="w-4 h-4 opacity-75" />
              </motion.div>
            </Button>

            {/* Ripple Effect Background */}
            <AnimatePresence>
              {itemCount > lastItemCount && (
                <motion.div
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 3, opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="absolute inset-0 bg-green-600 rounded-full -z-10"
                />
              )}
            </AnimatePresence>

            {/* Glow Effect */}
            <motion.div
              animate={{ 
                opacity: [0.5, 0.8, 0.5],
                scale: [1, 1.02, 1]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 rounded-full blur-lg -z-20 opacity-50"
            />
          </motion.div>

          {/* Floating particles effect when items are added */}
          <AnimatePresence>
            {itemCount > lastItemCount && (
              <>
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={`particle-${i}`}
                    initial={{ 
                      scale: 0, 
                      opacity: 1, 
                      x: 0, 
                      y: 0,
                      rotate: 0
                    }}
                    animate={{ 
                      scale: [0, 1, 0], 
                      opacity: [1, 1, 0],
                      x: (i - 1) * 30,
                      y: -40 - (i * 10),
                      rotate: 360
                    }}
                    transition={{ 
                      duration: 1.2, 
                      delay: i * 0.1,
                      ease: "easeOut"
                    }}
                    className="absolute top-4 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-400 rounded-full pointer-events-none"
                  />
                ))}
              </>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 