import { cn } from '@/lib/cn';
import { ChevronDown } from 'lucide-react';

export default function Select({
  label,
  error,
  options = [],
  placeholder = 'Select...',
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
        <select
          className={cn(
            'w-full appearance-none rounded-[var(--radius-input)] border border-neutral-300 bg-white px-3 py-2.5 pr-10 text-sm text-neutral-800 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400',
            error && 'border-error focus:ring-error/30 focus:border-error',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
        />
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
