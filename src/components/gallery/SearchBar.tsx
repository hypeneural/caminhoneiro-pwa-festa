import { useState, useCallback, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GalleryFilters } from '@/types/gallery';

interface SearchBarProps {
  filters: GalleryFilters;
  onFiltersChange: (filters: Partial<GalleryFilters>) => void;
  onClearFilters: () => void;
  isFiltersActive: boolean;
}

export function SearchBar({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  isFiltersActive 
}: SearchBarProps) {
  const [searchInput, setSearchInput] = useState(filters.vehiclePlate);
  const [generalSearch, setGeneralSearch] = useState(filters.searchQuery);

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

  return (
    <div className="bg-muted/30 p-4 space-y-3">
      {/* Vehicle Plate Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder="Buscar por placa (ABC-1234)"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-10 bg-background border-border/50 focus:border-trucker-blue transition-colors"
        />
      </div>

      {/* General Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder="Buscar fotos, descrições, tags..."
          value={generalSearch}
          onChange={(e) => setGeneralSearch(e.target.value)}
          className="pl-10 bg-background border-border/50 focus:border-trucker-blue transition-colors"
        />
      </div>

      {/* Clear Filters Button */}
      {isFiltersActive && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  );
}