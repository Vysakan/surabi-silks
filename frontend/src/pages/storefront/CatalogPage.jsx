import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { SlidersHorizontal, X } from 'lucide-react';
import * as productService from '@/services/productService';
import { loadCategoryTree, useCategoryTree } from '@/hooks/useCategoryTree';
import ProductCard from '@/components/storefront/ProductCard';
import FilterSidebar from '@/components/storefront/FilterSidebar';
import FilterBar, { ActiveFilters, SortSelect } from '@/components/storefront/FilterBar';
import Pagination from '@/components/ui/Pagination';
import { SkeletonProductCard } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { ITEMS_PER_PAGE } from '@/lib/constants';
import { cn } from '@/lib/cn';

const GRID = 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-3 md:gap-x-6 gap-y-8 md:gap-y-12';

function SubcategoryPills({ category, activeSlug }) {
  const subs = category?.subcategories || [];
  if (subs.length === 0) return null;
  const pill = (active) => cn(
    'shrink-0 px-4 py-2 rounded-full border text-sm transition-colors',
    active ? 'bg-black border-black text-white' : 'border-neutral-300 text-black hover:border-black'
  );
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap">
      <Link to={`/shop/${category.slug}`} className={pill(!activeSlug)}>All</Link>
      {subs.map((sub) => (
        <Link key={sub.id} to={`/shop/${category.slug}/${sub.slug}`} className={pill(sub.slug === activeSlug)}>
          {sub.name}
        </Link>
      ))}
    </div>
  );
}

export default function CatalogPage() {
  const { categorySlug, subcategorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories } = useCategoryTree();

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);
  const [subcategory, setSubcategory] = useState(null);
  // Which /shop/:category/:subcategory the category state belongs to (products wait for it).
  const [resolvedPath, setResolvedPath] = useState(null);
  const pathKey = `${categorySlug || ''}/${subcategorySlug || ''}`;
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const page = Number(searchParams.get('page')) || 1;
  const sort = searchParams.get('sort') || '';
  const filters = {};
  if (searchParams.get('categoryId')) filters.categoryId = searchParams.get('categoryId');
  if (searchParams.get('priceMin')) filters.priceMin = Number(searchParams.get('priceMin'));
  if (searchParams.get('priceMax')) filters.priceMax = Number(searchParams.get('priceMax'));
  if (searchParams.get('colors')) filters.colors = searchParams.get('colors').split(',');
  if (searchParams.get('fabrics')) filters.fabrics = searchParams.get('fabrics').split(',');
  if (searchParams.get('occasions')) filters.occasions = searchParams.get('occasions').split(',');
  const activeFilterCount = (filters.categoryId ? 1 : 0)
    + (filters.priceMin != null || filters.priceMax != null ? 1 : 0)
    + (filters.colors?.length || 0) + (filters.fabrics?.length || 0) + (filters.occasions?.length || 0);

  useEffect(() => {
    let cancelled = false;
    async function resolveCategory() {
      let cat = null;
      let sub = null;
      if (categorySlug) {
        try {
          const tree = await loadCategoryTree();
          cat = tree.find((c) => c.slug === categorySlug) || null;
          if (cat && subcategorySlug) {
            sub = (cat.subcategories || []).find((s) => s.slug === subcategorySlug) || null;
          }
        } catch {
          // Category list unavailable: show all products rather than nothing.
        }
      }
      if (cancelled) return;
      setCategory(cat);
      setSubcategory(sub);
      setResolvedPath(pathKey);
    }
    resolveCategory();
    return () => { cancelled = true; };
  }, [categorySlug, subcategorySlug, pathKey]);

  const fetchProducts = useCallback(async () => {
    if (resolvedPath !== pathKey) return; // wait until the category in the URL is known
    setLoading(true);
    const resolvedFilters = { ...filters };
    if (category) resolvedFilters.categoryId = category.id;
    if (subcategory) resolvedFilters.subcategoryId = subcategory.id;

    try {
      const data = await productService.getAll({
        page,
        limit: ITEMS_PER_PAGE,
        sort: sort || undefined,
        filters: resolvedFilters,
      });
      setProducts(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch {
      setProducts([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, sort, category, subcategory, resolvedPath, pathKey, searchParams.toString()]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  /** Applies only the keys in `patch`; empty values remove the key. */
  const handleFilterChange = (patch) => {
    const next = new URLSearchParams(searchParams);
    next.delete('page');
    Object.entries(patch).forEach(([k, v]) => {
      if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) {
        next.delete(k);
      } else {
        next.set(k, Array.isArray(v) ? v.join(',') : v);
      }
    });
    setSearchParams(next, { replace: true });
  };

  const handleSortChange = (value) => handleFilterChange({ sort: value });

  const handleClearFilters = () => {
    setSearchParams(sort ? { sort } : {}, { replace: true });
  };

  const pageTitle = subcategory?.name || category?.name || 'All products';
  const description = (subcategory || category)?.description;
  const showCategoryFilter = !category;

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-8 md:pt-12 pb-16">
      {/* Title */}
      <div className="mb-6 md:mb-8">
        {subcategory && category && (
          <Link to={`/shop/${category.slug}`} className="sf-eyebrow hover:text-black">{category.name}</Link>
        )}
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-black mt-1">{pageTitle}</h1>
        {description && <p className="text-sm md:text-base text-neutral-600 mt-3 max-w-2xl">{description}</p>}
      </div>

      {category && (
        <div className="mb-6">
          <SubcategoryPills category={category} activeSlug={subcategory?.slug} />
        </div>
      )}

      {/* Filter + sort row */}
      <div className="border-y border-neutral-200 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="hidden lg:block">
            <FilterBar filters={filters} onChange={handleFilterChange} showCategory={showCategoryFilter} />
          </div>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-2 text-sm font-medium cursor-pointer"
          >
            <SlidersHorizontal size={16} strokeWidth={1.6} />
            Filter{activeFilterCount > 0 && ` (${activeFilterCount})`}
          </button>
          <div className="flex items-center gap-5 shrink-0">
            {!loading && (
              <span className="hidden sm:inline text-sm text-neutral-500">
                {total} {total === 1 ? 'item' : 'items'}
              </span>
            )}
            <SortSelect value={sort} onChange={handleSortChange} />
          </div>
        </div>
      </div>
      <div className="hidden lg:block">
        <ActiveFilters filters={filters} categories={categories} onChange={handleFilterChange} onClear={handleClearFilters} />
      </div>
      {!loading && <p className="sm:hidden text-xs text-neutral-500 mt-3">{total} {total === 1 ? 'item' : 'items'}</p>}

      {/* Phone filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 sf-fade-in" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[88%] max-w-sm bg-white flex flex-col sf-slide-in-left">
            <div className="flex items-center justify-between px-5 h-16 border-b border-neutral-200">
              <h3 className="text-base font-medium">Filter{activeFilterCount > 0 && ` (${activeFilterCount})`}</h3>
              <button onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters" className="p-2 -mr-2 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5">
              <FilterSidebar filters={filters} onFilterChange={handleFilterChange} showCategory={showCategoryFilter} />
            </div>
            <div className="grid grid-cols-2 gap-3 px-5 py-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={handleClearFilters}
                className="py-3 border border-neutral-300 text-sm font-medium rounded-[var(--radius-button)] cursor-pointer"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="py-3 bg-black text-white text-sm font-medium rounded-[var(--radius-button)] cursor-pointer"
              >
                Show {loading ? '' : total} {total === 1 ? 'item' : 'items'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products */}
      <div className="mt-8">
        {loading ? (
          <div className={GRID}>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonProductCard key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            description={activeFilterCount > 0 ? 'Try removing a filter.' : 'Please check back soon.'}
            actionLabel={activeFilterCount > 0 ? 'Clear filters' : undefined}
            onAction={activeFilterCount > 0 ? handleClearFilters : undefined}
          />
        ) : (
          <>
            <div className={GRID}>
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
            {totalPages > 1 && (
              <div className="mt-14">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={(p) => {
                    const next = new URLSearchParams(searchParams);
                    if (p === 1) next.delete('page');
                    else next.set('page', p);
                    setSearchParams(next, { replace: true });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
