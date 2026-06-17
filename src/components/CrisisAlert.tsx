import { AlertTriangle, Phone } from 'lucide-react';
import type { UserRole } from '@shared/types';

interface CrisisAlertProps {
  keywords: string[];
  onConfirm: () => void;
  userRole: UserRole;
}

export default function CrisisAlert({ keywords, onConfirm, userRole }: CrisisAlertProps) {
  const isCounselor = userRole === 'counselor';

  return (
    <div
      className={
        'animate-slide-down border-y border-crisis-200 bg-crisis-500/10 backdrop-blur-sm'
      }
    >
      <div className="container mx-auto flex items-center gap-4 px-4 py-4">
        <div
          className={
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-crisis-500/20'
          }
        >
          <AlertTriangle className="h-6 w-6 text-crisis-600" />
        </div>

        <div className="min-w-0 flex-1">
          {isCounselor ? (
            <>
              <h4 className="font-serif text-base font-bold text-crisis-800">
                检测到危机关键词，请立即关注
              </h4>
              <p className="mt-1 text-sm text-crisis-700">
                匹配关键词：
                <span className="ml-1 font-medium">
                  {keywords.map((k, i) => (
                    <span key={k}>
                      {i > 0 && '、'}
                      <span className="rounded bg-crisis-500/20 px-1.5 py-0.5 font-semibold text-crisis-800">
                        {k}
                      </span>
                    </span>
                  ))}
                </span>
              </p>
            </>
          ) : (
            <>
              <h4 className="font-serif text-base font-bold text-crisis-800">
                我们非常重视您的安全
              </h4>
              <p className="mt-1 text-sm text-crisis-700">
                如果您正处于危机中，请立即寻求专业帮助。全国心理援助热线：
                <span className="ml-1 font-semibold">400-161-9995</span>
              </p>
            </>
          )}
        </div>

        <div className="shrink-0">
          {isCounselor ? (
            <button
              onClick={onConfirm}
              className="inline-flex items-center gap-2 rounded-xl bg-crisis-600 px-5 py-2.5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-crisis-700"
            >
              <AlertTriangle className="h-4 w-4" />
              启动危机干预流程
            </button>
          ) : (
            <a
              href="tel:400-161-9995"
              className="inline-flex items-center gap-2 rounded-xl bg-crisis-600 px-5 py-2.5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-crisis-700"
            >
              <Phone className="h-4 w-4" />
              拨打援助热线
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
