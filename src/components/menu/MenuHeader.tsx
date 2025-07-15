import { Grid2X2, List, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { APIMenuCategory } from '@/services/api/menuService';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { memo } from 'react';
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
  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
      {/* Search and Actions */}
      <div className="flex items-center gap-2 p-3 pb-2">
        <Input
          type="search"
          placeholder="Buscar no cardápio..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={onViewModeToggle}
          className="shrink-0"
        >
          {viewMode === 'grid' ? (
            <Grid2X2 className="h-4 w-4" />
          ) : (
            <List className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onOpenFilters}
          className="shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Categories */}
      <ScrollArea className="w-full pb-2" type="scroll">
        <div className="flex px-3 gap-2">
          <Button
            variant={activeCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(null)}
            className="shrink-0 h-9"
          >
            Todos
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(category.id)}
              className="shrink-0 h-9 gap-2"
            >
              <CategoryIcon iconName={category.icon_url} />
              {category.name}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  );
});