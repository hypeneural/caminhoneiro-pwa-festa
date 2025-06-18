import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar, 
  Clock, 
  Truck, 
  Camera, 
  MapPin, 
  SortAsc, 
  Filter,
  Sparkles,
  TrendingUp,
  Heart,
  Eye
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TouchFeedback } from '@/components/ui/touch-feedback';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { GalleryFilters, Photo } from '@/types/gallery';
import { useIsMobile } from '@/hooks/use-mobile';

interface SmartFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: GalleryFilters;
  onFiltersChange: (filters: Partial<GalleryFilters>) => void;
  onClearFilters: () => void;
  photos: Photo[];
}

interface SmartSuggestion {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  action: () => void;
  count: number;
  trend: 'up' | 'down' | 'stable';
}

const CATEGORIES = [
  { value: 'caminhoes', label: 'Caminhões', icon: Truck },
  { value: 'carretas', label: 'Carretas', icon: Truck },
  { value: 'familia', label: 'Família', icon: Camera },
  { value: 'shows', label: 'Shows', icon: Camera },
  { value: 'religioso', label: 'Momentos Religiosos', icon: Camera },
  { value: 'geral', label: 'Geral', icon: Camera },
];

const TIME_PERIODS = [
  { value: 'morning', label: 'Manhã', description: '6h às 12h' },
  { value: 'afternoon', label: 'Tarde', description: '12h às 18h' },
  { value: 'evening', label: 'Noite', description: '18h às 6h' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mais Recentes', icon: Calendar },
  { value: 'oldest', label: 'Mais Antigas', icon: Calendar },
  { value: 'mostViewed', label: 'Mais Visualizadas', icon: Eye },
  { value: 'mostLiked', label: 'Mais Curtidas', icon: Heart },
];

export function SmartFiltersModal({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onClearFilters,
  photos
}: SmartFiltersModalProps) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'filters' | 'smart' | 'sort'>('filters');

  // Generate smart suggestions based on data analysis
  const smartSuggestions = useMemo((): SmartSuggestion[] => {
    const suggestions: SmartSuggestion[] = [];
    
    // Most popular category suggestion
    const categoryCounts = CATEGORIES.map(cat => ({
      ...cat,
      count: photos.filter(photo => photo.category === cat.value).length
    }));
    const topCategory = categoryCounts.reduce((prev, current) => 
      prev.count > current.count ? prev : current
    );
    
    if (topCategory.count > 0) {
      suggestions.push({
        id: 'top-category',
        label: `Fotos de ${topCategory.label}`,
        description: `${topCategory.count} fotos disponíveis`,
        icon: topCategory.icon,
        action: () => onFiltersChange({ category: [topCategory.value] }),
        count: topCategory.count,
        trend: 'up'
      });
    }

    // Recent photos suggestion
    const today = new Date();
    const recentPhotos = photos.filter(photo => {
      const diffTime = today.getTime() - photo.timestamp.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 1;
    });

    if (recentPhotos.length > 0) {
      suggestions.push({
        id: 'recent',
        label: 'Fotos de Hoje',
        description: `${recentPhotos.length} fotos capturadas hoje`,
        icon: Calendar,
        action: () => {
          const startOfDay = new Date(today);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(today);
          endOfDay.setHours(23, 59, 59, 999);
          onFiltersChange({ dateRange: { start: startOfDay, end: endOfDay } });
        },
        count: recentPhotos.length,
        trend: 'up'
      });
    }

    // Most liked photos suggestion
    const highLikedPhotos = photos.filter(photo => photo.likes > 10);
    if (highLikedPhotos.length > 0) {
      suggestions.push({
        id: 'popular',
        label: 'Fotos Populares',
        description: `${highLikedPhotos.length} fotos com muitas curtidas`,
        icon: Heart,
        action: () => onFiltersChange({ sortBy: 'mostLiked' }),
        count: highLikedPhotos.length,
        trend: 'up'
      });
    }

    // Vehicles with plates suggestion
    const vehiclePhotos = photos.filter(photo => photo.vehiclePlate);
    if (vehiclePhotos.length > 0) {
      suggestions.push({
        id: 'vehicles',
        label: 'Veículos Identificados',
        description: `${vehiclePhotos.length} fotos com placas`,
        icon: Truck,
        action: () => onFiltersChange({ category: ['caminhoes', 'carretas'] }),
        count: vehiclePhotos.length,
        trend: 'stable'
      });
    }

    return suggestions.slice(0, 4);
  }, [photos, onFiltersChange]);

  const handleCategoryToggle = useCallback((categoryValue: string) => {
    const newCategories = filters.category.includes(categoryValue)
      ? filters.category.filter(c => c !== categoryValue)
      : [...filters.category, categoryValue];
    
    onFiltersChange({ category: newCategories });
    
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
  }, [filters.category, onFiltersChange, isMobile]);

  const handleTimeOfDayChange = useCallback((timeOfDay: string) => {
    onFiltersChange({ 
      timeOfDay: timeOfDay as GalleryFilters['timeOfDay']
    });
    
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
  }, [onFiltersChange, isMobile]);

  const handleSortChange = useCallback((sortBy: string) => {
    onFiltersChange({ 
      sortBy: sortBy as GalleryFilters['sortBy']
    });
    
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
  }, [onFiltersChange, isMobile]);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingUp;
      case 'stable': return Sparkles;
    }
  };

  const activeFiltersCount = useMemo(() => {
    return filters.category.length + 
           (filters.vehiclePlate ? 1 : 0) +
           (filters.searchQuery ? 1 : 0) +
           (filters.dateRange.start ? 1 : 0) +
           (filters.timeOfDay !== 'all' ? 1 : 0) +
           (filters.sortBy !== 'newest' ? 1 : 0);
  }, [filters]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg mx-auto max-h-[85vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Filtros Inteligentes
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </DialogTitle>
            
            <div className="flex items-center gap-2">
              <TouchFeedback>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearFilters}
                  disabled={activeFiltersCount === 0}
                >
                  Limpar Tudo
                </Button>
              </TouchFeedback>
              
              <TouchFeedback>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </TouchFeedback>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="px-6 pb-3">
          <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
            {[
              { id: 'smart', label: 'Smart', icon: Sparkles },
              { id: 'filters', label: 'Filtros', icon: Filter },
              { id: 'sort', label: 'Ordem', icon: SortAsc },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <TouchFeedback key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                </TouchFeedback>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <AnimatePresence mode="wait">
            {/* Smart Suggestions Tab */}
            {activeTab === 'smart' && (
              <motion.div
                key="smart"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Sugestões Baseadas em IA
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Filtros inteligentes baseados no comportamento e dados da galeria
                  </p>
                </div>

                {smartSuggestions.map((suggestion, index) => {
                  const Icon = suggestion.icon;
                  const TrendIcon = getTrendIcon(suggestion.trend);
                  
                  return (
                    <TouchFeedback key={suggestion.id}>
                      <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={suggestion.action}
                        className="w-full flex items-center gap-4 p-4 bg-muted/30 hover:bg-muted/50 rounded-xl transition-colors text-left group"
                      >
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground">{suggestion.label}</h4>
                            <TrendIcon className={`w-3 h-3 ${
                              suggestion.trend === 'up' ? 'text-green-500' : 
                              suggestion.trend === 'down' ? 'text-red-500' : 
                              'text-yellow-500'
                            }`} />
                          </div>
                          <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                        </div>
                        
                        <Badge variant="outline" className="text-xs">
                          {suggestion.count}
                        </Badge>
                      </motion.button>
                    </TouchFeedback>
                  );
                })}
              </motion.div>
            )}

            {/* Filters Tab */}
            {activeTab === 'filters' && (
              <motion.div
                key="filters"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Categories */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Categorias</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map((category) => {
                      const Icon = category.icon;
                      const isSelected = filters.category.includes(category.value);
                      const count = photos.filter(photo => photo.category === category.value).length;
                      
                      return (
                        <TouchFeedback key={category.value}>
                          <button
                            onClick={() => handleCategoryToggle(category.value)}
                            className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${
                              isSelected
                                ? 'bg-primary/10 border-primary text-primary'
                                : 'bg-background border-border hover:bg-muted/50'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{category.label}</p>
                              <p className="text-xs text-muted-foreground">{count} fotos</p>
                            </div>
                          </button>
                        </TouchFeedback>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Date Range */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Período</h3>
                  <DateRangePicker
                    value={filters.dateRange}
                    onChange={(dateRange) => onFiltersChange({ dateRange })}
                  />
                </div>

                <Separator />

                {/* Time of Day */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Horário do Dia</h3>
                  <div className="space-y-2">
                    {TIME_PERIODS.map((period) => (
                      <TouchFeedback key={period.value}>
                        <button
                          onClick={() => handleTimeOfDayChange(period.value)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                            filters.timeOfDay === period.value
                              ? 'bg-primary/10 border-primary text-primary'
                              : 'bg-background border-border hover:bg-muted/50'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium">{period.label}</p>
                            <p className="text-xs text-muted-foreground">{period.description}</p>
                          </div>
                          <Clock className="w-4 h-4" />
                        </button>
                      </TouchFeedback>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Sort Tab */}
            {activeTab === 'sort' && (
              <motion.div
                key="sort"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Ordenação
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Escolha como as fotos devem ser organizadas
                  </p>
                </div>

                {SORT_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = filters.sortBy === option.value;
                  
                  return (
                    <TouchFeedback key={option.value}>
                      <button
                        onClick={() => handleSortChange(option.value)}
                        className={`w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-background border-border hover:bg-muted/50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{option.label}</span>
                      </button>
                    </TouchFeedback>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}