
import { motion } from "framer-motion";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { FloatingActionButton } from "@/components/mobile/FloatingActionButton";
import { VehicleFilters } from "@/components/gallery/VehicleFilters";
import { TagSegmentation } from "@/components/gallery/TagSegmentation";
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
    <div className="flex flex-col min-h-screen bg-background">
      {/* Segmentação por tags fixa no topo */}
      <TagSegmentation
        selectedTag={filters.tagCategory}
        onTagChange={(tag) => updateFilters({ tagCategory: tag })}
      />

      {/* Filtros fixos abaixo das tags */}
      <VehicleFilters
        filters={filters}
        onFiltersChange={updateFilters}
        onClearFilters={clearFilters}
        isFiltersActive={isFiltersActive}
      />

      {/* Content Area */}
      <div className="flex-1">
        {/* Main content with Pull to Refresh */}
        <main className="flex-1 pb-20">
          <PullToRefresh onRefresh={refreshPhotos}>
            <div className="pt-2">
              <NativePhotoGrid
                photos={filteredPhotos}
                loading={loading}
                hasMore={hasMore}
                onPhotoClick={openLightbox}
                onLoadMore={loadMorePhotos}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
              />
            </div>
          </PullToRefresh>
        </main>
      </div>

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

      {/* FAB para enviar fotos */}
      <FloatingActionButton />

      <BottomNavigation />
    </div>
  );
};

export default Gallery;
