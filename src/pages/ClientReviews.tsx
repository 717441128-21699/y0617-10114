import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Star, Calendar, Clock, MessageSquare, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppointmentStore } from '@/store/appointmentStore';
import { useReviewStore } from '@/store/reviewStore';
import RatingStars from '@/components/RatingStars';
import Modal from '@/components/Modal';
import Empty from '@/components/Empty';
import { AppointmentStatusLabels, ServiceModeLabels } from '@shared/types';
import type { Appointment } from '@shared/types';

interface PendingReview {
  appointment: Appointment;
  rating: number;
  hoverRating: number;
}

export default function ClientReviews() {
  const location = useLocation();
  const state = location.state as { reviewAppointmentId?: string } | null;
  const [openReviewId, setOpenReviewId] = useState<string | null>(state?.reviewAppointmentId || null);
  const [draftRating, setDraftRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());

  const { appointments, loading, fetchMyAppointments } = useAppointmentStore();
  const { submitReview } = useReviewStore();

  useEffect(() => {
    fetchMyAppointments();
  }, [fetchMyAppointments]);

  const completedAppointments = appointments.filter((a) => a.status === 'completed');
  const pendingReviews = completedAppointments.filter((a) => !submitted.has(a.id));
  const reviewedAppointments = completedAppointments.filter((a) => submitted.has(a.id));

  const handleOpenReview = (appointmentId: string) => {
    setOpenReviewId(appointmentId);
    setDraftRating(0);
    setHoverRating(0);
  };

  const handleCloseReview = () => {
    setOpenReviewId(null);
    setDraftRating(0);
    setHoverRating(0);
  };

  const handleSubmitReview = async () => {
    if (!openReviewId || draftRating === 0) return;
    setSubmitting(true);
    const result = await submitReview(openReviewId, draftRating);
    setSubmitting(false);
    if (result) {
      setSubmitted((prev) => new Set(prev).add(openReviewId));
      handleCloseReview();
    }
  };

  const openAppointment = appointments.find((a) => a.id === openReviewId);
  const displayRating = hoverRating > 0 ? hoverRating : draftRating;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-slate-800">评价管理</h1>
        <p className="mt-1 text-sm text-slate-500">评价您的咨询体验，帮助其他来访者做出选择</p>
      </div>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="font-serif text-lg font-bold text-slate-700">待评价预约</h2>
          {pendingReviews.length > 0 && (
            <span className="inline-flex h-5 items-center rounded-full bg-warm-100 px-2 text-xs font-semibold text-warm-700">
              {pendingReviews.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
          </div>
        ) : pendingReviews.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 shadow-card">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-safe-50">
                <CheckCircle className="h-8 w-8 text-safe-500" />
              </div>
              <p className="font-serif text-base font-semibold text-slate-700">全部已评价完成</p>
              <p className="mt-1 text-sm text-slate-500">您已完成所有已结束咨询的评价</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingReviews.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-start justify-between gap-4 rounded-2xl bg-white p-5 shadow-card"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 text-lg font-bold text-primary-700">
                    {appointment.counselorName?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-serif text-base font-bold text-slate-800">
                      {appointment.counselorName || '咨询师'}
                    </h4>
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
                        <MessageSquare className="h-3.5 w-3.5" />
                        {ServiceModeLabels[appointment.serviceMode]}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenReview(appointment.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-warm-500 px-5 py-2.5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-warm-600"
                >
                  <Star className="h-4 w-4" />
                  写评价
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="font-serif text-lg font-bold text-slate-700">已评价历史</h2>
          {reviewedAppointments.length > 0 && (
            <span className="inline-flex h-5 items-center rounded-full bg-safe-100 px-2 text-xs font-semibold text-safe-700">
              {reviewedAppointments.length}
            </span>
          )}
        </div>

        {reviewedAppointments.length === 0 ? (
          <Empty
            title="暂无评价历史"
            description="您完成的评价将显示在这里"
            className="py-12"
          />
        ) : (
          <div className="space-y-3">
            {reviewedAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-start justify-between gap-4 rounded-2xl bg-white p-5 shadow-card"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-lg font-bold text-slate-600">
                    {appointment.counselorName?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-serif text-base font-bold text-slate-800">
                      {appointment.counselorName || '咨询师'}
                    </h4>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {appointment.date}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {appointment.timeSlot}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <RatingStars rating={5} size="md" />
                  <p className="mt-1 text-xs text-slate-400">{AppointmentStatusLabels[appointment.status]}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal
        isOpen={!!openReviewId}
        onClose={handleCloseReview}
        title="提交评价"
        confirmText={submitting ? '提交中...' : '提交评价'}
        confirmVariant="warm"
        onConfirm={handleSubmitReview}
        className="max-w-md"
      >
        {openAppointment && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 font-bold text-primary-700">
                {openAppointment.counselorName?.charAt(0) || '?'}
              </div>
              <div className="min-w-0">
                <p className="font-serif text-base font-bold text-slate-800">
                  {openAppointment.counselorName || '咨询师'}
                </p>
                <p className="text-sm text-slate-500">
                  {openAppointment.date} · {openAppointment.timeSlot}
                </p>
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-slate-700">
                综合评分 <span className="text-crisis-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setDraftRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform active:scale-95"
                  >
                    <Star
                      className={cn(
                        'h-10 w-10 transition-colors',
                        star <= displayRating ? 'text-warm-400' : 'text-slate-200'
                      )}
                      fill={star <= displayRating ? 'currentColor' : 'none'}
                    />
                  </button>
                ))}
                <span className="ml-3 font-serif text-xl font-bold text-slate-800">
                  {displayRating > 0 ? `${displayRating}.0` : '—'}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {draftRating === 0 && '请选择评分'}
                {draftRating === 1 && '非常不满意'}
                {draftRating === 2 && '不满意'}
                {draftRating === 3 && '一般'}
                {draftRating === 4 && '满意'}
                {draftRating === 5 && '非常满意，强烈推荐'}
              </p>
            </div>

            <div className="rounded-xl bg-primary-50/50 p-4 text-xs text-slate-500">
              <p>您的评价对其他来访者非常重要，请如实反馈。所有评价均为匿名展示。</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
