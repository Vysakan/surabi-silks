import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Search, X, ArrowRight } from 'lucide-react';
import * as productService from '@/services/productService';
import { useCategoryTree } from '@/hooks/useCategoryTree';
import SmartImage from '@/components/ui/SmartImage';
import { formatPrice } from '@/lib/formatters';
import { FALLBACK_IMAGE } from '@/lib/constants';

const MIN_CHARS = 2;
const RESULT_LIMIT = 6;

function ResultTile({ product, onNavigate }) {
  const variant = product.variants?.[0];
  return (
    <Link to={`/product/${product.slug}`} onClick={onNavigate} className="group block min-w-0">
      <SmartImage
        src={variant?.images?.[0] || FALLBACK_IMAGE}
        alt={product.name}
        containerClassName="aspect-[var(--product-aspect)] bg-neutral-100 rounded-[var(--radius-card)]"
        className="w-full h-full transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <p className="mt-2 text-sm text-black line-clamp-1 group-hover:underline underline-offset-4">{product.name}</p>
      {variant && <p className="text-sm text-neutral-600">{formatPrice(variant.price)}</p>}
    </Link>
  );
}

/** Full-width search panel that opens from the header search icon. */
export default function SearchOverlay({ onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { categories } = useCategoryTree();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ query: '', items: [], total: 0 });
  const [searching, setSearching] = useState(false);
  const [suggested, setSuggested] = useState([]);

  const term = query.trim();

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  // A few new arrivals to show before anything is typed.
  useEffect(() => {
    let cancelled = false;
    productService.getNewArrivals()
      .then((items) => { if (!cancelled) setSuggested((items || []).slice(0, 4)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Live results, 300 ms after typing stops.
  useEffect(() => {
    if (term.length < MIN_CHARS) return undefined;
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const data = await productService.search(term);
        if (!cancelled) setResults({ query: term, items: data.items || [], total: data.total ?? (data.items || []).length });
      } catch {
        if (!cancelled) setResults({ query: term, items: [], total: 0 });
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [term]);

  const submit = (e) => {
    e.preventDefault();
    if (!term) return;
    onClose();
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  const showResults = term.length >= MIN_CHARS;
  const upToDate = results.query === term;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 sf-fade-in" onClick={onClose} />
      <div className="relative bg-white max-h-[90vh] overflow-y-auto sf-slide-down">
        <div className="max-w-5xl mx-auto px-4 lg:px-6 pt-5 pb-8">
          <form onSubmit={submit} className="flex items-center gap-3 border-b border-black pb-3">
            <Search size={20} strokeWidth={1.6} className="shrink-0" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for sarees, fabrics, colours..."
              aria-label="Search products"
              className="flex-1 min-w-0 bg-transparent text-base md:text-lg placeholder:text-neutral-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            <button type="button" onClick={onClose} aria-label="Close search" className="p-1 hover:opacity-60 cursor-pointer">
              <X size={22} />
            </button>
          </form>

          {!showResults && (
            <div className="mt-6 grid gap-8 md:grid-cols-[220px_1fr]">
              <div>
                <p className="sf-eyebrow mb-3">Collections</p>
                <ul className="space-y-2">
                  {categories.slice(0, 8).map((cat) => (
                    <li key={cat.id}>
                      <Link to={`/shop/${cat.slug}`} onClick={onClose} className="text-sm text-black hover:underline underline-offset-4">
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link to="/shop" onClick={onClose} className="text-sm text-neutral-500 hover:underline underline-offset-4">Shop all</Link>
                  </li>
                </ul>
              </div>
              {suggested.length > 0 && (
                <div>
                  <p className="sf-eyebrow mb-3">New arrivals</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {suggested.map((p) => <ResultTile key={p.id} product={p} onNavigate={onClose} />)}
                  </div>
                </div>
              )}
            </div>
          )}

          {showResults && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4 min-h-6">
                <p className="sf-eyebrow">
                  {searching || !upToDate ? 'Searching...' : `${results.total} ${results.total === 1 ? 'result' : 'results'}`}
                </p>
                {upToDate && results.total > 0 && (
                  <button type="button" onClick={submit} className="sf-link inline-flex items-center gap-1 cursor-pointer">
                    View all results <ArrowRight size={14} />
                  </button>
                )}
              </div>
              {upToDate && !searching && results.items.length === 0 && (
                <p className="text-sm text-neutral-600 py-6">
                  No products match &ldquo;{term}&rdquo;. Try another word, or <Link to="/shop" onClick={onClose} className="underline underline-offset-4">browse everything</Link>.
                </p>
              )}
              {results.items.length > 0 && (
                <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 transition-opacity ${upToDate ? '' : 'opacity-50'}`}>
                  {results.items.slice(0, RESULT_LIMIT).map((p) => <ResultTile key={p.id} product={p} onNavigate={onClose} />)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
