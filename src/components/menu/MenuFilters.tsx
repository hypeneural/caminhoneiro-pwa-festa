import { useState } from "react";
import { motion } from "framer-motion";
import { Filter, X, Sliders, MapPin, Tag } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { MenuFilters as MenuFiltersType } from "@/types/menu";

interface MenuFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: MenuFiltersType;
  onFiltersChange: (filters: Partial<MenuFiltersType>) => void;
  onClearFilters: () => void;
  isFiltersActive: boolean;
}

const priceRanges = [
  { label: "Até R$ 10", value: [0, 10] },
  { label: "R$ 10 - R$ 20", value: [10, 20] },
  { label: "R$ 20 - R$ 30", value: [20, 30] },
  { label: "Acima de R$ 30", value: [30, 100] },
];

const tags = [
  { id: 'vegetarian', label: 'Vegetariano', color: 'bg-green-100 text-green-700' },
  { id: 'vegan', label: 'Vegano', color: 'bg-green-100 text-green-800' },
  { id: 'gluten-free', label: 'Sem Glúten', color: 'bg-blue-100 text-blue-700' },
  { id: 'spicy', label: 'Picante', color: 'bg-red-100 text-red-700' },
  { id: 'popular', label: 'Popular', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'new', label: 'Novidade', color: 'bg-purple-100 text-purple-700' },
  { id: 'large-portion', label: 'Porção Grande', color: 'bg-orange-100 text-orange-700' },
];

const categories = [
  { id: 'main', label: 'Pratos Principais' },
  { id: 'snacks', label: 'Petiscos' },
  { id: 'regional', label: 'Comida Regional' },
  { id: 'drinks', label: 'Bebidas' },
  { id: 'desserts', label: 'Sobremesas' },
  { id: 'fast', label: 'Lanches Rápidos' },
];

const vendors = [
  { id: 'food-court', label: 'Praça de Alimentação' },
  { id: 'food-truck', label: 'Food Trucks' },
  { id: 'regional-stand', label: 'Barracas Regionais' },
];

export function MenuFilters({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onClearFilters,
  isFiltersActive
}: MenuFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      priceRange: [0, 50],
      tags: [],
      category: [],
      vendor: []
    } as MenuFiltersType;
    
    setLocalFilters(clearedFilters);
    onClearFilters();
    onClose();
  };

  const toggleTag = (tagId: string) => {
    setLocalFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(t => t !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  const toggleCategory = (categoryId: string) => {
    setLocalFilters(prev => ({
      ...prev,
      category: prev.category.includes(categoryId)
        ? prev.category.filter(c => c !== categoryId)
        : [...prev.category, categoryId]
    }));
  };

  const toggleVendor = (vendorId: string) => {
    setLocalFilters(prev => ({
      ...prev,
      vendor: prev.vendor.includes(vendorId)
        ? prev.vendor.filter(v => v !== vendorId)
        : [...prev.vendor, vendorId]
    }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] overflow-hidden">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <Filter className="w-5 h-5 text-trucker-blue" />
              Filtros
            </SheetTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="w-8 h-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pb-20">
          {/* Faixa de Preço */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-trucker-blue" />
              <h3 className="font-semibold text-foreground">Faixa de Preço</h3>
            </div>
            
            <div className="px-2">
              <Slider
                value={localFilters.priceRange}
                onValueChange={(value) => setLocalFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
                max={50}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>{formatPrice(localFilters.priceRange[0])}</span>
                <span>{formatPrice(localFilters.priceRange[1])}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {priceRanges.map((range) => (
                <Button
                  key={range.label}
                  variant="outline"
                  size="sm"
                  onClick={() => setLocalFilters(prev => ({ ...prev, priceRange: range.value as [number, number] }))}
                  className={`text-xs ${
                    localFilters.priceRange[0] === range.value[0] && localFilters.priceRange[1] === range.value[1]
                      ? 'bg-trucker-blue text-trucker-blue-foreground border-trucker-blue'
                      : ''
                  }`}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Características */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-trucker-blue" />
              <h3 className="font-semibold text-foreground">Características</h3>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <motion.div
                  key={tag.id}
                  whileTap={{ scale: 0.95 }}
                >
                  <Badge
                    variant={localFilters.tags.includes(tag.id) ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      localFilters.tags.includes(tag.id)
                        ? 'bg-trucker-blue text-trucker-blue-foreground hover:bg-trucker-blue/90'
                        : `${tag.color} hover:bg-opacity-80`
                    }`}
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.label}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Categorias */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Categorias</h3>
            
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={localFilters.category.includes(category.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleCategory(category.id)}
                  className={`text-xs justify-start ${
                    localFilters.category.includes(category.id)
                      ? 'bg-trucker-blue text-trucker-blue-foreground hover:bg-trucker-blue/90'
                      : ''
                  }`}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Locais */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-trucker-blue" />
              <h3 className="font-semibold text-foreground">Onde Encontrar</h3>
            </div>
            
            <div className="space-y-2">
              {vendors.map((vendor) => (
                <Button
                  key={vendor.id}
                  variant={localFilters.vendor.includes(vendor.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleVendor(vendor.id)}
                  className={`w-full justify-start text-xs ${
                    localFilters.vendor.includes(vendor.id)
                      ? 'bg-trucker-blue text-trucker-blue-foreground hover:bg-trucker-blue/90'
                      : ''
                  }`}
                >
                  {vendor.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border space-y-3">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="flex-1"
              disabled={!isFiltersActive}
            >
              Limpar Filtros
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="flex-1 bg-trucker-blue hover:bg-trucker-blue/90"
            >
              Aplicar Filtros
            </Button>
          </div>
          
          {isFiltersActive && (
            <p className="text-xs text-center text-muted-foreground">
              Filtros ativos serão aplicados aos resultados
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}