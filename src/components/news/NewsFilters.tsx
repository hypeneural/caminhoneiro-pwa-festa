import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter, Search, Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NewsFilters as NewsFiltersType, NewsCategory } from "@/types/news";
import { useNewsCategories } from "@/hooks/useNewsCategories";

interface NewsFiltersProps {
  filters: NewsFiltersType;
  onFiltersChange: (filters: NewsFiltersType) => void;
  onReset: () => void;
}

export const NewsFilters = ({ filters, onFiltersChange, onReset }: NewsFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const { categories, loading: categoriesLoading } = useNewsCategories();

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== undefined && value !== '' && value !== null
  ).length;

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value || undefined });
  };

  const handleCategoryChange = (categoryId: string) => {
    onFiltersChange({ 
      ...filters, 
      category: categoryId === 'all' ? undefined : categoryId 
    });
  };

  const handleFeaturedToggle = () => {
    onFiltersChange({ 
      ...filters, 
      featured: filters.featured ? undefined : true 
    });
  };

  const handleSortChange = (sort: string) => {
    const [sortField, order] = sort.split(':');
    onFiltersChange({ 
      ...filters, 
      sort: sortField,
      order: order as 'ASC' | 'DESC'
    });
  };

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date);
    onFiltersChange({ 
      ...filters, 
      date_from: date ? format(date, 'yyyy-MM-dd') : undefined 
    });
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
    onFiltersChange({ 
      ...filters, 
      date_to: date ? format(date, 'yyyy-MM-dd') : undefined 
    });
  };

  const handleReset = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    onReset();
    setIsOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar notícias..."
          value={filters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Badge
          variant={filters.featured ? "default" : "outline"}
          className="whitespace-nowrap cursor-pointer hover:bg-opacity-80"
          onClick={handleFeaturedToggle}
        >
          Em Destaque
        </Badge>

        {/* Categories */}
        {!categoriesLoading && categories.map((category) => (
          <Badge
            key={category.id}
            variant={filters.category === category.id ? "default" : "outline"}
            className="whitespace-nowrap cursor-pointer hover:bg-opacity-80"
            style={{
              backgroundColor: filters.category === category.id ? category.color : undefined,
              borderColor: category.color
            }}
            onClick={() => handleCategoryChange(category.id)}
          >
            {category.name}
          </Badge>
        ))}

        {/* Advanced Filters Button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filtros Avançados</SheetTitle>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              {/* Sort Options */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Ordenar por
                </label>
                <Select
                  value={`${filters.sort || 'published_at'}:${filters.order || 'DESC'}`}
                  onValueChange={handleSortChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published_at:DESC">Mais Recentes</SelectItem>
                    <SelectItem value="published_at:ASC">Mais Antigas</SelectItem>
                    <SelectItem value="title:ASC">Título A-Z</SelectItem>
                    <SelectItem value="title:DESC">Título Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-3">
                <label className="text-sm font-medium block">
                  Período de Publicação
                </label>
                
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: ptBR }) : "Data inicial"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={handleDateFromChange}
                        disabled={(date) => date > new Date() || (dateTo && date > dateTo)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: ptBR }) : "Data final"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={handleDateToChange}
                        disabled={(date) => date > new Date() || (dateFrom && date < dateFrom)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Reset Button */}
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="w-full"
                disabled={activeFiltersCount === 0}
              >
                <X className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex flex-wrap gap-2"
        >
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Busca: "{filters.search}"
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => handleSearchChange('')}
              />
            </Badge>
          )}
          
          {filters.category && (
            <Badge variant="secondary" className="gap-1">
              Categoria: {categories.find(c => c.id === filters.category)?.name}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => handleCategoryChange('all')}
              />
            </Badge>
          )}
          
          {filters.featured && (
            <Badge variant="secondary" className="gap-1">
              Em Destaque
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={handleFeaturedToggle}
              />
            </Badge>
          )}
        </motion.div>
      )}
    </div>
  );
};