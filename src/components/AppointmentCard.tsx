import { Link } from 'react-router-dom';
import { Calendar, Clock, MessageSquare, PenLine, Phone, Star, Video, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AppointmentStatusLabels,
  ServiceModeLabels,
} from '@shared/types';
import type { Appointment, AppointmentStatus, ServiceMode, UserRole } from '@shared/types';

interface AppointmentCardProps {
  appointment: Appointment;
  role: UserRole;
  onCancel?: (id: string) => void;
  onConfirm?: (id: string) => void;
  onReview?: (id: string) => void;
  onNote?: (id: string) => void;
  onReschedule?: (id: string) => void;
  hasPendingReschedule?: boolean;
}

const statusStyles: Record<AppointmentStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-safe-50 text-safe-700 border-safe-200',
  in_progress: 'bg-primary-50 text-primary-700 border-primary-200',
  completed: 'bg-slate-50 text-slate-600 border-slate-200',
  cancelled: 'bg-slate-50 text-slate-500 border-slate-200',
  rescheduled: 'bg-purple-50 text-purple-700 border-purple-200',
};

const ServiceIcon: Record<ServiceMode, typeof MessageSquare> = {
  text: MessageSquare,
  voice: Phone,
  video: Video,
};

export default function AppointmentCard({
  appointment,
  role,
  onCancel,
  onConfirm,
  onReview,
  onNote,
  onReschedule,
  hasPendingReschedule,
}: AppointmentCardProps) {
  const otherName = role === 'counselor' ? appointment.clientName : appointment.counselorName;
  const sessionLink = `/session/${appointment.id}`;

  const renderActions = () => {
    const { status } = appointment;
    const buttons = [];

    if (status === 'in_progress') {
      buttons.push(
        <Link
          key="enter"
          to={sessionLink}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-soft transition-colors hover:bg-primary-700"
        >
          <MessageSquare className="h-4 w-4" />
          进入会话
        </Link>
      );
    }

    if (status === 'pending' && role === 'counselor') {
      buttons.push(
        <button
          key="confirm"
          onClick={() => onConfirm?.(appointment.id)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-safe-600 px-4 py-2 text-sm font-medium text-white shadow-soft transition-colors hover:bg-safe-700"
        >
          确认预约
        </button>
      );
    }

    if (status === 'confirmed' && onReschedule) {
      buttons.push(
        <button
          key="reschedule"
          onClick={() => onReschedule?.(appointment.id)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-100"
        >
          <RefreshCw className="h-4 w-4" />
          改期
        </button>
      );
    }

    if (status === 'pending' || status === 'confirmed') {
      buttons.push(
        <button
          key="cancel"
          onClick={() => onCancel?.(appointment.id)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          <X className="h-4 w-4" />
          取消
        </button>
      );
    }

    if (status === 'completed') {
      if (role === 'client') {
        buttons.push(
          <button
            key="review"
            onClick={() => onReview?.(appointment.id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-warm-500 px-4 py-2 text-sm font-medium text-white shadow-soft transition-colors hover:bg-warm-600"
          >
            <Star className="h-4 w-4" />
            写评价
          </button>
        );
      }
      if (role === 'counselor') {
        buttons.push(
          <button
            key="note"
            onClick={() => onNote?.(appointment.id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-soft transition-colors hover:bg-primary-700"
          >
            <PenLine className="h-4 w-4" />
            写笔记
          </button>
        );
      }
    }

    return buttons;
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card transition-shadow hover:shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 text-lg font-bold text-primary-700">
            {otherName?.charAt(0) || '?'}
          </div>
          <div className="min-w-0">
            <h4 className="font-serif text-base font-bold text-slate-800">{otherName || '未命名'}</h4>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {appointment.date}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {appointment.timeSlot}
              </span>
              <span className="inline-flex items-center gap-1">
                {(() => {
                  const Icon = ServiceIcon[appointment.serviceMode];
                  return <Icon className="h-3.5 w-3.5" />;
                })()}
                {ServiceModeLabels[appointment.serviceMode]}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="mb-1 flex items-center justify-end gap-2">
            <span className="text-lg font-bold text-warm-500">¥{appointment.price}</span>
            {hasPendingReschedule && (
              <div className="relative">
                <span className="flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crisis-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-crisis-500"></span>
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-2">
            <span
              className={cn(
                'inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium',
                statusStyles[appointment.status]
              )}
            >
              {AppointmentStatusLabels[appointment.status]}
            </span>
            {hasPendingReschedule && (
              <span className="inline-block rounded-full bg-crisis-100 px-2 py-0.5 text-[10px] font-medium text-crisis-700">
                待处理改期
              </span>
            )}
          </div>
        </div>
      </div>

      {renderActions().length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
          {renderActions()}
        </div>
      )}
    </div>
  );
}
