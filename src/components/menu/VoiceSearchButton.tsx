import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';
import { cn } from '@/lib/utils';

interface VoiceSearchButtonProps {
  onTranscript: (transcript: string) => void;
  className?: string;
}

export function VoiceSearchButton({ onTranscript, className }: VoiceSearchButtonProps) {
  const {
    isListening,
    isSupported,
    transcript,
    confidence,
    error,
    toggleListening,
    clearError
  } = useVoiceSearch(onTranscript);

  const [showTranscript, setShowTranscript] = useState(false);

  if (!isSupported) {
    return null;
  }

  const handleClick = () => {
    if (error) {
      clearError();
    }
    toggleListening();
    
    if (!isListening) {
      setShowTranscript(true);
      setTimeout(() => setShowTranscript(false), 5000);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className={cn(
          "relative transition-all duration-200",
          isListening && "text-red-500 hover:text-red-600",
          error && "text-red-500",
          className
        )}
        aria-label={isListening ? "Parar gravação" : "Iniciar busca por voz"}
      >
        <AnimatePresence mode="wait">
          {isListening ? (
            <motion.div
              key="listening"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <MicOff className="h-4 w-4" />
              
              {/* Pulsing animation while listening */}
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 rounded-full bg-red-500 opacity-20"
              />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Mic className="h-4 w-4" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Listening indicator */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ 
                  duration: 1, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-full h-full bg-red-500 rounded-full"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>

      {/* Transcript/Error Display */}
      <AnimatePresence>
        {(showTranscript && transcript) || error ? (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 z-50"
          >
            <div className={cn(
              "min-w-[200px] max-w-[300px] p-3 rounded-lg shadow-lg border",
              error 
                ? "bg-red-50 border-red-200 text-red-700" 
                : "bg-background border-border"
            )}>
              {error ? (
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 text-red-500 mt-0.5 shrink-0">
                    <MicOff className="w-full h-full" />
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1">Erro na busca por voz</p>
                    <p className="text-xs">{error}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 text-green-600 mt-0.5 shrink-0">
                    <Volume2 className="w-full h-full" />
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1 text-muted-foreground">
                      {isListening ? 'Ouvindo...' : 'Transcrito'}
                    </p>
                    <p className="text-sm">{transcript}</p>
                    {confidence > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center gap-1">
                          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${confidence * 100}%` }}
                              className={cn(
                                "h-full rounded-full",
                                confidence > 0.8 
                                  ? "bg-green-500" 
                                  : confidence > 0.6 
                                    ? "bg-yellow-500" 
                                    : "bg-red-500"
                              )}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Listening wave animation */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <div className="flex items-end gap-1">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: [4, 12, 4],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut"
                  }}
                  className="w-1 bg-red-500 rounded-full"
                  style={{ height: 4 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 