import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';

interface ShareData {
  title?: string;
  text?: string;
  url?: string;
}

export const useNativeShare = () => {
  const { toast } = useToast();

  const shareApp = async (data: ShareData = {}) => {
    if (!navigator.share) {
      throw new Error('Compartilhamento não suportado neste dispositivo');
    }

    try {
      await navigator.share(data);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        throw err;
      }
    }
  };

  return { shareApp };
};