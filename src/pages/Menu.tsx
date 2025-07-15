import { useState } from 'react';
import { useMenu } from '@/hooks/useMenu';
import { MenuHeader } from '@/components/menu/MenuHeader';
import { MenuGrid } from '@/components/menu/MenuGrid';
import { MenuFiltersSheet } from '@/components/menu/MenuFiltersSheet';
import { APIMenuItem } from '@/services/api/menuService';
import { useToast } from '@/hooks/use-toast';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { VirtualScroller } from '@/components/ui/virtual-scroller';

export default function Menu() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { toast } = useToast();
  
  const {
    categories,
    menuItems,
    favorites,
    searchTerm,
    activeCategory,
    priceRange,
    sortOrder,
    viewMode,
    hasActiveFilters,
    isLoading,
    isFetchingMore,
    hasMore,
    error,
    updateSearch,
    updateCategory,
    updatePriceRange,
    updateSortOrder,
    toggleViewMode,
    resetFilters,
    toggleFavorite,
    loadMore,
    refetch
  } = useMenu();

  // Handle item click (future implementation for item details)
  const handleItemClick = (item: APIMenuItem) => {
    // TODO: Implement item details modal/page
    toast({
      title: item.name,
      description: `${item.description || 'Sem descrição disponível'} - R$ ${item.price}`,
    });
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h2 className="text-xl font-semibold mb-2">Ops! Algo deu errado</h2>
        <p className="text-muted-foreground mb-4">
          Não foi possível carregar o cardápio. Tente novamente mais tarde.
        </p>
        <button
          onClick={() => refetch()}
          className="text-primary hover:underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-background pb-20">
        <MenuHeader
          categories={categories}
          activeCategory={activeCategory}
          searchTerm={searchTerm}
          viewMode={viewMode}
          onSearchChange={updateSearch}
          onCategoryChange={updateCategory}
          onViewModeToggle={toggleViewMode}
          onOpenFilters={() => setFiltersOpen(true)}
        />

        <MenuGrid
          items={menuItems}
          favorites={favorites}
          isLoading={isLoading}
          isFetchingMore={isFetchingMore}
          hasMore={hasMore}
          viewMode={viewMode}
          onLoadMore={loadMore}
          onFavoriteToggle={toggleFavorite}
          onItemClick={handleItemClick}
        />

        <MenuFiltersSheet
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          priceRange={priceRange}
          sortOrder={sortOrder}
          onPriceRangeChange={updatePriceRange}
          onSortOrderChange={updateSortOrder}
          onReset={resetFilters}
        />
      </main>

      <BottomNavigation />
    </>
  );
}