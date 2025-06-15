import { useState, useEffect } from 'react';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Carregar favoritos do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('menu-favorites');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    }
  }, []);

  // Salvar favoritos no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('menu-favorites', JSON.stringify(favorites));
    } catch (error) {
      console.error('Erro ao salvar favoritos:', error);
    }
  }, [favorites]);

  const toggleFavorite = (itemId: string) => {
    setFavorites(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const addFavorite = (itemId: string) => {
    setFavorites(prev => {
      if (!prev.includes(itemId)) {
        return [...prev, itemId];
      }
      return prev;
    });
  };

  const removeFavorite = (itemId: string) => {
    setFavorites(prev => prev.filter(id => id !== itemId));
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  return {
    favorites,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
    isFavorite: (itemId: string) => favorites.includes(itemId),
    favoritesCount: favorites.length
  };
}