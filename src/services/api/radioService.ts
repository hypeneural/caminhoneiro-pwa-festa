import axios from '@/lib/axios';

export interface RadioMetadata {
  currentListeners: number;
  peakListeners: number;
  serverGenre: string;
  serverTitle: string;
  songTitle: string;
  bitrate: string;
  streamStatus: number;
}

interface ShoutcastResponse {
  currentlisteners: number;
  peaklisteners: number;
  servergenre: string;
  servertitle: string;
  songtitle: string;
  bitrate: string;
  streamstatus: number;
}

const RADIO_STREAM_URL = 'https://s03.svrdedicado.org:6860/stream';
const RADIO_METADATA_URL = '/api/radio/metadata';

// Função para transformar a resposta do Shoutcast no formato que usamos
const transformMetadata = (data: ShoutcastResponse): RadioMetadata => ({
  currentListeners: data.currentlisteners,
  peakListeners: data.peaklisteners,
  serverGenre: data.servergenre,
  serverTitle: data.servertitle,
  songTitle: data.songtitle,
  bitrate: data.bitrate,
  streamStatus: data.streamstatus,
});

export const radioService = {
  getMetadata: async (): Promise<RadioMetadata> => {
    try {
      // Primeira tentativa: usar o proxy
      const { data } = await axios.get<ShoutcastResponse>(RADIO_METADATA_URL);
      return transformMetadata(data);
    } catch (error) {
      console.error('Erro ao buscar metadados da rádio:', error);

      // Segunda tentativa: tentar acessar diretamente se estiver em desenvolvimento
      if (import.meta.env.DEV) {
        try {
          const { data } = await axios.get<ShoutcastResponse>(
            'https://s03.svrdedicado.org:6860/stats?json=1',
            {
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          );
          return transformMetadata(data);
        } catch (directError) {
          console.error('Erro ao tentar acesso direto:', directError);
        }
      }

      // Se todas as tentativas falharem, retorna dados mockados
      return {
        currentListeners: 0,
        peakListeners: 0,
        serverGenre: 'Sertanejo',
        serverTitle: 'Rádio Festa do Caminhoneiro',
        songTitle: 'Transmissão Temporariamente Indisponível',
        bitrate: '256',
        streamStatus: 0,
      };
    }
  },

  getStreamUrl: () => RADIO_STREAM_URL,
}; 