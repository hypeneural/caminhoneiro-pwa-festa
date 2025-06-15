import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { FloatingActionButton } from "@/components/mobile/FloatingActionButton";
import { IntelligentSearch } from "@/components/gallery/IntelligentSearch";
import { NativePhotoGrid } from "@/components/gallery/NativePhotoGrid";
import { PullToRefresh } from "@/components/gallery/PullToRefresh";
import { PhotoLightbox } from "@/components/gallery/PhotoLightbox";
import { useGallery } from "@/hooks/useGallery";

const Gallery = () => {
  const {
    filteredPhotos,
    loading,
    selectedPhoto,
    lightboxOpen,
    filters,
    favorites,
    updateFilters,
    clearFilters,
    openLightbox,
    closeLightbox,
    navigatePhoto,
    toggleFavorite,
    isFiltersActive,
    loadMorePhotos,
    refreshPhotos,
    hasMore
  } = useGallery();

  const currentIndex = selectedPhoto 
    ? filteredPhotos.findIndex(photo => photo.id === selectedPhoto.id) 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 flex items-center shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-trucker-blue rounded-lg flex items-center justify-center">
            <Camera className="w-5 h-5 text-trucker-blue-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Galeria</h1>
            <p className="text-xs text-muted-foreground">
              {filteredPhotos.length} foto{filteredPhotos.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </motion.header>

      {/* Intelligent Search */}
      <IntelligentSearch
        filters={filters}
        onFiltersChange={updateFilters}
        onClearFilters={clearFilters}
        isFiltersActive={isFiltersActive}
        photos={filteredPhotos}
      />

      {/* Main content with Pull to Refresh */}
      <main className="flex-1 pb-20">
        <PullToRefresh onRefresh={refreshPhotos}>
          <NativePhotoGrid
            photos={filteredPhotos}
            loading={loading}
            hasMore={hasMore}
            onPhotoClick={openLightbox}
            onLoadMore={loadMorePhotos}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        </PullToRefresh>
      </main>

      {/* Lightbox */}
      <PhotoLightbox
        photo={selectedPhoto}
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        onNavigate={navigatePhoto}
        onToggleFavorite={toggleFavorite}
        favorites={favorites}
        totalPhotos={filteredPhotos.length}
        currentIndex={currentIndex}
      />

      {/* FAB */}
      <FloatingActionButton />

      <BottomNavigation />
    </div>
  );
};

export default Gallery;