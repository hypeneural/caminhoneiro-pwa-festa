import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Poll } from '@/types/poll';

interface UsePollSyncOptions {
  enabled?: boolean;
  interval?: number;
}

export function usePollSync({ enabled = true, interval = 30000 }: UsePollSyncOptions = {}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    // Função para atualizar os dados da enquete
    const updatePollData = () => {
      queryClient.invalidateQueries({ queryKey: ['active-poll'] });
    };

    // Iniciar intervalo de atualização
    const intervalId = setInterval(updatePollData, interval);

    // Cleanup ao desmontar
    return () => clearInterval(intervalId);
  }, [enabled, interval, queryClient]);
}
