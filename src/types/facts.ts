export interface Fact {
  id: number;
  summary: string;
  body: string;
  created_at: string;
  category_id: number;
  category_name: string;
  category_icon: string;
}

export interface FactCategory {
  id: number;
  name: string;
  icon: string;
}

export interface FactFilters {
  category?: number;
  search?: string;
  page?: number;
  limit?: number;
  sort?: 'created_at' | 'display_order';
  order?: 'ASC' | 'DESC';
}

export interface FactResponse {
  status: 'success' | 'error';
  message: string;
  meta: {
    total: number;
    page: number;
    limit: number;
  };
  data: Fact[];
}

export interface FactCategoriesResponse {
  status: 'success' | 'error';
  message: string | null;
  meta: any[];
  data: FactCategory[];
}

export interface FactState {
  items: Fact[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
} 