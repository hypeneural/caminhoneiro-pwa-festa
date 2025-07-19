import { API } from '@/constants/api';
import { smartGalleryCache } from '@/services/smartGalleryCache';
import { FilterOptions } from '@/types/gallery';

// Types baseados na API real
export interface APIPhoto {
  id_foto: number;
  descricao: string;
  data_envio: string;
  periodo_dia: 'MANHA' | 'TARDE' | 'NOITE' | 'MADRUGADA';
  destaque: boolean;
  visualizacoes: number;
  orientation: 'landscape' | 'portrait';
  aspect_ratio: number;
  dominant_color: string;
  blur_hash: string;
  mime_type: string;
  group: {
    id: number;
    nome: string;
    icone: string;
    cor: string;
  };
  vehicle: {
    plate: string | null;
    brand: string | null;
    model: string | null;
    category: string | null;
    year: number | null;
    color: string | null;
  };
  variants: {
    thumbnail?: {
      w: number;
      h: number;
      size: number;
      avif: string | null;
      webp: string;
      jpg: string;
      placeholder: string;
    };
    preview?: {
      w: number;
      h: number;
      size: number;
      avif: string | null;
      webp: string;
      jpg: string;
      placeholder: string;
    };
    full_1x?: {
      w: number;
      h: number;
      size: number;
      avif: string | null;
      webp: string;
      jpg: string;
      placeholder: string | null;
    };
    full_2x?: {
      w: number;
      h: number;
      size: number;
      avif: string | null;
      webp: string;
      jpg: string;
      placeholder: string | null;
    };
  };
}

export interface APIResponse {
  status: 'success' | 'error';
  message?: string;
  meta?: any[];
  data: {
    photos?: APIPhoto[];
    thumbs?: APIPhoto[];
    pagination: {
      total_registros_filtrados: number;
      pagina_atual: number;
      registros_por_pagina: number;
      total_paginas: number;
      filtros_aplicados: Record<string, string>;
      links: {
        self: string;
        proxima_pagina: string | null;
      };
    };
  };
}



export interface GalleryFilters {
  page?: number;
  limit?: number;
  ordenar_por?: 'data_desc' | 'data_asc' | 'views_desc' | 'destaque_desc';
  destaque?: boolean;
  periodo_dia?: 'MANHA' | 'TARDE' | 'NOITE' | 'MADRUGADA';
  id_grupo_whatsapp?: number;
  data_evento?: string;
  data_inicio?: string;
  data_fim?: string;
  vehicle_plate?: string;
  vehicle_brand_id?: number;
  vehicle_model_id?: number;
  vehicle_category_id?: number;
  vehicle_year?: number;
  vehicle_color?: string;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  etag?: string;
}

class GalleryService {
  private baseURL = `${API.BASE_URL}/galeria`;
  private memoryCache = new Map<string, CacheEntry>(); // Cache em memória para sessão
  private cacheTimeout = 5 * 60 * 1000; // 5 minutos para cache de memória
  private retryAttempts = 3;
  private retryDelay = 1000;

  constructor() {
    // Inicializa cache inteligente
    this.initializeSmartCache();
  }

  private async initializeSmartCache() {
    try {
      await smartGalleryCache.initialize();
      
      // Otimiza cache na inicialização
      setTimeout(() => {
        smartGalleryCache.optimizeCache();
      }, 1000);
    } catch (error) {
      console.warn('⚠️ Falha ao inicializar cache inteligente:', error);
    }
  }

  // Detecta qualidade da rede
  private getNetworkQuality(): 'slow' | 'medium' | 'fast' {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        if (effectiveType === '2g' || effectiveType === 'slow-2g') return 'slow';
        if (effectiveType === '3g') return 'medium';
      }
    }
    return 'fast';
  }

  // Ajusta limit baseado na qualidade da rede (respeitando limite solicitado)
  private getOptimalLimit(requestedLimit?: number): number {
    // Se um limite foi explicitamente solicitado, respeitá-lo
    if (requestedLimit && requestedLimit > 0) {
      return Math.min(requestedLimit, 100);
    }
    
    // Só aplica otimização automática se não foi especificado um limite
    const quality = this.getNetworkQuality();
    switch (quality) {
      case 'slow': return 12;
      case 'medium': return 20;
      case 'fast': return 30;
      default: return 20;
    }
  }

  // Cria chave de cache baseada nos filtros
  private getCacheKey(endpoint: string, filters: GalleryFilters = {}): string {
    const sortedFilters = Object.keys(filters)
      .sort()
      .reduce((result, key) => {
        result[key] = filters[key as keyof GalleryFilters];
        return result;
      }, {} as any);
    
    return `${endpoint}:${JSON.stringify(sortedFilters)}`;
  }

  // Verifica se cache de memória ainda é válido
  private isMemoryCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.cacheTimeout;
  }

  // Pré-carrega imagens críticas
  private async preloadCriticalImages(photos: APIPhoto[]): Promise<void> {
    const thumbnailUrls = photos
      .slice(0, 10) // Primeiras 10 fotos
      .map(photo => photo.variants?.thumbnail?.webp || photo.variants?.thumbnail?.jpg)
      .filter(Boolean) as string[];

    if (thumbnailUrls.length > 0) {
      await smartGalleryCache.preloadCriticalImages(thumbnailUrls);
    }
  }

  // Faz requisição com múltiplas camadas de cache
  private async fetchWithSmartCache(
    url: string, 
    options: RequestInit = {},
    cacheKey: string,
    filters: GalleryFilters
  ): Promise<any> {
    // 1. Verifica cache de memória (mais rápido)
    if (this.memoryCache.has(cacheKey)) {
      const cached = this.memoryCache.get(cacheKey)!;
      if (this.isMemoryCacheValid(cached)) {
        console.log(`🎯 Memory cache hit: ${cacheKey}`);
        return cached.data;
      }
    }

    // 2. Verifica cache IndexedDB
    try {
      const cachedPhotos = await smartGalleryCache.getCachedPhotos(filters);
      if (cachedPhotos) {
        console.log(`💾 IndexedDB cache hit: ${cacheKey}`);
        
        // Atualiza cache de memória
        this.memoryCache.set(cacheKey, {
          data: { status: 'success', data: { photos: cachedPhotos } },
          timestamp: Date.now()
        });
        
        return { status: 'success', data: { photos: cachedPhotos } };
      }
    } catch (error) {
      console.warn('⚠️ Erro ao acessar cache IndexedDB:', error);
    }

    // 3. Faz requisição à rede com retry
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`📡 Network request ${url} (attempt ${attempt})`);
        
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const etag = response.headers.get('etag') || undefined;
        
        // 4. Armazena em ambos os caches
        this.memoryCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          etag
        });

        // Armazena no IndexedDB se são fotos
        if (data.status === 'success' && data.data?.photos) {
          try {
            await smartGalleryCache.cachePhotos(filters, data.data.photos, etag);
            
            // Pré-carrega imagens críticas em background
            setTimeout(() => {
              this.preloadCriticalImages(data.data.photos);
            }, 100);
          } catch (error) {
            console.warn('⚠️ Erro ao salvar no cache IndexedDB:', error);
          }
        }

        console.log(`💾 Cached response: ${cacheKey}`);
        return data;
        
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Attempt ${attempt} failed:`, error);
        
        if (attempt < this.retryAttempts) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          console.log(`🔄 Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // 5. Fallback para cache expirado se todos os attempts falharam
    const expiredCache = this.memoryCache.get(cacheKey);
    if (expiredCache) {
      console.log(`⚡ Using expired memory cache as fallback: ${cacheKey}`);
      return expiredCache.data;
    }

    throw lastError!;
  }

  // Lista fotos (thumbnails para performance)
  async getPhotos(filters: GalleryFilters = {}): Promise<APIResponse> {
    // Otimiza limit baseado na rede
    const optimizedFilters = {
      ...filters,
      limit: this.getOptimalLimit(filters.limit)
    };

    const params = new URLSearchParams();
    Object.entries(optimizedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    const url = `${this.baseURL}/thumbs?${params.toString()}`;
    const cacheKey = this.getCacheKey('thumbs', optimizedFilters);
    
    return this.fetchWithSmartCache(url, {}, cacheKey, optimizedFilters);
  }

  // Lista fotos completas (para lightbox)
  async getFullPhotos(filters: GalleryFilters = {}): Promise<APIResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    const url = `${this.baseURL}?${params.toString()}`;
    const cacheKey = this.getCacheKey('full', filters);
    
    return this.fetchWithSmartCache(url, {}, cacheKey, filters);
  }

  // Busca opções de filtros com cache inteligente
  async getFilterOptions(): Promise<FilterOptions> {
    // Verifica cache IndexedDB primeiro
    try {
      const cached = await smartGalleryCache.getCachedFilterOptions();
      if (cached) {
        console.log('💾 Filter options from cache');
        return cached;
      }
    } catch (error) {
      console.warn('⚠️ Erro ao acessar cache de filtros:', error);
    }

    // Busca da rede
    const url = `${this.baseURL}/opcoes_filtro`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const filterOptions = data.data;

    // Salva no cache
    try {
      await smartGalleryCache.cacheFilterOptions(filterOptions);
    } catch (error) {
      console.warn('⚠️ Erro ao salvar filtros no cache:', error);
    }

    return filterOptions;
  }

  // Busca foto específica
  async getPhoto(id: number): Promise<APIPhoto> {
    const url = `${this.baseURL}?id_foto=${id}&limit=1`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.photos[0];
  }

  // Preload próxima página em background
  async preloadNextPage(filters: GalleryFilters, currentPage: number): Promise<void> {
    const nextPageFilters = { ...filters, page: currentPage + 1 };
    
    // Faz request em background sem bloquear UI
    setTimeout(() => {
      this.getPhotos(nextPageFilters).catch(() => {
        // Ignora erros de preload
      });
    }, 100);
  }

  // Limpa cache expirado
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (!this.isMemoryCacheValid(entry)) {
        this.memoryCache.delete(key);
      }
    }
  }

  // Limpa todo o cache
  async clearCache(): Promise<void> {
    this.memoryCache.clear();
    try {
      await smartGalleryCache.clearAll();
    } catch (error) {
      console.warn('⚠️ Erro ao limpar cache IndexedDB:', error);
    }
  }

  // Otimiza cache
  async optimizeCache(): Promise<void> {
    this.clearExpiredCache();
    
    try {
      await smartGalleryCache.optimizeCache();
    } catch (error) {
      console.warn('⚠️ Erro ao otimizar cache:', error);
    }
  }

  // Stats do cache para debugging
  async getCacheStats() {
    try {
      const indexedDBStats = await smartGalleryCache.getStats();
      
      return {
        memory: {
          size: this.memoryCache.size,
          keys: Array.from(this.memoryCache.keys())
        },
        indexedDB: indexedDBStats,
        combined: {
          hitRate: indexedDBStats.hitRate,
          totalSize: indexedDBStats.totalSize,
          totalEntries: this.memoryCache.size + indexedDBStats.entriesCount
        }
      };
    } catch (error) {
      return {
        memory: {
          size: this.memoryCache.size,
          keys: Array.from(this.memoryCache.keys())
        },
        indexedDB: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const galleryService = new GalleryService();
export default galleryService; 