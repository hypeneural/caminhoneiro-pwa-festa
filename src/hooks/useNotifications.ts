
import { useState, useEffect, useCallback } from 'react';
import { notificationService, NotificationAPI } from '@/services/notificationService';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
  read: boolean;
  icon?: 'church' | 'music' | 'map-pin' | 'gift' | 'sparkles' | 'utensils' | 'cloud-rain';
  imageUrl?: string;
  linkUrl?: string;
  category?: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readStatus, setReadStatus] = useLocalStorage<Record<string, boolean>>('notifications-read', {});

  const transformApiNotification = (apiNotification: NotificationAPI): Notification => ({
    id: apiNotification.id.toString(),
    title: apiNotification.title,
    message: apiNotification.description,
    type: apiNotification.type,
    timestamp: new Date(apiNotification.created_at).getTime(),
    read: readStatus[apiNotification.id.toString()] || apiNotification.is_read === 1,
    icon: apiNotification.icon,
    imageUrl: apiNotification.image_url,
    linkUrl: apiNotification.link_url,
    category: apiNotification.category
  });

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await notificationService.getNotifications();
      const transformedNotifications = response.data
        .filter(n => n.is_active === 1)
        .map(transformApiNotification)
        .sort((a, b) => b.timestamp - a.timestamp);
      
      setNotifications(transformedNotifications);
    } catch (err) {
      setError('Erro ao carregar notificações');
      console.error('Erro ao buscar notificações:', err);
    } finally {
      setLoading(false);
    }
  }, [readStatus]);

  const markAsRead = useCallback(async (notificationId: string) => {
    // Atualiza o estado local imediatamente
    setReadStatus(prev => ({ ...prev, [notificationId]: true }));
    
    // Atualiza a lista de notificações
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );

    // Tenta sincronizar com a API
    try {
      await notificationService.markAsRead(parseInt(notificationId));
    } catch (error) {
      console.warn('Falha ao sincronizar leitura com API:', error);
    }
  }, [setReadStatus]);

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications
      .filter(n => !n.read)
      .map(n => n.id);

    if (unreadIds.length === 0) return;

    // Atualiza estado local
    const newReadStatus = { ...readStatus };
    unreadIds.forEach(id => {
      newReadStatus[id] = true;
    });
    setReadStatus(newReadStatus);

    // Atualiza lista
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );

    // Sincroniza com API
    try {
      await Promise.all(
        unreadIds.map(id => notificationService.markAsRead(parseInt(id)))
      );
    } catch (error) {
      console.warn('Falha ao sincronizar algumas leituras com API:', error);
    }
  }, [notifications, readStatus, setReadStatus]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Polling para novas notificações (a cada 2 minutos)
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
}
