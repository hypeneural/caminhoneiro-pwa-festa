export interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string;
  title?: string;
  description?: string;
  category: 'caminhoes' | 'carretas' | 'familia' | 'shows' | 'religioso' | 'geral';
  vehiclePlate?: string;
  timestamp: Date;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  photographer?: string;
  views: number;
  likes: number;
  tags: string[];
  fileSize: number;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface GalleryFilters {
  category: string[];
  dateRange: {
    start?: Date;
    end?: Date;
  };
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'all';
  sortBy: 'newest' | 'oldest' | 'most-viewed' | 'most-liked';
  searchQuery: string;
  vehiclePlate: string;
}

export interface GalleryState {
  photos: Photo[];
  filteredPhotos: Photo[];
  loading: boolean;
  error: string | null;
  selectedPhoto: Photo | null;
  lightboxOpen: boolean;
  filters: GalleryFilters;
  favorites: string[];
  viewMode: 'grid' | 'masonry';
  hasMore: boolean;
  page: number;
}

export type CategoryType = 'Todos' | 'Caminhões' | 'Carretas' | 'Família' | 'Shows' | 'Momentos Religiosos';