import { useState } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  priority?: boolean;
  sizes?: string;
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc,
  priority = false,
  className,
  sizes,
  ...props
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleError = () => {
    if (fallbackSrc && !imageError) {
      setImageError(true);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  // Convert Unsplash URL to WebP if supported
  const getOptimizedSrc = (originalSrc: string) => {
    if (originalSrc.includes('unsplash.com')) {
      // Check if browser supports WebP
      const canvas = document.createElement('canvas');
      const supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      
      if (supportsWebP) {
        const url = new URL(originalSrc);
        url.searchParams.set('fm', 'webp');
        return url.toString();
      }
    }
    return originalSrc;
  };

  const optimizedSrc = imageError && fallbackSrc ? fallbackSrc : getOptimizedSrc(src);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Loading placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      <img
        src={optimizedSrc}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "low"}
        decoding="async"
        onError={handleError}
        onLoad={handleLoad}
        sizes={sizes}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        {...props}
      />
    </div>
  );
}