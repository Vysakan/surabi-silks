import { Link } from 'react-router';
import ProductCard from '@/components/storefront/ProductCard';
import SliderArrows, { useSlider } from '@/components/storefront/SliderArrows';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { SkeletonProductCard } from '@/components/ui/Skeleton';

// About 2.2 cards on phones, then 3 / 4 per view (gaps subtracted).
const SLIDE = 'snap-start shrink-0 w-[44%] sm:w-[calc((100%_-_2rem)/3)] lg:w-[calc((100%_-_4.5rem)/4)]';

/** A titled, swipeable row of products with arrows and a "View all" link. */
export default function ProductRow({ title, eyebrow, products = [], loading = false, viewAllLink, className }) {
  const { trackRef, canPrev, canNext, scroll } = useSlider([products.length, loading]);

  if (!loading && products.length === 0) return null;

  return (
    <section className={className ?? 'py-10 md:py-14'}>
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <ScrollReveal className="flex items-end justify-between gap-4 mb-6">
          <div className="min-w-0">
            {eyebrow && <p className="sf-eyebrow mb-2">{eyebrow}</p>}
            <h2 className="sf-heading">{title}</h2>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            {viewAllLink && <Link to={viewAllLink} className="sf-link">View all</Link>}
            <SliderArrows canPrev={canPrev} canNext={canNext} onScroll={scroll} label={title} />
          </div>
        </ScrollReveal>

        <div
          ref={trackRef}
          className="flex gap-3 md:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0 scroll-px-4 lg:scroll-px-0"
        >
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={SLIDE}><SkeletonProductCard /></div>
            ))
            : products.map((p) => (
              <div key={p.id} className={SLIDE}><ProductCard product={p} /></div>
            ))}
        </div>
      </div>
    </section>
  );
}
