import { Grid2X2, List, SlidersHorizontal, Search, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { APIMenuCategory } from '@/types/menu';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VoiceSearchButton } from './VoiceSearchButton';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import * as Fa from 'react-icons/fa';

interface MenuHeaderProps {
  categories: APIMenuCategory[];
  activeCategory: number | null;
  searchTerm: string;
  viewMode: 'grid' | 'list';
  onSearchChange: (value: string) => void;
  onCategoryChange: (id: number | null) => void;
  onViewModeToggle: () => void;
  onOpenFilters: () => void;
}

const CategoryIcon = memo(({ iconName }: { iconName: string }) => {
  const IconComponent = (Fa as any)[iconName];
  return IconComponent ? <IconComponent className="w-4 h-4 opacity-75" /> : null;
});

CategoryIcon.displayName = 'CategoryIcon';

export const MenuHeader = memo(function MenuHeader({
  categories,
  activeCategory,
  searchTerm,
  viewMode,
  onSearchChange,
  onCategoryChange,
  onViewModeToggle,
  onOpenFilters
}: MenuHeaderProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { isOnline } = useNetworkStatus();

  const handleVoiceTranscript = (transcript: string) => {
    onSearchChange(transcript);
  };

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
      {/* Main Header */}
      <div className="p-4 pb-3">
        {/* Title and Network Status */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Cardápio</h1>
            <p className="text-sm text-muted-foreground">
              Escolha seus pratos favoritos
            </p>
          </div>
          
          {/* Network Status Indicator */}
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: isOnline ? 1 : 0.9 }}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
                isOnline 
                  ? "bg-green-100 text-green-700" 
                  : "bg-red-100 text-red-700"
              )}
            >
              {isOnline ? (
                <Wifi className="w-3 h-3" />
              ) : (
                <WifiOff className="w-3 h-3" />
              )}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </motion.div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <div className={cn(
            "relative flex items-center bg-muted/50 rounded-2xl border-2 transition-all duration-200",
            isSearchFocused 
              ? "border-green-500 bg-background shadow-sm" 
              : "border-transparent"
          )}>
            <Search className="absolute left-4 w-4 h-4 text-muted-foreground" />
            
            <Input
              type="search"
              placeholder="Buscar pratos, bebidas, ingredientes..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="pl-12 pr-16 h-12 border-none bg-transparent text-base placeholder:text-muted-foreground focus:ring-0 focus:border-none rounded-2xl"
            />

            {/* Voice Search Button */}
            <div className="absolute right-3">
              <VoiceSearchButton 
                onTranscript={handleVoiceTranscript}
                className="h-8 w-8"
              />
            </div>
          </div>

          {/* Search Suggestions */}
          <AnimatePresence>
            {isSearchFocused && !searchTerm && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-2xl shadow-lg z-50 p-4"
              >
                <h4 className="text-sm font-medium text-foreground mb-3">
                  Buscas populares
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Costela', 
                    'Frango', 
                    'Feijão tropeiro', 
                    'Cerveja', 
                    'Pudim', 
                    'Linguiça',
                    'Farofa',
                    'Refrigerante'
                  ].map((suggestion) => (
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
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewModeToggle}
              className="h-9 px-3"
            >
              {viewMode === 'grid' ? (
                <>
                  <Grid2X2 className="h-4 w-4 mr-2" />
                  Grade
                </>
              ) : (
                <>
                  <List className="h-4 w-4 mr-2" />
                  Lista
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenFilters}
              className="h-9 px-3"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>

          {/* Results Count */}
          {searchTerm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs text-muted-foreground"
            >
              Buscando por "{searchTerm}"
            </motion.div>
          )}
        </div>
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="px-4 pb-3">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2">
            <Button
              variant={activeCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(null)}
              className={cn(
                "shrink-0 h-9 rounded-full",
                activeCategory === null && "bg-green-600 hover:bg-green-700 text-white"
              )}
            >
              Todos
            </Button>
            
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => onCategoryChange(category.id)}
                className={cn(
                  "shrink-0 h-9 gap-2 rounded-full",
                  activeCategory === category.id && "bg-green-600 hover:bg-green-700 text-white"
                )}
              >
                <CategoryIcon iconName={category.icon_url} />
                {category.name}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>

      {/* Active Filters Indicator */}
      <AnimatePresence>
        {(searchTerm || activeCategory !== null) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Filtros ativos:</span>
              
              {searchTerm && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                  <Search className="w-3 h-3" />
                  <span>"{searchTerm}"</span>
                </div>
              )}
              
              {activeCategory !== null && (
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                  <CategoryIcon iconName={categories.find(c => c.id === activeCategory)?.icon_url || ''} />
                  <span>{categories.find(c => c.id === activeCategory)?.name}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});