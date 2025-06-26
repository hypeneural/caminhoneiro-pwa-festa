
import api from '@/lib/axios';

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

export const notificationService = {
  async getNotifications(): Promise<NotificationResponse> {
    try {
      console.log('📡 notificationService: Fazendo requisição para /v1/notifications');
      const response = await api.get('/v1/notifications');
      console.log('📡 notificationService: Resposta recebida:', response.data);
      return response.data;
    } catch (error) {
      console.error('📡 notificationService: Erro ao buscar notificações:', error);
      throw error;
    }
  },

  async markAsRead(notificationId: number): Promise<void> {
    try {
      console.log('📡 notificationService: Marcando como lida:', notificationId);
      await api.patch(`/v1/notifications/${notificationId}/read`);
      console.log('📡 notificationService: Marcada como lida com sucesso');
    } catch (error) {
      console.error('📡 notificationService: Erro ao marcar como lida:', error);
      // Não rejeitamos o erro para não quebrar a UX
    }
  }
};
