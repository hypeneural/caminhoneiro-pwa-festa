export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  timestamp: Date;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

export interface LoadingState {
  isLoading: boolean;
  loadingText?: string;
  progress?: number;
}

export interface ErrorState {
  hasError: boolean;
  errorMessage?: string;
  errorCode?: string;
  retryable?: boolean;
  timestamp?: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface SortParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  category?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetch?: Date;
  refetch?: () => Promise<void>;
}

export interface CacheConfig {
  ttl: number; // time to live in milliseconds
  maxSize: number;
  strategy: 'lru' | 'fifo' | 'manual';
}

export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  cache: CacheConfig;
  features: {
    enableAnalytics: boolean;
    enablePWA: boolean;
    enableOfflineMode: boolean;
  };
  theme: {
    defaultTheme: 'light' | 'dark' | 'system';
    enableThemeSwitch: boolean;
  };
}