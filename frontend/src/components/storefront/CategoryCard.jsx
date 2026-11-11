import { Link } from 'react-router';
import SmartImage from '@/components/ui/SmartImage';
import { FALLBACK_IMAGE } from '@/lib/constants';
import { cn } from '@/lib/cn';

/** Image tile linking to a main category's shop page. */
export default function CategoryCard({ category, className }) {
  const count = category.subcategories?.length || 0;
  return (
    <Link
      to={`/shop/${category.slug}`}
      className={cn('group relative block aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100', className)}
    >
      <SmartImage
        src={category.image || FALLBACK_IMAGE}
        alt={category.name}
        containerClassName="absolute inset-0"
        className="w-full h-full transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-semibold text-lg leading-tight">{category.name}</h3>
        <p className="text-white/70 text-sm mt-0.5">
          {count > 0 ? `${count} ${count === 1 ? 'collection' : 'collections'}` : 'Explore'}
        </p>
      </div>
    </Link>
  );
}
