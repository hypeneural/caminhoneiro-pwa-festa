
import { motion } from "framer-motion";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { FloatingActionButton } from "@/components/mobile/FloatingActionButton";
import { VirtualPhotoGridWithAds } from "@/components/gallery/VirtualPhotoGridWithAds";
import { TouchFriendlyLightbox } from "@/components/gallery/TouchFriendlyLightbox";
import { LightboxErrorBoundary } from "@/components/gallery/LightboxErrorBoundary";
import { TagSlider } from "@/components/gallery/TagSlider";
import { AdvancedFilters } from "@/components/gallery/AdvancedFilters";
import { useGallery } from "@/hooks/useGallery";
import { useEffect, useState } from "react";

const Gallery = () => {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  const {
    filteredPhotos,
    loading,
    selectedPhoto,
    lightboxOpen,
    favorites,
    filterOptions,
    selectedTagId,
    filters,
    totalPhotos,
    openLightbox,
    closeLightbox,
    navigatePhoto,
    toggleFavorite,
    selectTag,
    updateFilters,
    clearFilters,
    loadMorePhotos,
    hasMore,
    isLoadingMore,
    networkQuality
  } = useGallery();

  const currentIndex = selectedPhoto 
    ? filteredPhotos.findIndex(photo => photo.id === selectedPhoto.id) 
    : 0;

  // Controle do header baseado no scroll
  const handleScroll = (scrollTop: number) => {
    const currentScrollY = scrollTop;
    
    if (currentScrollY < 50) {
      // No topo, sempre mostrar header
      setIsHeaderVisible(true);
    } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
      // Scrolling down, esconder header
      setIsHeaderVisible(false);
    } else if (currentScrollY < lastScrollY) {
      // Scrolling up, mostrar header
      setIsHeaderVisible(true);
    }
    
    setLastScrollY(currentScrollY);
  };

  // Log para console apenas
  useEffect(() => {
    console.log('📱 Galeria:', {
      photos: filteredPhotos.length,
      loading,
      hasMore,
      network: networkQuality,
      selectedTag: selectedTagId
    });
  }, [filteredPhotos.length, loading, hasMore, networkQuality, selectedTagId]);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header com animação de entrada/saída - posição absoluta */}
      <motion.div 
        className="absolute top-0 left-0 right-0 bg-background border-b px-4 py-3 z-50 backdrop-blur-sm"
        initial={{ y: 0 }}
        animate={{ y: isHeaderVisible ? 0 : -80 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Galeria</h1>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-muted-foreground">
              {totalPhotos} fotos
            </span>
            <AdvancedFilters
              filters={filters}
              filterOptions={filterOptions}
              onFiltersChange={updateFilters}
              onClearFilters={clearFilters}
              isLoading={loading}
            />
          </div>
        </div>
      </motion.div>

      {/* Tag Slider fixo no topo - ocupa espaço do header quando ele some */}
      <motion.div 
        className="sticky top-0 z-40 bg-background border-b flex-shrink-0"
        initial={{ paddingTop: "80px" }}
        animate={{ paddingTop: isHeaderVisible ? "80px" : "0px" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <TagSlider
          tags={filterOptions?.tags || []}
          selectedTagId={selectedTagId}
          onTagSelect={selectTag}
          isLoading={!filterOptions}
        />
      </motion.div>

      {/* Content Area - ocupa toda altura disponível */}
      <div className="flex-1 min-h-0 relative">
        {loading && filteredPhotos.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">
                Carregando fotos...
              </p>
            </div>
          </div>
        )}

        {!loading && filteredPhotos.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center px-6">
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-lg font-semibold mb-2">
                {selectedTagId ? 'Nenhuma foto encontrada nesta categoria' : 'Nenhuma foto encontrada'}
              </h3>
              <p className="text-muted-foreground text-sm">
                {selectedTagId 
                  ? 'Tente selecionar outra categoria ou "Todas" para ver mais fotos'
                  : 'Aguarde novas fotos serem adicionadas'
                }
              </p>
              {selectedTagId && (
                <button
                  onClick={() => selectTag(null)}
                  className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
                >
                  Ver todas as fotos
                </button>
              )}
            </div>
          </div>
        )}

        {filteredPhotos.length > 0 && (
          <VirtualPhotoGridWithAds
            photos={filteredPhotos}
            loading={loading}
            hasMore={hasMore}
            onPhotoClick={openLightbox}
            onLoadMore={loadMorePhotos}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            isRefreshing={false}
            isLoadingMore={isLoadingMore}
            onScroll={handleScroll}
            enableAds={true} // ✅ Ativa sistema de banners
          />
        )}
              </div>

      {/* Touch Friendly Lightbox with Error Boundary */}
      <LightboxErrorBoundary onClose={closeLightbox}>
        <TouchFriendlyLightbox
          photo={selectedPhoto}
          isOpen={lightboxOpen}
          onClose={closeLightbox}
          onNavigate={navigatePhoto}
          onToggleFavorite={toggleFavorite}
          favorites={favorites}
          totalPhotos={filteredPhotos.length}
          currentIndex={currentIndex}
          allPhotos={filteredPhotos}
          enableBanners={true} // ✅ Ativa banner carousel
        />
      </LightboxErrorBoundary>

      {/* FAB */}
      <div className="fixed bottom-20 right-4 z-30">
        <FloatingActionButton />
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <BottomNavigation />
      </div>

      {/* Network quality feedback */}
      {networkQuality === 'slow' && (
        <div className="fixed bottom-20 left-4 right-4 z-50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium text-center"
          >
            📶 Conexão lenta - Otimizando carregamento
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
