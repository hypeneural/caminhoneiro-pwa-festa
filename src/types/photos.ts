export interface PhotoItem {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  title: string;
  category: string;
  likes: number;
  isLiked: boolean;
  photographer: string;
  capturedAt: Date;
  location: string;
  tags: string[];
  featured: boolean;
  views: number;
  downloads: number;
  resolution: {
    width: number;
    height: number;
  };
  fileSize: string;
  description?: string;
  exifData?: {
    camera?: string;
    lens?: string;
    settings?: string;
    iso?: number;
    aperture?: string;
    shutterSpeed?: string;
  };
}

export interface PhotoCategory {
  id: string;
  name: string;
  slug: string;
  count: number;
  thumbnail?: string;
}

export interface PhotoFilters {
  category?: string;
  featured?: boolean;
  search?: string;
  photographer?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  sortBy?: 'capturedAt' | 'likes' | 'views' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface PhotoState {
  items: PhotoItem[];
  categories: PhotoCategory[];
  filters: PhotoFilters;
  favorites: string[];
  loading: boolean;
  error: string | null;
  selectedPhoto: PhotoItem | null;
  lightboxOpen: boolean;
}