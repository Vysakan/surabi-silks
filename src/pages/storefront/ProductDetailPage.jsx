import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { Heart, ShoppingBag, Minus, Plus, Truck, RotateCcw, Shield, Star } from 'lucide-react';
import * as productService from '@/services/productService';
import * as reviewService from '@/services/reviewService';
import { useCartStore } from '@/stores/useCartStore';
import { useWishlistStore } from '@/stores/useWishlistStore';
import { useUIStore } from '@/stores/useUIStore';
import { useAuthStore } from '@/stores/useAuthStore';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import Button from '@/components/ui/Button';
import PriceDisplay from '@/components/ui/PriceDisplay';
import StarRating from '@/components/ui/StarRating';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProductCard from '@/components/storefront/ProductCard';
import ImageGallery from '@/components/ui/ImageGallery';
import { formatDate } from '@/lib/formatters';
import { cn } from '@/lib/cn';

function VariantSelector({ label, options, value, onChange, type = 'text' }) {
  return (
    <div className="mb-4">
      <p className="text-sm font-medium text-neutral-700 mb-2">
        {label}: <span className="text-neutral-500">{value || 'Select'}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = opt.value === value;
          if (type === 'color') {
            return (
              <button
                key={opt.value}
                onClick={() => onChange(opt.value)}
                title={opt.label}
                className={cn(
                  'w-9 h-9 rounded-full border-2 transition-all',
                  active ? 'border-primary-500 ring-2 ring-primary-200' : 'border-neutral-200 hover:border-neutral-400',
                  opt.disabled && 'opacity-40 cursor-not-allowed'
                )}
                style={{ backgroundColor: opt.hex }}
                disabled={opt.disabled}
              />
            );
          }
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              disabled={opt.disabled}
              className={cn(
                'px-4 py-2 text-sm border rounded-lg transition-all',
                active ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400',
                opt.disabled && 'opacity-40 cursor-not-allowed line-through'
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ReviewForm({ productId, onSubmitted }) {
  const { isAuthenticated, user } = useAuthStore();
  const addToast = useUIStore((s) => s.addToast);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="bg-neutral-50 rounded-lg p-4 text-center">
        <p className="text-sm text-neutral-500">
          <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link> to write a review.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { addToast({ type: 'error', message: 'Please select a rating' }); return; }
    if (comment.trim().length < 5) { addToast({ type: 'error', message: 'Review must be at least 5 characters' }); return; }
    setSubmitting(true);
    const review = await reviewService.create({
      productId,
      customerId: user.id,
      customerName: user.name,
      rating,
      comment: comment.trim(),
    });
    onSubmitted(review);
    setRating(0);
    setComment('');
    addToast({ type: 'success', message: 'Review submitted!' });
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="border border-neutral-100 rounded-xl p-5 space-y-4">
      <h4 className="text-sm font-semibold text-neutral-800">Write a Review</h4>
      <div>
        <p className="text-sm text-neutral-600 mb-2">Rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="text-neutral-300 hover:text-amber-400 transition-colors"
            >
              <Star size={24} fill={star <= rating ? 'currentColor' : 'none'} className={star <= rating ? 'text-amber-400' : ''} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm text-neutral-600 mb-1">Your Review</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400"
          placeholder="Share your thoughts about this product..."
        />
      </div>
      <Button type="submit" isLoading={submitting} size="sm">Submit Review</Button>
    </form>
  );
}

function ProductTabs({ product, reviews, onReviewSubmitted }) {
  const [tab, setTab] = useState('description');
  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'details', label: 'Details' },
    { id: 'reviews', label: `Reviews (${reviews.length})` },
    { id: 'care', label: 'Care' },
  ];

  return (
    <div className="mt-12 border-t border-neutral-100">
      <div className="flex gap-6 border-b border-neutral-100 overflow-x-auto scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0',
              tab === t.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="py-6">
        {tab === 'description' && (
          <p className="text-neutral-600 leading-relaxed whitespace-pre-line">{product.description}</p>
        )}
        {tab === 'details' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {[
              ['Fabric', product.fabric],
              ['Weave', product.weave],
              ['Weight', product.weight],
              ['Selling Unit', product.sellingUnit === 'metre' ? 'Per Metre' : 'Per Piece'],
              ['Occasion', product.occasion?.join(', ')],
              ['Tags', product.tags?.join(', ')],
            ].filter(([_, v]) => v).map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-neutral-50">
                <span className="text-neutral-500">{k}</span>
                <span className="text-neutral-800 font-medium">{v}</span>
              </div>
            ))}
          </div>
        )}
        {tab === 'reviews' && (
          <div className="space-y-6">
            <ReviewForm productId={product.id} onSubmitted={onReviewSubmitted} />
            {reviews.length === 0 ? (
              <p className="text-neutral-500">No reviews yet. Be the first to review this product!</p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="pb-5 border-b border-neutral-50 last:border-0">
                  <div className="flex items-center gap-3 mb-2">
                    <StarRating value={r.rating} size={14} />
                    <span className="text-sm font-medium text-neutral-800">{r.customerName}</span>
                    <span className="text-xs text-neutral-400">{formatDate(r.createdAt)}</span>
                  </div>
                  <p className="text-sm text-neutral-600">{r.comment}</p>
                </div>
              ))
            )}
          </div>
        )}
        {tab === 'care' && (
          <p className="text-neutral-600">{product.careInstructions || 'Please follow the care label on the product.'}</p>
        )}
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  const addToCart = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const wishlistItems = useWishlistStore((s) => s.items);
  const { addToast, openCartDrawer } = useUIStore();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const p = await productService.getBySlug(slug);
      if (p) {
        setProduct(p);
        setSelectedColor(p.variants[0]?.color.name || null);
        setSelectedSize(p.variants[0]?.size || null);
        const [rev, rel] = await Promise.all([
          reviewService.getByProductId(p.id),
          productService.getRelated(p.id),
        ]);
        setReviews(rev);
        setRelated(rel);
      }
      setLoading(false);
    }
    load();
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) return <LoadingSpinner />;
  if (!product) return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <h2 className="text-xl font-semibold mb-2">Product not found</h2>
      <Link to="/shop" className="text-primary-600 hover:underline">Back to Shop</Link>
    </div>
  );

  const uniqueColors = [...new Map(product.variants.map((v) => [v.color.name, v.color])).values()];
  const variantsForColor = product.variants.filter((v) => v.color.name === selectedColor);
  const uniqueSizes = [...new Set(variantsForColor.map((v) => v.size))];

  const activeVariant = product.variants.find(
    (v) => v.color.name === selectedColor && v.size === selectedSize
  ) || product.variants[0];

  const wishlisted = wishlistItems.some((i) => i.variantId === activeVariant.id);

  const handleAddToCart = () => {
    if (activeVariant.stock === 0) return;
    addToCart({
      productId: product.id,
      variantId: activeVariant.id,
      productName: product.name,
      variantLabel: `${activeVariant.color.name}${activeVariant.size ? ' / ' + activeVariant.size : ''}`,
      image: activeVariant.images[0],
      unitPrice: activeVariant.price,
      quantity,
      sellingUnit: product.sellingUnit,
    });
    addToast({ type: 'success', message: 'Added to cart!' });
    openCartDrawer();
  };

  const handleWishlist = () => {
    toggleWishlist({
      productId: product.id,
      variantId: activeVariant.id,
      productName: product.name,
      image: activeVariant.images[0],
      price: activeVariant.price,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Breadcrumbs items={[
        { label: 'Home', to: '/' },
        { label: 'Shop', to: '/shop' },
        { label: product.name },
      ]} />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery — sticky on desktop */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <ImageGallery images={activeVariant.images} alt={product.name} />
        </div>

        {/* Product info */}
        <div>
          <p className="text-sm text-neutral-400 uppercase tracking-wider mb-1">{product.fabric}</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900 mb-3">{product.name}</h1>

          <div className="flex items-center gap-3 mb-4">
            <StarRating value={product.rating} />
            <span className="text-sm text-neutral-500">({product.reviewCount} reviews)</span>
          </div>

          <div className="mb-6">
            <PriceDisplay price={activeVariant.price} mrp={activeVariant.mrp} size="lg" />
          </div>

          <p className="text-neutral-600 mb-6">{product.shortDescription}</p>

          {/* Color selector */}
          {uniqueColors.length > 1 && (
            <VariantSelector
              label="Color"
              type="color"
              value={selectedColor}
              onChange={(c) => {
                setSelectedColor(c);
                const firstVariant = product.variants.find((v) => v.color.name === c);
                if (firstVariant) setSelectedSize(firstVariant.size);
              }}
              options={uniqueColors.map((c) => ({
                value: c.name,
                label: c.name,
                hex: c.hex,
              }))}
            />
          )}

          {/* Size selector */}
          {uniqueSizes.length > 1 && (
            <VariantSelector
              label="Size"
              value={selectedSize}
              onChange={setSelectedSize}
              options={uniqueSizes.map((s) => {
                const v = product.variants.find((v) => v.color.name === selectedColor && v.size === s);
                return { value: s, label: s, disabled: v?.stock === 0 };
              })}
            />
          )}

          {/* Stock status */}
          <div className="mb-6">
            {activeVariant.stock === 0 ? (
              <Badge color="error">Out of Stock</Badge>
            ) : activeVariant.stock <= 3 ? (
              <Badge color="warning">Only {activeVariant.stock} left</Badge>
            ) : (
              <Badge color="success">In Stock</Badge>
            )}
          </div>

          {/* Quantity + Add to Cart */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6">
            <div className="flex items-center border border-neutral-200 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center text-neutral-500 hover:bg-neutral-50"
              >
                <Minus size={16} />
              </button>
              <span className="w-10 text-center text-sm font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 flex items-center justify-center text-neutral-500 hover:bg-neutral-50"
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              onClick={handleWishlist}
              className={cn(
                'w-10 h-10 sm:w-12 sm:h-12 rounded-lg border flex items-center justify-center transition-colors shrink-0',
                wishlisted
                  ? 'border-red-200 bg-red-50 text-red-500'
                  : 'border-neutral-200 text-neutral-400 hover:text-red-500 hover:border-red-200'
              )}
            >
              <Heart size={20} fill={wishlisted ? 'currentColor' : 'none'} />
            </button>

            <Button
              onClick={handleAddToCart}
              disabled={activeVariant.stock === 0}
              className="w-full sm:flex-1 sm:w-auto"
              size="lg"
            >
              <ShoppingBag size={18} className="mr-2" />
              {activeVariant.stock === 0 ? 'Sold Out' : 'Add to Cart'}
            </Button>
          </div>

          {/* Trust signals */}
          <div className="border-t border-neutral-100 pt-5 space-y-3">
            {[
              { icon: Truck, text: 'Free shipping on orders above ₹2,000' },
              { icon: RotateCcw, text: '7-day easy returns' },
              { icon: Shield, text: 'Authenticity guaranteed' },
            ].map((s) => (
              <div key={s.text} className="flex items-center gap-3 text-sm text-neutral-500">
                <s.icon size={16} className="text-neutral-400" />
                {s.text}
              </div>
            ))}
          </div>

          {/* SKU */}
          <p className="text-xs text-neutral-400 mt-4">SKU: {activeVariant.sku}</p>
        </div>
      </div>

      {/* Tabs */}
      <ProductTabs product={product} reviews={reviews} onReviewSubmitted={(review) => setReviews((prev) => [review, ...prev])} />

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-16 mb-8">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
