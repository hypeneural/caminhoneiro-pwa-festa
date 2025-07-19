import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Search, X, ChevronDown, ChevronUp, Calendar, Clock, Filter, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { GalleryFilters, FilterOptions } from '@/types/gallery';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DynamicFiltersProps {
  filters: GalleryFilters;
  filterOptions: FilterOptions | null;
  onFiltersChange: (filters: Partial<GalleryFilters>) => void;
  onClearFilters: () => void;
  isFiltersActive: boolean;
  networkQuality: 'slow' | 'medium' | 'fast';
}

// Validação aprimorada de placa
const plateRegex = /^[A-Z]{3}[\d][A-Z][\d]{2}$|^[A-Z]{3}[\d]{4}$/;

const validatePlate = (plate: string): boolean => {
  if (!plate) return true;
  const cleanPlate = plate.replace(/[^A-Z0-9]/g, '');
  return plateRegex.test(cleanPlate);
};

const formatPlate = (plate: string): string => {
  const clean = plate.replace(/[^A-Z0-9]/g, '').toUpperCase();
  
  // Formato Mercosul: ABC1D23
  if (clean.length === 7 && /^[A-Z]{3}[\d][A-Z][\d]{2}$/.test(clean)) {
    return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  }
  
  // Formato antigo: ABC1234
  if (clean.length === 7 && /^[A-Z]{3}[\d]{4}$/.test(clean)) {
    return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  }
  
  return clean;
};

export const DynamicFilters: React.FC<DynamicFiltersProps> = ({
  filters,
  filterOptions,
  onFiltersChange,
  onClearFilters,
  isFiltersActive,
  networkQuality
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchPlate, setSearchPlate] = useState(filters.vehicle_plate || '');
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({
    start: filters.data_inicio ? new Date(filters.data_inicio) : undefined,
    end: filters.data_fim ? new Date(filters.data_fim) : undefined
  });

  // Memoiza opções para evitar re-renders desnecessários
  const { tags, marcas, datas } = useMemo(() => {
    if (!filterOptions) {
      return { tags: [], marcas: [], datas: [] };
    }
    
    return {
      tags: filterOptions.tags || [],
      marcas: filterOptions.marcas || [],
      datas: filterOptions.datas || []
    };
  }, [filterOptions]);

  // Debounced plate search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchPlate !== filters.vehicle_plate) {
        const cleanPlate = searchPlate.replace(/[^A-Z0-9]/g, '');
        onFiltersChange({ 
          vehicle_plate: cleanPlate || undefined,
          page: 1 
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchPlate, filters.vehicle_plate, onFiltersChange]);

  // Date range handler
  useEffect(() => {
    const startDate = dateRange.start?.toISOString().split('T')[0];
    const endDate = dateRange.end?.toISOString().split('T')[0];
    
    if (startDate !== filters.data_inicio || endDate !== filters.data_fim) {
      onFiltersChange({
        data_inicio: startDate,
        data_fim: endDate,
        page: 1
      });
    }
  }, [dateRange, filters.data_inicio, filters.data_fim, onFiltersChange]);

  const handlePlateChange = useCallback((value: string) => {
    const formatted = formatPlate(value);
    setSearchPlate(formatted);
  }, []);

  const handleClearAll = useCallback(() => {
    setSearchPlate('');
    setDateRange({});
    onClearFilters();
  }, [onClearFilters]);

  const handleQuickFilter = useCallback((filterType: string, value: any) => {
    onFiltersChange({ [filterType]: value, page: 1 });
  }, [onFiltersChange]);

  // Conta filtros ativos para performance
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.destaque) count++;
    if (filters.periodo_dia) count++;
    if (filters.id_grupo_whatsapp) count++;
    if (filters.vehicle_plate) count++;
    if (filters.vehicle_brand_id) count++;
    if (filters.data_inicio || filters.data_fim) count++;
    return count;
  }, [filters]);

  // Otimizações baseadas na qualidade da rede
  const shouldShowAdvancedFilters = networkQuality !== 'slow' || isExpanded;

  return (
    <div className="bg-background border-b">
      {/* Header com busca principal */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Busca por placa */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por placa (ABC-1234)"
              value={searchPlate}
              onChange={(e) => handlePlateChange(e.target.value)}
              className={cn(
                "pl-10 pr-10",
                searchPlate && !validatePlate(searchPlate) && "border-destructive"
              )}
              maxLength={8}
            />
            {searchPlate && (
              <button
                onClick={() => setSearchPlate('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Toggle filtros avançados */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3"
          >
            <Filter className="w-4 h-4 mr-1" />
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>

        {/* Filtros rápidos sempre visíveis */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-hide">
          {/* Apenas destaques */}
          <button
            onClick={() => handleQuickFilter('destaque', !filters.destaque)}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              filters.destaque 
                ? "bg-amber-500 text-white" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            ⭐ Destaques
          </button>

          {/* Tags populares */}
          {tags.slice(0, 3).map((tag) => (
            <button
              key={tag.id}
              onClick={() => handleQuickFilter('id_grupo_whatsapp', 
                filters.id_grupo_whatsapp === tag.id ? undefined : tag.id
              )}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                filters.id_grupo_whatsapp === tag.id
                  ? "text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
              style={{
                backgroundColor: filters.id_grupo_whatsapp === tag.id ? tag.cor : undefined
              }}
            >
              <i className={`${tag.icone} text-xs`} />
              {tag.nome}
            </button>
          ))}

          {/* Limpar filtros */}
          {isFiltersActive && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap text-destructive hover:bg-destructive/10"
            >
              <X className="w-3 h-3" />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Filtros avançados (expansível) */}
      <AnimatePresence>
        {shouldShowAdvancedFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 bg-muted/30">
              {/* Período do dia */}
              <div>
                <label className="text-sm font-medium mb-2 block">Período do dia</label>
                <div className="flex gap-2">
                  {[
                    { value: 'MANHA', label: 'Manhã', icon: '🌅' },
                    { value: 'TARDE', label: 'Tarde', icon: '☀️' },
                    { value: 'NOITE', label: 'Noite', icon: '🌙' },
                    { value: 'MADRUGADA', label: 'Madrugada', icon: '🌃' }
                  ].map((period) => (
                    <button
                      key={period.value}
                      onClick={() => handleQuickFilter('periodo_dia',
                        filters.periodo_dia === period.value ? undefined : period.value
                      )}
                      className={cn(
                        "flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex-1 justify-center",
                        filters.periodo_dia === period.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <span>{period.icon}</span>
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seleção de data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {datas.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Data específica</label>
                    <Select
                      value={filters.data_evento || ''}
                      onValueChange={(value) => handleQuickFilter('data_evento', value || undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma data" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas as datas</SelectItem>
                        {datas.map((date) => (
                          <SelectItem key={date} value={date}>
                            {format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Marcas de veículos */}
                {marcas.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Marca do veículo</label>
                    <Select
                      value={filters.vehicle_brand_id?.toString() || ''}
                      onValueChange={(value) => handleQuickFilter('vehicle_brand_id', value ? parseInt(value) : undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as marcas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas as marcas</SelectItem>
                        {marcas.map((marca) => (
                          <SelectItem key={marca.id} value={marca.id.toString()}>
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4" />
                              {marca.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Intervalo de datas */}
              <div>
                <label className="text-sm font-medium mb-2 block">Período personalizado</label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {dateRange.start ? format(dateRange.start, 'dd/MM/yyyy') : 'Data inicial'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateRange.start}
                        onSelect={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {dateRange.end ? format(dateRange.end, 'dd/MM/yyyy') : 'Data final'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateRange.end}
                        onSelect={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicador de filtros ativos */}
      {activeFiltersCount > 0 && (
        <div className="px-4 py-2 bg-primary/10">
          <div className="flex items-center justify-between">
            <span className="text-sm text-primary font-medium">
              {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} ativo{activeFiltersCount > 1 ? 's' : ''}
            </span>
            <Button variant="ghost" size="sm" onClick={handleClearAll}>
              <X className="w-4 h-4 mr-1" />
              Limpar tudo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicFilters; 