export interface NewsItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content?: string;
  imageUrl: string;
  publishedAt: Date;
  category: string;
  categoryColor: string;
  categoryId: string;
  author: string;
  featured: boolean;
  status: 'published' | 'draft' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  // UI specific fields
  views: number;
  likes: number;
  comments?: number;
  tags: string[];
  breaking?: boolean;
  trending?: boolean;
  hot?: boolean;
}

export interface NewsResponse {
  status: string;
  message: string;
  meta: {
    total: number;
    page: number;
    limit: number;
  };
  data: Array<{
    id: string;
    title: string;
    slug: string;
    summary: string;
    content: string;
    image_url: string;
    category_id: string;
    author: string;
    featured: number;
    status: 'published' | 'draft';
    published_at: string;
    created_at: string;
    updated_at: string;
    category_name: string;
    category_color: string;
  }>;
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
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}