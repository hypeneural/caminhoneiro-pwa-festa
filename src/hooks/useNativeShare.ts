import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export const useNativeShare = () => {
  const shareApp = async () => {
    const shareData = {
      title: 'Festa do Caminhoneiro - São Cristóvão 2025',
      text: 'Acompanhe a Festa do Caminhoneiro de Tijucas/SC! Tracker em tempo real, programação, galeria e muito mais.',
      url: 'https://6a4cbc5b-381a-4084-bdeb-fb77b8417e3f.lovableproject.com',
      dialogTitle: 'Compartilhar Festa do Caminhoneiro'
    };

    try {
      // Check if running on native platform
      if (Capacitor.isNativePlatform()) {
        await Share.share(shareData);
      } else {
        // Fallback to Web Share API
        if (navigator.share) {
          await navigator.share({
            title: shareData.title,
            text: shareData.text,
            url: shareData.url
          });
        } else {
          // Fallback: copy to clipboard
          await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
          // You could show a toast here indicating the link was copied
          alert('Link copiado para a área de transferência!');
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        alert('Link copiado para a área de transferência!');
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError);
      }
    }
  };

  return { shareApp };
};