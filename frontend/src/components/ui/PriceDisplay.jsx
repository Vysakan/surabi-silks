import { formatPrice } from '@/lib/formatters';
import { cn } from '@/lib/cn';

export default function PriceDisplay({ price, mrp, className }) {
  const hasDiscount = mrp && mrp > price;
  const discountPercent = hasDiscount
    ? Math.round(((mrp - price) / mrp) * 100)
    : 0;

  return (
    <div className={cn('flex items-baseline gap-2 flex-wrap', className)}>
      <span className="text-lg font-semibold text-neutral-900">
        {formatPrice(price)}
      </span>
      {hasDiscount && (
        <>
          <span className="text-sm text-neutral-400 line-through">
            {formatPrice(mrp)}
          </span>
          <span className="text-sm font-medium text-success">
            {discountPercent}% off
          </span>
        </>
      )}
    </div>
  );
}
