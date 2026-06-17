import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface EmptyProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function Empty({
  icon: Icon = Inbox,
  title = '暂无数据',
  description,
  action,
  className,
}: EmptyProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 text-center',
        className
      )}
    >
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
        <Icon className="h-10 w-10 text-slate-300" />
      </div>
      <h3 className="mb-2 font-serif text-lg font-semibold text-slate-700">{title}</h3>
      {description && (
        <p className="mb-6 max-w-sm text-sm text-slate-500">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-primary-700"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
