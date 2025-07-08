export interface PodcastItem {
  id: string;
  title: string;
  description: string;
  thumb_url: string;
  created_at: string;
}

export interface PodcastResponse {
  status: string;
  message: string;
  meta: {
    total: number;
    page: number;
    limit: number;
  };
  data: PodcastItem[];
}

export interface PodcastFilters {
  search?: string;
  page?: number;
  limit?: number;
  sort?: 'created_at' | 'display_order' | 'title';
  order?: 'ASC' | 'DESC';
}

export interface PodcastState {
  items: PodcastItem[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}