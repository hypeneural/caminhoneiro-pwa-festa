import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';

export const useNativeShare = () => {
  const { toast } = useToast();

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
        toast({
          title: "Compartilhado!",
          description: "App compartilhado com sucesso.",
        });
      } else {
        // Try Web Share API first
        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share({
            title: shareData.title,
            text: shareData.text,
            url: shareData.url
          });
          toast({
            title: "Compartilhado!",
            description: "App compartilhado com sucesso.",
          });
        } else {
          // Fallback: copy to clipboard
          const textToShare = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
          await navigator.clipboard.writeText(textToShare);
          toast({
            title: "Link copiado!",
            description: "O link foi copiado para a área de transferência.",
          });
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Final fallback: copy to clipboard
      try {
        const textToShare = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        await navigator.clipboard.writeText(textToShare);
        toast({
          title: "Link copiado!",
          description: "O link foi copiado para a área de transferência.",
        });
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError);
        toast({
          title: "Erro",
          description: "Não foi possível compartilhar o app.",
          variant: "destructive",
        });
      }
    }
  };

  return { shareApp };
};