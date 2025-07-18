import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, SortDesc, SortAsc } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FactCategory } from '@/types/facts';
import { cn } from '@/lib/utils';

interface FactFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeCategory: number | null;
  onCategoryChange: (categoryId: number | null) => void;
  categories: FactCategory[];
  categoriesLoading: boolean;
  sortOrder: 'ASC' | 'DESC';
  onSortOrderChange: (order: 'ASC' | 'DESC') => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export const FactFilters = ({
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  categories,
  categoriesLoading,
  sortOrder,
  onSortOrderChange,
  hasActiveFilters,
  onClearFilters
}: FactFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-3">
      {/* Barra de busca moderna */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Buscar curiosidades..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-12 pr-12 h-12 bg-white border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 h-8 w-8 rounded-full hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Filtros em linha horizontal */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {/* Scroll horizontal com categorias */}
        <div className="flex items-center gap-2 min-w-max">
          {/* Todas as categorias */}
          <Button
            variant={activeCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(null)}
            className={cn(
              "rounded-full px-4 py-2 transition-all whitespace-nowrap",
              activeCategory === null 
                ? "bg-blue-500 text-white shadow-lg" 
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            <Filter className="w-4 h-4 mr-2" />
            Todas
          </Button>

          {/* Categorias da API */}
          {!categoriesLoading && categories.map(category => {
            const getCategoryEmoji = (iconClass: string) => {
              const iconMap: { [key: string]: string } = {
                'fa-solid fa-landmark': '🏛️',
                'fa-solid fa-circle-info': '💡',
                'fa-solid fa-truck': '🚛',
                'fa-solid fa-church': '⛪',
                'fa-solid fa-star': '⭐',
                'fa-solid fa-heart': '❤️',
                'fa-solid fa-calendar': '📅',
                'fa-solid fa-map': '🗺️'
              };
              return iconMap[iconClass] || '💡';
            };

            return (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => onCategoryChange(category.id)}
                className={cn(
                  "rounded-full px-4 py-2 transition-all whitespace-nowrap",
                  activeCategory === category.id 
                    ? "bg-blue-500 text-white shadow-lg" 
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                <span className="mr-2">{getCategoryEmoji(category.icon)}</span>
                {category.name}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Linha de controles secundários */}
      <div className="flex items-center justify-between pt-2">
        {/* Filtros ativos */}
        <div className="flex items-center gap-2">
          {activeCategory && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Badge 
                variant="secondary"
                className="bg-blue-100 text-blue-700 border-blue-200 rounded-full px-3 py-1"
              >
                {categories.find(c => c.id === activeCategory)?.name || 'Categoria'}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCategoryChange(null)}
                  className="ml-2 p-0 h-4 w-4 rounded-full hover:bg-blue-200"
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            </motion.div>
          )}
        </div>

        {/* Ordenação e ações */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSortOrderChange(sortOrder === 'DESC' ? 'ASC' : 'DESC')}
            className="gap-2 rounded-full px-3 py-1 text-xs bg-white border-gray-200 text-gray-600"
          >
            {sortOrder === 'DESC' ? (
              <>
                <SortDesc className="w-3 h-3" />
                Recente
              </>
            ) : (
              <>
                <SortAsc className="w-3 h-3" />
                Antigo
              </>
            )}
          </Button>

          {/* Limpar filtros */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-gray-500 rounded-full px-3 py-1 text-xs hover:bg-gray-100"
            >
              Limpar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}; 