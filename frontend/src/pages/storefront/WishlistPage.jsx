import { useState, useEffect } from 'react';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useWishlistStore } from '@/stores/useWishlistStore';
import { useCartStore } from '@/stores/useCartStore';
import { useUIStore } from '@/stores/useUIStore';
import * as productService from '@/services/productService';
import { formatPrice } from '@/lib/formatters';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Link } from 'react-router';
import SmartImage from '@/components/ui/SmartImage';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { FALLBACK_IMAGE } from '@/lib/constants';

export default function WishlistPage() {
  const { items: wishlistItems, removeItem, clearAll } = useWishlistStore();
  const addToCart = useCartStore((s) => s.addItem);
  const { addToast, openCartDrawer } = useUIStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      const loaded = [];
      for (const item of wishlistItems) {
        const p = await productService.getById(item.productId);
        if (p) {
          const variant = p.variants.find((v) => v.id === item.variantId) || p.variants[0];
          loaded.push({ product: p, variant });
        }
      }
      setProducts(loaded);
      setLoading(false);
    }
    loadProducts();
  }, [wishlistItems.length]);

  const handleMoveToCart = (product, variant) => {
    addToCart({
      productId: product.id,
      variantId: variant.id,
      productName: product.name,
      variantLabel: `${variant.color.name}${variant.size ? ' / ' + variant.size : ''}`,
      image: variant.images[0],
      unitPrice: variant.price,
      sellingUnit: product.sellingUnit,
    });
    removeItem(variant.id);
    addToast({ type: 'success', message: 'Moved to cart!' });
    openCartDrawer();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Wishlist' }]} />

      <div className="flex items-center justify-between mt-4 mb-8">
        <ScrollReveal as="h1" className="text-2xl md:text-3xl font-semibold text-neutral-900">
          Wishlist ({wishlistItems.length})
        </ScrollReveal>
        {wishlistItems.length > 0 && (
          <button onClick={clearAll} className="text-sm text-neutral-400 hover:text-red-500">
            Clear All
          </button>
        )}
      </div>

      {wishlistItems.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save items you love for later"
          actionLabel="Browse Products"
          actionLink="/shop"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map(({ product, variant }) => (
            <div key={variant.id} className="border border-neutral-100 rounded-xl overflow-hidden group">
              <Link to={`/product/${product.slug}`} className="block aspect-[3/4] relative overflow-hidden bg-neutral-100">
                <SmartImage src={variant.images[0]} alt={product.name} containerClassName="w-full h-full" className="w-full h-full group-hover:scale-105 transition-transform duration-500" />
              </Link>
              <div className="p-4">
                <p className="text-xs text-neutral-400 uppercase tracking-wider">{product.fabric}</p>
                <h3 className="text-sm font-medium text-neutral-800 mt-1 line-clamp-2">{product.name}</h3>
                <p className="text-sm font-semibold mt-2">{formatPrice(variant.price)}</p>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={variant.stock === 0}
                    onClick={() => handleMoveToCart(product, variant)}
                  >
                    <ShoppingBag size={14} className="mr-1" />
                    {variant.stock === 0 ? 'Sold Out' : 'Move to Cart'}
                  </Button>
                  <button
                    onClick={() => removeItem(variant.id)}
                    className="w-9 h-9 flex items-center justify-center border border-neutral-200 rounded-lg text-neutral-400 hover:text-red-500 hover:border-red-200 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
