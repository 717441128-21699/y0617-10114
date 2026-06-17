import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Calendar, Users, Star, MessageSquare, Phone, Video, BookOpen, Award, Sparkles, Clock, ChevronRight, Lock, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import RatingStars from '@/components/RatingStars';
import PackageCard from '@/components/PackageCard';
import Modal from '@/components/Modal';
import PrivacyBadge from '@/components/PrivacyBadge';
import { useAuthStore } from '@/store/authStore';
import { useCounselorStore } from '@/store/counselorStore';
import { useReviewStore } from '@/store/reviewStore';
import { usePackageStore } from '@/store/packageStore';
import { cn, normalizeWeeklySchedule } from '@/lib/utils';
import type { Specialty, ServiceMode, TimeSlot, WeeklySchedule } from '@shared/types';
import { SpecialtyLabels, ServiceModeLabels } from '@shared/types';

type TabType = 'intro' | 'reviews' | 'schedule' | 'packages';

const ServiceIcon: Record<ServiceMode, typeof MessageSquare> = {
  text: MessageSquare,
  voice: Phone,
  video: Video,
};

const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const weekDayLabels: Record<typeof weekDays[number], string> = {
  monday: '周一',
  tuesday: '周二',
  wednesday: '周三',
  thursday: '周四',
  friday: '周五',
  saturday: '周六',
  sunday: '周日',
};

function getWeekDates(): { date: Date; dayKey: typeof weekDays[number] }[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  return weekDays.map((day, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { date: d, dayKey: day };
  });
}

function formatDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDateISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

export default function CounselorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentCounselor, loading, fetchCounselorById } = useCounselorStore();
  const { stats, loading: reviewsLoading, fetchReviewStats } = useReviewStore();
  const { packages, loading: packagesLoading, fetchPackages } = usePackageStore();

  const [activeTab, setActiveTab] = useState<TabType>('intro');
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedServiceMode, setSelectedServiceMode] = useState<ServiceMode | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [purchasePkgId, setPurchasePkgId] = useState<string | null>(null);

  const weekDates = getWeekDates();

  useEffect(() => {
    if (id) {
      fetchCounselorById(id);
    }
  }, [id, fetchCounselorById]);

  useEffect(() => {
    if (currentCounselor?.serviceModes?.length && !selectedServiceMode) {
      setSelectedServiceMode(currentCounselor.serviceModes[0]);
    }
  }, [currentCounselor, selectedServiceMode]);

  useEffect(() => {
    if (id && activeTab === 'reviews') {
      fetchReviewStats(id);
    }
  }, [id, activeTab, fetchReviewStats]);

  useEffect(() => {
    if (id && activeTab === 'packages') {
      fetchPackages(id);
    }
  }, [id, activeTab, fetchPackages]);

  const handleBack = () => navigate(-1);

  const handlePurchase = (pkg: any) => {
    if (!user) {
      setPurchasePkgId(pkg.id);
      setLoginModalOpen(true);
      return;
    }
    navigate(`/packages/purchase/${pkg.id}`);
  };

  const handleBooking = () => {
    if (!id) return;
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    if (!selectedSlot || !selectedServiceMode) return;
    const date = formatDateISO(weekDates[selectedDay].date);
    navigate(`/booking/${id}?date=${date}&timeSlot=${encodeURIComponent(selectedSlot)}&serviceMode=${selectedServiceMode}`);
  };

  const today = new Date();

  const normalizedSchedule: WeeklySchedule = useMemo(() => {
    return normalizeWeeklySchedule(currentCounselor?.schedule);
  }, [currentCounselor]);

  const currentDaySlots: TimeSlot[] = normalizedSchedule[weekDates[selectedDay].dayKey] || [];

  const tabs: { key: TabType; label: string; icon: typeof BookOpen }[] = [
    { key: 'intro', label: '简介', icon: BookOpen },
    { key: 'reviews', label: '评价', icon: Star },
    { key: 'schedule', label: '预约时段', icon: Calendar },
    { key: 'packages', label: '课程包', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {loading ? (
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse rounded-2xl bg-white p-8 shadow-card">
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
              <div className="h-32 w-32 rounded-3xl bg-slate-200" />
              <div className="flex-1 space-y-4">
                <div className="h-8 w-48 rounded bg-slate-200" />
                <div className="h-4 w-32 rounded bg-slate-100" />
                <div className="h-6 w-64 rounded bg-slate-100" />
              </div>
            </div>
          </div>
        </div>
      ) : currentCounselor ? (
        <>
          <section className="gradient-primary relative overflow-hidden py-12 md:py-16">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-white blur-3xl" />
              <div className="absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-warm-200 blur-3xl" />
            </div>

            <div className="container relative mx-auto px-4">
              <button
                onClick={handleBack}
                className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-white/90 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                返回列表
              </button>

              <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
                <div className="relative shrink-0">
                  {currentCounselor.avatar ? (
                    <img
                      src={currentCounselor.avatar}
                      alt={currentCounselor.name}
                      className="h-32 w-32 rounded-3xl border-4 border-white/30 object-cover shadow-2xl md:h-40 md:w-40"
                    />
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-3xl border-4 border-white/30 bg-gradient-to-br from-warm-300 to-warm-400 text-5xl font-bold text-white shadow-2xl md:h-40 md:w-40">
                      {currentCounselor.name.charAt(0)}
                    </div>
                  )}
                  {currentCounselor.licenseVerified && (
                    <div className="absolute -bottom-2 -right-2 rounded-full bg-white p-2 shadow-lg">
                      <div className="rounded-full bg-gradient-to-r from-safe-500 to-primary-500 p-1">
                        <BadgeCheck className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                    <h1 className="font-serif text-3xl font-bold text-white md:text-4xl">
                      {currentCounselor.name}
                    </h1>
                    {currentCounselor.licenseVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                        <Award className="h-3.5 w-3.5" />
                        已认证
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1.5 text-sm font-medium text-white backdrop-blur">
                      <Calendar className="h-4 w-4" />
                      {currentCounselor.experienceYears}年从业经验
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1.5 text-sm font-medium text-white backdrop-blur">
                      <Users className="h-4 w-4" />
                      {currentCounselor.totalSessions}人次咨询
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white/95 p-5 shadow-soft backdrop-blur">
                      <div className="mb-2 text-xs font-medium text-slate-500">综合评分</div>
                      <div className="flex items-baseline gap-3">
                        <RatingStars rating={currentCounselor.avgRating} size="lg" />
                        <span className="text-2xl font-bold text-slate-800">
                          {currentCounselor.avgRating.toFixed(1)}
                        </span>
                        <span className="text-sm text-slate-400">
                          ({currentCounselor.reviewCount}条评价)
                        </span>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white/95 p-5 shadow-soft backdrop-blur">
                      <div className="mb-2 text-xs font-medium text-slate-500">咨询费用</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-warm-500">
                          ¥{currentCounselor.pricePerSession}
                        </span>
                        <span className="text-sm text-slate-500">/次</span>
                        <span className="ml-2 text-xs text-slate-400">
                          ({currentCounselor.sessionDuration}分钟)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="container mx-auto px-4 py-8 md:py-12">
            <div className="mb-8 overflow-x-auto rounded-2xl bg-white shadow-card scrollbar-thin">
              <div className="flex min-w-max">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2',
                      activeTab === tab.key
                        ? 'border-primary-500 text-primary-700 bg-primary-50/50'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'intro' && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                  <div className="rounded-2xl bg-white p-6 shadow-card">
                    <h3 className="mb-4 flex items-center gap-2 font-serif text-lg font-bold text-slate-800">
                      <BookOpen className="h-5 w-5 text-primary-600" />
                      咨询师介绍
                    </h3>
                    <div className="mb-6">
                      <h4 className="mb-2 text-sm font-semibold text-slate-700">教育背景</h4>
                      <p className="text-sm leading-relaxed text-slate-600">
                        {currentCounselor.education || '暂无详细信息'}
                      </p>
                    </div>
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-slate-700">个人简介</h4>
                      <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                        {currentCounselor.introduction || '暂无详细信息'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white p-6 shadow-card">
                    <h3 className="mb-4 flex items-center gap-2 font-serif text-lg font-bold text-slate-800">
                      <Sparkles className="h-5 w-5 text-primary-600" />
                      擅长领域
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {currentCounselor.specialties.map((s: Specialty) => (
                        <span
                          key={s}
                          className="rounded-full bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700"
                        >
                          {SpecialtyLabels[s]}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-br from-warm-50 to-primary-50 p-6 shadow-card">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-warm-600">
                      咨询理念
                    </div>
                    <p className="font-serif text-lg leading-relaxed text-slate-700 italic">
                      "每一个人都值得被温柔对待。我相信，在安全、尊重的咨询关系中，你会找到属于自己的力量与答案。"
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-2xl bg-white p-6 shadow-card">
                    <h3 className="mb-4 flex items-center gap-2 font-serif text-lg font-bold text-slate-800">
                      <MessageSquare className="h-5 w-5 text-primary-600" />
                      服务模式
                    </h3>
                    <div className="space-y-3">
                      {currentCounselor.serviceModes.map((mode: ServiceMode) => {
                        const Icon = ServiceIcon[mode];
                        return (
                          <div
                            key={mode}
                            className="flex items-center gap-3 rounded-xl bg-slate-50 p-4"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100">
                              <Icon className="h-5 w-5 text-primary-700" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">
                                {ServiceModeLabels[mode]}
                              </div>
                              <div className="text-xs text-slate-500">
                                ¥{currentCounselor.pricePerSession} / {currentCounselor.sessionDuration}分钟
                              </div>
                            </div>
                            <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white p-6 shadow-card">
                    <div className="text-sm font-semibold text-slate-700 mb-3">隐私保障</div>
                    <PrivacyBadge />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="max-w-3xl">
                <div className="rounded-2xl bg-white p-6 shadow-card">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="font-serif text-lg font-bold text-slate-800">评价统计</h3>
                    <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5">
                      <Lock className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs font-medium text-slate-500">隐私保护</span>
                    </div>
                  </div>

                  <div className="mb-8 flex flex-col items-center gap-4 rounded-2xl bg-gradient-to-br from-warm-50 to-primary-50 p-8 md:flex-row md:items-center md:justify-between">
                    <div className="text-center md:text-left">
                      <div className="mb-2 text-xs font-medium text-slate-500">综合评分</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-extrabold text-warm-500">
                          {reviewsLoading ? '-' : stats?.avgRating.toFixed(1) || currentCounselor.avgRating.toFixed(1)}
                        </span>
                        <span className="text-sm text-slate-500">/ 5.0</span>
                      </div>
                    </div>
                    <div>
                      {reviewsLoading ? (
                        <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
                      ) : (
                        <RatingStars
                          rating={stats?.avgRating || currentCounselor.avgRating}
                          size="lg"
                        />
                      )}
                      <div className="mt-2 text-center text-sm text-slate-500">
                        共 {reviewsLoading ? '-' : stats?.reviewCount || currentCounselor.reviewCount} 条评价
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {reviewsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="animate-pulse space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="h-4 w-12 rounded bg-slate-200" />
                            <div className="h-3 flex-1 rounded bg-slate-100" />
                            <div className="h-4 w-16 rounded bg-slate-200" />
                          </div>
                        </div>
                      ))
                    ) : (
                      (stats?.distribution || []).map((d) => (
                        <div key={d.rating} className="flex items-center gap-3">
                          <div className="flex w-12 items-center gap-1 text-sm font-medium text-slate-600">
                            <span>{d.rating}</span>
                            <Star className="h-3.5 w-3.5 text-warm-400" fill="currentColor" />
                          </div>
                          <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-warm-400 to-warm-500 transition-all duration-500"
                              style={{ width: `${d.percentage}%` }}
                            />
                          </div>
                          <div className="w-16 text-right text-sm font-medium text-slate-600">
                            {d.count}条 ({d.percentage.toFixed(0)}%)
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-8 flex items-start gap-3 rounded-xl bg-blue-50 p-4">
                    <AlertCircle className="h-5 w-5 shrink-0 text-blue-500" />
                    <div className="text-sm leading-relaxed text-blue-700">
                      <p className="font-medium">为保护隐私，平台仅展示评分数值，不显示文字内容</p>
                      <p className="mt-1 text-blue-600">
                        所有评价均来自真实完成咨询的用户，系统确保评分的客观真实性。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="max-w-4xl space-y-6">
                <div className="rounded-2xl bg-white p-6 shadow-card">
                  <h3 className="mb-6 font-serif text-lg font-bold text-slate-800">选择服务形式</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {currentCounselor.serviceModes.map((mode) => {
                      const Icon = ServiceIcon[mode];
                      const selected = selectedServiceMode === mode;
                      return (
                        <button
                          key={mode}
                          onClick={() => setSelectedServiceMode(mode)}
                          className={cn(
                            'flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all',
                            selected
                              ? 'border-primary-500 bg-primary-50 shadow-glow'
                              : 'border-slate-200 bg-slate-50 hover:border-primary-200 hover:bg-primary-50/50'
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                              selected ? 'bg-primary-500 text-white' : 'bg-primary-100 text-primary-700'
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div
                              className={cn(
                                'font-semibold text-sm',
                                selected ? 'text-primary-800' : 'text-slate-800'
                              )}
                            >
                              {ServiceModeLabels[mode]}
                            </div>
                            <div className="text-xs text-slate-500">
                              ¥{currentCounselor.pricePerSession} / {currentCounselor.sessionDuration}分钟
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-card">
                  <h3 className="mb-6 font-serif text-lg font-bold text-slate-800">选择预约时段</h3>

                  <div className="mb-8 overflow-x-auto pb-2 scrollbar-thin">
                    <div className="flex gap-2 min-w-max">
                      {weekDates.map((wd, i) => {
                        const isPast = wd.date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        const isToday = isSameDay(wd.date, today);
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              if (!isPast) {
                                setSelectedDay(i);
                                setSelectedSlot(null);
                              }
                            }}
                            disabled={isPast}
                            className={cn(
                              'flex flex-col items-center gap-1 rounded-xl px-4 py-3 transition-all min-w-[80px]',
                              selectedDay === i
                                ? 'bg-primary-600 text-white shadow-soft'
                                : isPast
                                  ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                                  : 'bg-slate-50 text-slate-600 hover:bg-primary-50 hover:text-primary-700'
                            )}
                          >
                            <span className="text-xs font-medium">
                              {weekDayLabels[wd.dayKey]}
                            </span>
                            <span className={cn(
                              'text-lg font-bold',
                              isToday && selectedDay !== i && 'text-primary-600'
                            )}>
                              {wd.date.getDate()}
                            </span>
                            {isToday && (
                              <span className={cn(
                                'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                                selectedDay === i ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary-700'
                              )}>
                                今天
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Clock className="h-4 w-4" />
                      {weekDayLabels[weekDates[selectedDay].dayKey]}（{formatDate(weekDates[selectedDay].date)}）可预约时段
                    </h4>
                    {currentDaySlots.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {currentDaySlots.map((slot, i) => (
                          <button
                            key={i}
                            onClick={() => slot.available && setSelectedSlot(`${slot.start}-${slot.end}`)}
                            disabled={!slot.available}
                            className={cn(
                              'rounded-xl px-4 py-3 text-sm font-medium transition-all',
                              !slot.available
                                ? 'bg-slate-50 text-slate-300 cursor-not-allowed line-through'
                                : selectedSlot === `${slot.start}-${slot.end}`
                                  ? 'bg-primary-600 text-white shadow-soft ring-2 ring-primary-300'
                                  : 'bg-slate-50 text-slate-700 hover:bg-primary-50 hover:text-primary-700 hover:ring-1 hover:ring-primary-200'
                            )}
                          >
                            {slot.start}
                            <span className="mx-1 text-xs opacity-70">-</span>
                            {slot.end}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl bg-slate-50 p-8 text-center">
                        <Clock className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                        <p className="text-sm text-slate-500">该日期暂无可预约时段</p>
                        <p className="mt-1 text-xs text-slate-400">请选择其他日期</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 rounded-xl border border-primary-100 bg-primary-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm space-y-1">
                      {selectedServiceMode && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">服务形式：</span>
                          {(() => {
                            const Icon = ServiceIcon[selectedServiceMode];
                            return (
                              <>
                                <Icon className="h-4 w-4 text-primary-600" />
                                <span className="font-medium text-primary-700">
                                  {ServiceModeLabels[selectedServiceMode]}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      )}
                      {selectedSlot ? (
                        <div>
                          <span className="font-medium text-slate-700">已选择时段：</span>
                          <span className="text-primary-700">
                            {formatDate(weekDates[selectedDay].date)} {selectedSlot.split('-')[0]}
                          </span>
                          <span className="ml-2 text-slate-500">
                            · 费用 ¥{currentCounselor.pricePerSession}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500">请先选择预约时段</span>
                      )}
                    </div>
                    <button
                      onClick={handleBooking}
                      disabled={!selectedSlot || !selectedServiceMode}
                      className={cn(
                        'rounded-xl px-8 py-3 text-sm font-semibold shadow-soft transition-all',
                        selectedSlot && selectedServiceMode
                          ? 'bg-primary-600 text-white hover:bg-primary-700 hover:-translate-y-0.5'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      )}
                    >
                      立即预约
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'packages' && (
              <div>
                {packagesLoading ? (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="animate-pulse rounded-2xl bg-white p-6 shadow-card">
                        <div className="mb-4 h-6 w-32 rounded bg-slate-200" />
                        <div className="mb-4 h-12 w-20 rounded bg-slate-100" />
                        <div className="space-y-2">
                          <div className="h-4 w-24 rounded bg-slate-100" />
                          <div className="h-8 w-32 rounded bg-slate-200" />
                        </div>
                        <div className="mt-6 h-4 w-full rounded bg-slate-100" />
                        <div className="mt-4 h-12 w-full rounded-xl bg-slate-200" />
                      </div>
                    ))}
                  </div>
                ) : packages.length > 0 ? (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {packages.map((pkg, i) => (
                      <PackageCard
                        key={pkg.id}
                        pkg={pkg}
                        onPurchase={handlePurchase}
                        highlighted={i === 1}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="max-w-md mx-auto rounded-2xl bg-white p-12 shadow-card text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                      <Sparkles className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="mb-2 font-semibold text-slate-700">暂无课程包</h3>
                    <p className="text-sm text-slate-500">该咨询师暂未设置课程包，可单独预约单次咨询</p>
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      ) : (
        <div className="container mx-auto px-4 py-24 text-center">
          <p className="text-slate-500">咨询师不存在或已下线</p>
          <button onClick={handleBack} className="mt-4 btn-primary">
            返回
          </button>
        </div>
      )}

      <footer className="border-t border-slate-100 bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-slate-500">
            <p>© 2026 心语空间 · 在这里，你的心事被温柔倾听</p>
            <p className="mt-2">专业心理咨询服务平台 · 隐私安全 · 用心守护</p>
          </div>
        </div>
      </footer>

      <Modal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        title="请先登录"
        confirmText="去登录"
        confirmVariant="primary"
        onConfirm={() => {
          setLoginModalOpen(false);
          navigate('/login');
        }}
      >
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-slate-600">
            {purchasePkgId ? '购买课程包' : '预约咨询'}需要登录后才能进行。
          </p>
          <p className="text-sm text-slate-500">
            登录后可享受完整的咨询服务，所有信息严格保密。
          </p>
        </div>
      </Modal>
    </div>
  );
}
