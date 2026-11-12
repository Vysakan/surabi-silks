import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Search } from 'lucide-react';
import * as productService from '@/services/productService';
import ProductCard from '@/components/storefront/ProductCard';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonProductCard } from '@/components/ui/Skeleton';

const GRID = 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-3 md:gap-x-6 gap-y-8 md:gap-y-12';

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function doSearch() {
      if (!query.trim()) { setResults([]); setLoading(false); return; }
      setLoading(true);
      try {
        const data = await productService.search(query);
        if (!cancelled) setResults(data.items || []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    doSearch();
    return () => { cancelled = true; };
  }, [query]);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-8 md:pt-12 pb-16">
      <p className="sf-eyebrow">Search results</p>
      <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-black mt-1">&ldquo;{query}&rdquo;</h1>
      {!loading && (
        <p className="text-sm text-neutral-500 mt-3">
          {results.length} {results.length === 1 ? 'item' : 'items'}
        </p>
      )}

      <div className="mt-8 border-t border-neutral-200 pt-8">
        {loading ? (
          <div className={GRID}>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonProductCard key={i} />)}
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No results found"
            description={`We couldn't find anything for "${query}". Try different keywords or browse our collections.`}
          />
        ) : (
          <div className={GRID}>
            {results.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
