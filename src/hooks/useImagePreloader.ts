import { useCallback, useRef, useEffect } from 'react';

interface ImagePreloadOptions {
  priority?: 'high' | 'medium' | 'low';
  timeout?: number;
  quality?: 'preview' | 'full';
}

interface PreloadResult {
  url: string;
  loaded: boolean;
  error: boolean;
  size?: number;
}

export const useImagePreloader = () => {
  const preloadCache = useRef<Map<string, PreloadResult>>(new Map());
  const activeRequests = useRef<Map<string, Promise<void>>>(new Map());
  const preloadQueue = useRef<Array<{ url: string; options: ImagePreloadOptions }>>();

  // Pré-carrega uma única imagem
  const preloadImage = useCallback((url: string, options: ImagePreloadOptions = {}): Promise<void> => {
    // Verifica se já está no cache
    if (preloadCache.current.has(url)) {
      const cached = preloadCache.current.get(url)!;
      if (cached.loaded) {
        return Promise.resolve();
      }
      if (cached.error) {
        return Promise.reject(new Error('Image failed to load'));
      }
    }

    // Verifica se já está sendo carregada
    if (activeRequests.current.has(url)) {
      return activeRequests.current.get(url)!;
    }

    // Cria nova requisição de preload
    const loadPromise = new Promise<void>((resolve, reject) => {
      const img = new Image();
      
      // Configura prioridade de carregamento
      if (options.priority === 'high') {
        img.loading = 'eager';
        img.fetchPriority = 'high';
      } else if (options.priority === 'low') {
        img.loading = 'lazy';
        img.fetchPriority = 'low';
      } else {
        img.loading = 'lazy';
        img.fetchPriority = 'auto';
      }

      const timeout = options.timeout || 10000; // 10s timeout
      
      const timeoutId = setTimeout(() => {
        preloadCache.current.set(url, { url, loaded: false, error: true });
        activeRequests.current.delete(url);
        reject(new Error('Image preload timeout'));
      }, timeout);

      img.onload = () => {
        clearTimeout(timeoutId);
        preloadCache.current.set(url, { 
          url, 
          loaded: true, 
          error: false,
          size: img.naturalWidth * img.naturalHeight
        });
        activeRequests.current.delete(url);
        console.log(`✅ Preloaded: ${url}`);
        resolve();
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        preloadCache.current.set(url, { url, loaded: false, error: true });
        activeRequests.current.delete(url);
        console.error(`❌ Failed to preload: ${url}`);
        reject(new Error('Image failed to load'));
      };

      // Inicia o carregamento
      img.src = url;
    });

    activeRequests.current.set(url, loadPromise);
    return loadPromise;
  }, []);

  // Pré-carrega múltiplas imagens em lote
  const preloadImages = useCallback(async (
    urls: string[], 
    options: ImagePreloadOptions = {}
  ): Promise<PreloadResult[]> => {
    console.log(`🔄 Preloading ${urls.length} images...`);
    
    const results = await Promise.allSettled(
      urls.map(url => preloadImage(url, options))
    );

    return urls.map((url, index) => {
      const result = results[index];
      const cached = preloadCache.current.get(url);
      
      return {
        url,
        loaded: result.status === 'fulfilled' && cached?.loaded === true,
        error: result.status === 'rejected' || cached?.error === true,
        size: cached?.size
      };
    });
  }, [preloadImage]);

  // Pré-carrega as próximas N imagens para navegação
  const preloadNext = useCallback((
    currentIndex: number,
    allImages: string[],
    count: number = 3,
    options: ImagePreloadOptions = { priority: 'high' }
  ) => {
    const nextImages: string[] = [];
    
    // Pega as próximas imagens
    for (let i = 1; i <= count; i++) {
      const nextIndex = (currentIndex + i) % allImages.length;
      if (nextIndex < allImages.length) {
        nextImages.push(allImages[nextIndex]);
      }
    }

    // Pega as anteriores também (para navegação para trás)
    for (let i = 1; i <= Math.min(count, 2); i++) {
      const prevIndex = currentIndex - i;
      if (prevIndex >= 0) {
        nextImages.push(allImages[prevIndex]);
      }
    }

    console.log(`🚀 Preloading next ${nextImages.length} images for navigation`);
    return preloadImages(nextImages, options);
  }, [preloadImages]);

  // Limpa cache antigo
  const clearCache = useCallback((olderThan?: number) => {
    if (!olderThan) {
      preloadCache.current.clear();
      console.log('🧹 Preload cache cleared');
      return;
    }

    // Implementar limpeza baseada em tempo se necessário
    const now = Date.now();
    // Lógica para limpar itens mais antigos que 'olderThan' ms
  }, []);

  // Verifica se uma imagem está no cache
  const isPreloaded = useCallback((url: string): boolean => {
    const cached = preloadCache.current.get(url);
    return cached?.loaded === true;
  }, []);

  // Estatísticas do cache
  const getCacheStats = useCallback(() => {
    const cache = preloadCache.current;
    const total = cache.size;
    const loaded = Array.from(cache.values()).filter(item => item.loaded).length;
    const errors = Array.from(cache.values()).filter(item => item.error).length;
    
    return {
      total,
      loaded,
      errors,
      hitRate: total > 0 ? loaded / total : 0
    };
  }, []);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      activeRequests.current.clear();
      preloadCache.current.clear();
    };
  }, []);

  return {
    preloadImage,
    preloadImages,
    preloadNext,
    isPreloaded,
    clearCache,
    getCacheStats
  };
}; 