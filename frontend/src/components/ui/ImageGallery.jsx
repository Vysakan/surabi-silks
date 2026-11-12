import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import SmartImage from '@/components/ui/SmartImage';

/**
 * Product photos. Phones: swipe through full-width photos with a "1 / 4" counter.
 * Desktop: one large photo with arrows and a row of thumbnails.
 */
export default function ImageGallery({ images = [], alt = '' }) {
  const [active, setActive] = useState(0);
  const trackRef = useRef(null);

  // A different colour shows different photos: start again from the first one.
  useEffect(() => {
    setActive(0);
    trackRef.current?.scrollTo({ left: 0 });
  }, [images]);

  if (!images.length) {
    return (
      <div className="aspect-[3/4] bg-neutral-100 flex items-center justify-center text-sm text-neutral-500">
        No image
      </div>
    );
  }

  const count = images.length;
  const show = (i) => setActive((i + count) % count);

  const onTrackScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== active) setActive(i);
  };

  const arrow = 'absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white cursor-pointer';

  return (
    <div>
      {/* Phones and tablets */}
      <div className="lg:hidden relative -mx-4 sm:mx-0">
        <div
          ref={trackRef}
          onScroll={onTrackScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        >
          {images.map((img, i) => (
            <div key={`${img}-${i}`} className="snap-center shrink-0 w-full aspect-[3/4] bg-neutral-100">
              <SmartImage
                src={img}
                alt={`${alt} ${i + 1} of ${count}`}
                loading={i === 0 ? 'eager' : 'lazy'}
                containerClassName="w-full h-full"
                className="w-full h-full"
              />
            </div>
          ))}
        </div>
        {count > 1 && (
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/90 text-xs tabular-nums">
            {active + 1} / {count}
          </span>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden lg:block">
        <div className="relative aspect-[3/4] bg-neutral-100 overflow-hidden group">
          {images.map((img, i) => (
            <SmartImage
              key={`${img}-${i}`}
              src={img}
              alt={i === active ? alt : ''}
              loading={i === 0 ? 'eager' : 'lazy'}
              containerClassName={cn('absolute inset-0 transition-opacity duration-300', i === active ? 'opacity-100' : 'opacity-0')}
              className="w-full h-full"
            />
          ))}
          {count > 1 && (
            <>
              <button type="button" onClick={() => show(active - 1)} className={cn(arrow, 'left-4')} aria-label="Previous photo">
                <ChevronLeft size={20} strokeWidth={1.6} />
              </button>
              <button type="button" onClick={() => show(active + 1)} className={cn(arrow, 'right-4')} aria-label="Next photo">
                <ChevronRight size={20} strokeWidth={1.6} />
              </button>
              <span className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-white/90 text-xs tabular-nums">
                {active + 1} / {count}
              </span>
            </>
          )}
        </div>

        {count > 1 && (
          <div className="grid grid-cols-6 gap-2 mt-2">
            {images.map((img, i) => (
              <button
                key={`${img}-${i}`}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  'relative aspect-[3/4] bg-neutral-100 overflow-hidden cursor-pointer transition-opacity',
                  i === active ? 'ring-1 ring-black ring-offset-2' : 'opacity-70 hover:opacity-100'
                )}
              >
                <SmartImage src={img} alt="" containerClassName="absolute inset-0" className="w-full h-full" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
