import React, { useState, useRef, useEffect } from "react";
import { Search, Mic, MicOff, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";

interface FAQSearchProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
}

export function FAQSearch({
  value,
  onChange,
  onClear,
  placeholder = "Buscar dúvidas...",
  className
}: FAQSearchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
    error
  } = useVoiceSearch({
    onResult: (text) => {
      onChange(text);
    },
    continuous: false,
    language: 'pt-BR'
  });

  // Update input when transcript changes
  useEffect(() => {
    if (transcript && transcript !== value) {
      onChange(transcript);
    }
  }, [transcript, onChange, value]);

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleClear = () => {
    onChange('');
    onClear();
    inputRef.current?.focus();
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <div className={cn(
          "relative flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-300",
          isFocused
            ? "border-trucker-blue shadow-lg bg-card" 
            : "border-border bg-muted/50",
          isListening && "border-red-500 bg-red-50 dark:bg-red-950/20"
        )}>
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
          />

          <div className="flex items-center gap-1 flex-shrink-0">
            {value && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-6 w-6 p-0 hover:bg-muted"
                  aria-label="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {isSupported && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleVoiceToggle}
                className={cn(
                  "h-8 w-8 p-0 transition-colors",
                  isListening 
                    ? "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" 
                    : "text-muted-foreground hover:text-trucker-blue hover:bg-trucker-blue/10"
                )}
                aria-label={isListening ? "Parar gravação" : "Buscar por voz"}
              >
                <motion.div
                  animate={isListening ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={{ 
                    repeat: isListening ? Infinity : 0, 
                    duration: 1.5,
                    ease: "easeInOut"
                  }}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </motion.div>
              </Button>
            )}
          </div>
        </div>

        {/* Voice search feedback */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-2 h-2 bg-red-500 rounded-full"
                />
                <span className="text-sm text-red-700 dark:text-red-300">
                  Ouvindo... Fale sua pergunta
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error feedback */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
            >
              <span className="text-sm text-destructive">
                {error}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search suggestions could go here */}
      {isFocused && !value && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-muted-foreground px-1"
        >
          💡 Dica: Use o microfone para buscar por voz
        </motion.div>
      )}
    </div>
  );
}