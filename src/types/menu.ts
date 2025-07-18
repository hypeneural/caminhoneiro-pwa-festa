// API Response Types
export interface APIResponse<T> {
  status: 'success' | 'error';
  message: string | null;
  meta: {
    total?: number;
    page?: number;
    limit?: number;
  };
  data: T;
}

export interface APIMenuItem {
  id: number;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  created_at: string;
  category_id: number;
  category_name: string;
  icon_url: string;
  is_available?: number;
}

export interface APIMenuCategory {
  id: number;
  name: string;
  icon_url: string;
}

// Cart System Types
export interface CartItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_name: string;
  icon_url: string;
  quantity: number;
  customizations?: CartItemCustomization[];
  notes?: string;
}

export interface CartItemCustomization {
  id: string;
  name: string;
  price: number;
  selected: boolean;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
  lastUpdated: number;
  sessionId: string;
}

export interface Order {
  id: string;
  sessionId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  createdAt: number;
  estimatedTime?: number;
  notes?: string;
  customerInfo?: {
    name?: string;
    phone?: string;
    table?: string;
  };
}

// Enhanced Menu Types
export interface MenuItem extends APIMenuItem {
  formattedPrice: string;
  isFavorite: boolean;
  isInCart: boolean;
  cartQuantity: number;
}

export interface MenuReview {
  id: string;
  menuItemId: string;
  author: {
    name: string;
    avatar?: string;
  };
  rating: number; // 1-5
  comment: string;
  photos?: string[];
  date: Date;
  likes: number;
  verified: boolean; // se realmente participou da festa
}

export interface MenuFilters {
  priceRange: [number, number];
  tags: string[];
  category: number[];
  search: string;
  sortBy: 'name' | 'price' | 'category';
  sortOrder: 'ASC' | 'DESC';
}

export interface MenuPageState {
  menuItems: MenuItem[];
  reviews: MenuReview[];
  activeCategory: number | null;
  searchTerm: string;
  selectedItem: MenuItem | null;
  isModalOpen: boolean;
  favorites: number[]; // IDs dos itens favoritos
  filters: MenuFilters;
  sortBy: 'name' | 'price' | 'rating' | 'popularity';
  isLoading: boolean;
  error: string | null;
  viewMode: 'grid' | 'list';
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  type: 'combo' | 'discount' | 'happy-hour' | 'special';
  validUntil?: Date;
  image?: string;
  items?: string[]; // MenuItem IDs
  discountPercentage?: number;
  originalPrice?: number;
  promotionalPrice?: number;
}

// Voice Search Types
export interface VoiceSearchState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
}

// Cache Types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
  version: string;
}

export interface OfflineOrder {
  id: string;
  cart: Cart;
  timestamp: number;
  synced: boolean;
  retryCount: number;
}

// Query Parameters
export interface MenuQueryParams {
  search?: string;
  category?: number;
  min_price?: number;
  max_price?: number;
  sort?: 'price' | 'name';
  order?: 'ASC' | 'DESC';
  limit?: number;
  page?: number;
}