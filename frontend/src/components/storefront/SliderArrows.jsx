import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Scroll state for a horizontal snap row. Pass values that change the row's content as `deps`. */
export function useSlider(deps = []) {
  const trackRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [update, ...deps]);

  const scroll = (direction) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: 'smooth' });
  };

  return { trackRef, canPrev, canNext, scroll };
}

const arrowClass = 'w-9 h-9 flex items-center justify-center rounded-full border border-neutral-300 text-black hover:border-black transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default disabled:hover:border-neutral-300';

/** Previous / next buttons; hidden on phones (swipe instead) and when everything fits. */
export default function SliderArrows({ canPrev, canNext, onScroll, label = 'items' }) {
  if (!canPrev && !canNext) return null;
  return (
    <div className="hidden md:flex items-center gap-2">
      <button type="button" onClick={() => onScroll(-1)} disabled={!canPrev} className={arrowClass} aria-label={`Previous ${label}`}>
        <ChevronLeft size={18} strokeWidth={1.6} />
      </button>
      <button type="button" onClick={() => onScroll(1)} disabled={!canNext} className={arrowClass} aria-label={`Next ${label}`}>
        <ChevronRight size={18} strokeWidth={1.6} />
      </button>
    </div>
  );
}
