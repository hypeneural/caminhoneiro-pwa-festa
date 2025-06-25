
import React, { useState, useCallback, useEffect } from 'react';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { GalleryFilters } from '@/types/gallery';

interface VehicleFiltersProps {
  filters: GalleryFilters;
  onFiltersChange: (filters: Partial<GalleryFilters>) => void;
  onClearFilters: () => void;
  isFiltersActive: boolean;
}

const vehicleBrands = [
  'Volvo', 'Scania', 'Mercedes-Benz', 'Iveco', 'DAF', 'MAN', 'Ford', 'Volkswagen', 'Chevrolet', 'Fiat'
];

const vehicleModels = [
  'FH', 'FM', 'R-Series', 'S-Series', 'Actros', 'Atego', 'Axor', 'Daily', 'Tector', 'Cursor'
];

const vehicleYears = Array.from({ length: 25 }, (_, i) => (new Date().getFullYear() - i).toString());

const vehicleColors = [
  'Branco', 'Preto', 'Prata', 'Azul', 'Vermelho', 'Verde', 'Amarelo', 'Cinza', 'Bege', 'Marrom'
];

const fuelTypes = [
  'Diesel', 'Diesel S-10', 'Gasolina', 'Etanol', 'Flex', 'GNV', 'Elétrico', 'Híbrido'
];

const vehicleTypes = [
  'Caminhão', 'Carreta', 'Bitrem', 'Rodotrem', 'Truck', 'VUC', 'Semi-reboque', 'Reboque'
];

const cities = [
  'Chapecó', 'Xanxerê', 'Concórdia', 'São Miguel do Oeste', 'Pinhalzinho', 'Maravilha', 'Seara', 'Joaçaba'
];

// Regex para validação de placas (padrão antigo e Mercosul)
const plateRegex = /^(?:[A-Z]{3}-?\d{4}|[A-Z]{3}\d[A-Z]\d{2})$/i;

export function VehicleFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  isFiltersActive 
}: VehicleFiltersProps) {
  const [plateInput, setPlateInput] = useState(filters.vehiclePlate || '');
  const [plateValid, setPlateValid] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Validação de placa em tempo real
  const handlePlateChange = useCallback((value: string) => {
    // Converte para maiúsculas e remove espaços
    const cleanValue = value.toUpperCase().replace(/\s+/g, '');
    
    // Limita a 8 caracteres
    const limitedValue = cleanValue.slice(0, 8);
    
    setPlateInput(limitedValue);
    
    // Valida formato se não estiver vazio
    if (limitedValue.length > 0) {
      const isValid = plateRegex.test(limitedValue);
      setPlateValid(isValid);
      
      // Só aplica o filtro se for válido ou vazio
      if (isValid || limitedValue.length === 0) {
        onFiltersChange({ vehiclePlate: limitedValue });
      }
    } else {
      setPlateValid(true);
      onFiltersChange({ vehiclePlate: '' });
    }
  }, [onFiltersChange]);

  // Debounce para outros filtros
  useEffect(() => {
    const timer = setTimeout(() => {
      if (plateInput.length === 0 || plateRegex.test(plateInput)) {
        onFiltersChange({ vehiclePlate: plateInput });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [plateInput, onFiltersChange]);

  const handleClearAll = useCallback(() => {
    setPlateInput('');
    setPlateValid(true);
    onClearFilters();
  }, [onClearFilters]);

  const activeFiltersCount = [
    filters.category.length > 0,
    filters.dateRange.start || filters.dateRange.end,
    filters.timeOfDay !== 'all',
    filters.sortBy !== 'newest',
    filters.vehiclePlate,
    filters.searchQuery
  ].filter(Boolean).length;

  return (
    <motion.div 
      className="bg-background/95 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50"
      layout
    >
      <div className="p-4 space-y-3">
        {/* Barra de busca principal */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Buscar por placa do veículo..."
            value={plateInput}
            onChange={(e) => handlePlateChange(e.target.value)}
            className={`pl-10 pr-12 bg-background transition-all ${
              !plateValid ? 'border-red-500 focus:border-red-500' : 'border-border/50 focus:border-trucker-blue'
            }`}
            maxLength={8}
          />
          
          {plateInput && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-10 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0"
              onClick={() => handlePlateChange('')}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Feedback de validação */}
        <AnimatePresence>
          {!plateValid && plateInput.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-red-500 px-1"
            >
              Formato inválido. Use ABC-1234 ou ABC1D23
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filtros expandidos */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pt-2"
            >
              {/* Marca e Modelo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Marca
                  </label>
                  <Select 
                    value={filters.brand || ''} 
                    onValueChange={(value) => onFiltersChange({ brand: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleBrands.map(brand => (
                        <SelectItem key={brand} value={brand.toLowerCase()}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Modelo
                  </label>
                  <Select 
                    value={filters.model || ''} 
                    onValueChange={(value) => onFiltersChange({ model: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleModels.map(model => (
                        <SelectItem key={model} value={model.toLowerCase()}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Ano Modelo e Ano Fabricação */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Ano Modelo
                  </label>
                  <Select 
                    value={filters.modelYear || ''} 
                    onValueChange={(value) => onFiltersChange({ modelYear: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleYears.map(year => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Ano Fabricação
                  </label>
                  <Select 
                    value={filters.manufacturingYear || ''} 
                    onValueChange={(value) => onFiltersChange({ manufacturingYear: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleYears.map(year => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Cor e Município */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Cor
                  </label>
                  <Select 
                    value={filters.color || ''} 
                    onValueChange={(value) => onFiltersChange({ color: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleColors.map(color => (
                        <SelectItem key={color} value={color.toLowerCase()}>
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Município
                  </label>
                  <Select 
                    value={filters.city || ''} 
                    onValueChange={(value) => onFiltersChange({ city: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map(city => (
                        <SelectItem key={city} value={city.toLowerCase()}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Combustível e Tipo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Combustível
                  </label>
                  <Select 
                    value={filters.fuelType || ''} 
                    onValueChange={(value) => onFiltersChange({ fuelType: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {fuelTypes.map(fuel => (
                        <SelectItem key={fuel} value={fuel.toLowerCase()}>
                          {fuel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Tipo Veículo
                  </label>
                  <Select 
                    value={filters.vehicleType || ''} 
                    onValueChange={(value) => onFiltersChange({ vehicleType: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map(type => (
                        <SelectItem key={type} value={type.toLowerCase()}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Botão limpar filtros */}
              {isFiltersActive && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    className="w-full"
                  >
                    Limpar Filtros ({activeFiltersCount})
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filtros ativos */}
        <AnimatePresence>
          {isFiltersActive && !isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-1"
            >
              {Object.entries(filters).map(([key, value]) => {
                if (!value || (Array.isArray(value) && value.length === 0)) return null;
                
                return (
                  <Badge
                    key={key}
                    variant="secondary"
                    className="text-xs flex items-center gap-1 bg-trucker-blue/10 text-trucker-blue"
                  >
                    {String(value).slice(0, 15)}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-3 h-3 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => onFiltersChange({ [key]: key === 'category' ? [] : '' })}
                    >
                      <X className="w-2 h-2" />
                    </Button>
                  </Badge>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
