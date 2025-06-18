import React, { useState, useCallback, useEffect } from 'react';
import { Search, X, Truck, History, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface PlateSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (plate: string) => void;
  currentPlate: string;
}

const plateRegex = /^[A-Z]{3}-?\d{4}$/i;

export function PlateSearchModal({ 
  isOpen, 
  onClose, 
  onSearch, 
  currentPlate 
}: PlateSearchModalProps) {
  const [plate, setPlate] = useState(currentPlate);
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>('plate-searches', []);
  const [isValidPlate, setIsValidPlate] = useState(false);

  useEffect(() => {
    setPlate(currentPlate);
  }, [currentPlate]);

  useEffect(() => {
    const cleanPlate = plate.replace(/[^A-Z0-9]/gi, '');
    setIsValidPlate(plateRegex.test(cleanPlate));
  }, [plate]);

  const formatPlate = useCallback((value: string) => {
    const clean = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (clean.length <= 3) return clean;
    return `${clean.slice(0, 3)}-${clean.slice(3, 7)}`;
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPlate(e.target.value);
    setPlate(formatted);
  }, [formatPlate]);

  const handleSearch = useCallback(() => {
    if (!isValidPlate || !plate) return;

    const cleanPlate = plate.replace('-', '');
    
    // Add to recent searches
    const newRecentSearches = [cleanPlate, ...recentSearches.filter(p => p !== cleanPlate)].slice(0, 5);
    setRecentSearches(newRecentSearches);
    
    onSearch(cleanPlate);
    onClose();
  }, [isValidPlate, plate, recentSearches, setRecentSearches, onSearch, onClose]);

  const handleRecentSearch = useCallback((recentPlate: string) => {
    onSearch(recentPlate);
    onClose();
  }, [onSearch, onClose]);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, [setRecentSearches]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValidPlate) {
      handleSearch();
    }
  }, [isValidPlate, handleSearch]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-md w-full mx-4 p-0 overflow-hidden"
        aria-describedby="plate-search-description"
      >
        <div className="bg-background">
          {/* Header */}
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Truck className="w-5 h-5 text-trucker-blue" />
                Buscar por Placa
              </DialogTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="w-8 h-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="px-6 pb-6 space-y-6">
            {/* Description for accessibility */}
            <div id="plate-search-description" className="sr-only">
              Digite a placa do veículo para buscar fotos específicas. O formato deve ser ABC-1234.
            </div>

            {/* Plate Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Digite a placa do veículo
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="ABC-1234"
                  value={plate}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className={`text-center text-lg font-mono tracking-wider uppercase h-12 ${
                    plate && !isValidPlate 
                      ? 'border-destructive focus:border-destructive' 
                      : plate && isValidPlate 
                        ? 'border-success focus:border-success' 
                        : ''
                  }`}
                  maxLength={8}
                  autoFocus
                />
                {plate && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {isValidPlate ? (
                      <div className="w-2 h-2 bg-success rounded-full" />
                    ) : (
                      <div className="w-2 h-2 bg-destructive rounded-full" />
                    )}
                  </motion.div>
                )}
              </div>
              {plate && !isValidPlate && (
                <p className="text-xs text-destructive">
                  Formato inválido. Use: ABC-1234
                </p>
              )}
            </div>

            {/* Action Button */}
            <Button
              onClick={handleSearch}
              disabled={!isValidPlate}
              className="w-full h-12 text-base font-semibold bg-trucker-blue hover:bg-trucker-blue/90"
            >
              <Search className="w-4 h-4 mr-2" />
              Buscar Fotos
            </Button>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Buscas Recentes
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRecentSearches}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Limpar
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {recentSearches.map((recentPlate, index) => (
                      <motion.div
                        key={recentPlate}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-muted transition-colors font-mono tracking-wide"
                          onClick={() => handleRecentSearch(recentPlate)}
                        >
                          {recentPlate.slice(0, 3)}-{recentPlate.slice(3)}
                        </Badge>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Help Text */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Digite apenas letras e números</p>
              <p>• Formato: 3 letras + 4 números (ABC-1234)</p>
              <p>• A formatação será aplicada automaticamente</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}