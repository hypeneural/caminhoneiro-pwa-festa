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
  brand?: string;
  model?: string;
  modelYear?: string;
  manufacturingYear?: string;
  color?: string;
  city?: string;
  fuelType?: string;
  vehicleType?: string;
  featured?: boolean;
  tagCategory?: 'transportadora1' | 'transportadora2' | 'bencao' | 'sao-cristovao' | 'pavilhao';
}

export interface GalleryFilters {
  category: string[];
  dateRange: {
    start?: Date;
    end?: Date;
  };
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'all';
  sortBy: 'newest' | 'oldest' | 'mostViewed' | 'mostLiked';
  searchQuery: string;
  vehiclePlate: string;
  brand?: string;
  model?: string;
  modelYear?: string;
  manufacturingYear?: string;
  color?: string;
  city?: string;
  fuelType?: string;
  vehicleType?: string;
  specificDate?: Date;
  timeRange: {
    start?: string;
    end?: string;
  };
  showFeaturedOnly: boolean;
  tagCategory: string;
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
