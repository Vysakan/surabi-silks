import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DRAG_THRESHOLD = 6; // pixels moved before a press counts as a drag, not a click

/**
 * Scroll state for a horizontal snap row, plus click-and-drag sliding with a mouse
 * (touch screens swipe natively). Pass values that change the row's content as `deps`.
 */
export function useSlider(deps = []) {
  const trackRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const depsKey = JSON.stringify(deps);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  // Arrow state follows scrolling and resizing.
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
  }, [update, depsKey]);

  // Mouse drag to slide.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    let pointerId = null;
    let startX = 0;
    let startScroll = 0;
    let dragged = false;
    let dragEndedAt = 0;

    /** Ends a press: puts snapping and the cursor back, and remembers when a drag finished. */
    const endPress = () => {
      const wasDragging = dragged;
      if (pointerId !== null && el.hasPointerCapture?.(pointerId)) el.releasePointerCapture(pointerId);
      pointerId = null;
      dragged = false;
      if (!wasDragging) return;
      dragEndedAt = Date.now();
      el.style.cursor = '';
      el.style.userSelect = '';
      el.style.scrollBehavior = '';
      // Re-enabling snap lets the row settle on the nearest card.
      el.style.scrollSnapType = '';
    };

    const onDown = (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      endPress(); // in case an earlier press never finished
      pointerId = e.pointerId;
      startX = e.clientX;
      startScroll = el.scrollLeft;
    };
    const onMove = (e) => {
      if (pointerId === null || e.pointerId !== pointerId) return;
      // The button was released somewhere we did not hear about: the press is over.
      if ((e.buttons & 1) === 0) {
        endPress();
        return;
      }
      const dx = e.clientX - startX;
      if (!dragged) {
        if (Math.abs(dx) < DRAG_THRESHOLD) return;
        dragged = true;
        el.setPointerCapture?.(pointerId);
        // Snapping and smooth scrolling fight a drag: switch them off until release.
        el.style.scrollSnapType = 'none';
        el.style.scrollBehavior = 'auto';
        el.style.cursor = 'grabbing';
        el.style.userSelect = 'none';
      }
      el.scrollLeft = startScroll - dx;
    };
    // Listened for on the whole window, so letting go outside the row also ends the press.
    const onUp = (e) => {
      if (pointerId === null || e.pointerId !== pointerId) return;
      endPress();
    };
    // A drag must not also open the card it started on.
    const onClick = (e) => {
      if (Date.now() - dragEndedAt < 250) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const onDragStart = (e) => e.preventDefault(); // no "ghost image" dragging of pictures and links

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    el.addEventListener('click', onClick, true);
    el.addEventListener('dragstart', onDragStart);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      el.removeEventListener('click', onClick, true);
      el.removeEventListener('dragstart', onDragStart);
    };
  }, [depsKey]);

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
