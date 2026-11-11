import { Link } from 'react-router';
import { useCategoryTree } from '@/hooks/useCategoryTree';
import CategoryCard from '@/components/storefront/CategoryCard';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import ScrollReveal from '@/components/ui/ScrollReveal';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

/** /categories - every main category at once, with its subcategories. */
export default function CategoriesPage() {
  const { categories, loading, error } = useCategoryTree();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'All Categories' }]} />

      <div className="mt-4 mb-8">
        <ScrollReveal as="h1" className="text-2xl md:text-3xl font-semibold text-neutral-900">All Categories</ScrollReveal>
        {!loading && !error && (
          <p className="text-sm text-neutral-500 mt-1">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'}
          </p>
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3] rounded-xl" />)}
        </div>
      )}

      {!loading && (error || categories.length === 0) && (
        <EmptyState
          title={error ? 'Could not load categories' : 'No categories yet'}
          description={error ? 'Please refresh the page to try again.' : 'Please check back soon.'}
        />
      )}

      {!loading && !error && categories.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6">
          {categories.map((cat) => (
            <div key={cat.id}>
              <CategoryCard category={cat} />
              {cat.subcategories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {cat.subcategories.map((sub) => (
                    <Link
                      key={sub.id}
                      to={`/shop/${cat.slug}/${sub.slug}`}
                      className="text-xs px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
