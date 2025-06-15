export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  popular: boolean;
  order: number;
  lastUpdated: Date;
}

export interface FAQCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  count: number;
  description?: string;
}

export interface FAQFilters {
  category?: string;
  search?: string;
  tags?: string[];
}

export interface FAQState {
  items: FAQItem[];
  categories: FAQCategory[];
  filters: FAQFilters;
  loading: boolean;
  error: string | null;
}