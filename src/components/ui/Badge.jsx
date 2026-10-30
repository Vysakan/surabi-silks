import { cn } from '@/lib/cn';

const colorMap = {
  default: 'bg-neutral-100 text-neutral-600',
  primary: 'bg-primary-100 text-primary-700',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700',
};

export default function Badge({ children, color = 'default', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        colorMap[color],
        className
      )}
    >
      {children}
    </span>
  );
}
