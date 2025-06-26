
import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [lastFetch, setLastFetch] = useLocalStorage<number>('notifications-last-fetch', 0);
  const [cachedNotifications, setCachedNotifications] = useLocalStorage<NotificationAPI[]>('notifications-cache', []);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  const transformApiNotification = useCallback((apiNotification: NotificationAPI): Notification => ({
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
  }), [readStatus]);

  const fetchNotifications = useCallback(async (useCache = true) => {
    // Previne requisições simultâneas
    if (loading) return;
    
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
    
    // Usa cache se disponível e ainda válido
    if (useCache && cachedNotifications.length > 0 && (now - lastFetch) < CACHE_DURATION) {
      const transformedNotifications = cachedNotifications
        .filter(n => n.is_active === 1)
        .map(transformApiNotification)
        .sort((a, b) => b.timestamp - a.timestamp);
      
      setNotifications(transformedNotifications);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await notificationService.getNotifications();
      const activeNotifications = response.data.filter(n => n.is_active === 1);
      
      // Atualiza cache apenas se recebeu dados válidos
      if (activeNotifications.length >= 0) {
        setCachedNotifications(activeNotifications);
        setLastFetch(now);
      }
      
      // Transforma e ordena notificações
      const transformedNotifications = activeNotifications
        .map(transformApiNotification)
        .sort((a, b) => b.timestamp - a.timestamp);
      
      setNotifications(transformedNotifications);
    } catch (err) {
      setError('Erro ao carregar notificações');
      console.error('Erro ao buscar notificações:', err);
      
      // Fallback para cache em caso de erro
      if (cachedNotifications.length > 0) {
        const transformedNotifications = cachedNotifications
          .filter(n => n.is_active === 1)
          .map(transformApiNotification)
          .sort((a, b) => b.timestamp - a.timestamp);
        
        setNotifications(transformedNotifications);
      }
    } finally {
      setLoading(false);
    }
  }, [loading, cachedNotifications, lastFetch, setCachedNotifications, setLastFetch, transformApiNotification]);

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

  const startPolling = useCallback(() => {
    // Evita múltiplos intervalos
    if (isPollingRef.current) return;
    
    isPollingRef.current = true;
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(() => {
      if (!loading) {
        fetchNotifications(false); // Força busca na API sem cache
      }
    }, 60 * 1000); // 60 segundos
  }, [fetchNotifications, loading]);

  const stopPolling = useCallback(() => {
    isPollingRef.current = false;
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Busca inicial e inicia polling
  useEffect(() => {
    fetchNotifications();
    startPolling();
    
    return () => {
      stopPolling();
    };
  }, []); // Array vazio para executar apenas uma vez

  // Limpa polling ao desmontar
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: () => fetchNotifications(false)
  };
}
