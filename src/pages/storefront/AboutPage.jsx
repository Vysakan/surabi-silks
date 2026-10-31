import { Link } from 'react-router';
import { ArrowRight, Gem, Heart, ShieldCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { FALLBACK_IMAGE } from '@/lib/constants';

const values = [
  {
    icon: Gem,
    title: 'Authentic Craftsmanship',
    description: 'Every textile in our collection is sourced directly from master weavers and artisan cooperatives across India, ensuring authenticity and fair trade.',
  },
  {
    icon: Heart,
    title: 'Heritage Preservation',
    description: 'We work closely with weaving communities to preserve endangered textile traditions, supporting livelihoods while keeping ancient art forms alive.',
  },
  {
    icon: ShieldCheck,
    title: 'Uncompromising Quality',
    description: 'Each piece undergoes rigorous quality checks for weave density, colour fastness, and finish before it reaches your hands.',
  },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-neutral-900 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/products/saree-collection.jpg"
            alt="Textile heritage"
            className="w-full h-full object-cover opacity-30"
            onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28 text-center">
          <div className="flex justify-center">
            <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'About Us' }]} />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mt-6 mb-4">Our Story</h1>
          <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
            Celebrating India's textile heritage — one thread at a time.
          </p>
        </div>
      </section>

      {/* Brand Story */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 mb-5">
              Born from a Love for Handloom
            </h2>
            <div className="space-y-4 text-neutral-600 leading-relaxed">
              <p>
                Surabi Silks was founded with a simple yet powerful vision: to bring India's finest handloom textiles to discerning customers who value authenticity, craftsmanship, and the stories woven into every fabric.
              </p>
              <p>
                What began as a small family venture in the heart of South India has grown into a curated destination for premium sarees, fabrics, and dress materials — each piece handpicked from weaving clusters across Kerala, Tamil Nadu, Andhra Pradesh, Uttar Pradesh, and beyond.
              </p>
              <p>
                We believe that every saree carries the soul of its maker. Our mission is to honour that legacy by connecting you directly with the artisans and traditions behind each creation.
              </p>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden">
            <img
              src="/images/products/saree-red-gold.jpg"
              alt="Handloom weaving tradition"
              loading="lazy"
              onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
              className="w-full h-80 md:h-[420px] object-cover"
            />
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div className="order-2 md:order-1 rounded-2xl overflow-hidden">
              <img
                src="/images/products/saree-peach-kanchi.jpg"
                alt="Fine silk textiles"
                loading="lazy"
                onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                className="w-full h-80 md:h-[420px] object-cover"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 mb-5">
                Our Mission & Vision
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-neutral-800 mb-2">Mission</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    To make India's authentic handloom textiles accessible to every home, while ensuring fair compensation and sustained livelihood for the artisan communities who create them.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-neutral-800 mb-2">Vision</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    To be the most trusted destination for handcrafted Indian textiles — known for quality, transparency, and our deep commitment to preserving the country's weaving heritage for future generations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Craftsmanship */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 mb-5">
              The Art of Indian Weaving
            </h2>
            <div className="space-y-4 text-neutral-600 leading-relaxed">
              <p>
                India's textile traditions span millennia — from the intricate zari work of Kanchipuram to the geometric precision of Pochampally ikats, from the delicate jamdani of Bengal to the bold block prints of Rajasthan.
              </p>
              <p>
                At Surabi Silks, we travel to the loom. We visit weaving villages, sit with artisans, and understand the months of work that go into a single saree. This direct relationship ensures you receive textiles of the highest quality at fair prices.
              </p>
              <p>
                Every Kanchipuram silk in our collection is woven with mulberry silk yarn and pure zari. Every Banarasi features hand-woven brocade patterns passed down through generations. Every cotton handloom is dyed with care and woven with intention.
              </p>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden">
            <img
              src="/images/products/fabric-silk-brocade.jpg"
              alt="Silk weaving craftsmanship"
              loading="lazy"
              onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
              className="w-full h-80 md:h-[420px] object-cover"
            />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900">What We Stand For</h2>
            <p className="text-neutral-500 mt-2 max-w-xl mx-auto">
              Three principles that guide every decision we make.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {values.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <div className="w-14 h-14 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-5">
                  <v.icon size={26} />
                </div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-3">{v.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-20 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 mb-4">
          Explore Our Collection
        </h2>
        <p className="text-neutral-500 max-w-xl mx-auto mb-8">
          Discover handcrafted sarees, premium fabrics, and dress materials — each piece with a story worth wearing.
        </p>
        <Link to="/shop">
          <Button size="lg">
            Shop Our Collection <ArrowRight size={18} className="ml-2" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
