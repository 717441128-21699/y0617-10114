import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'warm';
  hideFooter?: boolean;
  hideCancel?: boolean;
  className?: string;
}

const confirmVariants = {
  primary: 'bg-primary-600 hover:bg-primary-700',
  danger: 'bg-crisis-600 hover:bg-crisis-700',
  warm: 'bg-warm-500 hover:bg-warm-600',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmText = '确认',
  cancelText = '取消',
  confirmVariant = 'primary',
  hideFooter = false,
  hideCancel = false,
  className,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEsc);
      return () => {
        document.removeEventListener('keydown', handleEsc);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full max-w-lg rounded-2xl bg-white shadow-2xl',
          'animate-in zoom-in-95 fade-in duration-200',
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="font-serif text-lg font-bold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>

        {!hideFooter && (
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
            {!hideCancel && (
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                {cancelText}
              </button>
            )}
            {onConfirm && (
              <button
                onClick={onConfirm}
                className={cn(
                  'rounded-xl px-5 py-2 text-sm font-medium text-white shadow-soft transition-colors',
                  confirmVariants[confirmVariant]
                )}
              >
                {confirmText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
