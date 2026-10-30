import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function LoadingSpinner({ size = 24, className }) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <Loader2 size={size} className="animate-spin text-primary-400" />
    </div>
  );
}
