import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX, Play, ExternalLink } from 'lucide-react';
import SmartImage from '@/components/ui/SmartImage';
import InstagramEmbed from '@/components/storefront/InstagramEmbed';
import InstagramIcon from '@/components/ui/InstagramIcon';
import { mediaUrl } from '@/lib/media';
import { isInstagramReel, parseInstagramUrl } from '@/lib/instagram';
import { formatPrice } from '@/lib/formatters';
import { FALLBACK_IMAGE } from '@/lib/constants';
import { cn } from '@/lib/cn';

/** "Shop now" card for the product linked to a reel. */
function ProductLink({ product, onClose }) {
  return (
    <Link
      to={`/product/${product.slug}`}
      onClick={onClose}
      className="flex items-center gap-3 bg-white rounded-xl p-2 pr-3 hover:bg-neutral-100 transition-colors"
    >
      <SmartImage
        src={product.image || FALLBACK_IMAGE}
        alt=""
        containerClassName="w-12 h-14 rounded-md overflow-hidden shrink-0 bg-neutral-100"
        className="w-full h-full"
      />
      <span className="flex-1 min-w-0">
        <span className="block text-sm text-black truncate">{product.name}</span>
        {product.price != null && <span className="block text-sm text-neutral-600">{formatPrice(product.price)}</span>}
      </span>
      <span className="shrink-0 text-xs font-medium bg-black text-white px-3 py-2 rounded-md">Shop now</span>
    </Link>
  );
}

/**
 * Full-screen player for the home-page reels. Arrow keys / swipe move between videos, Esc closes.
 * Uploaded videos play here; Instagram reels use Instagram's own player.
 */
export default function ReelViewer({ reels, index, onIndexChange, onClose }) {
  const videoRef = useRef(null);
  const touchStart = useRef(null);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false); // the sound choice carries over to the next video
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failedId, setFailedId] = useState(null);

  const reel = reels[index];
  const count = reels.length;
  const instagram = isInstagramReel(reel);
  const hasVideo = Boolean(reel?.videoUrl) && !instagram;
  const failed = failedId !== null && failedId === reel?.id;

  const go = useCallback((step) => {
    if (count < 2) return;
    onIndexChange((index + step + count) % count);
  }, [count, index, onIndexChange]);

  // Keyboard and page scroll while open.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [go, onClose]);

  // Start each video from the beginning. Opening the viewer was a tap, so sound is allowed;
  // if the browser still refuses, play muted.
  useEffect(() => {
    setProgress(0);
    setPaused(false);
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.muted = mutedRef.current;
    video.play().catch(() => {
      video.muted = true;
      mutedRef.current = true;
      setMuted(true);
      video.play().catch(() => setPaused(true));
    });
  }, [index]);

  if (!reel) return null;

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    const next = !muted;
    mutedRef.current = next;
    setMuted(next);
    if (video) video.muted = next;
  };

  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) onClose(); // swipe down closes
  };

  const sideButton = 'hidden md:flex absolute top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white items-center justify-center transition-colors cursor-pointer';
  const product = reel.product;
  const sideButtons = count > 1 && (
    <>
      <button type="button" onClick={() => go(-1)} aria-label="Previous video" className={cn(sideButton, 'left-6 pointer-events-auto')}>
        <ChevronLeft size={22} />
      </button>
      <button type="button" onClick={() => go(1)} aria-label="Next video" className={cn(sideButton, 'right-6 pointer-events-auto')}>
        <ChevronRight size={22} />
      </button>
    </>
  );
  const closeButton = (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close video"
      className="absolute top-3 right-3 md:top-5 md:right-5 z-20 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
    >
      <X size={22} />
    </button>
  );

  if (instagram) {
    const link = parseInstagramUrl(reel.videoUrl)?.url;
    const phoneArrow = 'md:hidden w-8 h-8 rounded-full bg-white/15 text-white flex items-center justify-center cursor-pointer';
    return (
      <div className="fixed inset-0 z-[60] bg-black/90 sf-fade-in" role="dialog" aria-modal="true" aria-label="Instagram reel">
        <div className="absolute inset-0" onClick={onClose} />
        {closeButton}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-0 md:p-6">
          <div
            className="relative pointer-events-auto h-full md:h-[min(88vh,820px)] w-full md:w-[440px] md:rounded-2xl overflow-hidden bg-neutral-950 flex flex-col"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            data-reel-source="instagram"
          >
            {/* Top: counter, phone arrows, open on Instagram */}
            <div className="shrink-0 flex items-center gap-2 p-3 pr-14 md:pr-3 text-white">
              {count > 1 && (
                <button type="button" onClick={() => go(-1)} aria-label="Previous video" className={phoneArrow}>
                  <ChevronLeft size={18} />
                </button>
              )}
              <span className="text-xs tabular-nums">{index + 1} / {count}</span>
              {count > 1 && (
                <button type="button" onClick={() => go(1)} aria-label="Next video" className={phoneArrow}>
                  <ChevronRight size={18} />
                </button>
              )}
              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto inline-flex items-center gap-1.5 text-xs text-white/85 hover:text-white"
                >
                  <InstagramIcon size={14} /> Open in Instagram <ExternalLink size={12} />
                </a>
              )}
            </div>

            {/* Instagram's player: scrolls when it is taller than the screen */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col px-3">
              <div className="my-auto py-2">
                <InstagramEmbed key={reel.id} url={reel.videoUrl} />
              </div>
            </div>

            {/* Bottom: caption and product */}
            {(reel.title || product) && (
              <div className="shrink-0 p-3 pt-2">
                {reel.title && <p className="text-white text-sm mb-2.5 line-clamp-2">{reel.title}</p>}
                {product && <ProductLink product={product} onClose={onClose} />}
              </div>
            )}
          </div>

          {sideButtons}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 sf-fade-in" role="dialog" aria-modal="true" aria-label="Video">
      <div className="absolute inset-0" onClick={onClose} />
      {closeButton}

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-0 md:p-6">
        <div
          className="relative pointer-events-auto h-full md:h-[min(88vh,820px)] w-full md:w-auto md:aspect-[9/16] md:rounded-2xl overflow-hidden bg-black"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {hasVideo && !failed ? (
            <video
              key={reel.id}
              ref={videoRef}
              src={mediaUrl(reel.videoUrl)}
              poster={mediaUrl(reel.coverUrl)}
              playsInline
              loop
              preload="auto"
              onClick={togglePlay}
              onPlay={() => setPaused(false)}
              onPause={() => setPaused(true)}
              onError={() => setFailedId(reel.id)}
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                if (v.duration) setProgress(v.currentTime / v.duration);
              }}
              className="absolute inset-0 w-full h-full object-cover md:object-contain bg-black cursor-pointer"
            />
          ) : (
            <>
              <SmartImage src={reel.coverUrl || FALLBACK_IMAGE} alt="" containerClassName="absolute inset-0" className="w-full h-full" />
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-white text-sm">
                <span className="inline-block px-3 py-1.5 rounded-full bg-black/60">
                  {failed ? 'This video could not be played' : 'Video coming soon'}
                </span>
              </div>
            </>
          )}

          {/* Top: progress, counter, sound */}
          <div className="absolute inset-x-0 top-0 p-3 bg-gradient-to-b from-black/50 to-transparent">
            {hasVideo && !failed && (
              <div className="h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white" style={{ width: `${progress * 100}%` }} />
              </div>
            )}
            <div className="flex items-center justify-between mt-2.5 pr-12 md:pr-0 text-white">
              <span className="text-xs tabular-nums">{index + 1} / {count}</span>
              {hasVideo && !failed && (
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
                  className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center cursor-pointer"
                >
                  {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              )}
            </div>
          </div>

          {hasVideo && !failed && paused && (
            <button
              type="button"
              onClick={togglePlay}
              aria-label="Play"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/90 text-black flex items-center justify-center cursor-pointer"
            >
              <Play size={24} fill="currentColor" className="ml-1" />
            </button>
          )}

          {/* Bottom: caption and product */}
          {(reel.title || product) && (
            <div className="absolute inset-x-0 bottom-0 p-3 pt-10 bg-gradient-to-t from-black/70 to-transparent">
              {reel.title && <p className="text-white text-sm mb-3 line-clamp-2">{reel.title}</p>}
              {product && <ProductLink product={product} onClose={onClose} />}
            </div>
          )}

          {/* Phones: tap the left or right edge to move */}
          {count > 1 && (
            <>
              <button type="button" onClick={() => go(-1)} aria-label="Previous video" className="md:hidden absolute left-0 top-1/4 bottom-1/3 w-10" />
              <button type="button" onClick={() => go(1)} aria-label="Next video" className="md:hidden absolute right-0 top-1/4 bottom-1/3 w-10" />
            </>
          )}
        </div>

        {sideButtons}
      </div>
    </div>
  );
}
