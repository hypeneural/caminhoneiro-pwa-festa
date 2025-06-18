import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedBackgroundProps {
  isPlaying: boolean;
  className?: string;
}

export const AnimatedBackground = ({ isPlaying, className }: AnimatedBackgroundProps) => {
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {/* Gradiente principal */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-trucker-red/5 to-trucker-orange/5"
        animate={{
          opacity: isPlaying ? [0.5, 0.8, 0.5] : 0.5,
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Círculos flutuantes */}
      {isPlaying && (
        <>
          <motion.div
            className="absolute w-64 h-64 rounded-full bg-trucker-red/5"
            initial={{ x: "-50%", y: "-50%" }}
            animate={{
              x: ["-50%", "0%", "-50%"],
              y: ["-50%", "0%", "-50%"],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute w-48 h-48 rounded-full bg-trucker-orange/5"
            initial={{ x: "150%", y: "150%" }}
            animate={{
              x: ["150%", "100%", "150%"],
              y: ["150%", "100%", "150%"],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </>
      )}

      {/* Ondas de áudio estilizadas */}
      {isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          {Array.from({ length: 3 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute w-full h-full border-2 border-trucker-red/5 rounded-full"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: [0.8, 1.2, 0.8],
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: i * 1.3,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Overlay de blur */}
      <div className="absolute inset-0 backdrop-blur-[100px]" />
    </div>
  );
}; 