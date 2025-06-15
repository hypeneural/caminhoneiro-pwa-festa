import { useState, useEffect } from 'react';
import { QuickAccessBadge } from '@/types/quickAccess';

interface BadgeData {
  [itemId: string]: QuickAccessBadge | undefined;
}

export function useDynamicBadges() {
  const [badges, setBadges] = useState<BadgeData>({});

  // Simular dados dinâmicos de badges
  useEffect(() => {
    const updateBadges = () => {
      const now = new Date();
      const dynamicBadges: BadgeData = {};

      // Galeria: mostrar novas fotos
      if (Math.random() > 0.3) {
        dynamicBadges.galeria = {
          count: Math.floor(Math.random() * 10) + 1,
          type: 'new',
          pulse: true
        };
      }

      // Programação: mostrar atualizações
      if (now.getHours() >= 8 && now.getHours() <= 22) {
        dynamicBadges.programacao = {
          count: Math.floor(Math.random() * 3) + 1,
          type: 'update',
          pulse: false
        };
      }

      // Notícias: sempre mostrar algumas
      dynamicBadges.noticias = {
        count: Math.floor(Math.random() * 5) + 1,
        type: 'new',
        pulse: true
      };

      // Mapa: mostrar se ao vivo
      if (now.getHours() >= 6 && now.getHours() <= 23) {
        dynamicBadges.mapa = {
          count: 1,
          type: 'notification',
          color: 'bg-emerald-500',
          pulse: true
        };
      }

      setBadges(dynamicBadges);
    };

    // Atualizar badges inicialmente
    updateBadges();

    // Atualizar a cada 30 segundos
    const interval = setInterval(updateBadges, 30000);

    return () => clearInterval(interval);
  }, []);

  const getBadgeForItem = (itemId: string): QuickAccessBadge | undefined => {
    return badges[itemId];
  };

  return {
    badges,
    getBadgeForItem
  };
}