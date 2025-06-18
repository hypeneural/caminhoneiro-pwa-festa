import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AudioVisualizerProps {
  isPlaying: boolean;
  isBuffering: boolean;
}

export const AudioVisualizer = ({ isPlaying, isBuffering }: AudioVisualizerProps) => {
  const bars = Array.from({ length: 16 }, (_, i) => i);
  
  return (
    <div className="relative w-full h-32 flex items-center justify-center">
      {/* Círculo pulsante de fundo */}
      <motion.div
        className="absolute w-32 h-32 bg-trucker-red/5 rounded-full"
        animate={{
          scale: isPlaying && !isBuffering ? [1, 1.2, 1] : 1,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Círculo médio */}
      <motion.div
        className="absolute w-24 h-24 bg-trucker-red/10 rounded-full"
        animate={{
          scale: isPlaying && !isBuffering ? [1, 1.1, 1] : 1,
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2,
        }}
      />

      {/* Barras de visualização */}
      <div className="relative flex items-center justify-center gap-1">
        {bars.map((i) => (
          <motion.div
            key={i}
            className={cn(
              "w-1 bg-trucker-red",
              i % 2 === 0 ? "h-8" : "h-6"
            )}
            animate={
              isPlaying && !isBuffering
                ? {
                    height: [
                      `${Math.random() * 16 + 16}px`,
                      `${Math.random() * 24 + 24}px`,
                      `${Math.random() * 16 + 16}px`,
                    ],
                  }
                : {}
            }
            transition={{
              duration: 0.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.05,
            }}
          />
        ))}
      </div>

      {/* Círculo central com ícone */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="w-16 h-16 bg-trucker-red/20 rounded-full flex items-center justify-center"
          animate={{
            scale: isBuffering ? [0.95, 1.05, 0.95] : 1,
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {isBuffering ? (
            <motion.div
              className="w-8 h-8 border-4 border-trucker-red border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ) : (
            <motion.div
              className="w-8 h-8 bg-trucker-red/30 rounded-full"
              animate={{
                scale: isPlaying ? [1, 1.1, 1] : 1,
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </motion.div>
      </div>

      {/* Partículas flutuantes */}
      {isPlaying && !isBuffering && (
        <>
          {Array.from({ length: 8 }, (_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-1 h-1 bg-trucker-red/30 rounded-full"
              initial={{
                x: 0,
                y: 0,
                opacity: 0,
                scale: 0,
              }}
              animate={{
                x: [
                  0,
                  (Math.random() - 0.5) * 100,
                  (Math.random() - 0.5) * 150,
                ],
                y: [0, -50 - Math.random() * 50],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 2 + Math.random(),
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeOut",
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}; 