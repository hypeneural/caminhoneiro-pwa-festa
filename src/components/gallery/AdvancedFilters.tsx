import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Calendar, 
  Clock, 
  Truck, 
  Star, 
  RotateCcw, 
  Filter,
  X,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { GalleryFilters, FilterOptions } from '@/types/gallery';

interface AdvancedFiltersProps {
  filters: GalleryFilters;
  filterOptions: FilterOptions | null;
  onFiltersChange: (filters: Partial<GalleryFilters>) => void;
  onClearFilters: () => void;
  isLoading?: boolean;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  filterOptions,
  onFiltersChange,
  onClearFilters,
  isLoading = false
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [plateSearch, setPlateSearch] = useState(filters.vehicle_plate || '');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Debounce para busca de placa
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      if (plateSearch !== filters.vehicle_plate) {
        onFiltersChange({ vehicle_plate: plateSearch || undefined });
      }
    }, 500); // 500ms debounce

    setSearchTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [plateSearch]);

  // Conta filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    
    if (filters.destaque) count++;
    if (filters.periodo_dia) count++;
    if (filters.data_evento) count++;
    if (filters.data_inicio || filters.data_fim) count++;
    if (filters.vehicle_plate) count++;
    if (filters.vehicle_brand_id) count++;
    if (filters.vehicle_model_id) count++;
    if (filters.vehicle_category_id) count++;
    if (filters.vehicle_year) count++;
    if (filters.vehicle_color) count++;
    
    return count;
  }, [filters]);

  // Períodos do dia disponíveis
  const periodosHorario = [
    { value: 'MANHA', label: '🌅 Manhã', icon: '🌅' },
    { value: 'TARDE', label: '☀️ Tarde', icon: '☀️' },
    { value: 'NOITE', label: '🌙 Noite', icon: '🌙' },
    { value: 'MADRUGADA', label: '🌃 Madrugada', icon: '🌃' }
  ];

  // Ordenação disponível
  const ordenacaoOpcoes = [
    { value: 'data_desc', label: '📅 Mais recentes' },
    { value: 'data_asc', label: '📅 Mais antigas' },
    { value: 'views_desc', label: '👁️ Mais visualizadas' },
    { value: 'destaque_desc', label: '⭐ Em destaque' }
  ];

  const handleFilterChange = (key: keyof GalleryFilters, value: any) => {
    onFiltersChange({ [key]: value || undefined });
  };

  const clearAllFilters = () => {
    setPlateSearch('');
    onClearFilters();
    setIsOpen(false);
  };

  if (!filterOptions) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" disabled>
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </SheetTrigger>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen} modal={true}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="relative"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 h-5"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto" aria-describedby="filters-description">
        <SheetHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filtros Avançados
            </SheetTitle>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-muted-foreground hover:text-destructive"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>
          
          <div id="filters-description" className="text-sm text-muted-foreground">
            Configure os filtros para refinar sua busca na galeria
          </div>
          
          {activeFiltersCount > 0 && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} ativo{activeFiltersCount > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Fotos em Destaque */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5 text-amber-500" />
                  <div>
                    <Label className="text-sm font-medium">Fotos em Destaque</Label>
                    <p className="text-xs text-muted-foreground">
                      Mostrar apenas fotos destacadas
                    </p>
                  </div>
                </div>
                <Switch
                  checked={filters.destaque || false}
                  onCheckedChange={(checked) => handleFilterChange('destaque', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Busca por Placa */}
          <Card>
            <CardContent className="p-4">
              <Label className="text-sm font-medium flex items-center mb-3">
                <Search className="w-4 h-4 mr-2" />
                Busca por Placa
              </Label>
              <div className="relative">
                <Input
                  placeholder="Digite a placa (ex: ABC1234)"
                  value={plateSearch}
                  onChange={(e) => setPlateSearch(e.target.value.toUpperCase())}
                  className="pr-8"
                />
                {plateSearch && (
                  <button
                    onClick={() => setPlateSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {plateSearch && plateSearch.length >= 3 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Buscando por placas que contenham "{plateSearch}"
                </p>
              )}
            </CardContent>
          </Card>

          {/* Data do Evento */}
          <Card>
            <CardContent className="p-4">
              <Label className="text-sm font-medium flex items-center mb-3">
                <Calendar className="w-4 h-4 mr-2" />
                Data do Evento
              </Label>
              <Select
                value={filters.data_evento || 'all'}
                onValueChange={(value) => handleFilterChange('data_evento', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as datas</SelectItem>
                  {filterOptions.datas.map((data) => (
                    <SelectItem key={data} value={data}>
                      {new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Período do Dia */}
          <Card>
            <CardContent className="p-4">
              <Label className="text-sm font-medium flex items-center mb-3">
                <Clock className="w-4 h-4 mr-2" />
                Período do Dia
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {periodosHorario.map((periodo) => (
                  <button
                    key={periodo.value}
                    onClick={() => {
                      const newValue = filters.periodo_dia === periodo.value ? undefined : periodo.value;
                      handleFilterChange('periodo_dia', newValue);
                    }}
                    className={`
                      p-3 rounded-lg border text-left transition-all
                      ${filters.periodo_dia === periodo.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                  >
                    <div className="text-lg mb-1">{periodo.icon}</div>
                    <div className="text-sm font-medium">
                      {periodo.label.replace(/^.+ /, '')}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Veículo */}
          <Card>
            <CardContent className="p-4">
              <Label className="text-sm font-medium flex items-center mb-3">
                <Truck className="w-4 h-4 mr-2" />
                Informações do Veículo
              </Label>
              
              <div className="space-y-4">
                {/* Marca */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Marca</Label>
                  <Select
                    value={filters.vehicle_brand_id?.toString() || 'all'}
                    onValueChange={(value) => handleFilterChange('vehicle_brand_id', value === 'all' ? undefined : parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a marca" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as marcas</SelectItem>
                      {filterOptions.marcas.map((marca) => (
                        <SelectItem key={marca.id} value={marca.id.toString()}>
                          {marca.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Categoria */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Tipo de Veículo</Label>
                  <Select
                    value={filters.vehicle_category_id?.toString() || 'all'}
                    onValueChange={(value) => handleFilterChange('vehicle_category_id', value === 'all' ? undefined : parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {filterOptions.categorias.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id.toString()}>
                          {categoria.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Modelo */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Modelo</Label>
                  <Select
                    value={filters.vehicle_model_id?.toString() || 'all'}
                    onValueChange={(value) => handleFilterChange('vehicle_model_id', value === 'all' ? undefined : parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os modelos</SelectItem>
                      {filterOptions.modelos.map((modelo) => (
                        <SelectItem key={modelo.id} value={modelo.id.toString()}>
                          {modelo.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Ano */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Ano</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 2020"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={filters.vehicle_year || ''}
                    onChange={(e) => handleFilterChange('vehicle_year', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>

                {/* Cor */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Cor</Label>
                  <Input
                    placeholder="Ex: BRANCA, AZUL, VERMELHA"
                    value={filters.vehicle_color || ''}
                    onChange={(e) => handleFilterChange('vehicle_color', e.target.value.toUpperCase())}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ordenação */}
          <Card>
            <CardContent className="p-4">
              <Label className="text-sm font-medium flex items-center mb-3">
                <ChevronDown className="w-4 h-4 mr-2" />
                Ordenação
              </Label>
              <Select
                value={filters.ordenar_por || 'data_desc'}
                onValueChange={(value) => handleFilterChange('ordenar_por', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ordenacaoOpcoes.map((opcao) => (
                    <SelectItem key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Aplicar Filtros
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="text-destructive hover:text-destructive"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AdvancedFilters; 