import { formatPrice } from '@/lib/formatters';
import { cn } from '@/lib/cn';

const SIZES = {
  sm: { price: 'text-sm', mrp: 'text-sm', percent: 'text-xs' },
  md: { price: 'text-lg font-semibold', mrp: 'text-sm', percent: 'text-sm' },
  lg: { price: 'text-xl', mrp: 'text-base', percent: 'text-sm' },
};

export default function PriceDisplay({ price, mrp, size = 'md', showPercent = true, className }) {
  const hasDiscount = mrp && mrp > price;
  const discountPercent = hasDiscount
    ? Math.round(((mrp - price) / mrp) * 100)
    : 0;
  const s = SIZES[size] || SIZES.md;

  return (
    <div className={cn('flex items-baseline gap-2 flex-wrap', className)}>
      <span className={cn(s.price, hasDiscount ? 'text-[var(--color-sale,#b42318)]' : 'text-neutral-900')}>
        {formatPrice(price)}
      </span>
      {hasDiscount && (
        <>
          <span className={cn(s.mrp, 'text-neutral-500 line-through')}>
            {formatPrice(mrp)}
          </span>
          {showPercent && (
            <span className={cn(s.percent, 'font-medium text-neutral-700')}>
              {discountPercent}% off
            </span>
          )}
        </>
      )}
    </div>
  );
}
