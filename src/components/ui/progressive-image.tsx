import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhotoVariant } from '@/types/gallery';

interface ProgressiveImageProps {
  variants: {
    thumbnail?: PhotoVariant;
    preview?: PhotoVariant;
    full_1x?: PhotoVariant;
    full_2x?: PhotoVariant;
  };
  alt: string;
  className?: string;
  onClick?: () => void;
  priority?: boolean; // Para imagens acima da dobra
  dominantColor?: string;
  blurHash?: string;
  aspectRatio?: number;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// Detecta suporte a WebP uma vez
let webpSupported: boolean | null = null;

const detectWebPSupport = (): Promise<boolean> => {
  if (webpSupported !== null) {
    return Promise.resolve(webpSupported);
  }

  return new Promise((resolve) => {
    const webp = new Image();
    webp.onload = webp.onerror = () => {
      webpSupported = webp.height === 2;
      resolve(webpSupported);
    };
    webp.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

// Detecta qualidade da conexão
const getConnectionQuality = (): 'slow' | 'medium' | 'fast' => {
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection) {
      const effectiveType = connection.effectiveType;
      if (effectiveType === '2g' || effectiveType === 'slow-2g') return 'slow';
      if (effectiveType === '3g') return 'medium';
    }
  }
  return 'fast';
};

// Seleciona melhor variante baseada no tamanho e qualidade da conexão
const selectBestVariant = (
  variants: ProgressiveImageProps['variants'],
  containerWidth: number,
  connectionQuality: 'slow' | 'medium' | 'fast',
  isWebPSupported: boolean
): { src: string; srcSet?: string } => {
  const devicePixelRatio = window.devicePixelRatio || 1;
  const targetWidth = containerWidth * devicePixelRatio;

  // Ordena variantes por largura
  const availableVariants = Object.entries(variants)
    .map(([key, variant]) => ({ key, ...variant }))
    .filter(v => v.webp || v.jpg)
    .sort((a, b) => a.w - b.w);

  if (availableVariants.length === 0) {
    return { src: '' };
  }

  // Lógica de seleção baseada na conexão
  let selectedVariant;
  
  if (connectionQuality === 'slow') {
    // Conexão lenta: sempre thumbnail
    selectedVariant = availableVariants.find(v => v.key === 'thumbnail') || availableVariants[0];
  } else if (connectionQuality === 'medium') {
    // Conexão média: thumbnail ou preview
    selectedVariant = availableVariants.find(v => v.w <= targetWidth && v.w >= 400) ||
                     availableVariants.find(v => v.key === 'preview') ||
                     availableVariants.find(v => v.key === 'thumbnail') ||
                     availableVariants[0];
  } else {
    // Conexão rápida: melhor qualidade disponível
    selectedVariant = availableVariants.find(v => v.w >= targetWidth) ||
                     availableVariants[availableVariants.length - 1];
  }

  // Escolhe formato (WebP ou JPEG)
  const src = isWebPSupported && selectedVariant.webp ? selectedVariant.webp : selectedVariant.jpg;

  // Cria srcSet para diferentes densidades
  const srcSet = availableVariants
    .filter(v => isWebPSupported ? v.webp : v.jpg)
    .map(v => {
      const url = isWebPSupported ? v.webp : v.jpg;
      return `${url} ${v.w}w`;
    })
    .join(', ');

  return { src, srcSet: srcSet || undefined };
};

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  variants,
  alt,
  className = '',
  onClick,
  priority = false,
  dominantColor = '#f1f5f9',
  blurHash,
  aspectRatio,
  sizes = '100vw',
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isWebPSupported, setIsWebPSupported] = useState(false);
  const [containerWidth, setContainerWidth] = useState(400);
  const [isVisible, setIsVisible] = useState(priority);
  const [loadedSrc, setLoadedSrc] = useState<string>('');

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);

  const connectionQuality = getConnectionQuality();

  // Detecta suporte WebP
  useEffect(() => {
    if (priority) {
      detectWebPSupport().then(setIsWebPSupported);
    }
  }, [priority]);

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (priority || !containerRef.current) return;

    intersectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            detectWebPSupport().then(setIsWebPSupported);
            intersectionObserverRef.current?.disconnect();
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    intersectionObserverRef.current.observe(containerRef.current);

    return () => {
      intersectionObserverRef.current?.disconnect();
    };
  }, [priority]);

  // Observa mudanças no tamanho do container
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(containerRef.current);
    
    // Set inicial
    setContainerWidth(containerRef.current.offsetWidth);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Seleciona e carrega a melhor imagem
  useEffect(() => {
    if (!isVisible || !isWebPSupported || !variants) return;

    const { src } = selectBestVariant(variants, containerWidth, connectionQuality, isWebPSupported);
    
    if (!src || src === loadedSrc) return;

    const img = new Image();
    
    img.onload = () => {
      setLoadedSrc(src);
      setIsLoaded(true);
      setHasError(false);
      onLoad?.();
    };

    img.onerror = () => {
      setHasError(true);
      setIsLoaded(false);
      onError?.();
      
      // Fallback para JPEG se WebP falhar
      if (isWebPSupported && src.includes('.webp')) {
        const { src: fallbackSrc } = selectBestVariant(variants, containerWidth, connectionQuality, false);
        if (fallbackSrc && fallbackSrc !== src) {
          img.src = fallbackSrc;
        }
      }
    };

    img.src = src;
  }, [isVisible, isWebPSupported, variants, containerWidth, connectionQuality, loadedSrc, onLoad, onError]);

  const handleClick = useCallback(() => {
    if (onClick && isLoaded && !hasError) {
      onClick();
    }
  }, [onClick, isLoaded, hasError]);

  // Calcula altura baseada no aspect ratio
  const getContainerStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      backgroundColor: dominantColor,
      position: 'relative',
      overflow: 'hidden'
    };

    if (aspectRatio) {
      baseStyle.aspectRatio = aspectRatio.toString();
    }

    return baseStyle;
  };

  const { src, srcSet } = isVisible && isWebPSupported 
    ? selectBestVariant(variants, containerWidth, connectionQuality, isWebPSupported)
    : { src: '', srcSet: undefined };

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={getContainerStyle()}
      onClick={handleClick}
    >
      {/* Placeholder com blur hash ou cor dominante */}
      <div 
        className="absolute inset-0 transition-opacity duration-300"
        style={{ 
          backgroundColor: dominantColor,
          opacity: isLoaded ? 0 : 1 
        }}
      >
        {/* Placeholder blur-up */}
        {variants.thumbnail?.placeholder && (
          <img
            src={variants.thumbnail.placeholder}
            alt=""
            className="w-full h-full object-cover blur-sm"
            aria-hidden="true"
          />
        )}

        {/* Loading skeleton */}
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        )}
      </div>

      {/* Imagem principal */}
      <AnimatePresence>
        {isVisible && src && (
          <motion.img
            ref={imgRef}
            src={loadedSrc || src}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            className={`
              absolute inset-0 w-full h-full object-cover
              ${onClick ? 'cursor-pointer' : ''}
              ${isLoaded ? 'opacity-100' : 'opacity-0'}
            `}
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
          />
        )}
      </AnimatePresence>

      {/* Indicador de erro */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-center text-muted-foreground">
            <div className="text-2xl mb-2">📷</div>
            <div className="text-xs">Erro ao carregar</div>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isVisible && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

// Hook para pré-carregar imagens críticas
export const useImagePreloader = (srcs: string[], enabled = true) => {
  useEffect(() => {
    if (!enabled || srcs.length === 0) return;

    const preloadPromises = srcs.map(src => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = src;
      });
    });

    Promise.allSettled(preloadPromises).then((results) => {
      const loadedCount = results.filter(r => r.status === 'fulfilled').length;
      console.log(`📸 Preloaded ${loadedCount}/${srcs.length} images`);
    });
  }, [srcs, enabled]);
};

export default ProgressiveImage; 