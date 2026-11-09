import { cn } from '@/lib/cn';

export default function StatsCard({ label, value, icon: Icon, trend, className }) {
  return (
    <div className={cn('bg-white rounded-xl border border-neutral-100 p-5', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="text-2xl font-semibold text-neutral-900 mt-1">{value}</p>
          {trend && (
            <p className={cn('text-xs mt-1', trend > 0 ? 'text-green-600' : 'text-red-500')}>
              {trend > 0 ? '+' : ''}{trend}% from last month
            </p>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
