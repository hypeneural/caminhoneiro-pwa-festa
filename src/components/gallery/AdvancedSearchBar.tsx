import React, { useState, useCallback, useEffect } from 'react';
import { Search, Filter, X, Calendar, MapPin, Truck, Tag, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { GalleryFilters } from '@/types/gallery';

interface AdvancedSearchBarProps {
  filters: GalleryFilters;
  onFiltersChange: (filters: Partial<GalleryFilters>) => void;
  onClearFilters: () => void;
  isFiltersActive: boolean;
  photos: any[];
}

const timeOfDayOptions = [
  { value: 'all', label: 'Qualquer Horário' },
  { value: 'morning', label: 'Manhã (6h-12h)' },
  { value: 'afternoon', label: 'Tarde (12h-18h)' },
  { value: 'evening', label: 'Noite (18h-6h)' }
];

const sortOptions = [
  { value: 'newest', label: 'Mais Recentes' },
  { value: 'oldest', label: 'Mais Antigas' },
  { value: 'mostViewed', label: 'Mais Visualizadas' },
  { value: 'mostLiked', label: 'Mais Curtidas' }
];

const vehicleTypes = [
  'Caminhão',
  'Carreta',
  'Bitrem',
  'Rodotrem',
  'Truck',
  'VUC'
];

export function AdvancedSearchBar({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  isFiltersActive,
  photos
}: AdvancedSearchBarProps) {
  const [searchInput, setSearchInput] = useState(filters.vehiclePlate);
  const [generalSearch, setGeneralSearch] = useState(filters.searchQuery);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Debounced search for vehicle plate
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ vehiclePlate: searchInput });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, onFiltersChange]);

  // Debounced search for general search
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ searchQuery: generalSearch });
    }, 300);

    return () => clearTimeout(timer);
  }, [generalSearch, onFiltersChange]);

  const handleClearAll = useCallback(() => {
    setSearchInput('');
    setGeneralSearch('');
    onClearFilters();
  }, [onClearFilters]);

  const handleDateRangeChange = useCallback((range: { start?: Date; end?: Date }) => {
    onFiltersChange({ 
      dateRange: range
    });
  }, [onFiltersChange]);

  const handleTimeOfDayChange = useCallback((value: string) => {
    onFiltersChange({ 
      timeOfDay: value as 'morning' | 'afternoon' | 'evening' | 'all'
    });
  }, [onFiltersChange]);

  const handleSortChange = useCallback((value: string) => {
    onFiltersChange({ 
      sortBy: value as 'newest' | 'oldest' | 'mostViewed' | 'mostLiked'
    });
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
            value={generalSearch}
            onChange={(e) => setGeneralSearch(e.target.value)}
            className="pl-10 pr-12 bg-background border-border/50 focus:border-trucker-blue transition-colors"
          />
          {generalSearch && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0"
              onClick={() => setGeneralSearch('')}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Quick Filters Row */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
          {/* Vehicle Plate Search */}
          <div className="relative flex-shrink-0">
            <Truck className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3" />
            <Input
              type="text"
              placeholder="Placa"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-7 pr-3 py-1.5 h-8 text-sm bg-background border-border/50 focus:border-trucker-blue transition-colors w-24"
            />
          </div>

          {/* Advanced Filters Button */}
          <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className={`flex items-center gap-2 h-8 ${
                  activeFiltersCount > 0 
                    ? 'bg-trucker-blue text-trucker-blue-foreground border-trucker-blue' 
                    : ''
                }`}
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span className="text-sm">Filtros</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="text-xs px-1 py-0 h-4 min-w-4">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader className="pb-4">
                <SheetTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros Avançados
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                {/* Date Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Período
                  </label>
                  <DateRangePicker
                    value={{
                      start: filters.dateRange.start,
                      end: filters.dateRange.end
                    }}
                    onChange={handleDateRangeChange}
                  />
                </div>

                {/* Time of Day */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Horário do Dia</label>
                  <Select value={filters.timeOfDay} onValueChange={handleTimeOfDayChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOfDayOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ordenar Por</label>
                  <Select value={filters.sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Vehicle Types */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Tipos de Veículo
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {vehicleTypes.map(type => {
                      const isSelected = filters.category.includes(type.toLowerCase());
                      return (
                        <Button
                          key={type}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className={`text-xs ${
                            isSelected 
                              ? 'bg-trucker-blue text-trucker-blue-foreground' 
                              : ''
                          }`}
                          onClick={() => {
                            const currentCategories = [...filters.category];
                            const typeValue = type.toLowerCase();
                            const index = currentCategories.indexOf(typeValue);
                            
                            if (index > -1) {
                              currentCategories.splice(index, 1);
                            } else {
                              currentCategories.push(typeValue);
                            }
                            
                            onFiltersChange({ category: currentCategories });
                          }}
                        >
                          {type}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-border/50">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleClearAll}
                  disabled={!isFiltersActive}
                >
                  Limpar Filtros
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setIsFilterSheetOpen(false)}
                >
                  Aplicar Filtros
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Quick Sort */}
          <Select value={filters.sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-auto h-8 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              
              {(filters.dateRange.start || filters.dateRange.end) && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Período
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-3 h-3 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => onFiltersChange({ dateRange: {} })}
                  >
                    <X className="w-2 h-2" />
                  </Button>
                </Badge>
              )}
              
              {filters.timeOfDay !== 'all' && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  Horário
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-3 h-3 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => onFiltersChange({ timeOfDay: 'all' })}
                  >
                    <X className="w-2 h-2" />
                  </Button>
                </Badge>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
