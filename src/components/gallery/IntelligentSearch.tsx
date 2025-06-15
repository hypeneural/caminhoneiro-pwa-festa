import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Filter, Truck, Calendar, MapPin, Camera, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TouchFeedback } from '@/components/ui/touch-feedback';
import Fuse from 'fuse.js';
import { Photo, GalleryFilters } from '@/types/gallery';
import { useIsMobile } from '@/hooks/use-mobile';

interface IntelligentSearchProps {
  photos: Photo[];
  filters: GalleryFilters;
  onFiltersChange: (filters: Partial<GalleryFilters>) => void;
  onClearFilters: () => void;
  isFiltersActive: boolean;
}

interface SearchSuggestion {
  type: 'plate' | 'category' | 'photographer' | 'tag' | 'location';
  value: string;
  count: number;
  icon: React.ComponentType<any>;
}

const QUICK_FILTERS = [
  { label: 'Hoje', value: 'today', icon: Calendar },
  { label: 'Caminhões', value: 'caminhoes', icon: Truck },
  { label: 'Carretas', value: 'carretas', icon: Truck },
  { label: 'Família', value: 'familia', icon: Camera },
  { label: 'Shows', value: 'shows', icon: Zap },
];

export function IntelligentSearch({
  photos,
  filters,
  onFiltersChange,
  onClearFilters,
  isFiltersActive
}: IntelligentSearchProps) {
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery || '');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const isMobile = useIsMobile();

  // Fuse.js setup for intelligent search
  const fuse = useMemo(() => {
    const options = {
      keys: [
        { name: 'title', weight: 0.3 },
        { name: 'description', weight: 0.2 },
        { name: 'vehiclePlate', weight: 0.4 },
        { name: 'tags', weight: 0.1 },
        { name: 'photographer', weight: 0.1 },
        { name: 'category', weight: 0.2 }
      ],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true
    };
    return new Fuse(photos, options);
  }, [photos]);

  // Generate intelligent suggestions
  const generateSuggestions = useCallback((query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const suggestions: SearchSuggestion[] = [];
    
    // Vehicle plates suggestions
    const plateMatches = photos
      .filter(photo => photo.vehiclePlate?.toLowerCase().includes(query.toLowerCase()))
      .map(photo => photo.vehiclePlate!)
      .filter((plate, index, self) => self.indexOf(plate) === index)
      .slice(0, 3);
      
    plateMatches.forEach(plate => {
      suggestions.push({
        type: 'plate',
        value: plate,
        count: photos.filter(p => p.vehiclePlate === plate).length,
        icon: Truck
      });
    });

    // Category suggestions
    const categoryMatches = photos
      .filter(photo => photo.category.toLowerCase().includes(query.toLowerCase()))
      .map(photo => photo.category)
      .filter((category, index, self) => self.indexOf(category) === index)
      .slice(0, 2);
      
    categoryMatches.forEach(category => {
      suggestions.push({
        type: 'category',
        value: category,
        count: photos.filter(p => p.category === category).length,
        icon: Camera
      });
    });

    // Photographer suggestions
    const photographerMatches = photos
      .filter(photo => photo.photographer?.toLowerCase().includes(query.toLowerCase()))
      .map(photo => photo.photographer!)
      .filter((photographer, index, self) => self.indexOf(photographer) === index)
      .slice(0, 2);
      
    photographerMatches.forEach(photographer => {
      suggestions.push({
        type: 'photographer',
        value: photographer,
        count: photos.filter(p => p.photographer === photographer).length,
        icon: Camera
      });
    });

    setSuggestions(suggestions.slice(0, 5));
  }, [photos]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== filters.searchQuery) {
        onFiltersChange({ searchQuery });
      }
      generateSuggestions(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, filters.searchQuery, onFiltersChange, generateSuggestions]);

  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    switch (suggestion.type) {
      case 'plate':
        onFiltersChange({ vehiclePlate: suggestion.value, searchQuery: '' });
        setSearchQuery('');
        break;
      case 'category':
        onFiltersChange({ 
          category: [...filters.category, suggestion.value], 
          searchQuery: '' 
        });
        setSearchQuery('');
        break;
      case 'photographer':
        onFiltersChange({ searchQuery: suggestion.value });
        setSearchQuery(suggestion.value);
        break;
    }
    setShowSuggestions(false);
    
    // Haptic feedback
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
  }, [filters.category, onFiltersChange, isMobile]);

  const handleQuickFilter = useCallback((filterValue: string) => {
    if (filterValue === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      onFiltersChange({
        dateRange: { start: today, end: tomorrow }
      });
    } else {
      onFiltersChange({
        category: [...filters.category, filterValue]
      });
    }
    
    // Haptic feedback
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(20);
    }
  }, [filters.category, onFiltersChange, isMobile]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    onFiltersChange({ searchQuery: '', vehiclePlate: '' });
    setSuggestions([]);
  }, [onFiltersChange]);

  return (
    <div className="relative">
      {/* Search Bar */}
      <motion.div
        className="relative"
        animate={{
          scale: isSearchFocused ? 1.02 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              setIsSearchFocused(true);
              setShowSuggestions(true);
            }}
            onBlur={() => {
              setIsSearchFocused(false);
              setTimeout(() => setShowSuggestions(false), 150);
            }}
            placeholder="Buscar por placa, categoria, fotógrafo..."
            className="pl-10 pr-20 h-12 bg-background/95 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all duration-200"
          />
          
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {(searchQuery || isFiltersActive) && (
              <TouchFeedback>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSearch}
                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </TouchFeedback>
            )}
            
            <TouchFeedback>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 transition-colors ${
                  isFiltersActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                }`}
              >
                <Filter className="w-4 h-4" />
              </Button>
            </TouchFeedback>
          </div>
        </div>
      </motion.div>

      {/* Search Suggestions */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 z-50 mt-2 bg-background/95 backdrop-blur-lg border border-border/50 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="p-2 space-y-1">
              {suggestions.map((suggestion, index) => {
                const Icon = suggestion.icon;
                return (
                  <TouchFeedback key={`${suggestion.type}-${suggestion.value}`}>
                    <motion.button
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                    >
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {suggestion.value}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {suggestion.count} foto{suggestion.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.type === 'plate' && 'Placa'}
                        {suggestion.type === 'category' && 'Categoria'}
                        {suggestion.type === 'photographer' && 'Fotógrafo'}
                        {suggestion.type === 'tag' && 'Tag'}
                        {suggestion.type === 'location' && 'Local'}
                      </Badge>
                    </motion.button>
                  </TouchFeedback>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Filters */}
      <motion.div 
        className="flex gap-2 mt-3 pb-1 overflow-x-auto scrollbar-hide"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {QUICK_FILTERS.map((filter, index) => {
          const Icon = filter.icon;
          const isActive = filter.value === 'today' 
            ? !!filters.dateRange.start
            : filters.category.includes(filter.value);
            
          return (
            <TouchFeedback key={filter.value}>
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleQuickFilter(filter.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{filter.label}</span>
              </motion.button>
            </TouchFeedback>
          );
        })}
      </motion.div>

      {/* Active Filters Display */}
      <AnimatePresence>
        {isFiltersActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex flex-wrap gap-2"
          >
            {filters.category.map((category) => (
              <Badge
                key={category}
                variant="secondary"
                className="flex items-center gap-1"
              >
                <span>{category}</span>
                <TouchFeedback>
                  <button
                    onClick={() => onFiltersChange({
                      category: filters.category.filter(c => c !== category)
                    })}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </TouchFeedback>
              </Badge>
            ))}
            
            {filters.vehiclePlate && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Truck className="w-3 h-3" />
                <span>{filters.vehiclePlate}</span>
                <TouchFeedback>
                  <button
                    onClick={() => onFiltersChange({ vehiclePlate: '' })}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </TouchFeedback>
              </Badge>
            )}
            
            {filters.dateRange.start && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Hoje</span>
                <TouchFeedback>
                  <button
                    onClick={() => onFiltersChange({ dateRange: {} })}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </TouchFeedback>
              </Badge>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}