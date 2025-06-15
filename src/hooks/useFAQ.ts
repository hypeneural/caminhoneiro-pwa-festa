import { useState, useEffect, useMemo } from 'react';
import { FAQItem, FAQCategory } from '@/types/faq';
import { mockFAQs, mockFAQCategories } from '@/data/mockFAQ';

export function useFAQ() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Load FAQ data
  useEffect(() => {
    const loadFAQs = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 200));
        setFaqs(mockFAQs);
        setCategories(mockFAQCategories);
      } catch (error) {
        console.error('Error loading FAQs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFAQs();
  }, []);

  // Filter FAQs based on category and search
  const filteredFAQs = useMemo(() => {
    let filtered = faqs;

    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(faq => faq.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(faq =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort by popularity/relevance
    return filtered.sort((a, b) => {
      // Prioritize popular questions
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;
      
      // Then by order
      return a.order - b.order;
    });
  }, [faqs, activeCategory, searchQuery]);

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setActiveCategory('all');
  };

  return {
    faqs: filteredFAQs,
    filteredFAQs,
    categories,
    activeCategory,
    searchQuery,
    loading,
    setActiveCategory,
    setSearchQuery,
    clearSearch
  };
}