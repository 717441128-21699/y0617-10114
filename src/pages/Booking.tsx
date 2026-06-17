import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MessageSquare,
  Phone,
  Video,
  Shield,
  AlertTriangle,
  Wallet,
  CreditCard,
  Package,
  Lock,
  Home,
  CalendarDays,
  AlertCircle,
} from 'lucide-react';
import { useCounselorStore } from '@/store/counselorStore';
import { useAppointmentStore } from '@/store/appointmentStore';
import { usePackageStore } from '@/store/packageStore';
import { useAuthStore } from '@/store/authStore';
import PrivacyBadge from '@/components/PrivacyBadge';
import Modal from '@/components/Modal';
import { ServiceModeLabels, type ServiceMode } from '@shared/types';
import { cn, normalizeWeeklySchedule } from '@/lib/utils';

type BookingStep = 1 | 2 | 3 | 4;

const ServiceIcon: Record<ServiceMode, typeof MessageSquare> = {
  text: MessageSquare,
  voice: Phone,
  video: Video,
};

interface AssessmentFormData {
  emotionalState: number;
  stressLevel: number;
  sleepQuality: number;
  mainConcern: string;
  durationMonths: number;
  previousTherapy: boolean;
  previousTherapyDetails: string;
  suicidalIdeation: 'none' | 'occasional' | 'frequent';
  selfHarmThoughts: 'none' | 'occasional' | 'frequent';
  additionalNotes: string;
}

export default function Booking() {
  const { counselorId } = useParams<{ counselorId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { currentCounselor, fetchCounselorById, loading: counselorLoading } = useCounselorStore();
  const { createAppointment, checkConflict, loading: appointmentLoading } = useAppointmentStore();
  const { myPackages, fetchMyPackages } = usePackageStore();
  const { user } = useAuthStore();

  const [step, setStep] = useState<BookingStep>(1);
  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || '');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(searchParams.get('timeSlot') || '');
  const [selectedServiceMode, setSelectedServiceMode] = useState<ServiceMode>(
    (searchParams.get('serviceMode') as ServiceMode) || 'text'
  );

  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [slotConflictStatus, setSlotConflictStatus] = useState<'checking' | 'available' | 'conflict' | null>(null);
  const [checkingStep1, setCheckingStep1] = useState(false);

  const [isFirstTime, setIsFirstTime] = useState(true);

  const [assessment, setAssessment] = useState<AssessmentFormData>({
    emotionalState: 5,
    stressLevel: 5,
    sleepQuality: 5,
    mainConcern: '',
    durationMonths: 1,
    previousTherapy: false,
    previousTherapyDetails: '',
    suicidalIdeation: 'none',
    selfHarmThoughts: 'none',
    additionalNotes: '',
  });

  const [showSuicideWarning, setShowSuicideWarning] = useState(false);
  const [showSelfHarmWarning, setShowSelfHarmWarning] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<'balance' | 'alipay' | 'wechat'>('wechat');
  const [selectedPackageUsageId, setSelectedPackageUsageId] = useState<string | undefined>(undefined);
  const [createdAppointmentId, setCreatedAppointmentId] = useState<string>('');

  useEffect(() => {
    if (counselorId) {
      fetchCounselorById(counselorId);
    }
  }, [counselorId, fetchCounselorById]);

  useEffect(() => {
    if (user) {
      fetchMyPackages();
    }
  }, [user, fetchMyPackages]);

  useEffect(() => {
    setShowSuicideWarning(assessment.suicidalIdeation === 'occasional' || assessment.suicidalIdeation === 'frequent');
  }, [assessment.suicidalIdeation]);

  useEffect(() => {
    setShowSelfHarmWarning(assessment.selfHarmThoughts === 'occasional' || assessment.selfHarmThoughts === 'frequent');
  }, [assessment.selfHarmThoughts]);

  useEffect(() => {
    if (!counselorLoading && currentCounselor && selectedDate && selectedTimeSlot) {
      if (isFirstTime) {
        setStep(2);
      } else {
        setStep(3);
      }
    }
  }, [counselorLoading, currentCounselor, selectedDate, selectedTimeSlot, isFirstTime]);

  const price = useMemo(() => {
    if (selectedPackageUsageId) return 0;
    return currentCounselor?.pricePerSession || 0;
  }, [currentCounselor, selectedPackageUsageId]);

  const filteredPackages = useMemo(() => {
    if (!counselorId) return [];
    return myPackages.filter((p) => p.counselorId === counselorId && p.remainingSessions > 0);
  }, [myPackages, counselorId]);

  const availableDates = useMemo(() => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, []);

  const normalizedSchedule = useMemo(() => {
    return normalizeWeeklySchedule(currentCounselor?.schedule);
  }, [currentCounselor]);

  const availableTimeSlots = useMemo(() => {
    if (!selectedDate) return [];
    const dateObj = new Date(selectedDate);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dateObj.getDay()] as keyof typeof normalizedSchedule;
    return normalizedSchedule[dayName] || [];
  }, [selectedDate, normalizedSchedule]);

  useEffect(() => {
    let cancelled = false;
    if (step === 1 && selectedDate && selectedTimeSlot && counselorId) {
      setSlotConflictStatus('checking');
      setCheckingStep1(true);
      checkConflict(counselorId, selectedDate, selectedTimeSlot).then((conflict) => {
        if (!cancelled) {
          setSlotConflictStatus(conflict ? 'conflict' : 'available');
          setCheckingStep1(false);
        }
      });
    } else {
      setSlotConflictStatus(null);
    }
    return () => {
      cancelled = true;
    };
  }, [step, selectedDate, selectedTimeSlot, counselorId, checkConflict]);

  const canProceedStep1 = selectedDate && selectedTimeSlot && selectedServiceMode && slotConflictStatus !== 'conflict' && !checkingStep1;
  const canProceedStep2 = assessment.mainConcern.trim().length > 0;

  const handleNext = () => {
    if (step === 1 && canProceedStep1) {
      if (isFirstTime) {
        setStep(2);
      } else {
        setStep(3);
      }
    } else if (step === 2 && canProceedStep2) {
      setStep(3);
    }
  };

  const handlePrev = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(isFirstTime ? 2 : 1);
  };

  const handleSubmit = async () => {
    if (!counselorId || !currentCounselor) return;

    const conflict = await checkConflict(counselorId, selectedDate, selectedTimeSlot);
    if (conflict) {
      setConflictModalOpen(true);
      setStep(1);
      return;
    }

    const assessmentForm = isFirstTime
      ? {
          anonymousId: user?.id || 'anon_' + Date.now(),
          emotionalState: assessment.emotionalState,
          stressLevel: assessment.stressLevel,
          sleepQuality: assessment.sleepQuality,
          mainConcern: assessment.mainConcern,
          durationMonths: assessment.durationMonths,
          previousTherapy: assessment.previousTherapy,
          previousTherapyDetails: assessment.previousTherapy ? assessment.previousTherapyDetails : undefined,
          suicidalIdeation: assessment.suicidalIdeation !== 'none',
          selfHarmThoughts: assessment.selfHarmThoughts !== 'none',
          additionalNotes: assessment.additionalNotes || undefined,
          submittedAt: new Date().toISOString(),
        }
      : undefined;

    const result = await createAppointment({
      counselorId,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      serviceMode: selectedServiceMode,
      price,
      packageUsageId: selectedPackageUsageId,
      assessmentForm,
    });

    if (result) {
      setCreatedAppointmentId(result.id);
      setStep(4);
    }
  };

  const stepperLabels = ['确认时段', '评估问卷', '确认支付', '完成'];

  const renderStepper = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4].map((s, idx) => (
          <div key={s} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all',
                  step >= s
                    ? 'bg-primary-600 text-white shadow-soft'
                    : 'bg-slate-100 text-slate-400'
                )}
              >
                {step > s ? <Check className="h-5 w-5" /> : s}
              </div>
              <span
                className={cn(
                  'mt-2 text-xs font-medium transition-colors',
                  step >= s ? 'text-primary-700' : 'text-slate-400'
                )}
              >
                {stepperLabels[idx]}
              </span>
            </div>
            {idx < 3 && (
              <div
                className={cn(
                  'mx-2 h-0.5 flex-1 transition-colors',
                  step > s ? 'bg-primary-600' : 'bg-slate-200'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderSlider = (
    label: string,
    value: number,
    onChange: (v: number) => void,
    leftLabel: string,
    rightLabel: string
  ) => (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <label className="label-field mb-0">{label}</label>
        <span className="text-lg font-bold text-primary-700">{value}</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-primary-600"
      />
      <div className="mt-1 flex justify-between text-xs text-slate-400">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="card p-6">
      <h2 className="mb-6 font-serif text-xl font-bold text-slate-800">确认预约信息</h2>

      {counselorLoading ? (
        <div className="py-12 text-center text-slate-400">加载中...</div>
      ) : currentCounselor ? (
        <>
          <div className="mb-6 flex items-center gap-4 rounded-xl bg-slate-50 p-4">
            {currentCounselor.avatar ? (
              <img
                src={currentCounselor.avatar}
                alt={currentCounselor.name}
                className="h-16 w-16 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 text-2xl font-bold text-primary-700">
                {currentCounselor.name.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-serif text-lg font-bold text-slate-800">{currentCounselor.name}</h3>
              <p className="text-sm text-slate-500">
                {currentCounselor.experienceYears}年经验 · {currentCounselor.totalSessions}人次咨询
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-warm-500">¥{currentCounselor.pricePerSession}</span>
              <span className="text-sm text-slate-400">/次</span>
            </div>
          </div>

          <div className="mb-6">
            <label className="label-field">
              <CalendarDays className="mr-1.5 inline h-4 w-4" />
              选择日期
            </label>
            <div className="grid grid-cols-7 gap-2">
              {availableDates.map((d) => {
                const dateObj = new Date(d);
                const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
                const isSelected = selectedDate === d;
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDate(d)}
                    className={cn(
                      'flex flex-col items-center rounded-xl py-3 text-sm transition-all',
                      isSelected
                        ? 'bg-primary-600 text-white shadow-soft'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    <span className={cn('text-xs', isSelected ? 'text-primary-100' : 'text-slate-400')}>
                      {dayNames[dateObj.getDay()]}
                    </span>
                    <span className="font-semibold">{dateObj.getDate()}</span>
                    <span className={cn('text-xs', isSelected ? 'text-primary-100' : 'text-slate-400')}>
                      {dateObj.getMonth() + 1}月
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <label className="label-field">
              <Clock className="mr-1.5 inline h-4 w-4" />
              选择时段
            </label>
            {availableTimeSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
                {availableTimeSlots.map((slot) => {
                  const isSelected = selectedTimeSlot === `${slot.start}-${slot.end}`;
                  return (
                    <button
                      key={`${slot.start}-${slot.end}`}
                      disabled={!slot.available}
                      onClick={() => setSelectedTimeSlot(`${slot.start}-${slot.end}`)}
                      className={cn(
                        'rounded-xl py-3 text-sm font-medium transition-all',
                        !slot.available
                          ? 'cursor-not-allowed bg-slate-50 text-slate-300 line-through'
                          : isSelected
                          ? 'bg-primary-600 text-white shadow-soft'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      )}
                    >
                      {slot.start} - {slot.end}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 py-8 text-center text-slate-400">
                {selectedDate ? '该日期暂无可用时段，请选择其他日期' : '请先选择日期'}
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="label-field">
              <Calendar className="mr-1.5 inline h-4 w-4" />
              服务模式
            </label>
            <div className="grid grid-cols-3 gap-3">
              {currentCounselor.serviceModes.map((mode) => {
                const Icon = ServiceIcon[mode];
                const isSelected = selectedServiceMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setSelectedServiceMode(mode)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-2xl py-4 transition-all',
                      isSelected
                        ? 'bg-primary-600 text-white shadow-soft'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-sm font-medium">{ServiceModeLabels[mode]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {slotConflictStatus && (
            <div className={cn(
              'mb-6 rounded-xl p-4 flex items-center gap-3',
              slotConflictStatus === 'checking' && 'bg-slate-50',
              slotConflictStatus === 'available' && 'bg-safe-50',
              slotConflictStatus === 'conflict' && 'bg-crisis-500/10'
            )}>
              {slotConflictStatus === 'checking' && (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500" />
              )}
              {slotConflictStatus === 'available' && (
                <Check className="h-5 w-5 text-safe-600" />
              )}
              {slotConflictStatus === 'conflict' && (
                <AlertCircle className="h-5 w-5 text-crisis-600" />
              )}
              <div>
                {slotConflictStatus === 'checking' && (
                  <span className="text-sm text-slate-600">正在检查时段可用性...</span>
                )}
                {slotConflictStatus === 'available' && (
                  <span className="text-sm font-semibold text-safe-700">✅ 该时段可预约</span>
                )}
                {slotConflictStatus === 'conflict' && (
                  <span className="text-sm font-semibold text-crisis-700">❌ 该时段已被约走，请选择其他时段</span>
                )}
              </div>
            </div>
          )}

          <div className="mb-6 rounded-xl bg-safe-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4 text-safe-600" />
              <span className="text-sm font-semibold text-safe-700">首次咨询评估</span>
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isFirstTime}
                onChange={(e) => setIsFirstTime(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-primary-600"
              />
              <span className="text-sm text-slate-600">我是首次预约，需要填写匿名评估问卷</span>
            </label>
          </div>
        </>
      ) : (
        <div className="py-12 text-center text-slate-400">未找到咨询师信息</div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="card p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="font-serif text-xl font-bold text-slate-800">匿名评估问卷</h2>
          <p className="mt-1 text-sm text-slate-500">您的回答将帮助咨询师更好地了解您的情况</p>
        </div>
        <PrivacyBadge />
      </div>

      {renderSlider(
        '情绪状态',
        assessment.emotionalState,
        (v) => setAssessment({ ...assessment, emotionalState: v }),
        '很糟糕',
        '很好'
      )}
      {renderSlider(
        '压力程度',
        assessment.stressLevel,
        (v) => setAssessment({ ...assessment, stressLevel: v }),
        '很轻松',
        '很沉重'
      )}
      {renderSlider(
        '睡眠质量',
        assessment.sleepQuality,
        (v) => setAssessment({ ...assessment, sleepQuality: v }),
        '非常差',
        '非常好'
      )}

      <div className="mb-6">
        <label className="label-field">
          主要困扰 <span className="text-crisis-500">*</span>
        </label>
        <textarea
          value={assessment.mainConcern}
          onChange={(e) => setAssessment({ ...assessment, mainConcern: e.target.value })}
          placeholder="请简要描述您当前面临的主要困扰或想要咨询的问题..."
          rows={4}
          className="input-field resize-none"
        />
      </div>

      <div className="mb-6">
        <label className="label-field">持续时间（月）</label>
        <input
          type="number"
          min={0}
          max={120}
          value={assessment.durationMonths}
          onChange={(e) =>
            setAssessment({ ...assessment, durationMonths: Math.max(0, Number(e.target.value) || 0) })
          }
          className="input-field w-32"
        />
      </div>

      <div className="mb-6">
        <label className="label-field">是否接受过心理咨询？</label>
        <div className="flex gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              checked={!assessment.previousTherapy}
              onChange={() => setAssessment({ ...assessment, previousTherapy: false })}
              className="h-4 w-4 accent-primary-600"
            />
            <span className="text-sm text-slate-600">否</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              checked={assessment.previousTherapy}
              onChange={() => setAssessment({ ...assessment, previousTherapy: true })}
              className="h-4 w-4 accent-primary-600"
            />
            <span className="text-sm text-slate-600">是</span>
          </label>
        </div>
        {assessment.previousTherapy && (
          <textarea
            value={assessment.previousTherapyDetails}
            onChange={(e) => setAssessment({ ...assessment, previousTherapyDetails: e.target.value })}
            placeholder="请简要描述之前的咨询经历（时间、咨询师、治疗效果等）..."
            rows={3}
            className="mt-3 input-field resize-none"
          />
        )}
      </div>

      <div className={cn('mb-6 rounded-xl p-4', showSuicideWarning && 'bg-crisis-500/10')}>
        <label className="label-field">是否有自杀意念？</label>
        <div className="mb-2 flex gap-3">
          {(['none', 'occasional', 'frequent'] as const).map((val) => (
            <label key={val} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                checked={assessment.suicidalIdeation === val}
                onChange={() => setAssessment({ ...assessment, suicidalIdeation: val })}
                className="h-4 w-4 accent-primary-600"
              />
              <span className="text-sm text-slate-600">
                {val === 'none' ? '否' : val === 'occasional' ? '偶尔' : '经常'}
              </span>
            </label>
          ))}
        </div>
        {showSuicideWarning && (
          <div className="mt-3 flex items-start gap-3 rounded-lg border border-crisis-200 bg-white p-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-crisis-600" />
            <div className="text-sm">
              <p className="font-semibold text-crisis-800">我们非常重视您的安全</p>
              <p className="mt-1 text-crisis-700">
                如果您正处于危机中，请立即寻求专业帮助。全国心理援助热线：
                <a href="tel:400-161-9995" className="ml-1 font-semibold underline">
                  400-161-9995
                </a>
              </p>
            </div>
          </div>
        )}
      </div>

      <div className={cn('mb-6 rounded-xl p-4', showSelfHarmWarning && 'bg-crisis-500/10')}>
        <label className="label-field">是否有自残想法？</label>
        <div className="mb-2 flex gap-3">
          {(['none', 'occasional', 'frequent'] as const).map((val) => (
            <label key={val} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                checked={assessment.selfHarmThoughts === val}
                onChange={() => setAssessment({ ...assessment, selfHarmThoughts: val })}
                className="h-4 w-4 accent-primary-600"
              />
              <span className="text-sm text-slate-600">
                {val === 'none' ? '否' : val === 'occasional' ? '偶尔' : '经常'}
              </span>
            </label>
          ))}
        </div>
        {showSelfHarmWarning && (
          <div className="mt-3 flex items-start gap-3 rounded-lg border border-crisis-200 bg-white p-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-crisis-600" />
            <div className="text-sm">
              <p className="font-semibold text-crisis-800">请您一定保重</p>
              <p className="mt-1 text-crisis-700">
                自残不能解决问题，请向专业人士求助。您也可以拨打危机干预热线：
                <a href="tel:400-161-9995" className="ml-1 font-semibold underline">
                  400-161-9995
                </a>
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mb-6">
        <label className="label-field">补充说明（选填）</label>
        <textarea
          value={assessment.additionalNotes}
          onChange={(e) => setAssessment({ ...assessment, additionalNotes: e.target.value })}
          placeholder="有其他想让咨询师了解的信息可以填写在这里..."
          rows={3}
          className="input-field resize-none"
        />
      </div>

      <div className="rounded-xl bg-safe-50 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-5 w-5 text-safe-600" />
          <span className="font-semibold text-safe-800">隐私保护承诺</span>
        </div>
        <p className="text-sm leading-relaxed text-safe-700">
          您填写的所有评估信息将采用端到端加密存储，平台工作人员无法查看您的具体回答内容。
          仅您指定的咨询师在咨询会话开始后可以访问这些信息，用于更好地为您提供专业服务。
          您有权随时请求删除您的评估数据。根据《精神卫生法》和《个人信息保护法》，
          我们严格保护您的隐私权，未经您的书面同意，不会向任何第三方披露您的咨询内容。
        </p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="mb-6 font-serif text-xl font-bold text-slate-800">订单汇总</h2>

        <div className="space-y-4">
          <div className="flex justify-between border-b border-slate-100 pb-4">
            <span className="text-slate-500">咨询师</span>
            <span className="font-medium text-slate-800">{currentCounselor?.name}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-4">
            <span className="text-slate-500">日期</span>
            <span className="font-medium text-slate-800">{selectedDate}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-4">
            <span className="text-slate-500">时段</span>
            <span className="font-medium text-slate-800">{selectedTimeSlot}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-4">
            <span className="text-slate-500">服务模式</span>
            <span className="font-medium text-slate-800">
              {ServiceModeLabels[selectedServiceMode]}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-4">
            <span className="text-slate-500">评估问卷</span>
            <span className="font-medium text-slate-800">{isFirstTime ? '已填写' : '无需填写'}</span>
          </div>
          <div className="flex justify-between pt-2">
            <span className="text-lg font-semibold text-slate-700">合计</span>
            <span className="text-2xl font-bold text-warm-500">¥{price}</span>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 font-serif text-lg font-bold text-slate-800">
          <Package className="mr-1.5 inline h-5 w-5 text-primary-600" />
          使用课程包
        </h2>
        {filteredPackages.length > 0 ? (
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                checked={selectedPackageUsageId === undefined}
                onChange={() => setSelectedPackageUsageId(undefined)}
                className="h-4 w-4 accent-primary-600"
              />
              <span className="text-sm text-slate-600">不使用课程包</span>
            </label>
            {filteredPackages.map((p) => (
              <label
                key={p.id}
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all',
                  selectedPackageUsageId === p.id
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                )}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    checked={selectedPackageUsageId === p.id}
                    onChange={() => setSelectedPackageUsageId(p.id)}
                    className="h-4 w-4 accent-primary-600"
                  />
                  <div>
                    <p className="font-medium text-slate-800">{p.counselorName || currentCounselor?.name}</p>
                    <p className="text-xs text-slate-500">
                      剩余 {p.remainingSessions}/{p.totalSessions} 次 · 有效期至{' '}
                      {new Date(p.expireAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="badge bg-safe-100 text-safe-700">抵扣1次</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-slate-50 py-4 text-center text-sm text-slate-400">
            暂无可使用的课程包
          </p>
        )}
      </div>

      <div className="card p-6">
        <h2 className="mb-4 font-serif text-lg font-bold text-slate-800">
          <CreditCard className="mr-1.5 inline h-5 w-5 text-primary-600" />
          选择支付方式
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { id: 'balance', label: '余额支付', icon: Wallet, desc: '可用余额 ¥0.00' },
            { id: 'alipay', label: '支付宝', icon: CreditCard, desc: '推荐使用' },
            { id: 'wechat', label: '微信支付', icon: CreditCard, desc: '快捷支付' },
          ].map((method) => {
            const Icon = method.icon;
            const isSelected = selectedPayment === method.id;
            return (
              <button
                key={method.id}
                onClick={() => setSelectedPayment(method.id as typeof selectedPayment)}
                className={cn(
                  'flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all',
                  isSelected
                    ? 'border-primary-300 bg-primary-50 shadow-soft'
                    : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={cn('h-5 w-5', isSelected ? 'text-primary-600' : 'text-slate-400')}
                  />
                  <span
                    className={cn('font-semibold', isSelected ? 'text-primary-800' : 'text-slate-700')}
                  >
                    {method.label}
                  </span>
                </div>
                <span
                  className={cn('text-xs', isSelected ? 'text-primary-600' : 'text-slate-400')}
                >
                  {method.desc}
                </span>
                {isSelected && (
                  <div className="ml-auto">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-safe-200 bg-safe-50/50 p-4">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-safe-600" />
          <div>
            <p className="text-sm font-semibold text-safe-800">安全支付保障</p>
            <p className="mt-1 text-xs text-safe-600">
              所有支付均通过加密通道传输，资金由第三方托管，咨询完成后结算。
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="card p-8 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-safe-100">
        <Check className="h-10 w-10 text-safe-600" strokeWidth={3} />
      </div>
      <h2 className="mb-2 font-serif text-2xl font-bold text-slate-800">预约成功！</h2>
      <p className="mb-6 text-slate-500">咨询师将在24小时内确认您的预约</p>

      <div className="mx-auto mb-8 max-w-sm rounded-2xl bg-slate-50 p-5 text-left">
        <div className="mb-3 flex justify-between">
          <span className="text-sm text-slate-500">预约编号</span>
          <span className="font-mono font-semibold text-slate-800">{createdAppointmentId}</span>
        </div>
        <div className="mb-3 flex justify-between">
          <span className="text-sm text-slate-500">咨询师</span>
          <span className="font-medium text-slate-800">{currentCounselor?.name}</span>
        </div>
        <div className="mb-3 flex justify-between">
          <span className="text-sm text-slate-500">时间</span>
          <span className="font-medium text-slate-800">
            {selectedDate} {selectedTimeSlot}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-slate-500">支付金额</span>
          <span className="font-bold text-warm-500">¥{price}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={() => navigate(`/session/${createdAppointmentId}`)}
          className="btn-primary"
        >
          稍后进入咨询
        </button>
        <button onClick={() => navigate('/client/dashboard')} className="btn-secondary">
          <Home className="h-4 w-4" />
          返回我的预约
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-hero py-8">
      <div className="container mx-auto max-w-3xl px-4">
        {renderStepper()}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        {step !== 4 && (
          <div className="mt-6 flex items-center justify-between">
            {step > 1 ? (
              <button onClick={handlePrev} className="btn-secondary">
                <ChevronLeft className="h-4 w-4" />
                上一步
              </button>
            ) : (
              <button onClick={() => navigate(-1)} className="btn-ghost">
                <ChevronLeft className="h-4 w-4" />
                返回
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)}
                className="btn-primary"
              >
                下一步
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={appointmentLoading}
                className="btn-primary"
              >
                {appointmentLoading ? '提交中...' : `确认支付 ¥${price}`}
                <Lock className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        <Modal
          isOpen={conflictModalOpen}
          onClose={() => setConflictModalOpen(false)}
          title="预约冲突"
          confirmText="重新选择"
          confirmVariant="primary"
          onConfirm={() => setConflictModalOpen(false)}
          hideCancel
        >
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 shrink-0 text-crisis-600" />
              <div>
                <p className="font-semibold text-slate-800">时段已被预约</p>
                <p className="mt-1 text-sm text-slate-600">
                  很抱歉，该时段刚刚已被其他来访者预约，请重新选择时段。
                </p>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
