import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Search, Filter, X, Truck, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Fuse from 'fuse.js';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SmartFiltersModal } from './SmartFiltersModal';
import { PlateSearchModal } from './PlateSearchModal';
import { SortModal } from './SortModal';
import { GalleryFilters } from '@/types/gallery';

interface IntelligentSearchProps {
  filters: GalleryFilters;
  onFiltersChange: (filters: Partial<GalleryFilters>) => void;
  onClearFilters: () => void;
  isFiltersActive: boolean;
  photos: any[];
}

export function IntelligentSearch({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  isFiltersActive,
  photos
}: IntelligentSearchProps) {
  const [searchInput, setSearchInput] = useState(filters.searchQuery);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [isPlateSearchOpen, setIsPlateSearchOpen] = useState(false);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fuse.js setup for intelligent search
  const fuse = useMemo(() => {
    const options = {
      keys: [
        { name: 'title', weight: 0.3 },
        { name: 'description', weight: 0.2 },
        { name: 'vehiclePlate', weight: 0.4 },
        { name: 'tags', weight: 0.1 }
      ],
      threshold: 0.3,
      includeScore: true
    };
    return new Fuse(photos, options);
  }, [photos]);

  // Generate smart suggestions
  useEffect(() => {
    if (searchInput.length > 1) {
      const results = fuse.search(searchInput);
      const suggestions = results
        .slice(0, 5)
        .map(result => result.item.title || result.item.vehiclePlate || result.item.description)
        .filter(Boolean);
      setSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchInput, fuse]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ searchQuery: searchInput });
    }, 150);

    return () => clearTimeout(timer);
  }, [searchInput, onFiltersChange]);

  const handleClearAll = useCallback(() => {
    setSearchInput('');
    onClearFilters();
    setShowSuggestions(false);
  }, [onClearFilters]);

  const handlePlateSearch = useCallback((plate: string) => {
    onFiltersChange({ vehiclePlate: plate });
  }, [onFiltersChange]);

  const handleSortChange = useCallback((sortBy: string) => {
    onFiltersChange({ sortBy: sortBy as any });
  }, [onFiltersChange]);

  const activeFiltersCount = [
    filters.category.length > 0,
    filters.dateRange.start || filters.dateRange.end,
    filters.timeOfDay !== 'all',
    filters.sortBy !== 'newest',
    filters.vehiclePlate,
    filters.searchQuery
  ].filter(Boolean).length;

  return (
    <div className="bg-background/95 backdrop-blur-sm border-b border-border/50 sticky top-16 z-40">
      <div className="p-4 space-y-3">
        {/* Main Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Buscar fotos, descrições, tags..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 pr-12 bg-background border-border/50 focus:border-trucker-blue transition-colors h-12"
          />
          {searchInput && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0"
              onClick={() => setSearchInput('')}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Suggestions */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-background border border-border/50 rounded-lg shadow-lg overflow-hidden"
            >
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={suggestion}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="w-full text-left px-4 py-2 hover:bg-muted transition-colors text-sm"
                  onClick={() => {
                    setSearchInput(suggestion);
                    setShowSuggestions(false);
                  }}
                >
                  {suggestion}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions Row */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {/* Vehicle Plate Search Button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsPlateSearchOpen(true)}
            className={`flex items-center gap-2 h-10 min-w-fit ${
              filters.vehiclePlate 
                ? 'bg-trucker-blue text-trucker-blue-foreground border-trucker-blue' 
                : ''
            }`}
          >
            <Truck className="w-4 h-4" />
            <span className="text-sm">
              {filters.vehiclePlate ? `Placa: ${filters.vehiclePlate}` : 'Buscar Placa'}
            </span>
            {filters.vehiclePlate && (
              <X 
                className="w-3 h-3 ml-1 cursor-pointer hover:text-destructive" 
                onClick={(e) => {
                  e.stopPropagation();
                  onFiltersChange({ vehiclePlate: '' });
                }}
              />
            )}
          </Button>

          {/* Smart Filters Button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsFiltersModalOpen(true)}
            className={`flex items-center gap-2 h-10 min-w-fit ${
              activeFiltersCount > 0 
                ? 'bg-trucker-blue text-trucker-blue-foreground border-trucker-blue' 
                : ''
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-sm">Filtros</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 min-w-5">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {/* Sort Button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsSortModalOpen(true)}
            className="flex items-center gap-2 h-10 min-w-fit"
          >
            <ArrowUpDown className="w-4 h-4" />
            <span className="text-sm">
              {filters.sortBy === 'newest' ? 'Recentes' :
               filters.sortBy === 'oldest' ? 'Antigas' :
               filters.sortBy === 'most-viewed' ? 'Visualizadas' :
               filters.sortBy === 'most-liked' ? 'Curtidas' : 'Ordenar'}
            </span>
          </Button>
        </div>

        {/* Active Filters Display */}
        <AnimatePresence>
          {isFiltersActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-1 pt-2"
            >
              {filters.category.map(category => (
                <Badge
                  key={category}
                  variant="secondary"
                  className="text-xs flex items-center gap-1"
                >
                  <Truck className="w-3 h-3" />
                  {category}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-3 h-3 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => {
                      const newCategories = filters.category.filter(c => c !== category);
                      onFiltersChange({ category: newCategories });
                    }}
                  >
                    <X className="w-2 h-2" />
                  </Button>
                </Badge>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Smart Filters Modal */}
      <SmartFiltersModal
        isOpen={isFiltersModalOpen}
        onClose={() => setIsFiltersModalOpen(false)}
        filters={filters}
        onFiltersChange={onFiltersChange}
        onClearFilters={onClearFilters}
        photos={photos}
      />

      {/* Plate Search Modal */}
      <PlateSearchModal
        isOpen={isPlateSearchOpen}
        onClose={() => setIsPlateSearchOpen(false)}
        onSearch={handlePlateSearch}
        currentPlate={filters.vehiclePlate}
      />

      {/* Sort Modal */}
      <SortModal
        isOpen={isSortModalOpen}
        onClose={() => setIsSortModalOpen(false)}
        currentSort={filters.sortBy}
        onSortChange={handleSortChange}
      />
    </div>
  );
}