import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Package } from '@shared/types';

interface PackageCardProps {
  pkg: Package;
  onPurchase?: (pkg: Package) => void;
  highlighted?: boolean;
}

export default function PackageCard({ pkg, onPurchase, highlighted = false }: PackageCardProps) {
  const avgPrice = Math.round(pkg.discountPrice / pkg.sessionCount);
  const discount = Math.round((1 - pkg.discountPrice / pkg.originalPrice) * 100);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
        highlighted && 'ring-2 ring-warm-400'
      )}
    >
      {highlighted && (
        <div className="absolute right-0 top-0">
          <div className="flex items-center gap-1 bg-warm-500 px-3 py-1 text-xs font-bold text-white">
            <Sparkles className="h-3 w-3" />
            推荐
          </div>
        </div>
      )}

      <div className="mb-5">
        <h3 className="font-serif text-lg font-bold text-slate-800">{pkg.name}</h3>
      </div>

      <div className="mb-5">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-warm-500">{pkg.sessionCount}</span>
          <span className="text-base font-medium text-slate-500">次</span>
        </div>
      </div>

      <div className="mb-4 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400 line-through">¥{pkg.originalPrice}</span>
          <span className="rounded-full bg-warm-100 px-2 py-0.5 text-xs font-bold text-warm-700">
            省{discount}%
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-warm-500">¥{pkg.discountPrice}</span>
        </div>
        <div className="text-xs text-slate-400">
          每次均价 <span className="font-semibold text-slate-600">¥{avgPrice}</span>
        </div>
      </div>

      <p className="mb-6 min-h-[48px] text-sm leading-relaxed text-slate-500">
        {pkg.description}
      </p>

      <button
        onClick={() => onPurchase?.(pkg)}
        className={cn(
          'w-full rounded-xl py-3 text-sm font-semibold transition-all shadow-soft',
          highlighted
            ? 'bg-warm-500 text-white hover:bg-warm-600'
            : 'bg-primary-600 text-white hover:bg-primary-700'
        )}
      >
        立即购买
      </button>
    </div>
  );
}
