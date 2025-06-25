
import React, { useState, useCallback, useEffect, KeyboardEventHandler } from 'react';
import { Search, X, ChevronDown, ChevronUp, Calendar, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { GalleryFilters } from '@/types/gallery';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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

// Validação aprimorada de placa
const allowAtPos = (c: string, pos: number): boolean => {
  if (pos < 3) return /[A-Z]/i.test(c);         // posições 0-1-2: letras
  if (pos === 3) return /\d/.test(c);           // posição 3: dígito
  if (pos === 4) return /[A-Z0-9]/i.test(c);    // posição 4: letra OU dígito
  return pos > 4 && /\d/.test(c);               // posições 5-6: sempre dígitos
};

const validatePlate = (plate: string): boolean => {
  if (plate.length < 7) return plate.length === 0;
  
  const pattern1990 = /^[A-Z]{3}\d{4}$/i;    // ABC1234
  const patternMercosul = /^[A-Z]{3}\d[A-Z]\d{2}$/i; // ABC1D23
  
  return pattern1990.test(plate) || patternMercosul.test(plate);
};

export function VehicleFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  isFiltersActive 
}: VehicleFiltersProps) {
  const [plateInput, setPlateInput] = useState(filters.vehiclePlate || '');
  const [plateValid, setPlateValid] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);

  // Validação de placa em tempo real
  const handlePlateChange = useCallback((value: string) => {
    // Converte para maiúsculas e remove caracteres inválidos
    const cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Limita a 7 caracteres
    const limitedValue = cleanValue.slice(0, 7);
    
    setPlateInput(limitedValue);
    
    // Valida formato
    const isValid = validatePlate(limitedValue);
    setPlateValid(isValid);
    
    // Só aplica o filtro se for válido ou vazio
    if (isValid || limitedValue.length === 0) {
      onFiltersChange({ vehiclePlate: limitedValue });
    }
  }, [onFiltersChange]);

  // Handler para keydown com validação por posição
  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    const pos = (e.target as HTMLInputElement).selectionStart ?? 0;
    
    // Permite teclas de controle
    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
      return;
    }
    
    // Impede entrada se exceder 7 caracteres
    if (pos >= 7) {
      e.preventDefault();
      return;
    }
    
    // Valida caractere na posição atual
    if (!allowAtPos(e.key, pos)) {
      e.preventDefault();
    }
  };

  const handleClearAll = useCallback(() => {
    setPlateInput('');
    setPlateValid(true);
    onClearFilters();
  }, [onClearFilters]);

  // Gera opções de datas (próximos 7 dias como exemplo)
  const getDateOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayName = format(date, 'EEE', { locale: ptBR });
      const dayDate = format(date, 'dd/MM', { locale: ptBR });
      
      options.push({
        value: date.toISOString(),
        label: `${dayName} - ${dayDate}`,
        date
      });
    }
    
    return options;
  };

  const activeFiltersCount = [
    filters.category.length > 0,
    filters.dateRange.start || filters.dateRange.end,
    filters.timeOfDay !== 'all',
    filters.sortBy !== 'newest',
    filters.vehiclePlate,
    filters.searchQuery,
    filters.specificDate,
    filters.timeRange.start || filters.timeRange.end,
    filters.showFeaturedOnly
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
            placeholder="Buscar por placa (ABC1234 ou ABC1D23)..."
            value={plateInput}
            onChange={(e) => handlePlateChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`pl-10 pr-12 bg-background transition-all ${
              !plateValid ? 'border-red-500 focus:border-red-500' : 'border-border/50 focus:border-trucker-blue'
            }`}
            maxLength={7}
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
              Formato inválido. Use ABC1234 ou ABC1D23 (sem hífen)
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
              {/* Busca por dia específico */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Busca por Dia
                </label>
                <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-9",
                        !filters.specificDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {filters.specificDate ? (
                        `${format(filters.specificDate, 'EEE', { locale: ptBR })} - ${format(filters.specificDate, 'dd/MM/yyyy', { locale: ptBR })}`
                      ) : (
                        "Selecionar dia"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={filters.specificDate}
                      onSelect={(date) => {
                        onFiltersChange({ specificDate: date });
                        setIsDateOpen(false);
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Faixa de horário */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Faixa de Horário
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="time"
                      placeholder="Início"
                      value={filters.timeRange.start || ''}
                      onChange={(e) => onFiltersChange({ 
                        timeRange: { ...filters.timeRange, start: e.target.value }
                      })}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Input
                      type="time"
                      placeholder="Fim"
                      value={filters.timeRange.end || ''}
                      onChange={(e) => onFiltersChange({ 
                        timeRange: { ...filters.timeRange, end: e.target.value }
                      })}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Switch para fotos em destaque */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">
                  Mostrar Apenas Fotos em Destaque
                </label>
                <Switch
                  checked={filters.showFeaturedOnly}
                  onCheckedChange={(checked) => onFiltersChange({ showFeaturedOnly: checked })}
                />
              </div>

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
                if (key === 'timeRange' && !value.start && !value.end) return null;
                
                let displayValue = '';
                if (key === 'specificDate' && value instanceof Date) {
                  displayValue = format(value, 'dd/MM', { locale: ptBR });
                } else if (key === 'timeRange' && (value.start || value.end)) {
                  displayValue = `${value.start || '00:00'}-${value.end || '23:59'}`;
                } else if (key === 'showFeaturedOnly' && value) {
                  displayValue = 'Destaque';
                } else {
                  displayValue = String(value).slice(0, 15);
                }
                
                if (!displayValue) return null;
                
                return (
                  <Badge
                    key={key}
                    variant="secondary"
                    className="text-xs flex items-center gap-1 bg-trucker-blue/10 text-trucker-blue"
                  >
                    {displayValue}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-3 h-3 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => {
                        if (key === 'category') {
                          onFiltersChange({ [key]: [] });
                        } else if (key === 'timeRange') {
                          onFiltersChange({ [key]: { start: '', end: '' } });
                        } else if (key === 'showFeaturedOnly') {
                          onFiltersChange({ [key]: false });
                        } else {
                          onFiltersChange({ [key]: '' });
                        }
                      }}
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
