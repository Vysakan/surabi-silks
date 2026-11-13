import { Link } from 'react-router';
import SmartImage from '@/components/ui/SmartImage';
import { FALLBACK_IMAGE } from '@/lib/constants';
import { cn } from '@/lib/cn';

/** Collection tile: rounded photo with the category name on a small white label. */
export default function CategoryCard({ category, to, className, aspect = 'aspect-square' }) {
  return (
    <Link
      to={to || `/shop/${category.slug}`}
      className={cn('group relative block overflow-hidden rounded-2xl bg-neutral-100', aspect, className)}
      draggable={false}
    >
      <SmartImage
        src={category.image || FALLBACK_IMAGE}
        alt={category.name}
        draggable={false}
        containerClassName="absolute inset-0"
        className="w-full h-full transition-transform duration-700 group-hover:scale-[1.04]"
      />
      <span className="absolute left-3 bottom-3 md:left-4 md:bottom-4 max-w-[calc(100%-1.5rem)] truncate bg-white text-black text-xs md:text-sm px-2.5 py-1.5 md:px-3 rounded-[3px] shadow-sm">
        {category.name}
      </span>
    </Link>
  );
}
