import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface MenuFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priceRange: [number, number];
  sortOrder: {
    sort?: 'price' | 'name';
    order?: 'ASC' | 'DESC';
  };
  onPriceRangeChange: (range: [number, number]) => void;
  onSortOrderChange: (sort: 'price' | 'name' | undefined, order?: 'ASC' | 'DESC') => void;
  onReset: () => void;
}

export function MenuFiltersSheet({
  open,
  onOpenChange,
  priceRange,
  sortOrder,
  onPriceRangeChange,
  onSortOrderChange,
  onReset
}: MenuFiltersSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] sm:h-[65vh]">
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Price Range */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Faixa de Preço</Label>
              <span className="text-sm text-muted-foreground">
                R$ {priceRange[0].toFixed(2)} - R$ {priceRange[1].toFixed(2)}
              </span>
            </div>
            <Slider
              min={0}
              max={100}
              step={1}
              value={priceRange}
              onValueChange={(value) => onPriceRangeChange(value as [number, number])}
              className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
            />
          </div>

          {/* Sort Order */}
          <div className="space-y-4">
            <Label>Ordenar por Preço</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  sortOrder.sort === 'price' && sortOrder.order === 'ASC' && 'bg-primary/10'
                )}
                onClick={() => onSortOrderChange('price', 'ASC')}
              >
                Menor Preço
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  sortOrder.sort === 'price' && sortOrder.order === 'DESC' && 'bg-primary/10'
                )}
                onClick={() => onSortOrderChange('price', 'DESC')}
              >
                Maior Preço
              </Button>
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              onReset();
              onOpenChange(false);
            }}
          >
            Limpar Filtros
          </Button>
          <Button
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Aplicar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
} 