import { useState, memo, useEffect } from 'react';
import { cn } from '@/lib/utils';

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
  const [currentSrc, setCurrentSrc] = useState(src);

  // Preload image
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setIsLoaded(true);
      setCurrentSrc(src);
    };
    img.onerror = () => {
      if (fallbackSrc && fallbackSrc !== src) {
        setCurrentSrc(fallbackSrc);
        const fallbackImg = new Image();
        fallbackImg.src = fallbackSrc;
        fallbackImg.onload = () => setIsLoaded(true);
        fallbackImg.onerror = () => setError(true);
      } else {
        setError(true);
      }
    };
  }, [src, fallbackSrc]);

  if (error) {
    return (
      <div className={cn(
        'bg-muted flex items-center justify-center',
        className
      )}>
        <span className="text-muted-foreground text-sm">
          Imagem indisponível
        </span>
      </div>
    );
  }

  return (
    <>
      {/* Low quality placeholder */}
      {!isLoaded && (
        <div className={cn(
          'bg-muted animate-pulse',
          className
        )} />
      )}
      
      {/* Main image */}
      <img
        src={currentSrc}
        alt={alt}
        className={cn(
          className,
          !isLoaded && 'invisible absolute',
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        {...(priority ? { fetchpriority: "high" } : {})}
        {...props}
      />
    </>
  );
});