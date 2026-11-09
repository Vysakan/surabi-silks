import { cn } from '@/lib/cn';

export default function Input({
  label,
  error,
  icon: Icon,
  className,
  ...props
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <Icon size={18} />
          </div>
        )}
        <input
          className={cn(
            'w-full rounded-[var(--radius-input)] border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400',
            error && 'border-error focus:ring-error/30 focus:border-error',
            Icon && 'pl-10',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          'w-full rounded-[var(--radius-input)] border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 transition-colors resize-y min-h-[80px]',
          'focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400',
          error && 'border-error focus:ring-error/30 focus:border-error',
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
