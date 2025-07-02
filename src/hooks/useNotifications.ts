import { useState, useEffect, useCallback } from 'react';
import { notificationService, Notification } from '@/services/api/notificationService';
import { API } from '@/constants/api';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  loading: boolean; // Alias para compatibilidade
  error: string | null;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      console.log('🔔 fetchNotifications: Fazendo requisição para API...');
      const response = await notificationService.getNotifications();
      setNotifications(response.data);
      setUnreadCount(response.unread_count);
      setError(null);
    } catch (err) {
      console.error('🔔 fetchNotifications: Erro:', err);
      setError('Erro ao carregar notificações');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('🔔 markAsRead: Erro:', err);
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('🔔 markAllAsRead: Erro:', err);
      throw err;
    }
  }, []);

  const startPolling = useCallback(() => {
    console.log('🔔 startPolling: Iniciando polling...');
    const interval = setInterval(fetchNotifications, API.DEFAULTS.NOTIFICATION_POLL_INTERVAL);
    setPollingInterval(interval);
    return () => {
      if (interval) {
        console.log('🔔 stopPolling: Parando polling');
        clearInterval(interval);
      }
    };
  }, [fetchNotifications]);

  useEffect(() => {
    console.log('🔔 useNotifications: Hook inicializado');
    fetchNotifications();
    const cleanup = startPolling();

    return () => {
      console.log('🔔 useNotifications: Cleanup executado');
      cleanup();
    };
  }, [fetchNotifications, startPolling]);

  return {
    notifications,
    unreadCount,
    isLoading,
    loading: isLoading, // Alias para compatibilidade
    error,
    markAsRead,
    markAllAsRead,
  };
}
