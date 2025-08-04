import { useState, useCallback, memo } from "react";
import { ImageIcon } from "lucide-react";

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const ImageWithFallback = memo(({
  src,
  alt,
  className = "",
  fallbackClassName = "",
  priority = false,
  onLoad,
  onError,
}: ImageWithFallbackProps) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleLoad = useCallback(() => {
    setLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setError(true);
    setLoading(false);
    onError?.();
  }, [onError]);

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className} ${fallbackClassName}`}
      >
        <ImageIcon className="h-8 w-8 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div 
          className={`absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse ${className}`}
        />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
});

ImageWithFallback.displayName = "ImageWithFallback";

export default ImageWithFallback;