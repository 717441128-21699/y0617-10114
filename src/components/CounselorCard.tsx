import { Link } from 'react-router-dom';
import { BadgeCheck, Calendar, MessageSquare, Phone, Video, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SpecialtyLabels, ServiceModeLabels } from '@shared/types';
import type { Counselor, ServiceMode } from '@shared/types';
import RatingStars from './RatingStars';

interface CounselorCardProps {
  counselor: Counselor;
}

const ServiceIcon: Record<ServiceMode, typeof MessageSquare> = {
  text: MessageSquare,
  voice: Phone,
  video: Video,
};

export default function CounselorCard({ counselor }: CounselorCardProps) {
  return (
    <Link
      to={`/counselor/${counselor.id}`}
      className={cn(
        'group block rounded-2xl bg-white p-6 shadow-card transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-xl'
      )}
    >
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          {counselor.avatar ? (
            <img
              src={counselor.avatar}
              alt={counselor.name}
              className="h-20 w-20 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 text-2xl font-bold text-primary-700">
              {counselor.name.charAt(0)}
            </div>
          )}
          {counselor.licenseVerified && (
            <div className="absolute -bottom-1.5 -right-1.5 rounded-full bg-gradient-to-r from-primary-600 to-primary-500 p-1 shadow-lg">
              <BadgeCheck className="h-4 w-4 text-white" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-serif text-lg font-bold text-slate-800">{counselor.name}</h3>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
              <Calendar className="h-3 w-3" />
              {counselor.experienceYears}年经验
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
              <Users className="h-3 w-3" />
              {counselor.totalSessions}人次
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <RatingStars rating={counselor.avgRating} size="sm" showValue />
            <span className="text-xs text-slate-400">({counselor.reviewCount}条评价)</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-2xl font-bold text-warm-500">¥{counselor.pricePerSession}</span>
          <span className="text-sm text-slate-400">/次</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {counselor.specialties.slice(0, 4).map((s) => (
          <span
            key={s}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 transition-colors group-hover:border-primary-200 group-hover:bg-primary-50 group-hover:text-primary-700"
          >
            {SpecialtyLabels[s]}
          </span>
        ))}
        {counselor.specialties.length > 4 && (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-400">
            +{counselor.specialties.length - 4}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2">
          {counselor.serviceModes.map((mode) => {
            const Icon = ServiceIcon[mode];
            return (
              <div
                key={mode}
                className="group/mode flex items-center gap-1 rounded-lg px-2 py-1 text-slate-500 transition-colors hover:bg-primary-50 hover:text-primary-600"
                title={ServiceModeLabels[mode]}
              >
                <Icon className="h-4 w-4" />
              </div>
            );
          })}
        </div>

        <span className="text-sm font-medium text-primary-600 transition-transform group-hover:translate-x-1">
          查看详情 →
        </span>
      </div>
    </Link>
  );
}
