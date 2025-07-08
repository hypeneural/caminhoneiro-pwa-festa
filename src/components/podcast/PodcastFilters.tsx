import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, X, SortAsc, SortDesc } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TouchFeedback } from "@/components/ui/touch-feedback";
import { PodcastFilters as PodcastFiltersType } from "@/types/podcast";

interface PodcastFiltersProps {
  filters: PodcastFiltersType;
  onFiltersChange: (filters: PodcastFiltersType) => void;
  onReset: () => void;
}

export function PodcastFilters({ filters, onFiltersChange, onReset }: PodcastFiltersProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: searchTerm, page: 1 });
  };

  const handleSortChange = (value: string) => {
    const [sort, order] = value.split('_') as [any, 'ASC' | 'DESC'];
    onFiltersChange({ ...filters, sort, order, page: 1 });
  };

  const hasActiveFilters = Boolean(filters.search || filters.sort !== 'created_at' || filters.order !== 'DESC');

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar podcasts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-20 h-12 rounded-xl border-border/20 bg-background/95 backdrop-blur-sm"
          />
          
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
            {searchTerm && (
              <TouchFeedback
                onClick={() => {
                  setSearchTerm('');
                  onFiltersChange({ ...filters, search: undefined, page: 1 });
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                haptic={false}
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </TouchFeedback>
            )}
            
            <Button type="submit" size="sm" className="h-8">
              Buscar
            </Button>
          </div>
        </div>
      </form>

      {/* Filter Controls */}
      <div className="flex items-center gap-3">
        {/* Sort Dropdown */}
        <Select 
          value={`${filters.sort || 'created_at'}_${filters.order || 'DESC'}`}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-auto min-w-[140px] h-10 rounded-lg border-border/20 bg-background/95 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              {filters.order === 'ASC' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at_DESC">Mais Recentes</SelectItem>
            <SelectItem value="created_at_ASC">Mais Antigos</SelectItem>
            <SelectItem value="title_ASC">Título A-Z</SelectItem>
            <SelectItem value="title_DESC">Título Z-A</SelectItem>
            <SelectItem value="display_order_ASC">Ordem Manual</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset Filters */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="gap-2 h-10 rounded-lg border-border/20 bg-background/95 backdrop-blur-sm"
              >
                <X className="w-4 h-4" />
                Limpar
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active Filters Display */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap gap-2"
          >
            {filters.search && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs border border-primary/20"
              >
                <span>Busca: "{filters.search}"</span>
                <TouchFeedback
                  onClick={() => onFiltersChange({ ...filters, search: undefined, page: 1 })}
                  className="hover:bg-primary/20 rounded-full p-1 transition-colors"
                  haptic={false}
                >
                  <X className="w-3 h-3" />
                </TouchFeedback>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}