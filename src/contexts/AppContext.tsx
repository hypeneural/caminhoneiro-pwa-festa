import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface AppState {
  isOnline: boolean;
  currentTab: string;
  syncQueue: Array<{
    id: string;
    action: string;
    data: any;
    timestamp: number;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: number;
    read: boolean;
  }>;
}

interface AppContextType {
  state: AppState;
  setCurrentTab: (tab: string) => void;
  addToSyncQueue: (action: string, data: any) => void;
  clearSyncQueue: () => void;
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const isOnline = useNetworkStatus();
  const [syncQueue, setSyncQueue] = useLocalStorage<AppState['syncQueue']>('syncQueue', []);
  const [notifications, setNotifications] = useLocalStorage<AppState['notifications']>('notifications', []);
  const [currentTab, setCurrentTab] = useState('home');

  const state: AppState = {
    isOnline,
    currentTab,
    syncQueue,
    notifications: notifications.filter(n => Date.now() - n.timestamp < 7 * 24 * 60 * 60 * 1000), // 7 dias
  };

  const addToSyncQueue = (action: string, data: any) => {
    const newItem = {
      id: crypto.randomUUID(),
      action,
      data,
      timestamp: Date.now(),
    };
    setSyncQueue(prev => [...prev, newItem]);
  };

  const clearSyncQueue = () => {
    setSyncQueue([]);
  };

  const addNotification = (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp' | 'read'>) => {
    const newNotification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Processar fila de sincronização quando voltar online
  useEffect(() => {
    if (isOnline && syncQueue.length > 0) {
      // Aqui você implementaria a lógica de sincronização
      console.log('Processando fila de sincronização:', syncQueue);
      // clearSyncQueue(); // Limpar após sincronizar
    }
  }, [isOnline, syncQueue]);

  const value: AppContextType = {
    state,
    setCurrentTab,
    addToSyncQueue,
    clearSyncQueue,
    addNotification,
    markNotificationAsRead,
    clearNotifications,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}