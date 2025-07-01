import axios from '@/lib/axios';
import { API } from '@/constants/api';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  created_at: string;
}

interface NotificationResponse {
  data: Notification[];
  unread_count: number;
}

export const notificationService = {
  async getNotifications(): Promise<NotificationResponse> {
    try {
      console.log('📡 notificationService: Fazendo requisição para /notifications');
      const response = await axios.get('/notifications');
      return response.data;
    } catch (error) {
      console.error('📡 notificationService: Erro ao buscar notificações:', error);
      throw error;
    }
  },

  async markAsRead(notificationId: number): Promise<void> {
    try {
      await axios.post(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('📡 notificationService: Erro ao marcar notificação como lida:', error);
      throw error;
    }
  },

  async markAllAsRead(): Promise<void> {
    try {
      await axios.post('/notifications/read-all');
    } catch (error) {
      console.error('📡 notificationService: Erro ao marcar todas notificações como lidas:', error);
      throw error;
    }
  }
}; 