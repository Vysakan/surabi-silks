import { useState } from 'react';
import { Link } from 'react-router';
import { useCategoryTree } from '@/hooks/useCategoryTree';
import SmartImage from '@/components/ui/SmartImage';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { FALLBACK_IMAGE } from '@/lib/constants';
import { cn } from '@/lib/cn';

/**
 * Large text list of every collection. On desktop the picture beside it
 * changes to whichever collection the pointer is over.
 */
export default function CollectionLinks({ eyebrow = 'Browse', title = 'Find your collection' }) {
  const { categories, loading } = useCategoryTree();
  const [activeId, setActiveId] = useState(null);

  if (loading || categories.length === 0) return null;

  const active = categories.find((c) => c.id === activeId) || categories[0];

  return (
    <section className="py-12 md:py-20 bg-[var(--color-surface)]">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 grid gap-10 lg:grid-cols-[1fr_minmax(0,420px)] lg:items-center">
        <div>
          <ScrollReveal>
            <p className="sf-eyebrow mb-2">{eyebrow}</p>
            <h2 className="sf-heading mb-6 md:mb-8">{title}</h2>
          </ScrollReveal>
          <ul className="flex flex-col">
            {categories.map((cat) => {
              const count = cat.subcategories.length;
              const isActive = cat.id === active.id;
              return (
                <li key={cat.id} className="border-t border-black/10 last:border-b">
                  <Link
                    to={`/shop/${cat.slug}`}
                    onMouseEnter={() => setActiveId(cat.id)}
                    onFocus={() => setActiveId(cat.id)}
                    className="group flex items-center gap-4 py-3 md:py-4"
                  >
                    <SmartImage
                      src={cat.image || FALLBACK_IMAGE}
                      alt=""
                      containerClassName="lg:hidden w-14 h-14 shrink-0 bg-neutral-200 rounded-lg"
                      className="w-full h-full"
                    />
                    <span
                      className={cn(
                        'text-2xl sm:text-3xl md:text-[2.6rem] font-medium leading-none tracking-tight transition-colors',
                        isActive ? 'lg:text-black' : 'lg:text-black/35',
                        'group-hover:text-black'
                      )}
                    >
                      {cat.name}
                      {count > 0 && (
                        <sup className="ml-1 text-xs md:text-sm font-normal text-neutral-500 align-super">{count}</sup>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="hidden lg:block">
          <Link to={`/shop/${active.slug}`} className="block relative aspect-[var(--tile-aspect)] overflow-hidden rounded-[var(--radius-card)] bg-neutral-200">
            {categories.map((cat) => (
              <SmartImage
                key={cat.id}
                src={cat.image || FALLBACK_IMAGE}
                alt={cat.id === active.id ? cat.name : ''}
                containerClassName={cn(
                  'absolute inset-0 transition-opacity duration-500',
                  cat.id === active.id ? 'opacity-100' : 'opacity-0'
                )}
                className="w-full h-full"
              />
            ))}
          </Link>
        </div>
      </div>
    </section>
  );
}
