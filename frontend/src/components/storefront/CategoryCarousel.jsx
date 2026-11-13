import { Link } from 'react-router';
import { useCategoryTree } from '@/hooks/useCategoryTree';
import CategoryCard from '@/components/storefront/CategoryCard';
import SliderArrows, { useSlider } from '@/components/storefront/SliderArrows';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { Skeleton } from '@/components/ui/Skeleton';

// About 1.6 tiles on phones, 2.6 on tablets, 4.4 on desktop: the next tile peeks in to show the row slides.
const SLIDE = 'snap-start shrink-0 w-[62%] sm:w-[38%] lg:w-[calc((100%_-_2rem)/4.4)]';

/** "Shop by collection" on the home page: every main category in a row you can swipe or drag. */
export default function CategoryCarousel({ title = 'Shop by collection' }) {
  const { categories, loading } = useCategoryTree();
  const { trackRef, canPrev, canNext, scroll } = useSlider([categories.length, loading]);

  if (!loading && categories.length === 0) return null;

  return (
    <section className="py-10 md:py-14">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <ScrollReveal className="flex items-end justify-between gap-4 mb-5 md:mb-6">
          <h2 className="sf-heading">{title}</h2>
          <div className="flex items-center gap-4 shrink-0">
            <Link to="/categories" className="sf-link">View all</Link>
            <SliderArrows canPrev={canPrev} canNext={canNext} onScroll={scroll} label="collections" />
          </div>
        </ScrollReveal>

        <div
          ref={trackRef}
          className="flex gap-2 md:gap-2.5 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide overscroll-x-contain -mx-4 px-4 lg:mx-0 lg:px-0 scroll-px-4 lg:scroll-px-0 md:cursor-grab"
        >
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={SLIDE}>
                <Skeleton className="aspect-square rounded-2xl" />
              </div>
            ))
            : categories.map((cat) => (
              <div key={cat.id} className={SLIDE}>
                <CategoryCard category={cat} />
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
