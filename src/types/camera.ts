export interface Camera {
  id: number;
  nome_local: string;
  alias_ipcamlive: string;
  descricao: string;
  latitude: number | null;
  longitude: number | null;
  thumbnail_url: string | null;
  ordem_exibicao: number;
  data_cadastro: string;
  data_atualizacao: string;
}

export interface CameraResponse {
  status: string;
  message: string;
  meta: {
    total: number;
    page: number;
    limit: number;
  };
  data: Camera[];
}

export interface CameraFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface CameraState {
  streams: CameraStream[];
  filters: CameraFilters;
  selectedCamera: CameraStream | null;
  loading: boolean;
  error: string | null;
  autoRefresh: boolean;
  refreshInterval: number;
}

export interface StreamQuality {
  value: string;
  label: string;
  bitrate: string;
  resolution: string;
}

export interface CameraStats {
  totalCameras: number;
  liveCameras: number;
  totalViewers: number;
  averageUptime: string;
  popularCamera: CameraStream | null;
}