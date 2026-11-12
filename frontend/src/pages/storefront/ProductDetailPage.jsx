import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { Heart, Minus, Plus, Star, ChevronDown, Truck, RotateCcw, ShieldCheck } from 'lucide-react';
import * as productService from '@/services/productService';
import * as reviewService from '@/services/reviewService';
import { useCartStore } from '@/stores/useCartStore';
import { useWishlistStore } from '@/stores/useWishlistStore';
import { useUIStore } from '@/stores/useUIStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { loadCategoryTree } from '@/hooks/useCategoryTree';
import Button from '@/components/ui/Button';
import PriceDisplay from '@/components/ui/PriceDisplay';
import StarRating from '@/components/ui/StarRating';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProductRow from '@/components/storefront/ProductRow';
import ImageGallery from '@/components/ui/ImageGallery';
import { formatDate } from '@/lib/formatters';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/constants';
import { cn } from '@/lib/cn';

function OptionLabel({ name, value }) {
  return (
    <p className="text-sm text-neutral-600 mb-2.5">
      {name}{value && <>: <span className="text-black">{value}</span></>}
    </p>
  );
}

function ColorPicker({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            title={opt.label}
            aria-label={opt.label}
            aria-pressed={active}
            className={cn(
              'w-8 h-8 rounded-full border transition-shadow cursor-pointer',
              active ? 'border-black ring-1 ring-black ring-offset-2' : 'border-black/15 hover:ring-1 hover:ring-neutral-400 hover:ring-offset-2'
            )}
            style={{ backgroundColor: opt.hex }}
          />
        );
      })}
    </div>
  );
}

function SizePicker({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={cn(
              'min-w-12 px-4 py-2 text-sm rounded-full border transition-colors cursor-pointer',
              active ? 'bg-black border-black text-white' : 'border-neutral-300 text-black hover:border-black',
              opt.disabled && !active && 'text-neutral-400 line-through decoration-neutral-400'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-neutral-200">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex items-center justify-between w-full py-4 text-sm font-medium text-black cursor-pointer"
      >
        {title}
        <ChevronDown size={16} className={cn('transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="pb-5 text-sm text-neutral-700 leading-relaxed">{children}</div>}
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
      <p className="text-sm text-neutral-600">
        <Link to="/login" className="text-black underline underline-offset-4">Sign in</Link> to write a review.
      </p>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { addToast({ type: 'error', message: 'Please select a rating' }); return; }
    if (comment.trim().length < 5) { addToast({ type: 'error', message: 'Review must be at least 5 characters' }); return; }
    setSubmitting(true);
    try {
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
    } catch {
      addToast({ type: 'error', message: 'Could not submit your review. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-neutral-200 p-5 space-y-4">
      <h3 className="text-sm font-medium text-black">Write a review</h3>
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            className="text-neutral-300 hover:text-black transition-colors cursor-pointer"
          >
            <Star size={22} strokeWidth={1.5} fill={star <= rating ? 'currentColor' : 'none'} className={star <= rating ? 'text-black' : ''} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        aria-label="Your review"
        className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-[var(--radius-input)] focus:outline-none focus:border-black"
        placeholder="Share your thoughts about this product..."
      />
      <Button type="submit" isLoading={submitting} size="sm">Submit review</Button>
    </form>
  );
}

function Reviews({ product, reviews, onReviewSubmitted }) {
  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : product.rating || 0;
  return (
    <section id="reviews" className="mt-16 md:mt-24 scroll-mt-24">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,320px)_1fr]">
        <div>
          <h2 className="sf-heading mb-3">Customer reviews</h2>
          {reviews.length > 0 ? (
            <div className="flex items-center gap-3">
              <StarRating rating={average} size={16} />
              <span className="text-sm text-neutral-600">
                {average.toFixed(1)} · {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          ) : (
            <p className="text-sm text-neutral-600">No reviews yet. Be the first to share your thoughts.</p>
          )}
          <div className="mt-6">
            <ReviewForm productId={product.id} onSubmitted={onReviewSubmitted} />
          </div>
        </div>
        <div>
          {reviews.map((r) => (
            <article key={r.id} className="py-5 border-b border-neutral-200 first:pt-0">
              <div className="flex items-center gap-3 mb-2">
                <StarRating rating={r.rating} size={14} />
                <span className="text-sm font-medium text-black">{r.customerName}</span>
                <span className="text-xs text-neutral-500">{formatDate(r.createdAt)}</span>
              </div>
              <p className="text-sm text-neutral-700 leading-relaxed">{r.comment}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [category, setCategory] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  const addToCart = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const wishlistItems = useWishlistStore((s) => s.items);
  const openCartDrawer = useUIStore((s) => s.openCartDrawer);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setQuantity(1);
      let p = null;
      try {
        p = await productService.getBySlug(slug);
      } catch {
        p = null;
      }
      if (cancelled) return;
      setProduct(p);
      if (p) {
        setSelectedColor(p.variants?.[0]?.color?.name || null);
        setSelectedSize(p.variants?.[0]?.size || null);
        const [rev, rel, tree] = await Promise.all([
          reviewService.getByProductId(p.id).catch(() => []),
          productService.getRelated(p.id).catch(() => []),
          loadCategoryTree().catch(() => []),
        ]);
        if (cancelled) return;
        setReviews(rev || []);
        setRelated(rel || []);
        setCategory(tree.find((c) => String(c.id) === String(p.categoryId)) || null);
      }
      setLoading(false);
    }
    load();
    window.scrollTo(0, 0);
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) return <LoadingSpinner />;
  if (!product || !product.variants?.length) return (
    <div className="max-w-7xl mx-auto px-4 py-24 text-center">
      <h1 className="sf-heading mb-3">Product not found</h1>
      <Link to="/shop" className="sf-link">Continue shopping</Link>
    </div>
  );

  const variants = product.variants;
  const uniqueColors = [...new Map(variants.filter((v) => v.color).map((v) => [v.color.name, v.color])).values()];
  const variantsForColor = variants.filter((v) => v.color?.name === selectedColor);
  const uniqueSizes = [...new Set(variantsForColor.map((v) => v.size).filter(Boolean))];

  const activeVariant = variants.find(
    (v) => v.color?.name === selectedColor && v.size === selectedSize
  ) || variantsForColor[0] || variants[0];

  const soldOut = activeVariant.stock === 0;
  const wishlisted = wishlistItems.some((i) => i.variantId === activeVariant.id);
  const unitLabel = product.sellingUnit === 'metre' ? 'Quantity (metres)' : 'Quantity';

  const cartItem = () => ({
    productId: product.id,
    variantId: activeVariant.id,
    productName: product.name,
    variantLabel: [activeVariant.color?.name, activeVariant.size].filter(Boolean).join(' / '),
    image: activeVariant.images?.[0],
    unitPrice: activeVariant.price,
    quantity,
    sellingUnit: product.sellingUnit,
  });

  const handleAddToCart = () => {
    if (soldOut) return;
    addToCart(cartItem());
    openCartDrawer();
  };

  const handleBuyNow = () => {
    if (soldOut) return;
    addToCart(cartItem());
    navigate('/checkout');
  };

  const handleWishlist = () => {
    toggleWishlist({
      productId: product.id,
      variantId: activeVariant.id,
      productName: product.name,
      image: activeVariant.images?.[0],
      price: activeVariant.price,
    });
  };

  const details = [
    ['Fabric', product.fabric],
    ['Weave', product.weave],
    ['Weight', product.weight],
    ['Sold', product.sellingUnit === 'metre' ? 'Per metre' : 'Per piece'],
    ['Occasion', product.occasion?.join(', ')],
    ['SKU', activeVariant.sku],
  ].filter(([, v]) => v);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-4 md:pt-8 pb-8">
      <nav className="hidden sm:flex items-center gap-2 text-xs text-neutral-500 mb-6" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-black">Home</Link>
        <span>/</span>
        {category ? (
          <Link to={`/shop/${category.slug}`} className="hover:text-black">{category.name}</Link>
        ) : (
          <Link to="/shop" className="hover:text-black">Shop</Link>
        )}
        <span>/</span>
        <span className="text-black truncate max-w-[300px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-8 lg:gap-16">
        <div>
          <ImageGallery images={activeVariant.images || []} alt={product.name} />
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          {product.fabric && <p className="sf-eyebrow mb-2">{product.fabric}</p>}
          <h1 className="text-2xl md:text-[2rem] leading-tight font-medium tracking-tight text-black">{product.name}</h1>

          <div className="mt-4">
            <PriceDisplay price={activeVariant.price} mrp={activeVariant.mrp} size="lg" />
          </div>
          <p className="text-xs text-neutral-500 mt-1.5">
            Free shipping on orders above ₹{FREE_SHIPPING_THRESHOLD.toLocaleString('en-IN')}.
          </p>

          {product.reviewCount > 0 && (
            <a href="#reviews" className="inline-flex items-center gap-2 mt-3 text-sm text-neutral-600 hover:text-black">
              <StarRating rating={product.rating} size={14} />
              <span className="underline underline-offset-4">{product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'}</span>
            </a>
          )}

          {product.shortDescription && (
            <p className="text-sm text-neutral-700 leading-relaxed mt-5">{product.shortDescription}</p>
          )}

          <div className="mt-6 space-y-6">
            {uniqueColors.length > 1 && (
              <div>
                <OptionLabel name="Colour" value={selectedColor} />
                <ColorPicker
                  value={selectedColor}
                  onChange={(c) => {
                    setSelectedColor(c);
                    const first = variants.find((v) => v.color?.name === c);
                    if (first) setSelectedSize(first.size);
                  }}
                  options={uniqueColors.map((c) => ({ value: c.name, label: c.name, hex: c.hex }))}
                />
              </div>
            )}

            {uniqueSizes.length > 1 && (
              <div>
                <OptionLabel name="Size" value={selectedSize} />
                <SizePicker
                  value={selectedSize}
                  onChange={setSelectedSize}
                  options={uniqueSizes.map((s) => {
                    const v = variantsForColor.find((x) => x.size === s);
                    return { value: s, label: s, disabled: v?.stock === 0 };
                  })}
                />
              </div>
            )}

            <div>
              <OptionLabel name={unitLabel} />
              <div className="inline-flex items-center border border-neutral-300 rounded-[var(--radius-button)]">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Decrease quantity"
                  className="w-11 h-11 flex items-center justify-center hover:bg-neutral-100 cursor-pointer"
                >
                  <Minus size={15} />
                </button>
                <span className="w-10 text-center text-sm tabular-nums">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(soldOut ? quantity : Math.min(activeVariant.stock || 99, quantity + 1))}
                  aria-label="Increase quantity"
                  className="w-11 h-11 flex items-center justify-center hover:bg-neutral-100 cursor-pointer"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>

            <p className="flex items-center gap-2 text-sm">
              <span className={cn('w-2 h-2 rounded-full', soldOut ? 'bg-neutral-400' : activeVariant.stock <= 3 ? 'bg-amber-500' : 'bg-green-600')} />
              {soldOut ? 'Sold out' : activeVariant.stock <= 3 ? `Only ${activeVariant.stock} left` : 'In stock, ready to ship'}
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={soldOut}
                className="w-full py-3.5 bg-black text-white text-sm font-medium rounded-[var(--radius-button)] hover:bg-neutral-800 transition-colors cursor-pointer disabled:bg-neutral-300 disabled:text-neutral-600 disabled:cursor-not-allowed"
              >
                {soldOut ? 'Sold out' : 'Add to cart'}
              </button>
              {!soldOut && (
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full py-3.5 border border-black text-black text-sm font-medium rounded-[var(--radius-button)] hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  Buy it now
                </button>
              )}
              <button
                type="button"
                onClick={handleWishlist}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-neutral-700 hover:text-black cursor-pointer"
              >
                <Heart size={16} strokeWidth={1.6} fill={wishlisted ? 'currentColor' : 'none'} />
                {wishlisted ? 'Saved to wishlist' : 'Add to wishlist'}
              </button>
            </div>
          </div>

          <div className="mt-6 border-t border-neutral-200">
            {product.description && (
              <Accordion title="Description" defaultOpen>
                <p className="whitespace-pre-line">{product.description}</p>
              </Accordion>
            )}
            {details.length > 0 && (
              <Accordion title="Product details">
                <dl className="divide-y divide-neutral-100">
                  {details.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 py-2">
                      <dt className="text-neutral-500">{k}</dt>
                      <dd className="text-black text-right">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Accordion>
            )}
            <Accordion title="Care">
              <p>{product.careInstructions || 'Please follow the care label on the product.'}</p>
            </Accordion>
            <Accordion title="Shipping & returns">
              <ul className="space-y-2.5">
                <li className="flex gap-3"><Truck size={16} strokeWidth={1.6} className="shrink-0 mt-0.5" /> Free shipping on orders above ₹{FREE_SHIPPING_THRESHOLD.toLocaleString('en-IN')}.</li>
                <li className="flex gap-3"><RotateCcw size={16} strokeWidth={1.6} className="shrink-0 mt-0.5" /> 7-day easy returns.</li>
                <li className="flex gap-3"><ShieldCheck size={16} strokeWidth={1.6} className="shrink-0 mt-0.5" /> Authenticity guaranteed.</li>
              </ul>
            </Accordion>
          </div>
        </div>
      </div>

      <Reviews
        product={product}
        reviews={reviews}
        onReviewSubmitted={(review) => setReviews((prev) => [review, ...prev])}
      />

      {related.length > 0 && (
        <div className="mt-8 -mx-4 lg:-mx-6">
          <ProductRow title="You may also like" products={related} />
        </div>
      )}
    </div>
  );
}
