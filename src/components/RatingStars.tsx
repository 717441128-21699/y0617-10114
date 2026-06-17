import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

const sizeMap = {
  sm: { star: 'h-3.5 w-3.5', text: 'text-xs' },
  md: { star: 'h-4 w-4', text: 'text-sm' },
  lg: { star: 'h-5 w-5', text: 'text-base' },
};

export default function RatingStars({ rating, size = 'md', showValue = false }: RatingStarsProps) {
  const sizeConfig = sizeMap[size];
  const rounded = Math.round(rating * 2) / 2;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((index) => {
          const diff = rounded - index;
          let fillPercent = 0;
          if (diff >= 0) fillPercent = 100;
          else if (diff > -1) fillPercent = (diff + 1) * 100;

          return (
            <div key={index} className="relative inline-block">
              <Star className={cn(sizeConfig.star, 'text-slate-200')} />
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
                <Star className={cn(sizeConfig.star, 'text-warm-400')} fill="currentColor" />
              </div>
            </div>
          );
        })}
      </div>
      {showValue && (
        <span className={cn(sizeConfig.text, 'font-medium text-slate-700')}>{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
