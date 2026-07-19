import { memo, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { selectSafeImageSrc } from '@/lib/image-safety';

interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'priority'> {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  priority?: boolean;
}

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className,
  fallbackSrc,
  priority,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(() => selectSafeImageSrc(src, fallbackSrc) || '');

  useEffect(() => {
    setIsLoaded(false);
    setError(false);

    const primarySrc = selectSafeImageSrc(src, fallbackSrc);

    if (!primarySrc) {
      setCurrentSrc('');
      setError(true);
      return;
    }

    setCurrentSrc(primarySrc);

    const img = new Image();
    img.src = primarySrc;
    img.onload = () => {
      setIsLoaded(true);
      setCurrentSrc(primarySrc);
    };
    img.onerror = () => {
      const safeFallback = selectSafeImageSrc(fallbackSrc);
      if (safeFallback && safeFallback !== primarySrc) {
        setCurrentSrc(safeFallback);
        const fallbackImg = new Image();
        fallbackImg.src = safeFallback;
        fallbackImg.onload = () => setIsLoaded(true);
        fallbackImg.onerror = () => setError(true);
      } else {
        setError(true);
      }
    };
  }, [src, fallbackSrc]);

  if (error) {
    return (
      <div className={cn('bg-muted flex items-center justify-center p-2 text-center', className)}>
        <span className="text-muted-foreground text-xs font-medium leading-tight">
          {alt || 'Imagem indisponivel'}
        </span>
      </div>
    );
  }

  return (
    <>
      {!isLoaded && <div className={cn('bg-muted animate-pulse', className)} />}

      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          className={cn(
            className,
            !isLoaded && 'invisible absolute',
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          {...(priority ? { fetchPriority: 'high' } : {})}
          {...props}
        />
      )}
    </>
  );
});
