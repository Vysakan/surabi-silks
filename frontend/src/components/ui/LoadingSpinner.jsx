import { cn } from '@/lib/cn';

export default function LoadingSpinner({ size = 'md', className, label }) {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-[2.5px]',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 gap-3', className)}>
      <div
        className={cn('branded-spinner', sizes[size] || sizes.md)}
        role="status"
        aria-label={label || 'Loading'}
      />
      {label && <p className="text-sm text-neutral-400">{label}</p>}
    </div>
  );
}

export function PageLoader({ label }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="branded-spinner w-10 h-10 border-[2.5px]" role="status" aria-label={label || 'Loading page'} />
      {label && <p className="text-sm text-neutral-500">{label}</p>}
    </div>
  );
}

export function InlineSpinner({ className }) {
  return (
    <div
      className={cn('branded-spinner w-4 h-4 border-2', className)}
      role="status"
      aria-label="Loading"
    />
  );
}
