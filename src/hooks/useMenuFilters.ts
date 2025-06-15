import { useState, useMemo } from 'react';
import { MenuItem, MenuFilters } from '@/types/menu';

export function useMenuFilters(menuItems: MenuItem[]) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'rating' | 'popularity'>('popularity');
  const [filters, setFilters] = useState<MenuFilters>({
    priceRange: [0, 50],
    tags: [],
    category: [],
    vendor: []
  });

  const filteredItems = useMemo(() => {
    let filtered = [...menuItems];

    // Filtro por categoria ativa
    if (activeCategory && activeCategory !== 'all') {
      filtered = filtered.filter(item => item.category === activeCategory);
    }

    // Filtro por termo de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.ingredients.some(ingredient => 
          ingredient.toLowerCase().includes(searchLower)
        ) ||
        item.vendor.name.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por faixa de preço
    filtered = filtered.filter(item => 
      item.price >= filters.priceRange[0] && item.price <= filters.priceRange[1]
    );

    // Filtro por tags
    if (filters.tags.length > 0) {
      filtered = filtered.filter(item =>
        filters.tags.some(tag => item.tags.includes(tag as any))
      );
    }

    // Filtro por categoria (dos filtros avançados)
    if (filters.category.length > 0) {
      filtered = filtered.filter(item =>
        filters.category.includes(item.category)
      );
    }

    // Filtro por fornecedor
    if (filters.vendor.length > 0) {
      filtered = filtered.filter(item =>
        filters.vendor.includes(item.vendor.type)
      );
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return a.price - b.price;
        case 'rating':
          return (b.rating?.average || 0) - (a.rating?.average || 0);
        case 'popularity':
          return (b.rating?.count || 0) - (a.rating?.count || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [menuItems, activeCategory, searchTerm, sortBy, filters]);

  const updateFilters = (newFilters: Partial<MenuFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      priceRange: [0, 50],
      tags: [],
      category: [],
      vendor: []
    });
    setSearchTerm('');
    setActiveCategory(null);
  };

  const isFiltersActive = useMemo(() => {
    return (
      filters.tags.length > 0 ||
      filters.category.length > 0 ||
      filters.vendor.length > 0 ||
      filters.priceRange[0] > 0 ||
      filters.priceRange[1] < 50 ||
      searchTerm.length > 0
    );
  }, [filters, searchTerm]);

  return {
    filteredItems,
    activeCategory,
    setActiveCategory,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    filters,
    updateFilters,
    clearFilters,
    isFiltersActive
  };
}