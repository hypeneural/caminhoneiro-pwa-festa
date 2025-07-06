
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
}

interface AppContextType {
  state: AppState;
  setCurrentTab: (tab: string) => void;
  addToSyncQueue: (action: string, data: any) => void;
  clearSyncQueue: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { isOnline } = useNetworkStatus();
  const [syncQueue, setSyncQueue] = useLocalStorage<AppState['syncQueue']>('syncQueue', []);
  const [currentTab, setCurrentTab] = useState('home');

  const state: AppState = {
    isOnline,
    currentTab,
    syncQueue,
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

  // Processar fila de sincronização quando voltar online
  useEffect(() => {
    if (isOnline && syncQueue.length > 0) {
      console.log('Processando fila de sincronização:', syncQueue);
      // Aqui você implementaria a lógica de sincronização
      // clearSyncQueue(); // Limpar após sincronizar
    }
  }, [isOnline, syncQueue]);

  const value: AppContextType = {
    state,
    setCurrentTab,
    addToSyncQueue,
    clearSyncQueue,
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
