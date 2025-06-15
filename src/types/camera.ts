export interface CameraStream {
  id: string;
  name: string;
  location: string;
  isLive: boolean;
  viewers: number;
  thumbnailUrl: string;
  streamUrl: string;
  quality: '480p' | '720p' | '1080p' | '4K';
  fps: number;
  bitrate: string;
  uptime: string;
  maxViewers: number;
  description: string;
  category: 'entertainment' | 'religious' | 'general' | 'food' | 'parking';
  hasAudio: boolean;
  canRecord: boolean;
  priority: number;
  scheduleStart?: Date;
  scheduleEnd?: Date;
  status?: 'online' | 'offline' | 'maintenance' | 'scheduled';
  metadata?: {
    codec?: string;
    resolution?: string;
    bandwidth?: string;
  };
}

export interface CameraFilters {
  category?: string;
  isLive?: boolean;
  hasAudio?: boolean;
  quality?: string[];
  search?: string;
  sortBy?: 'priority' | 'viewers' | 'name' | 'uptime';
  sortOrder?: 'asc' | 'desc';
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