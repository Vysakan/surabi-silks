import { useState } from 'react';
import { Link } from 'react-router';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { useWishlistStore } from '@/stores/useWishlistStore';
import { useCartStore } from '@/stores/useCartStore';
import { useUIStore } from '@/stores/useUIStore';
import PriceDisplay from '@/components/ui/PriceDisplay';
import Badge from '@/components/ui/Badge';
import SmartImage from '@/components/ui/SmartImage';
import { cn } from '@/lib/cn';

export default function ProductCard({ product }) {
  const [hoveredColor, setHoveredColor] = useState(null);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const addToCart = useCartStore((s) => s.addItem);
  const addToast = useUIStore((s) => s.addToast);
  const openCartDrawer = useUIStore((s) => s.openCartDrawer);

  const defaultVariant = product.variants[0];
  const activeVariant = hoveredColor
    ? product.variants.find((v) => v.color.name === hoveredColor) || defaultVariant
    : defaultVariant;

  const mainImage = activeVariant.images[0];
  const hoverImage = activeVariant.images[1] || mainImage;
  const wishlisted = useWishlistStore((s) => s.items.some((i) => i.variantId === defaultVariant.id));

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({
      productId: product.id,
      variantId: defaultVariant.id,
      productName: product.name,
      image: mainImage,
      price: defaultVariant.price,
    });
  };

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.variants.length === 1 && activeVariant.stock > 0) {
      addToCart({
        productId: product.id,
        variantId: activeVariant.id,
        productName: product.name,
        variantLabel: `${activeVariant.color.name}${activeVariant.size ? ' / ' + activeVariant.size : ''}`,
        image: mainImage,
        unitPrice: activeVariant.price,
        sellingUnit: product.sellingUnit,
      });
      addToast({ type: 'success', message: 'Added to cart!' });
      openCartDrawer();
    }
  };

  const uniqueColors = [...new Map(product.variants.map((v) => [v.color.name, v.color])).values()];

  return (
    <Link to={`/product/${product.slug}`} className="group block">
      {/* Image container */}
      <div className="relative aspect-[3/4] rounded-[var(--radius-card)] overflow-hidden bg-neutral-100 mb-3">
        {/* Main image with hover swap */}
        <SmartImage
          src={mainImage}
          alt={product.name}
          containerClassName="absolute inset-0 transition-opacity duration-500 group-hover:opacity-0"
          className="w-full h-full"
        />
        <SmartImage
          src={hoverImage}
          alt={`${product.name} alternate`}
          containerClassName="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          className="w-full h-full"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.isNewArrival && <Badge color="info">New</Badge>}
          {product.isBestseller && <Badge color="warning">Bestseller</Badge>}
          {activeVariant.stock === 0 && <Badge color="error">Sold Out</Badge>}
          {activeVariant.mrp > activeVariant.price && (
            <Badge color="success">
              {Math.round(((activeVariant.mrp - activeVariant.price) / activeVariant.mrp) * 100)}% Off
            </Badge>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          className={cn(
            'absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer',
            wishlisted
              ? 'bg-red-50 text-red-500'
              : 'bg-white/80 text-neutral-500 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:bg-white hover:text-red-500'
          )}
        >
          <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>

        {/* Quick action */}
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-100 translate-y-0 lg:opacity-0 lg:translate-y-2 lg:group-hover:opacity-100 lg:group-hover:translate-y-0 transition-all duration-200">
          {product.variants.length === 1 && activeVariant.stock > 0 ? (
            <button
              onClick={handleQuickAdd}
              className="w-full flex items-center justify-center gap-2 bg-white/95 backdrop-blur-sm text-neutral-800 py-2.5 rounded-lg text-sm font-medium hover:bg-white transition-colors shadow-sm"
            >
              <ShoppingBag size={16} />
              Quick Add
            </button>
          ) : (
            <div className="w-full flex items-center justify-center gap-2 bg-white/95 backdrop-blur-sm text-neutral-800 py-2.5 rounded-lg text-sm font-medium shadow-sm">
              <Eye size={16} />
              View Options
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1.5">
        <p className="text-xs text-neutral-400 uppercase tracking-wider">{product.fabric}</p>
        <h3 className="text-sm font-medium text-neutral-800 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {product.name}
        </h3>
        <PriceDisplay price={activeVariant.price} mrp={activeVariant.mrp} />

        {/* Color swatches */}
        {uniqueColors.length > 1 && (
          <div className="flex items-center gap-1.5 pt-1">
            {uniqueColors.slice(0, 5).map((color) => (
              <button
                key={color.name}
                title={color.name}
                onMouseEnter={() => setHoveredColor(color.name)}
                onMouseLeave={() => setHoveredColor(null)}
                onClick={(e) => e.preventDefault()}
                className={cn(
                  'w-4 h-4 rounded-full border border-neutral-200 transition-transform hover:scale-125',
                  hoveredColor === color.name && 'ring-2 ring-primary-400 ring-offset-1'
                )}
                style={{ backgroundColor: color.hex }}
              />
            ))}
            {uniqueColors.length > 5 && (
              <span className="text-xs text-neutral-400">+{uniqueColors.length - 5}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
