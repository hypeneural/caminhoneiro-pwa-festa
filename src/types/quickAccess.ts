import { LucideIcon } from 'lucide-react';

export interface QuickAccessBadge {
  count: number;
  type: 'notification' | 'update' | 'new' | 'warning';
  color?: string;
  pulse?: boolean;
}

export interface QuickAccessItem {
  id: string;
  title: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  route: string;
  badge?: QuickAccessBadge;
  category: 'media' | 'navigation' | 'schedule' | 'info' | 'tools';
  priority: number;
  description: string;
  isActive: boolean;
  requiresAuth?: boolean;
  isExternal?: boolean;
  metadata?: {
    lastUsed?: Date;
    useCount?: number;
    isFavorite?: boolean;
  };
}

export interface QuickAccessCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  items: QuickAccessItem[];
  isCollapsed?: boolean;
}

export interface QuickAccessFilters {
  category?: string;
  isActive?: boolean;
  search?: string;
  showFavorites?: boolean;
  sortBy?: 'priority' | 'title' | 'lastUsed' | 'useCount';
  sortOrder?: 'asc' | 'desc';
}

export interface QuickAccessState {
  items: QuickAccessItem[];
  categories: QuickAccessCategory[];
  filters: QuickAccessFilters;
  favorites: string[];
  recentlyUsed: string[];
  loading: boolean;
  error: string | null;
}