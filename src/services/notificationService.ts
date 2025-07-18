
import api from '@/lib/axios';
import { API } from '@/constants/api';

export interface NotificationAPI {
  id: number;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success';
  image_url?: string;
  icon: 'church' | 'music' | 'map-pin' | 'gift' | 'sparkles' | 'utensils' | 'cloud-rain';
  created_at: string;
  scheduled_for: string;
  is_read: number;
  is_active: number;
  category: string;
  link_url?: string;
}

export interface NotificationResponse {
  status: string;
  message: string;
  meta: {
    total_registros_filtrados: number;
    pagina_atual: number;
    registros_por_pagina: number;
    total_paginas: number;
    filtros_aplicados: string[];
    links: {
      self: string;
      proxima_pagina: string | null;
    };
  };
  data: NotificationAPI[];
}

const STORAGE_KEY = 'notifications_read';

const getReadNotifications = (): number[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('📡 notificationService: Erro ao ler notificações do localStorage:', error);
    return [];
  }
};

const saveReadNotifications = (ids: number[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error('📡 notificationService: Erro ao salvar notificações no localStorage:', error);
  }
};

export const notificationService = {
  async getNotifications(): Promise<NotificationResponse> {
    try {
      console.log('📡 notificationService: Fazendo requisição para /notifications');
      const response = await api.get(API.ENDPOINTS.NOTIFICATIONS.LIST);
      console.log('📡 notificationService: Resposta recebida:', response.data);

      // Atualizar o status de leitura com base no localStorage
      const readIds = getReadNotifications();
      response.data.data = response.data.data.map(notification => ({
        ...notification,
        is_read: readIds.includes(notification.id) ? 1 : 0
      }));

      return response.data;
    } catch (error) {
      console.error('📡 notificationService: Erro ao buscar notificações:', error);
      throw error;
    }
  },

  async markAsRead(notificationId: number): Promise<void> {
    try {
      console.log('📡 notificationService: Marcando como lida:', notificationId);
      const readIds = getReadNotifications();
      if (!readIds.includes(notificationId)) {
        readIds.push(notificationId);
        saveReadNotifications(readIds);
      }
      console.log('📡 notificationService: Marcada como lida com sucesso');
    } catch (error) {
      console.error('📡 notificationService: Erro ao marcar como lida:', error);
      throw error;
    }
  },

  async markAllAsRead(): Promise<void> {
    try {
      console.log('📡 notificationService: Marcando todas como lidas');
      const response = await this.getNotifications();
      const allIds = response.data.map(notification => notification.id);
      saveReadNotifications(allIds);
      console.log('📡 notificationService: Todas marcadas como lidas com sucesso');
    } catch (error) {
      console.error('📡 notificationService: Erro ao marcar todas como lidas:', error);
      throw error;
    }
  }
};
