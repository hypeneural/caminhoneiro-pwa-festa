
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
  
  // Refs para controle de polling
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);
  const isFetchingRef = useRef(false);

  console.log('🔔 useNotifications: Hook inicializado');

  const transformApiNotification = useCallback((apiNotification: NotificationAPI): Notification => {
    return {
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
    };
  }, [readStatus]);

  const fetchNotifications = useCallback(async (useCache = true) => {
    // Previne requisições simultâneas
    if (isFetchingRef.current) {
      console.log('🔔 fetchNotifications: Requisição já em andamento, pulando...');
      return;
    }
    
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
    
    // Usa cache se disponível e ainda válido
    if (useCache && cachedNotifications.length > 0 && (now - lastFetch) < CACHE_DURATION) {
      console.log('🔔 fetchNotifications: Usando cache local');
      const transformedNotifications = cachedNotifications
        .filter(n => n.is_active === 1)
        .map(transformApiNotification)
        .sort((a, b) => b.timestamp - a.timestamp);
      
      setNotifications(transformedNotifications);
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    
    console.log('🔔 fetchNotifications: Fazendo requisição para API...');
    
    try {
      const response = await notificationService.getNotifications();
      console.log('🔔 fetchNotifications: Resposta recebida:', response);
      
      const activeNotifications = response.data.filter(n => n.is_active === 1);
      
      // Atualiza cache apenas se recebeu dados válidos
      if (activeNotifications.length >= 0) {
        setCachedNotifications(activeNotifications);
        setLastFetch(now);
        console.log('🔔 fetchNotifications: Cache atualizado com', activeNotifications.length, 'notificações');
      }
      
      // Transforma e ordena notificações
      const transformedNotifications = activeNotifications
        .map(transformApiNotification)
        .sort((a, b) => b.timestamp - a.timestamp);
      
      setNotifications(transformedNotifications);
      console.log('🔔 fetchNotifications: Estado atualizado com', transformedNotifications.length, 'notificações');
    } catch (err) {
      console.error('🔔 fetchNotifications: Erro:', err);
      setError('Erro ao carregar notificações');
      
      // Fallback para cache em caso de erro
      if (cachedNotifications.length > 0) {
        console.log('🔔 fetchNotifications: Usando fallback do cache');
        const transformedNotifications = cachedNotifications
          .filter(n => n.is_active === 1)
          .map(transformApiNotification)
          .sort((a, b) => b.timestamp - a.timestamp);
        
        setNotifications(transformedNotifications);
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [cachedNotifications, lastFetch, setCachedNotifications, setLastFetch, transformApiNotification]);

  const markAsRead = useCallback(async (notificationId: string) => {
    console.log('🔔 markAsRead:', notificationId);
    
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
      console.log('🔔 markAsRead: Sincronizado com API');
    } catch (error) {
      console.warn('🔔 markAsRead: Falha ao sincronizar:', error);
    }
  }, [setReadStatus]);

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications
      .filter(n => !n.read)
      .map(n => n.id);

    if (unreadIds.length === 0) return;

    console.log('🔔 markAllAsRead:', unreadIds.length, 'notificações');

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
      console.log('🔔 markAllAsRead: Sincronizado com API');
    } catch (error) {
      console.warn('🔔 markAllAsRead: Falha ao sincronizar:', error);
    }
  }, [notifications, readStatus, setReadStatus]);

  const startPolling = useCallback(() => {
    // Evita múltiplos intervalos
    if (isPollingRef.current || pollingIntervalRef.current) {
      console.log('🔔 startPolling: Polling já ativo');
      return;
    }
    
    console.log('🔔 startPolling: Iniciando polling a cada 60s');
    isPollingRef.current = true;
    
    pollingIntervalRef.current = setInterval(() => {
      if (!isFetchingRef.current) {
        console.log('🔔 Polling: Verificando novas notificações...');
        fetchNotifications(false); // Força busca na API sem cache
      } else {
        console.log('🔔 Polling: Pulando (requisição em andamento)');
      }
    }, 60 * 1000); // 60 segundos
  }, [fetchNotifications]);

  const stopPolling = useCallback(() => {
    console.log('🔔 stopPolling: Parando polling');
    isPollingRef.current = false;
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Efeito principal - executa apenas uma vez
  useEffect(() => {
    console.log('🔔 useNotifications: Efeito principal executado');
    
    // Busca inicial
    fetchNotifications();
    
    // Inicia polling
    startPolling();
    
    // Cleanup
    return () => {
      console.log('🔔 useNotifications: Cleanup executado');
      stopPolling();
    };
  }, []); // Array vazio - executa apenas uma vez

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
