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
  shares?: number;
  comments?: number;
  tags: string[];
  readTime?: string;
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
  search?: string;
  status?: 'published' | 'draft' | 'archived';
  featured?: boolean;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export interface NewsCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export interface NewsCategoriesResponse {
  status: string;
  message: string | null;
  meta: any[];
  data: NewsCategory[];
}

export interface NewsState {
  items: NewsItem[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}