
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Poll } from '@/data/pollData';

interface PollSyncOptions {
  pollId: string;
  enabled?: boolean;
}

export function usePollSync({ pollId, enabled = true }: PollSyncOptions) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!enabled || !pollId) return;

    const connectWebSocket = () => {
      try {
        // Mock WebSocket para desenvolvimento - substituir pela API real
        const mockWs = {
          onmessage: null as ((event: MessageEvent) => void) | null,
          onopen: null as (() => void) | null,
          onerror: null as (() => void) | null,
          onclose: null as (() => void) | null,
          close: () => {},
        };

        // Simular conexão WebSocket
        if (mockWs.onopen) mockWs.onopen();

        // Simular updates periódicos
        const interval = setInterval(() => {
          if (mockWs.onmessage) {
            const mockUpdate = {
              data: JSON.stringify({
                type: 'poll_update',
                pollId,
                opcoes: [
                  { id: "show", votos: Math.floor(Math.random() * 100) + 50 },
                  { id: "food", votos: Math.floor(Math.random() * 50) + 30 },
                  { id: "desfile", votos: Math.floor(Math.random() * 40) + 25 },
                  { id: "brindes", votos: Math.floor(Math.random() * 30) + 15 },
                ]
              })
            };
            mockWs.onmessage(mockUpdate as MessageEvent);
          }
        }, 30000); // Update a cada 30 segundos

        mockWs.onmessage = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'poll_update' && data.pollId === pollId) {
              queryClient.setQueryData(['poll', pollId], (oldData: Poll | undefined) => {
                if (!oldData) return oldData;
                
                const updatedOpcoes = oldData.opcoes.map(opcao => {
                  const updatedOpcao = data.opcoes.find((o: any) => o.id === opcao.id);
                  return updatedOpcao ? { ...opcao, votos: updatedOpcao.votos } : opcao;
                });

                const newTotal = updatedOpcoes.reduce((sum, opcao) => sum + opcao.votos, 0);

                return {
                  ...oldData,
                  opcoes: updatedOpcoes,
                  total: newTotal
                };
              });
            }
          } catch (error) {
            console.error('Erro ao processar update da enquete:', error);
          }
        };

        wsRef.current = mockWs as any;

        return () => {
          clearInterval(interval);
          mockWs.close();
        };
      } catch (error) {
        console.error('Erro ao conectar WebSocket:', error);
        
        // Tentar reconectar após 5 segundos
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 5000);
      }
    };

    const cleanup = connectWebSocket();

    return () => {
      if (cleanup) cleanup();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [pollId, enabled, queryClient]);

  return {
    isConnected: !!wsRef.current,
  };
}
