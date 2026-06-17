import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrivacyBadgeProps {
  variant?: 'default' | 'subtle';
  className?: string;
}

export default function PrivacyBadge({ variant = 'default', className }: PrivacyBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5',
        variant === 'default'
          ? 'rounded-lg bg-safe-50 px-3 py-1.5 text-safe-700'
          : 'text-slate-500',
        className
      )}
    >
      <Shield className="h-3.5 w-3.5" />
      <span className="text-xs font-medium">端到端加密 · 平台不留存内容</span>
    </div>
  );
}
