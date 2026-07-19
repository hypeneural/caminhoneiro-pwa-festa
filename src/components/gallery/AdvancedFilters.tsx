import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  RotateCcw, 
  Filter,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
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

  // Conta filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    
    if (filters.periodo_dia) count++;
    if (filters.data_evento) count++;
    if (filters.data_inicio || filters.data_fim) count++;
    
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