import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCategoryTree } from '@/hooks/useCategoryTree';
import CategoryCard from '@/components/storefront/CategoryCard';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { Skeleton } from '@/components/ui/Skeleton';

// Card widths: about 1.5 cards on phones, then 2 / 3 / 4 per view (the gaps are subtracted).
const SLIDE = 'snap-start shrink-0 w-[66%] sm:w-[calc((100%_-_1rem)/2)] md:w-[calc((100%_-_3rem)/3)] lg:w-[calc((100%_-_4.5rem)/4)]';

/** "Shop by Category" on the home page: every main category in a swipeable row, plus View All. */
export default function CategoryCarousel() {
  const { categories, loading } = useCategoryTree();
  const trackRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows, categories.length, loading]);

  const scroll = (direction) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: 'smooth' });
  };

  if (!loading && categories.length === 0) return null;

  const arrowClass = 'hidden sm:flex w-9 h-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed';

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <ScrollReveal className="flex items-end justify-between gap-4 mb-8">
        <div className="min-w-0">
          <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900">Shop by Category</h2>
          <p className="text-neutral-500 mt-2">Explore our curated collections</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={() => scroll(-1)} disabled={!canPrev} className={arrowClass} aria-label="Previous categories">
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={() => scroll(1)} disabled={!canNext} className={arrowClass} aria-label="Next categories">
            <ChevronRight size={18} />
          </button>
          <Link to="/categories" className="ml-1 sm:ml-2 text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>
      </ScrollReveal>

      <div
        ref={trackRef}
        className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-1 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={SLIDE}>
              <Skeleton className="aspect-[4/3] rounded-xl" />
            </div>
          ))
          : categories.map((cat) => (
            <div key={cat.id} className={SLIDE}>
              <CategoryCard category={cat} />
            </div>
          ))}
      </div>
    </section>
  );
}
