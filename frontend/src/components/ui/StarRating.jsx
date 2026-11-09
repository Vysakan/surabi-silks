import { Star } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function StarRating({ rating, size = 16, showValue = false, className }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const fill =
      i <= Math.floor(rating) ? 'full' : i - rating < 1 ? 'half' : 'empty';
    stars.push(
      <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
        <Star
          size={size}
          className="text-neutral-200"
          fill="currentColor"
        />
        {fill !== 'empty' && (
          <span
            className="absolute inset-0 overflow-hidden text-amber-400"
            style={{ width: fill === 'full' ? '100%' : '50%' }}
          >
            <Star size={size} fill="currentColor" />
          </span>
        )}
      </span>
    );
  }

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <div className="flex">{stars}</div>
      {showValue && (
        <span className="text-sm text-neutral-500 ml-1">{rating}</span>
      )}
    </div>
  );
}
