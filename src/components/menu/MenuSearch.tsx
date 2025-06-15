import { useState } from "react";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";

interface MenuSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function MenuSearch({ searchTerm, onSearchChange }: MenuSearchProps) {
  const [isFocused, setIsFocused] = useState(false);

  const clearSearch = () => {
    onSearchChange('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <div className={`relative transition-all duration-200 ${
        isFocused ? 'ring-2 ring-trucker-blue ring-offset-2' : ''
      } rounded-full`}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        
        <Input
          type="text"
          placeholder="Buscar pratos, bebidas, ingredientes..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="pl-12 pr-12 h-12 rounded-full border-2 bg-background text-base placeholder:text-muted-foreground focus:border-trucker-blue focus:ring-0"
        />

        <AnimatePresence>
          {searchTerm && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Sugestões de busca popular */}
      {isFocused && !searchTerm && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-2xl shadow-xl z-50 p-4"
        >
          <h4 className="text-sm font-medium text-foreground mb-3">Buscas populares</h4>
          <div className="flex flex-wrap gap-2">
            {['Costela', 'Frango', 'Feijão tropeiro', 'Cerveja', 'Pudim', 'Linguiça'].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onSearchChange(suggestion)}
                className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}