import axios from '@/lib/axios';
import type { Camera, CameraResponse, CameraFilters } from '@/types/camera';

const API_URL = 'https://api.festadoscaminhoneiros.com.br/v1';

export const cameraService = {
  async listCameras(filters?: CameraFilters): Promise<CameraResponse> {
    const response = await axios.get<CameraResponse>(`${API_URL}/cameras`, { 
      params: filters 
    });
    return response.data;
  },

  async getCamera(id: number): Promise<Camera> {
    const response = await axios.get<{ data: Camera }>(`${API_URL}/cameras/${id}`);
    return response.data.data;
  },

  getThumbnailUrl(alias: string): string {
    return `https://g3.ipcamlive.com/player/snapshot.php?alias=${alias}`;
  },

  getStreamUrl(alias: string): string {
    return `https://g3.ipcamlive.com/player/player.php?alias=${alias}&autoplay=1&disablezoombutton=1&disablevideofit=1&disableframecapture=1&disabledownloadbutton=1&disablenavigation=1`;
  }
}; 