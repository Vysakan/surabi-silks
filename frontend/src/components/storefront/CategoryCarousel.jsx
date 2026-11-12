import { Link } from 'react-router';
import { useCategoryTree } from '@/hooks/useCategoryTree';
import CategoryCard from '@/components/storefront/CategoryCard';
import SliderArrows, { useSlider } from '@/components/storefront/SliderArrows';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { Skeleton } from '@/components/ui/Skeleton';

// About 2.3 tiles on phones, then 3 / 5 per view (gaps subtracted).
const SLIDE = 'snap-start shrink-0 w-[42%] sm:w-[calc((100%_-_2rem)/3)] lg:w-[calc((100%_-_6rem)/5)]';

/** "Shop by collection" on the home page: every main category in a swipeable row, plus View all. */
export default function CategoryCarousel({ title = 'Shop by collection' }) {
  const { categories, loading } = useCategoryTree();
  const { trackRef, canPrev, canNext, scroll } = useSlider([categories.length, loading]);

  if (!loading && categories.length === 0) return null;

  return (
    <section className="py-10 md:py-14">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <ScrollReveal className="flex items-end justify-between gap-4 mb-6">
          <h2 className="sf-heading">{title}</h2>
          <div className="flex items-center gap-4 shrink-0">
            <Link to="/categories" className="sf-link">View all</Link>
            <SliderArrows canPrev={canPrev} canNext={canNext} onScroll={scroll} label="collections" />
          </div>
        </ScrollReveal>

        <div
          ref={trackRef}
          className="flex gap-3 md:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0 scroll-px-4 lg:scroll-px-0"
        >
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={SLIDE}>
                <Skeleton className="aspect-[3/4] rounded-none" />
                <Skeleton className="h-4 w-2/3 mt-3" />
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
