import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Password field with a show/hide button. Same props as Input (label, error, hint, ...). */
export default function PasswordInput({ label, error, hint, className, id, ...props }) {
  const [visible, setVisible] = useState(false);
  const inputId = id || props.name || undefined;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          className={cn(
            'w-full rounded-[var(--radius-input)] border border-neutral-300 bg-white px-3 py-2.5 pr-11 text-sm text-neutral-800 placeholder:text-neutral-400 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400',
            error && 'border-error focus:ring-error/30 focus:border-error',
            className
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-neutral-600"
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error ? (
        <p className="text-sm text-error">{error}</p>
      ) : (
        hint && <p className="text-xs text-neutral-500">{hint}</p>
      )}
    </div>
  );
}
