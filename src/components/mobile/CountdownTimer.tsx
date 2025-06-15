import { Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface TimeUnit {
  value: number;
  label: string;
}

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeUnit[]>([]);

  useEffect(() => {
    const targetDate = new Date('2025-07-19T00:00:00').getTime();

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
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="px-4 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-6 bg-trucker-blue rounded-lg flex items-center justify-center">
          <Clock className="w-4 h-4 text-trucker-blue-foreground" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Faltam para a festa</h2>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {timeLeft.map((unit, index) => (
          <motion.div
            key={unit.label}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            whileHover={{ scale: 1.05 }}
            className="bg-trucker-blue rounded-lg p-2 text-center"
          >
            <motion.div
              key={unit.value}
              initial={{ rotateX: 90 }}
              animate={{ rotateX: 0 }}
              transition={{ duration: 0.3 }}
              className="text-lg font-bold text-trucker-blue-foreground"
            >
              {unit.value.toString().padStart(2, '0')}
            </motion.div>
            <div className="text-xs text-trucker-blue-foreground/80 font-medium">
              {unit.label}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}