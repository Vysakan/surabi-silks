import { cn } from '@/lib/cn';

export function Skeleton({ className }) {
  return (
    <div className={cn('animate-pulse bg-neutral-200 rounded', className)} />
  );
}

export function SkeletonProductCard() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-[var(--product-aspect)] w-full rounded-[var(--radius-card)]" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-5 w-1/3" />
    </div>
  );
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}
