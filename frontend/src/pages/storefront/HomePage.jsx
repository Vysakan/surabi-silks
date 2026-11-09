import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Truck, Shield, Repeat, Headphones } from 'lucide-react';
import * as productService from '@/services/productService';
import { categories } from '@/data/categories';
import { banners } from '@/data/banners';
import ProductCard from '@/components/storefront/ProductCard';
import Button from '@/components/ui/Button';
import SmartImage from '@/components/ui/SmartImage';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { SkeletonProductCard } from '@/components/ui/Skeleton';
import { FALLBACK_IMAGE } from '@/lib/constants';

const heroSlides = [
  {
    image: '/images/banners/hero-traditional-group.jpg',
    label: 'THE ART OF TIMELESS ELEGANCE',
    title: 'Timeless Elegance in Every Drape',
    subtitle: 'Discover the beauty of tradition with Surabhi Silks. Explore our curated collection of exquisite sarees, premium fabrics, and timeless ethnic wear.',
    cta: 'Explore Collection',
    ctaLink: '/shop',
    secondaryCta: 'Shop Sarees',
    secondaryLink: '/shop/sarees',
  },
  {
    image: '/images/banners/hero-street-fashion.jpg',
    label: 'BOLD & BEAUTIFUL',
    title: 'Street to Celebration',
    subtitle: 'Bold prints and vibrant colours that make every day a statement. Modern Indian fashion that turns heads.',
    cta: 'Browse Collection',
    ctaLink: '/shop?sort=newest',
    secondaryCta: 'Shop Fabrics',
    secondaryLink: '/shop/fabrics',
  },
  {
    image: '/images/banners/hero-silk-closeup.jpg',
    label: 'HANDCRAFTED HERITAGE',
    title: 'Woven with Stories',
    subtitle: 'Each thread carries centuries of artisan tradition. Pure silk, authentic zari, and weaves that honour India\'s textile legacy.',
    cta: 'Explore Collection',
    ctaLink: '/shop',
    secondaryCta: 'Shop Kanchipuram',
    secondaryLink: '/shop/sarees/kanchipuram-silk',
  },
];

function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimate(false);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % heroSlides.length);
        setAnimate(true);
      }, 100);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = heroSlides[current];

  return (
    <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #2a2018 50%, #1A1A1A 100%)' }}>
      {/* Background image for mobile */}
      <SmartImage
        src={slide.image}
        alt=""
        loading="eager"
        containerClassName={`absolute inset-0 md:hidden transition-opacity duration-700 ${animate ? 'opacity-30' : 'opacity-0'}`}
        className="w-full h-full"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/50 md:hidden" />

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center min-h-[380px] md:min-h-[520px]">
          {/* Left — Content */}
          <div className={`w-full md:w-[55%] text-center md:text-left py-12 md:py-16 z-10 transition-all duration-700 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <span className="inline-block text-[10px] md:text-xs font-medium tracking-[0.25em] text-[#FAF6F1]/50 uppercase mb-4 md:mb-5">
              {slide.label}
            </span>
            <h1
              className="text-3xl md:text-5xl lg:text-[3.4rem] font-bold text-white leading-[1.15] mb-5 md:mb-6"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {slide.title}
            </h1>
            <p className="text-sm md:text-base text-[#FAF6F1]/60 leading-relaxed mb-8 max-w-lg mx-auto md:mx-0">
              {slide.subtitle}
            </p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 justify-center md:justify-start">
              <Link to={slide.ctaLink}>
                <button className="px-5 sm:px-7 py-2.5 sm:py-3 bg-[#ED0103] text-white text-sm font-semibold rounded-lg hover:bg-[#d40102] active:bg-[#b80102] transition-all duration-200 shadow-lg shadow-red-900/20">
                  {slide.cta}
                  <ArrowRight size={16} className="inline ml-2 -mt-0.5" />
                </button>
              </Link>
              <Link to={slide.secondaryLink}>
                <button className="px-5 sm:px-7 py-2.5 sm:py-3 text-sm font-semibold text-white/90 border border-white/25 rounded-lg hover:bg-white/10 hover:border-white/40 transition-all duration-200">
                  {slide.secondaryCta}
                </button>
              </Link>
            </div>

            {/* Slide indicators */}
            <div className="flex items-center gap-2.5 mt-8 md:mt-10 justify-center md:justify-start">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setAnimate(false); setTimeout(() => { setCurrent(i); setAnimate(true); }, 100); }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'bg-[#ED0103] w-8' : 'bg-white/25 w-5 hover:bg-white/40'}`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right — Image card (desktop only) */}
          <div className={`hidden md:flex md:w-[45%] items-center justify-end py-8 transition-all duration-700 ${animate ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className="relative w-full max-w-md">
              <SmartImage
                src={slide.image}
                alt={slide.title}
                loading="eager"
                fetchPriority="high"
                containerClassName="w-full h-[440px] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
                className="w-full h-full rounded-2xl"
              />
              <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryGrid() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <ScrollReveal className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900">Shop by Category</h2>
        <p className="text-neutral-500 mt-2">Explore our curated collections</p>
      </ScrollReveal>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/shop/${cat.slug}`}
            className="group relative aspect-[4/3] rounded-xl overflow-hidden"
          >
            <SmartImage
              src={cat.image}
              alt={cat.name}
              containerClassName="absolute inset-0"
              className="w-full h-full transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-semibold text-lg">{cat.name}</h3>
              <p className="text-white/70 text-sm mt-0.5">{cat.subcategories.length} collections</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ProductSection({ title, subtitle, products, loading, viewAllLink }) {
  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <ScrollReveal className="flex items-end justify-between gap-4 mb-8">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-neutral-900">{title}</h2>
          {subtitle && <p className="text-neutral-500 text-sm mt-1">{subtitle}</p>}
        </div>
        {viewAllLink && (
          <Link to={viewAllLink} className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 shrink-0">
            View All <ArrowRight size={14} />
          </Link>
        )}
      </ScrollReveal>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonProductCard key={i} />)
          : products.map((p) => <ProductCard key={p.id} product={p} />)
        }
      </div>
    </section>
  );
}

function PromoBanner() {
  const promo = banners.find((b) => b.id === 'banner-promo');
  if (!promo) return null;

  const dark = promo.textTheme === 'dark';

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <Link
        to={promo.link}
        className="group block relative rounded-2xl overflow-hidden h-64 md:h-80"
      >
        <SmartImage
          src={promo.image}
          alt={promo.title}
          containerClassName="absolute inset-0"
          className="w-full h-full transition-transform duration-500 group-hover:scale-105"
        />
        {!dark && <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />}
        {dark && <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/30 to-transparent" />}
        <ScrollReveal className="relative z-10 flex flex-col justify-center h-full p-8 md:p-12 max-w-lg">
          <h2 className={`text-2xl md:text-3xl font-bold mb-3 ${dark ? 'text-[#1A1A1A]' : 'text-white'}`}>{promo.title}</h2>
          <p className={`mb-6 ${dark ? 'text-[#555555]' : 'text-white/90'}`}>{promo.subtitle}</p>
          <span className={`inline-flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all ${dark ? 'text-[#ED0103]' : 'text-white'}`}>
            {promo.cta} <ArrowRight size={16} />
          </span>
        </ScrollReveal>
      </Link>
    </section>
  );
}

function TrustSignals() {
  const signals = [
    { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹2,000' },
    { icon: Shield, title: 'Authenticity Guaranteed', desc: '100% genuine handloom products' },
    { icon: Repeat, title: 'Easy Returns', desc: '7-day hassle-free returns' },
    { icon: Headphones, title: 'Customer Support', desc: 'Mon–Sat, 10am–7pm IST' },
  ];

  return (
    <section className="border-y border-neutral-100 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {signals.map((s, i) => (
            <ScrollReveal key={s.title} delay={i * 100} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mb-3">
                <s.icon size={22} />
              </div>
              <h4 className="text-sm font-semibold text-neutral-800">{s.title}</h4>
              <p className="text-xs text-neutral-500 mt-0.5">{s.desc}</p>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [na, bs] = await Promise.all([
        productService.getNewArrivals(),
        productService.getBestsellers(),
      ]);
      setNewArrivals(na);
      setBestsellers(bs);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <>
      <HeroSection />
      <CategoryGrid />
      <ProductSection
        title="New Arrivals"
        subtitle="Fresh additions to our collection"
        products={newArrivals.slice(0, 4)}
        loading={loading}
        viewAllLink="/shop?sort=newest"
      />
      <PromoBanner />
      <ProductSection
        title="Bestsellers"
        subtitle="Most loved by our customers"
        products={bestsellers.slice(0, 4)}
        loading={loading}
        viewAllLink="/shop?sort=rating"
      />
      <TrustSignals />
    </>
  );
}
