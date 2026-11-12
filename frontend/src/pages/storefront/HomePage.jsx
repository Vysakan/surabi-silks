import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Truck, ShieldCheck, RotateCcw, Headphones } from 'lucide-react';
import * as productService from '@/services/productService';
import { useCategoryTree } from '@/hooks/useCategoryTree';
import CategoryCarousel from '@/components/storefront/CategoryCarousel';
import CollectionLinks from '@/components/storefront/CollectionLinks';
import ProductRow from '@/components/storefront/ProductRow';
import ReelsSection from '@/components/storefront/ReelsSection';
import SmartImage from '@/components/ui/SmartImage';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { cn } from '@/lib/cn';

// Hero slides. Images live in public/images/banners/.
const heroSlides = [
  {
    image: '/images/banners/hero-traditional-group.jpg',
    eyebrow: 'The art of timeless elegance',
    title: 'Timeless elegance in every drape',
    subtitle: 'Exquisite sarees, premium fabrics and ethnic wear, curated by Surabhi Silks.',
    cta: 'Shop now',
    ctaLink: '/shop',
    secondaryCta: 'Explore sarees',
    secondaryLink: '/shop/sarees',
  },
  {
    image: '/images/banners/hero-street-fashion.jpg',
    eyebrow: 'Bold & beautiful',
    title: 'Street to celebration',
    subtitle: 'Bold prints and vibrant colours that make every day a statement.',
    cta: 'Shop new arrivals',
    ctaLink: '/shop?sort=newest',
  },
  {
    image: '/images/banners/hero-silk-closeup.jpg',
    eyebrow: 'Handcrafted heritage',
    title: 'Woven with stories',
    subtitle: 'Pure silk, authentic zari and weaves that honour India\u2019s textile legacy.',
    cta: 'Explore the collection',
    ctaLink: '/categories',
  },
];

// How many main categories get their own product row on the home page.
const CATEGORY_ROWS = 2;

function Hero() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = heroSlides.length;

  const go = useCallback((i) => setCurrent((i + count) % count), [count]);

  useEffect(() => {
    if (paused || count < 2) return undefined;
    const timer = setTimeout(() => go(current + 1), 6000);
    return () => clearTimeout(timer);
  }, [current, paused, count, go]);

  return (
    <section
      className="relative h-[72svh] min-h-[440px] max-h-[560px] md:h-[82vh] md:max-h-[760px] overflow-hidden bg-neutral-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {heroSlides.map((slide, i) => {
        const active = i === current;
        return (
          <div
            key={slide.image}
            className={cn('absolute inset-0 transition-opacity duration-1000', active ? 'opacity-100 z-10' : 'opacity-0 z-0')}
            aria-hidden={!active}
          >
            <SmartImage
              src={slide.image}
              alt=""
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : undefined}
              containerClassName="absolute inset-0"
              className={cn('w-full h-full transition-transform duration-[7000ms] ease-out', active ? 'scale-100' : 'scale-105')}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />

            <div className="absolute inset-x-0 bottom-0">
              <div className="max-w-7xl mx-auto px-4 lg:px-6 pb-14 md:pb-20">
                <div
                  className={cn(
                    'max-w-2xl text-white transition-all duration-700 delay-200',
                    active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  )}
                >
                  <p className="text-[11px] md:text-xs font-medium tracking-[0.2em] uppercase text-white/80 mb-3">
                    {slide.eyebrow}
                  </p>
                  {i === 0 ? (
                    <h1 className="text-[2.1rem] leading-[1.05] md:text-6xl font-semibold tracking-tight mb-4">{slide.title}</h1>
                  ) : (
                    <h2 className="text-[2.1rem] leading-[1.05] md:text-6xl font-semibold tracking-tight mb-4">{slide.title}</h2>
                  )}
                  <p className="text-sm md:text-base text-white/85 mb-7 max-w-md">{slide.subtitle}</p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      to={slide.ctaLink}
                      tabIndex={active ? 0 : -1}
                      className="inline-flex items-center justify-center px-6 py-3 bg-white text-black text-sm font-medium rounded-[var(--radius-button)] hover:bg-neutral-200 transition-colors"
                    >
                      {slide.cta}
                    </Link>
                    {slide.secondaryCta && (
                      <Link
                        to={slide.secondaryLink}
                        tabIndex={active ? 0 : -1}
                        className="inline-flex items-center justify-center px-6 py-3 border border-white/70 text-white text-sm font-medium rounded-[var(--radius-button)] hover:bg-white hover:text-black transition-colors"
                      >
                        {slide.secondaryCta}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {count > 1 && (
        <div className="absolute z-20 bottom-5 md:bottom-8 inset-x-0">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 flex items-center gap-2">
            {heroSlides.map((slide, i) => (
              <button
                key={slide.image}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show slide ${i + 1} of ${count}`}
                aria-current={i === current}
                className="group py-2 cursor-pointer"
              >
                <span
                  className={cn(
                    'block h-0.5 rounded-full transition-all duration-300',
                    i === current ? 'w-10 bg-white' : 'w-5 bg-white/45 group-hover:bg-white/80'
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/** A product row for one main category (loads its own products). */
function CategoryProductRow({ category }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    productService
      .getAll({ page: 1, limit: 8, filters: { categoryId: category.id } })
      .then((data) => { if (!cancelled) setProducts(data.items || []); })
      .catch(() => { if (!cancelled) setProducts([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [category.id]);

  return (
    <ProductRow
      eyebrow="Collection"
      title={category.name}
      products={products}
      loading={loading}
      viewAllLink={`/shop/${category.slug}`}
    />
  );
}

function ServiceStrip() {
  const items = [
    { icon: Truck, title: 'Free shipping', desc: 'On orders above ₹2,000' },
    { icon: ShieldCheck, title: 'Authentic handloom', desc: 'Sourced from master weavers' },
    { icon: RotateCcw, title: 'Easy returns', desc: '7-day hassle-free returns' },
    { icon: Headphones, title: 'Here to help', desc: 'Mon–Sat, 10am–7pm IST' },
  ];
  return (
    <section className="border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-10 md:py-12 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8">
        {items.map((s, i) => (
          <ScrollReveal key={s.title} delay={i * 80} className="flex flex-col items-start gap-3">
            <s.icon size={22} strokeWidth={1.4} />
            <div>
              <h3 className="text-sm font-medium text-black">{s.title}</h3>
              <p className="text-sm text-neutral-600 mt-0.5">{s.desc}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { categories } = useCategoryTree();

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      productService.getNewArrivals().catch(() => []),
      productService.getBestsellers().catch(() => []),
    ]).then(([na, bs]) => {
      if (cancelled) return;
      setNewArrivals(na || []);
      setBestsellers(bs || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <Hero />
      <CategoryCarousel />
      <ProductRow
        title="New arrivals"
        products={newArrivals.slice(0, 12)}
        loading={loading}
        viewAllLink="/shop?sort=newest"
      />
      {categories.slice(0, CATEGORY_ROWS).map((cat) => (
        <CategoryProductRow key={cat.id} category={cat} />
      ))}
      <CollectionLinks />
      <ProductRow
        title="Bestsellers"
        products={bestsellers.slice(0, 12)}
        loading={loading}
        viewAllLink="/shop?sort=rating"
      />
      <ReelsSection />
      <ServiceStrip />
    </>
  );
}
