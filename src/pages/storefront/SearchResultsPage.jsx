import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Search } from 'lucide-react';
import * as productService from '@/services/productService';
import ProductCard from '@/components/storefront/ProductCard';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonProductCard } from '@/components/ui/Skeleton';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import ScrollReveal from '@/components/ui/ScrollReveal';

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function doSearch() {
      if (!query.trim()) { setResults([]); setLoading(false); return; }
      setLoading(true);
      const data = await productService.search(query);
      setResults(data.items);
      setLoading(false);
    }
    doSearch();
  }, [query]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: `Search: "${query}"` }]} />

      <ScrollReveal as="h1" className="text-2xl md:text-3xl font-semibold text-neutral-900 mt-4 mb-2">
        Search Results
      </ScrollReveal>
      {!loading && (
        <p className="text-neutral-500 mb-8">
          {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonProductCard key={i} />)}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No results found"
          description={`We couldn't find anything for "${query}". Try different keywords or browse our collections.`}
          actionLabel="Browse Shop"
          actionLink="/shop"
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {results.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
