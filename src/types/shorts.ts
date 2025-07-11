export interface Short {
  id: string;
  title: string;
  thumb_url: string;
  created_at: string;
}

export interface ShortsResponse {
  status: string;
  message: string;
  meta: {
    total: number;
    page: number;
    limit: number;
  };
  data: Short[];
}

export interface ShortsQueryParams {
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sort?: 'created_at' | 'title';
  order?: 'ASC' | 'DESC';
}