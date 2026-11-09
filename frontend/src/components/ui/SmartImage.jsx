import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/cn';
import { FALLBACK_IMAGE } from '@/lib/constants';

export default function SmartImage({
  src,
  alt = '',
  className,
  containerClassName,
  aspectRatio,
  objectFit = 'cover',
  loading = 'lazy',
  fetchPriority,
  placeholder,
  fallback = FALLBACK_IMAGE,
  sizes,
  srcSet,
  onLoad,
  onError,
  ...rest
}) {
  const [status, setStatus] = useState('loading');
  const imgRef = useRef(null);
  const prevSrc = useRef(src);

  useEffect(() => {
    if (prevSrc.current !== src) {
      prevSrc.current = src;
      setStatus('loading');
    }
  }, [src]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) {
      setStatus('loaded');
    }
  }, [src]);

  const handleLoad = useCallback((e) => {
    setStatus('loaded');
    onLoad?.(e);
  }, [onLoad]);

  const handleError = useCallback((e) => {
    if (fallback && e.target.src !== fallback) {
      e.target.src = fallback;
      return;
    }
    setStatus('error');
    onError?.(e);
  }, [fallback, onError]);

  const aspectStyle = aspectRatio ? { aspectRatio } : undefined;

  return (
    <div
      className={cn('smart-image-wrap', containerClassName)}
      style={aspectStyle}
    >
      {status === 'loading' && (
        <div className="smart-image-skeleton" aria-hidden="true">
          {placeholder && (
            <img
              src={placeholder}
              alt=""
              className="smart-image-placeholder"
            />
          )}
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        fetchpriority={fetchPriority}
        sizes={sizes}
        srcSet={srcSet}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'smart-image',
          status === 'loading' && 'smart-image--loading',
          status === 'loaded' && 'smart-image--loaded',
          status === 'error' && 'smart-image--error',
          className
        )}
        style={{ objectFit }}
        {...rest}
      />
    </div>
  );
}
