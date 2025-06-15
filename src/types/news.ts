export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content?: string;
  imageUrl: string;
  publishedAt: Date;
  category: string;
  categoryColor: string;
  author: string;
  slug: string;
  views: number;
  likes: number;
  shares?: number;
  comments?: number;
  readTime?: string;
  tags: string[];
  featured: boolean;
  breaking?: boolean;
  trending?: boolean;
  hot?: boolean;
  priority?: 'low' | 'medium' | 'high';
  updatedAt?: Date;
  status?: 'draft' | 'published' | 'archived';
}

export interface NewsCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
  description?: string;
  count?: number;
}

export interface NewsFilters {
  category?: string;
  featured?: boolean;
  search?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  sortBy?: 'publishedAt' | 'views' | 'likes' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface NewsState {
  items: NewsItem[];
  categories: NewsCategory[];
  filters: NewsFilters;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}