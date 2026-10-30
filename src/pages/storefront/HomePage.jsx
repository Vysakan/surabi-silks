import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Truck, Shield, Repeat, Headphones } from 'lucide-react';
import * as productService from '@/services/productService';
import { categories } from '@/data/categories';
import { banners } from '@/data/banners';
import ProductCard from '@/components/storefront/ProductCard';
import Button from '@/components/ui/Button';
import { SkeletonProductCard } from '@/components/ui/Skeleton';

function HeroSection() {
  const [current, setCurrent] = useState(0);
  const heroSlides = banners.filter((b) => b.id.includes('hero'));

  useEffect(() => {
    const timer = setInterval(() => setCurrent((c) => (c + 1) % heroSlides.length), 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const slide = heroSlides[current];

  return (
    <section className="relative overflow-hidden bg-neutral-900" style={{ backgroundColor: slide.bgColor }}>
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-8 md:gap-12">
        <div className="flex-1 text-center md:text-left z-10">
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4">
            {slide.title}
          </h1>
          <p className="text-base md:text-lg text-white/70 mb-8 max-w-lg">
            {slide.subtitle}
          </p>
          <Link to={slide.link}>
            <Button size="lg" className="shadow-lg">
              {slide.cta}
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </Link>
          {heroSlides.length > 1 && (
            <div className="flex items-center gap-2 mt-8 justify-center md:justify-start">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? 'bg-white w-8' : 'bg-white/40'}`}
                />
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 max-w-md md:max-w-lg">
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full rounded-2xl shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
}

function CategoryGrid() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900">Shop by Category</h2>
        <p className="text-neutral-500 mt-2">Explore our curated collections</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/shop/${cat.slug}`}
            className="group relative aspect-[4/3] rounded-xl overflow-hidden"
          >
            <img
              src={cat.image}
              alt={cat.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900">{title}</h2>
          {subtitle && <p className="text-neutral-500 mt-1">{subtitle}</p>}
        </div>
        {viewAllLink && (
          <Link to={viewAllLink} className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        )}
      </div>
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

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <Link
        to={promo.link}
        className="group block relative rounded-2xl overflow-hidden"
        style={{ backgroundColor: promo.bgColor }}
      >
        <div className="flex flex-col md:flex-row items-center">
          <div className="flex-1 p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-3">{promo.title}</h2>
            <p className="text-neutral-600 mb-6">{promo.subtitle}</p>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 group-hover:gap-3 transition-all">
              {promo.cta} <ArrowRight size={16} />
            </span>
          </div>
          <div className="flex-1">
            <img src={promo.image} alt={promo.title} className="w-full h-64 md:h-80 object-cover" />
          </div>
        </div>
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
          {signals.map((s) => (
            <div key={s.title} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mb-3">
                <s.icon size={22} />
              </div>
              <h4 className="text-sm font-semibold text-neutral-800">{s.title}</h4>
              <p className="text-xs text-neutral-500 mt-0.5">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Newsletter() {
  const [email, setEmail] = useState('');

  return (
    <section className="bg-neutral-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-14 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold mb-2">Stay in the Loop</h2>
        <p className="text-neutral-400 mb-6">Get notified about new collections, exclusive offers, and styling tips.</p>
        <form
          onSubmit={(e) => { e.preventDefault(); setEmail(''); }}
          className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-1 w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
          <Button type="submit" className="w-full sm:w-auto whitespace-nowrap">Subscribe</Button>
        </form>
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
      <Newsletter />
    </>
  );
}
