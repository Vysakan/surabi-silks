import { Link } from 'react-router';
import { useCategoryTree } from '@/hooks/useCategoryTree';
import CategoryCard from '@/components/storefront/CategoryCard';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

/** /categories - every main category at once, with its subcategories. */
export default function CategoriesPage() {
  const { categories, loading, error } = useCategoryTree();

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-8 md:pt-12 pb-16">
      <div className="mb-8 md:mb-10">
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-black">Collections</h1>
        {!loading && !error && (
          <p className="text-sm text-neutral-500 mt-2">
            {categories.length} {categories.length === 1 ? 'collection' : 'collections'}
          </p>
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 md:gap-x-6 gap-y-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[var(--tile-aspect)] rounded-[var(--radius-card)]" />
              <Skeleton className="h-4 w-2/3 mt-3" />
            </div>
          ))}
        </div>
      )}

      {!loading && (error || categories.length === 0) && (
        <EmptyState
          title={error ? 'Could not load collections' : 'No collections yet'}
          description={error ? 'Please refresh the page to try again.' : 'Please check back soon.'}
        />
      )}

      {!loading && !error && categories.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 md:gap-x-6 gap-y-10 md:gap-y-14">
          {categories.map((cat) => (
            <div key={cat.id} className="min-w-0">
              <CategoryCard category={cat} />
              {cat.subcategories.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {cat.subcategories.map((sub) => (
                    <li key={sub.id}>
                      <Link
                        to={`/shop/${cat.slug}/${sub.slug}`}
                        className="text-sm text-neutral-600 hover:text-black hover:underline underline-offset-4"
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
