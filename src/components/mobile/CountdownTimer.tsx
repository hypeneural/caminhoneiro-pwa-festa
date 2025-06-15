import { Clock, Zap, Sparkles } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

interface TimeUnit {
  value: number;
  label: string;
  prevValue?: number;
}

// Componente para flip cards mais realistas
const FlipCard = ({ value, label, index }: { value: number; label: string; index: number }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setIsFlipping(true);
      setTimeout(() => {
        setDisplayValue(value);
        setIsFlipping(false);
      }, 300);
    }
  }, [value, displayValue]);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.5, type: "spring" }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="relative"
    >
      {/* Card Container */}
      <div className="relative bg-gradient-to-b from-trucker-blue to-trucker-blue/90 rounded-xl p-3 shadow-lg border border-trucker-blue/20 overflow-hidden">
        {/* Shine Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
        />

        {/* Top Half - Current */}
        <div className="relative overflow-hidden">
          <motion.div
            className="text-center"
            animate={isFlipping ? { rotateX: -90 } : { rotateX: 0 }}
            transition={{ duration: 0.3 }}
            style={{ 
              transformOrigin: 'bottom',
              transformStyle: 'preserve-3d'
            }}
          >
            <div className="text-2xl font-black text-white drop-shadow-sm">
              {displayValue.toString().padStart(2, '0')}
            </div>
          </motion.div>
        </div>

        {/* Divider Line */}
        <div className="absolute left-2 right-2 top-1/2 h-px bg-trucker-blue/30 transform -translate-y-1/2" />

        {/* Bottom Half - Next */}
        <AnimatePresence>
          {isFlipping && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ rotateX: 90 }}
              animate={{ rotateX: 0 }}
              exit={{ rotateX: -90 }}
              transition={{ duration: 0.3 }}
              style={{ 
                transformOrigin: 'top',
                transformStyle: 'preserve-3d'
              }}
            >
              <div className="text-2xl font-black text-white drop-shadow-sm">
                {value.toString().padStart(2, '0')}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Label */}
        <div className="text-xs text-white/90 font-bold mt-2 text-center tracking-wide">
          {label.toUpperCase()}
        </div>

        {/* Decorative Elements */}
        {index === 0 && (
          <motion.div
            className="absolute -top-1 -right-1"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-4 h-4 text-trucker-yellow drop-shadow-sm" />
          </motion.div>
        )}
      </div>

      {/* Reflection Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent rounded-xl pointer-events-none"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
  );
};

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeUnit[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const targetDate = new Date('2025-07-19T08:00:00').getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft([
          { value: days, label: 'Dias' },
          { value: hours, label: 'Horas' },
          { value: minutes, label: 'Min' },
          { value: seconds, label: 'Seg' }
        ]);
      } else {
        setTimeLeft([
          { value: 0, label: 'Dias' },
          { value: 0, label: 'Horas' },
          { value: 0, label: 'Min' },
          { value: 0, label: 'Seg' }
        ]);
      }
    };

    updateCountdown();
    setIsLoaded(true);
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isLoaded) {
    return (
      <div className="px-4 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 bg-trucker-blue rounded-lg flex items-center justify-center animate-pulse">
            <Clock className="w-4 h-4 text-trucker-blue-foreground" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Carregando...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 mb-6">
      {/* Enhanced Header */}
      <motion.div 
        className="flex items-center gap-3 mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div 
          className="w-6 h-6 bg-gradient-to-br from-trucker-yellow to-trucker-orange rounded-lg flex items-center justify-center shadow-md"
          animate={{ 
            boxShadow: [
              "0 0 0 0 rgba(251, 191, 36, 0.3)",
              "0 0 0 8px rgba(251, 191, 36, 0)",
              "0 0 0 0 rgba(251, 191, 36, 0)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Clock className="w-4 h-4 text-white" />
        </motion.div>
        
        <div>
          <h2 className="text-lg font-bold text-foreground">Festa começa em</h2>
          <motion.div 
            className="flex items-center gap-1"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Zap className="w-3 h-3 text-trucker-red" />
            <span className="text-xs text-trucker-red font-semibold">AO VIVO</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Interactive Background */}
      <motion.div
        className="relative p-4 rounded-2xl overflow-hidden mb-4"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.05) 0%, rgba(220, 38, 38, 0.05) 100%)'
        }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {/* Animated Background Particles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-trucker-yellow/30 rounded-full"
            animate={{
              x: [Math.random() * 300, Math.random() * 300],
              y: [Math.random() * 100, Math.random() * 100],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        {/* Countdown Grid */}
        <div className="grid grid-cols-4 gap-3 relative z-10">
          {timeLeft.map((unit, index) => (
            <FlipCard
              key={unit.label}
              value={unit.value}
              label={unit.label}
              index={index}
            />
          ))}
        </div>

        {/* Progress Indicator */}
        <motion.div
          className="mt-4 h-1 bg-gradient-to-r from-trucker-blue via-trucker-red to-trucker-yellow rounded-full overflow-hidden"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-white/30 to-white/60"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <motion.p 
          className="text-sm text-muted-foreground mb-2"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="font-semibold text-trucker-blue">São Cristóvão 2025</span> • Tijucas/SC
        </motion.p>
        
        <motion.div
          className="flex items-center justify-center gap-2 text-xs text-trucker-green font-medium"
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="w-2 h-2 bg-trucker-green rounded-full animate-pulse" />
          Preparativos em andamento
        </motion.div>
      </motion.div>
    </div>
  );
}