import { useState } from 'react';
import { Link } from 'react-router';
import { Heart, Plus } from 'lucide-react';
import { useWishlistStore } from '@/stores/useWishlistStore';
import { useCartStore } from '@/stores/useCartStore';
import { useUIStore } from '@/stores/useUIStore';
import PriceDisplay from '@/components/ui/PriceDisplay';
import SmartImage from '@/components/ui/SmartImage';
import { FALLBACK_IMAGE } from '@/lib/constants';
import { cn } from '@/lib/cn';

function CardBadge({ children, tone = 'light' }) {
  return (
    <span
      className={cn(
        'inline-block px-2 py-0.5 text-[11px] font-medium tracking-wide rounded-sm',
        tone === 'dark' && 'bg-black text-white',
        tone === 'sale' && 'bg-[var(--color-sale)] text-white',
        tone === 'light' && 'bg-white text-black'
      )}
    >
      {children}
    </span>
  );
}

export default function ProductCard({ product, className }) {
  const [hoveredColor, setHoveredColor] = useState(null);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const addToCart = useCartStore((s) => s.addItem);
  const openCartDrawer = useUIStore((s) => s.openCartDrawer);

  const variants = product.variants || [];
  const defaultVariant = variants[0];
  const activeVariant = (hoveredColor && variants.find((v) => v.color?.name === hoveredColor)) || defaultVariant;
  const wishlisted = useWishlistStore((s) => s.items.some((i) => i.variantId === defaultVariant?.id));

  if (!defaultVariant) return null;

  const mainImage = activeVariant.images?.[0] || FALLBACK_IMAGE;
  const hoverImage = activeVariant.images?.[1];
  const soldOut = variants.every((v) => v.stock === 0);
  const onSale = activeVariant.mrp > activeVariant.price;
  const canQuickAdd = variants.length === 1 && activeVariant.stock > 0;
  const uniqueColors = [...new Map(variants.filter((v) => v.color).map((v) => [v.color.name, v.color])).values()];

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({
      productId: product.id,
      variantId: defaultVariant.id,
      productName: product.name,
      image: defaultVariant.images?.[0] || FALLBACK_IMAGE,
      price: defaultVariant.price,
    });
  };

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canQuickAdd) return;
    addToCart({
      productId: product.id,
      variantId: activeVariant.id,
      productName: product.name,
      variantLabel: `${activeVariant.color?.name || ''}${activeVariant.size ? ' / ' + activeVariant.size : ''}`,
      image: mainImage,
      unitPrice: activeVariant.price,
      sellingUnit: product.sellingUnit,
    });
    openCartDrawer();
  };

  return (
    <Link to={`/product/${product.slug}`} className={cn('group block min-w-0', className)}>
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100 rounded-[var(--radius-card)]">
        <SmartImage
          src={mainImage}
          alt={product.name}
          containerClassName={cn(
            'absolute inset-0 transition-opacity duration-500',
            hoverImage && 'lg:group-hover:opacity-0'
          )}
          className="w-full h-full transition-transform duration-700 group-hover:scale-[1.03]"
        />
        {hoverImage && (
          <SmartImage
            src={hoverImage}
            alt=""
            containerClassName="absolute inset-0 opacity-0 transition-opacity duration-500 hidden lg:block lg:group-hover:opacity-100"
            className="w-full h-full"
          />
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1">
          {soldOut ? (
            <CardBadge tone="dark">Sold out</CardBadge>
          ) : onSale ? (
            <CardBadge tone="sale">Sale</CardBadge>
          ) : product.isNewArrival ? (
            <CardBadge>New</CardBadge>
          ) : null}
        </div>

        {/* Wishlist */}
        <button
          type="button"
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={cn(
            'absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center transition-opacity cursor-pointer',
            wishlisted ? 'opacity-100 text-black' : 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100 text-neutral-700 hover:text-black'
          )}
        >
          <Heart size={16} strokeWidth={1.8} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>

        {/* Quick add (single-option products) */}
        {canQuickAdd && (
          <button
            type="button"
            onClick={handleQuickAdd}
            aria-label={`Add ${product.name} to cart`}
            className="absolute bottom-2.5 right-2.5 h-9 min-w-9 px-2.5 rounded-full bg-white text-black shadow-sm flex items-center justify-center gap-1 text-xs font-medium transition-all cursor-pointer lg:opacity-0 lg:translate-y-1 lg:group-hover:opacity-100 lg:group-hover:translate-y-0 hover:bg-black hover:text-white"
          >
            <Plus size={16} />
            <span className="hidden lg:inline">Add</span>
          </button>
        )}
      </div>

      <div className="pt-3 space-y-1">
        <h3 className="text-sm text-black leading-snug line-clamp-2 group-hover:underline underline-offset-4 decoration-1">
          {product.name}
        </h3>
        <PriceDisplay price={activeVariant.price} mrp={activeVariant.mrp} size="sm" showPercent={false} />

        {uniqueColors.length > 1 && (
          <div className="flex items-center gap-1.5 pt-1">
            {uniqueColors.slice(0, 5).map((color) => (
              <span
                key={color.name}
                title={color.name}
                onMouseEnter={() => setHoveredColor(color.name)}
                onMouseLeave={() => setHoveredColor(null)}
                className={cn(
                  'w-3.5 h-3.5 rounded-full border border-black/15 transition-transform',
                  hoveredColor === color.name && 'ring-1 ring-black ring-offset-1'
                )}
                style={{ backgroundColor: color.hex }}
              />
            ))}
            {uniqueColors.length > 5 && (
              <span className="text-xs text-neutral-500">+{uniqueColors.length - 5}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
