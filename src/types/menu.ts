export interface MenuItem {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  price: number;
  currency: 'BRL';
  category: 'main' | 'snacks' | 'regional' | 'drinks' | 'desserts' | 'fast';
  images: string[];
  ingredients: string[];
  allergens?: string[];
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  tags: Array<'vegetarian' | 'vegan' | 'gluten-free' | 'spicy' | 'popular' | 'new' | 'large-portion'>;
  preparationTime?: number; // minutos
  rating?: {
    average: number;
    count: number;
  };
  vendor: {
    name: string;
    location: string;
    type: 'food-court' | 'food-truck' | 'regional-stand';
  };
  availability: {
    days: ('saturday' | 'sunday')[];
    hours: {
      start: string; // "10:00"
      end: string; // "22:00"
    };
  };
  promotions?: Array<{
    type: 'combo' | 'discount' | 'happy-hour';
    description: string;
    validUntil?: Date;
  }>;
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
  category: string[];
  vendor: string[];
}

export interface MenuPageState {
  menuItems: MenuItem[];
  reviews: MenuReview[];
  activeCategory: string | null;
  searchTerm: string;
  selectedItem: MenuItem | null;
  isModalOpen: boolean;
  favorites: string[]; // IDs dos itens favoritos
  filters: MenuFilters;
  sortBy: 'name' | 'price' | 'rating' | 'popularity';
  isLoading: boolean;
  error: string | null;
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