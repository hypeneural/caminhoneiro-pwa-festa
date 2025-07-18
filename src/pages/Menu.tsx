import { useState } from 'react';
import { useMenu } from '@/hooks/useMenu';
import { useCart } from '@/hooks/useCart';
import { MenuHeader } from '@/components/menu/MenuHeader';
import { MenuGrid } from '@/components/menu/MenuGrid';
import { MenuFiltersSheet } from '@/components/menu/MenuFiltersSheet';
import { FloatingCartButton } from '@/components/cart/FloatingCartButton';
import { CartModal } from '@/components/cart/CartModal';
import { APIMenuItem } from '@/types/menu';
import { useToast } from '@/hooks/use-toast';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, ChefHat, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';

export default function Menu() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  const { 
    isCartOpen, 
    openCart, 
    closeCart, 
    addToCart
  } = useCart();
  
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

  // Handle item click - show details in future, for now add to cart
  const handleItemClick = async (item: APIMenuItem) => {
    try {
      // Quick add to cart with haptic feedback
      await addToCart(item, 1);
      
      // Success toast with better messaging
      toast({
        title: "✨ Adicionado com sucesso!",
        description: `${item.name} está no seu carrinho.`,
        duration: 2500,
      });
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "😔 Ops! Algo deu errado",
        description: "Não conseguimos adicionar o item. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Handle retry when offline or error
  const handleRetry = async () => {
    try {
      await refetch();
      toast({
        title: "🎉 Conectado!",
        description: "Cardápio atualizado com sucesso.",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "📱 Modo offline ativo",
        description: "Usando dados salvos no seu dispositivo.",
        duration: 3000,
      });
    }
  };

  // Enhanced error state with better UX
  if (error && !menuItems.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md w-full space-y-6"
          >
            {/* Error Icon with Animation */}
            <motion.div
              animate={{ 
                rotate: isOnline ? [0, 10, -10, 0] : 0,
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: isOnline ? 0.6 : 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center shadow-lg"
            >
              {isOnline ? (
                <ChefHat className="w-10 h-10 text-orange-600" />
              ) : (
                <WifiOff className="w-10 h-10 text-red-600" />
              )}
            </motion.div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {isOnline ? '🍳 Cozinha em preparação' : '📡 Você está offline'}
              </h2>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                {isOnline 
                  ? 'Nosso cardápio está sendo preparado. Que tal tentar novamente em alguns instantes?'
                  : 'Sem conexão com a internet. Verifique sua rede para ver o cardápio completo.'
                }
              </p>
            </div>
            
            <Button 
              onClick={handleRetry} 
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              {isOnline ? 'Tentar novamente' : 'Reconectar'}
            </Button>

            {/* Helpful tip */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <p className="text-blue-800 text-sm">
                💡 <strong>Dica:</strong> Quando conectado, o cardápio fica salvo no seu dispositivo para acesso offline.
              </p>
            </Card>
          </motion.div>
        </div>
        
        <BottomNavigation />
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gray-50 pb-20 relative">
        {/* Enhanced Offline Indicator */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-0 left-0 right-0 z-50"
            >
              <Alert className="rounded-none border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 shadow-md">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <WifiOff className="h-4 w-4" />
                </motion.div>
                <AlertDescription className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">📱 Modo offline</span>
                    <span className="text-amber-600">•</span>
                    <span className="text-sm">cardápio salvo localmente</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleRetry}
                    className="h-7 px-3 text-amber-800 hover:bg-amber-100 rounded-lg font-medium"
                  >
                    <Wifi className="w-3 h-3 mr-1" />
                    Conectar
                  </Button>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading overlay for better UX */}
        <AnimatePresence>
          {isLoading && !menuItems.length && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-white/80 backdrop-blur-sm z-40 flex items-center justify-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={!isOnline ? 'pt-16' : ''}
        >
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

          {/* Quick Stats */}
          {menuItems.length > 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="px-4 pb-2"
            >
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <ChefHat className="w-4 h-4" />
                  <span>{menuItems.length} pratos disponíveis</span>
                </div>
                {hasActiveFilters && (
                  <div className="flex items-center gap-1">
                    <span>•</span>
                    <button 
                      onClick={resetFilters}
                      className="text-green-600 hover:text-green-700 font-medium"
                    >
                      Limpar filtros
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          <MenuGrid
            items={menuItems}
            favorites={favorites.map(id => id.toString())}
            isLoading={isLoading}
            isFetchingMore={isFetchingMore}
            hasMore={hasMore}
            viewMode={viewMode}
            onLoadMore={loadMore}
            onFavoriteToggle={toggleFavorite}
            onItemClick={handleItemClick}
          />

          {/* Loading more indicator */}
          <AnimatePresence>
            {isFetchingMore && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center justify-center py-8"
              >
                <div className="flex items-center gap-3 text-gray-600">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-gray-300 border-t-green-600 rounded-full"
                  />
                  <span className="text-sm">Carregando mais pratos...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Enhanced Filters Sheet */}
        <MenuFiltersSheet
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          priceRange={priceRange}
          sortOrder={sortOrder}
          onPriceRangeChange={updatePriceRange}
          onSortOrderChange={updateSortOrder}
          onReset={resetFilters}
        />

        {/* Floating Cart Button with enhanced animations */}
        <FloatingCartButton onCartClick={openCart} />

        {/* Modern Cart Modal */}
        <CartModal isOpen={isCartOpen} onClose={closeCart} />
      </main>

      <BottomNavigation />
    </>
  );
}