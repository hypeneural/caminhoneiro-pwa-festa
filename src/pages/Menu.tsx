import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, Search, Filter, Heart, MapPin, Star, Info } from "lucide-react";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { MenuHeader } from "@/components/menu/MenuHeader";
import { CategoryTabs } from "@/components/menu/CategoryTabs";
import { MenuGrid } from "@/components/menu/MenuGrid";
import { MenuFilters } from "@/components/menu/MenuFilters";
import { MenuSearch } from "@/components/menu/MenuSearch";
import { MenuModal } from "@/components/menu/MenuModal";
import { FavoritesSection } from "@/components/menu/FavoritesSection";
import { PromotionsSection } from "@/components/menu/PromotionsSection";
import { useMenuData } from "@/hooks/useMenuData";
import { useMenuFilters } from "@/hooks/useMenuFilters";
import { useFavorites } from "@/hooks/useFavorites";
import { MenuItem } from "@/types/menu";

const Menu = () => {
  const { menuItems, reviews, loading } = useMenuData();
  const { favorites, toggleFavorite } = useFavorites();
  const {
    filteredItems,
    activeCategory,
    setActiveCategory,
    searchTerm,
    setSearchTerm,
    filters,
    updateFilters,
    clearFilters,
    isFiltersActive
  } = useMenuFilters(menuItems);

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);

  const favoriteItems = useMemo(() => 
    menuItems.filter(item => favorites.includes(item.id)),
    [menuItems, favorites]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <MenuHeader />

      {/* Search and Filters */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="px-4 py-3 space-y-3">
          <MenuSearch 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isFiltersActive 
                  ? 'bg-trucker-red text-trucker-red-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtros
              {isFiltersActive && (
                <span className="w-2 h-2 bg-trucker-red-foreground rounded-full" />
              )}
            </button>

            <button
              onClick={() => setShowFavorites(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              <Heart className="w-4 h-4" />
              Favoritos
              {favoriteItems.length > 0 && (
                <span className="bg-trucker-red text-trucker-red-foreground text-xs px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                  {favoriteItems.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <CategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Promotions */}
      <PromotionsSection />

      {/* Main content */}
      <main className="flex-1 pb-20">
        <MenuGrid
          items={filteredItems}
          loading={loading}
          favorites={favorites}
          onItemClick={setSelectedItem}
          onToggleFavorite={toggleFavorite}
        />
      </main>

      {/* Item Detail Modal */}
      <MenuModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        reviews={reviews.filter(r => r.menuItemId === selectedItem?.id)}
        isFavorite={selectedItem ? favorites.includes(selectedItem.id) : false}
        onToggleFavorite={() => selectedItem && toggleFavorite(selectedItem.id)}
      />

      {/* Filters Modal */}
      <MenuFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={updateFilters}
        onClearFilters={clearFilters}
        isFiltersActive={isFiltersActive}
      />

      {/* Favorites Modal */}
      <FavoritesSection
        isOpen={showFavorites}
        onClose={() => setShowFavorites(false)}
        favoriteItems={favoriteItems}
        onItemClick={setSelectedItem}
        onToggleFavorite={toggleFavorite}
      />

      <BottomNavigation />
    </div>
  );
};

export default Menu;