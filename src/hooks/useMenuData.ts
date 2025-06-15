import { useState, useEffect } from 'react';
import { MenuItem, MenuReview } from '@/types/menu';
import { mockMenuItems, mockReviews } from '@/data/menuData';

export function useMenuData() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<MenuReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simular carregamento de dados
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Simular delay de rede
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setMenuItems(mockMenuItems);
        setReviews(mockReviews);
        setError(null);
      } catch (err) {
        setError('Erro ao carregar dados do cardápio');
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return {
    menuItems,
    reviews,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      setTimeout(() => {
        setMenuItems(mockMenuItems);
        setReviews(mockReviews);
        setLoading(false);
      }, 500);
    }
  };
}