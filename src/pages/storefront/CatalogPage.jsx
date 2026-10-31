import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { SlidersHorizontal, X } from 'lucide-react';
import * as productService from '@/services/productService';
import * as categoryService from '@/services/categoryService';
import ProductCard from '@/components/storefront/ProductCard';
import FilterSidebar from '@/components/storefront/FilterSidebar';
import Pagination from '@/components/ui/Pagination';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import Select from '@/components/ui/Select';
import { SkeletonProductCard } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { ITEMS_PER_PAGE } from '@/lib/constants';
const SORT_OPTIONS = [
  { value: '', label: 'Relevance' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'name-asc', label: 'Name: A-Z' },
];

export default function CatalogPage() {
  const { categorySlug, subcategorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);
  const [subcategory, setSubcategory] = useState(null);
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

  useEffect(() => {
    async function resolveCategory() {
      if (!categorySlug) { setCategory(null); setSubcategory(null); return; }
      const cats = await categoryService.getAll();
      const cat = cats.find((c) => c.slug === categorySlug);
      setCategory(cat || null);
      if (cat && subcategorySlug) {
        setSubcategory(cat.subcategories.find((s) => s.slug === subcategorySlug) || null);
      } else {
        setSubcategory(null);
      }
    }
    resolveCategory();
  }, [categorySlug, subcategorySlug]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const resolvedFilters = { ...filters };
    if (category) resolvedFilters.categoryId = category.id;
    if (subcategory) resolvedFilters.subcategoryId = subcategory.id;

    const data = await productService.getAll({
      page,
      limit: ITEMS_PER_PAGE,
      sort: sort || undefined,
      filters: resolvedFilters,
    });
    setProducts(data.items);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setLoading(false);
  }, [page, sort, category, subcategory, searchParams.toString()]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
      next.delete(key);
    } else {
      next.set(key, Array.isArray(value) ? value.join(',') : value);
    }
    next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const handleFilterChange = (newFilters) => {
    const next = new URLSearchParams(searchParams);
    next.delete('page');
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) {
        next.delete(k);
      } else {
        next.set(k, Array.isArray(v) ? v.join(',') : v);
      }
    });
    setSearchParams(next, { replace: true });
  };

  const handleClearFilters = () => {
    setSearchParams(sort ? { sort } : {}, { replace: true });
  };

  const breadcrumbs = [{ label: 'Home', to: '/' }];
  if (category) breadcrumbs.push({ label: category.name, to: `/shop/${category.slug}` });
  if (subcategory) breadcrumbs.push({ label: subcategory.name });
  if (!category) breadcrumbs.push({ label: 'Shop All' });

  const pageTitle = subcategory?.name || category?.name || 'Shop All';

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Breadcrumbs items={breadcrumbs} />

      <div className="flex items-center justify-between mt-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">{pageTitle}</h1>
          {!loading && <p className="text-sm text-neutral-500 mt-1">{total} products</p>}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-2 px-3 py-2 border border-neutral-200 rounded-lg text-sm"
          >
            <SlidersHorizontal size={16} /> Filters
          </button>
          <div className="hidden sm:block w-44">
            <Select
              options={SORT_OPTIONS}
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <FilterSidebar filters={filters} onFilterChange={handleFilterChange} onClear={handleClearFilters} />
        </aside>

        {/* Mobile filter drawer */}
        {mobileFiltersOpen && (
          <>
            <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setMobileFiltersOpen(false)} />
            <div className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-white z-50 p-6 overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Filters</h3>
                <button onClick={() => setMobileFiltersOpen(false)}><X size={20} /></button>
              </div>
              <FilterSidebar filters={filters} onFilterChange={handleFilterChange} onClear={handleClearFilters} />
            </div>
          </>
        )}

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <SkeletonProductCard key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              title="No products found"
              description="Try adjusting your filters or search terms"
              actionLabel="Clear Filters"
              onAction={handleClearFilters}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-10">
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
    </div>
  );
}
