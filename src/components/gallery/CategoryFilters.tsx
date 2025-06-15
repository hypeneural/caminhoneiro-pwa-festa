import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CategoryType, GalleryFilters } from '@/types/gallery';

interface CategoryFiltersProps {
  filters: GalleryFilters;
  onFiltersChange: (filters: Partial<GalleryFilters>) => void;
}

const categories: CategoryType[] = [
  'Todos',
  'Caminhões', 
  'Carretas',
  'Família',
  'Shows',
  'Momentos Religiosos'
];

const categoryMap: Record<CategoryType, string | null> = {
  'Todos': null,
  'Caminhões': 'caminhoes',
  'Carretas': 'carretas',
  'Família': 'familia',
  'Shows': 'shows',
  'Momentos Religiosos': 'religioso'
};

export function CategoryFilters({ filters, onFiltersChange }: CategoryFiltersProps) {
  const handleCategoryToggle = (category: CategoryType) => {
    if (category === 'Todos') {
      onFiltersChange({ category: [] });
      return;
    }

    const categoryValue = categoryMap[category];
    if (!categoryValue) return;

    const currentCategories = [...filters.category];
    const index = currentCategories.indexOf(categoryValue);
    
    if (index > -1) {
      currentCategories.splice(index, 1);
    } else {
      currentCategories.push(categoryValue);
    }
    
    onFiltersChange({ category: currentCategories });
  };

  const isCategoryActive = (category: CategoryType): boolean => {
    if (category === 'Todos') {
      return filters.category.length === 0;
    }
    
    const categoryValue = categoryMap[category];
    return categoryValue ? filters.category.includes(categoryValue) : false;
  };

  return (
    <div className="px-4 pb-2">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-max space-x-2 pb-2">
          {categories.map((category) => {
            const isActive = isCategoryActive(category);
            
            return (
              <Badge
                key={category}
                variant={isActive ? "default" : "secondary"}
                className={`
                  cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105
                  ${isActive 
                    ? 'bg-trucker-blue text-trucker-blue-foreground hover:bg-trucker-blue/90 shadow-md' 
                    : 'bg-background text-foreground hover:bg-accent border border-border/50'
                  }
                `}
                onClick={() => handleCategoryToggle(category)}
              >
                {category}
              </Badge>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}