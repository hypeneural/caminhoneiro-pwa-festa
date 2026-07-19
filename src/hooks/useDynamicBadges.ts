import { useState, useEffect } from 'react';
import { QuickAccessBadge } from '@/types/quickAccess';

interface BadgeData {
  [itemId: string]: QuickAccessBadge | undefined;
}

export function useDynamicBadges() {
  const [badges, setBadges] = useState<BadgeData>({});

  // Badges estáveis para destacar os pontos oficiais da edição 2026.
  useEffect(() => {
    const updateBadges = () => {
      const dynamicBadges: BadgeData = {};

      dynamicBadges.programacao = {
        count: 6,
        type: 'update',
        pulse: false
      };

      dynamicBadges.rota = {
        count: 1,
        type: 'notification',
        color: 'bg-emerald-500',
        pulse: false
      };

      dynamicBadges.noticias = {
        count: 2,
        type: 'new',
        pulse: false
      };

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
