import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import SmartImage from '@/components/ui/SmartImage';
import { FALLBACK_IMAGE } from '@/lib/constants';
import { cn } from '@/lib/cn';

/** Collection tile: portrait image with the category name underneath. */
export default function CategoryCard({ category, to, className }) {
  return (
    <Link to={to || `/shop/${category.slug}`} className={cn('group block min-w-0', className)}>
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100 rounded-[var(--radius-card)]">
        <SmartImage
          src={category.image || FALLBACK_IMAGE}
          alt={category.name}
          containerClassName="absolute inset-0"
          className="w-full h-full transition-transform duration-700 group-hover:scale-[1.04]"
        />
      </div>
      <div className="flex items-center justify-between gap-2 pt-3">
        <h3 className="text-sm md:text-base font-medium text-black truncate">{category.name}</h3>
        <ArrowRight
          size={16}
          strokeWidth={1.6}
          className="shrink-0 transition-transform duration-300 group-hover:translate-x-1"
        />
      </div>
    </Link>
  );
}
