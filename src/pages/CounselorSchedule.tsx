import { useState, useEffect } from 'react';
import { Save, CheckSquare, Square, CalendarDays, RefreshCw, Check, CheckCircle2, Plus, Edit2, Trash2, X, Calendar } from 'lucide-react';
import { cn, normalizeWeeklySchedule } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useCounselorStore } from '@/store/counselorStore';
import { useAuthStore } from '@/store/authStore';
import Modal from '@/components/Modal';
import type { WeeklySchedule, TimeSlot, ScheduleException } from '@shared/types';

type DayKey = keyof WeeklySchedule;

const dayLabels: Record<DayKey, string> = {
  monday: '周一',
  tuesday: '周二',
  wednesday: '周三',
  thursday: '周四',
  friday: '周五',
  saturday: '周六',
  sunday: '周日',
};

const dayKeys: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const defaultTimeSlots: Omit<TimeSlot, 'available'>[] = [
  { start: '09:00', end: '09:50' },
  { start: '10:00', end: '10:50' },
  { start: '11:00', end: '11:50' },
  { start: '14:00', end: '14:50' },
  { start: '15:00', end: '15:50' },
  { start: '16:00', end: '16:50' },
];

const morningSlots = [0, 1, 2];
const afternoonSlots = [3, 4, 5];

function createInitialSchedule(): WeeklySchedule {
  const schedule = {} as WeeklySchedule;
  dayKeys.forEach((day) => {
    schedule[day] = defaultTimeSlots.map((t) => ({ ...t, available: false }));
  });
  return schedule;
}

export default function CounselorSchedule() {
  const { currentUserCounselor, fetchCurrentCounselor, updateSchedule, exceptions, exceptionsLoading, fetchMyExceptions, createException, updateException, deleteException } = useCounselorStore();
  const { updateUser } = useAuthStore();
  const [schedule, setSchedule] = useState<WeeklySchedule>(createInitialSchedule());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const [exceptionModalOpen, setExceptionModalOpen] = useState(false);
  const [editingException, setEditingException] = useState<ScheduleException | null>(null);
  const [exceptionDate, setExceptionDate] = useState('');
  const [exceptionType, setExceptionType] = useState<'off' | 'extra'>('off');
  const [exceptionTimeSlots, setExceptionTimeSlots] = useState<TimeSlot[]>([]);
  const [exceptionNote, setExceptionNote] = useState('');
  const [exceptionSaving, setExceptionSaving] = useState(false);

  useEffect(() => {
    fetchCurrentCounselor();
    fetchMyExceptions();
  }, [fetchCurrentCounselor, fetchMyExceptions]);

  useEffect(() => {
    if (currentUserCounselor) {
      setSchedule(normalizeWeeklySchedule(currentUserCounselor.schedule));
    }
  }, [currentUserCounselor]);

  const toggleSlot = (day: DayKey, slotIndex: number) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day].map((slot, i) =>
        i === slotIndex ? { ...slot, available: !slot.available } : slot
      ),
    }));
  };

  const setDayAll = (day: DayKey, available: boolean) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day].map((slot) => ({ ...slot, available })),
    }));
  };

  const selectAll = () => {
    setSchedule((prev) => {
      const next = {} as WeeklySchedule;
      dayKeys.forEach((day) => {
        next[day] = prev[day].map((slot) => ({ ...slot, available: true }));
      });
      return next;
    });
  };

  const clearAll = () => {
    setSchedule((prev) => {
      const next = {} as WeeklySchedule;
      dayKeys.forEach((day) => {
        next[day] = prev[day].map((slot) => ({ ...slot, available: false }));
      });
      return next;
    });
  };

  const selectWeekdays = () => {
    const weekdays: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    setSchedule((prev) => {
      const next = { ...prev };
      weekdays.forEach((day) => {
        next[day] = prev[day].map((slot) => ({ ...slot, available: true }));
      });
      return next;
    });
  };

  const clearWeekends = () => {
    const weekends: DayKey[] = ['saturday', 'sunday'];
    setSchedule((prev) => {
      const next = { ...prev };
      weekends.forEach((day) => {
        next[day] = prev[day].map((slot) => ({ ...slot, available: false }));
      });
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await apiClient.put<WeeklySchedule>('/counselors/me/schedule', schedule);
    setSaving(false);
    if (res.success && res.data) {
      setSaved(true);
      setToastVisible(true);
      updateSchedule(res.data);
      updateUser({});
      await fetchCurrentCounselor();
      setTimeout(() => {
        setSaved(false);
        setToastVisible(false);
      }, 3000);
    }
  };

  const totalAvailable = dayKeys.reduce(
    (sum, day) => sum + schedule[day].filter((s) => s.available).length,
    0
  );

  const handleOpenAddException = () => {
    setEditingException(null);
    setExceptionDate('');
    setExceptionType('off');
    setExceptionTimeSlots(defaultTimeSlots.map((t) => ({ ...t, available: false })));
    setExceptionNote('');
    setExceptionModalOpen(true);
  };

  const handleOpenEditException = (ex: ScheduleException) => {
    setEditingException(ex);
    setExceptionDate(ex.date);
    setExceptionType(ex.type);
    setExceptionTimeSlots(ex.timeSlots || defaultTimeSlots.map((t) => ({ ...t, available: false })));
    setExceptionNote(ex.note || '');
    setExceptionModalOpen(true);
  };

  const handleCloseExceptionModal = () => {
    setExceptionModalOpen(false);
    setEditingException(null);
    setExceptionDate('');
    setExceptionType('off');
    setExceptionTimeSlots([]);
    setExceptionNote('');
  };

  const handleToggleExceptionSlot = (index: number) => {
    setExceptionTimeSlots((prev) =>
      prev.map((slot, i) =>
        i === index ? { ...slot, available: !slot.available } : slot
      )
    );
  };

  const handleSaveException = async () => {
    if (!exceptionDate) return;
    setExceptionSaving(true);
    const data = {
      date: exceptionDate,
      type: exceptionType,
      timeSlots: exceptionType === 'extra' ? exceptionTimeSlots : undefined,
      note: exceptionNote || undefined,
    };
    if (editingException) {
      await updateException(editingException.id, data);
    } else {
      await createException(data);
    }
    setExceptionSaving(false);
    handleCloseExceptionModal();
  };

  const handleDeleteException = async (id: string) => {
    if (window.confirm('确定要删除这个例外日期吗？')) {
      await deleteException(id);
    }
  };

  return (
    <div className="space-y-6 relative">
      {toastVisible && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="flex items-center gap-2 rounded-xl bg-safe-600 px-6 py-3 text-white shadow-lg">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">保存成功！时段设置已更新</span>
          </div>
        </div>
      )}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-800">时段设置</h1>
          <p className="mt-1 text-sm text-slate-500">
            设置您每周的可预约时段，已设置 <span className="font-semibold text-warm-600">{totalAvailable}</span> 个可用时段
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-soft transition-all',
            saved ? 'bg-safe-600 hover:bg-safe-700' : 'bg-warm-500 hover:bg-warm-600',
            saving && 'opacity-70 cursor-not-allowed'
          )}
        >
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? '保存中...' : saved ? '✓ 已保存' : '保存 Schedule'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={selectAll}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-warm-300 hover:bg-warm-50 hover:text-warm-700"
        >
          <CheckSquare className="h-4 w-4" />
          一键全选
        </button>
        <button
          onClick={clearAll}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
          <Square className="h-4 w-4" />
          清空
        </button>
        <button
          onClick={selectWeekdays}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
        >
          <CalendarDays className="h-4 w-4" />
          工作日全选
        </button>
        <button
          onClick={clearWeekends}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          周末清空
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-card">
        <div className="grid grid-cols-8 border-b border-slate-100">
          <div className="flex items-center justify-center p-4 text-xs font-medium text-slate-400">
            时段
          </div>
          {dayKeys.map((day) => {
            const count = schedule[day].filter((s) => s.available).length;
            const isWeekend = day === 'saturday' || day === 'sunday';
            return (
              <div
                key={day}
                className={cn(
                  'flex flex-col items-center justify-center border-l border-slate-100 p-3',
                  isWeekend && 'bg-slate-50/50'
                )}
              >
                <p className={cn('font-serif text-sm font-bold', isWeekend ? 'text-warm-600' : 'text-slate-700')}>
                  {dayLabels[day]}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">{count}/6 可用</p>
              </div>
            );
          })}
        </div>

        <div>
          {defaultTimeSlots.map((slot, slotIndex) => {
            const isMorning = morningSlots.includes(slotIndex);
            const isAfternoon = afternoonSlots.includes(slotIndex);
            return (
              <div
                key={slot.start}
                className={cn(
                  'grid grid-cols-8 border-b border-slate-50 last:border-b-0',
                  slotIndex === 3 && 'border-t-2 border-slate-100'
                )}
              >
                <div className="flex flex-col items-center justify-center p-3">
                  <p className="text-sm font-semibold text-slate-700">{slot.start}</p>
                  <p className="text-xs text-slate-400">- {slot.end.slice(0, 5)}</p>
                  {isMorning && slotIndex === morningSlots[0] && (
                    <span className="mt-1 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-600">
                      上午
                    </span>
                  )}
                  {isAfternoon && slotIndex === afternoonSlots[0] && (
                    <span className="mt-1 rounded-full bg-warm-50 px-2 py-0.5 text-[10px] font-medium text-warm-600">
                      下午
                    </span>
                  )}
                </div>
                {dayKeys.map((day) => {
                  const s = schedule[day][slotIndex];
                  const isWeekend = day === 'saturday' || day === 'sunday';
                  const dayCount = schedule[day].filter((x) => x.available).length;
                  return (
                    <div
                      key={day + slotIndex}
                      className={cn(
                        'flex items-center justify-center border-l border-slate-50 p-3',
                        isWeekend && 'bg-slate-50/30'
                      )}
                    >
                      <button
                        onClick={() => toggleSlot(day, slotIndex)}
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                          s.available
                            ? 'bg-warm-500 text-white shadow-soft hover:bg-warm-600'
                            : 'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-500'
                        )}
                      >
                        {s.available ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-8 border-t border-slate-100 bg-slate-50/50">
          <div className="p-3" />
          {dayKeys.map((day) => {
            const count = schedule[day].filter((s) => s.available).length;
            const isWeekend = day === 'saturday' || day === 'sunday';
            return (
              <div
                key={day}
                className={cn(
                  'flex items-center justify-center gap-2 border-l border-slate-100 p-3',
                  isWeekend && 'bg-slate-50/70'
                )}
              >
                <button
                  onClick={() => setDayAll(day, true)}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-warm-600 transition-colors hover:bg-warm-50"
                >
                  全选
                </button>
                <button
                  onClick={() => setDayAll(day, false)}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100"
                >
                  清空
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl bg-warm-50/50 border border-warm-100 p-5">
        <h3 className="font-serif text-base font-bold text-warm-700">设置说明</h3>
        <ul className="mt-2 space-y-1.5 text-sm text-warm-700/80">
          <li>• 每个时段为 50 分钟咨询，预留 10 分钟间隔</li>
          <li>• 上午 09:00-12:00，下午 14:00-17:00 为推荐时段</li>
          <li>• 设置完成后点击「保存 Schedule」，来访者即可看到您的可用时段</li>
          <li>• 已有预约的时段无法取消，需先与来访者协商改期</li>
        </ul>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-slate-800">临时调整</h3>
            <p className="mt-1 text-sm text-slate-500">管理请假、加班等临时例外日期</p>
          </div>
          <button
            onClick={handleOpenAddException}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-soft transition-colors hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            添加例外
          </button>
        </div>

        {exceptionsLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
          </div>
        ) : exceptions.length === 0 ? (
          <div className="py-8 text-center">
            <Calendar className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-500">暂无临时调整</p>
            <p className="mt-1 text-xs text-slate-400">点击「添加例外」设置请假或加班时段</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exceptions.map((ex) => (
              <div
                key={ex.id}
                className={cn(
                  'flex items-center justify-between rounded-xl border p-4 transition-colors',
                  ex.type === 'off' ? 'border-slate-200 bg-slate-50/50' : 'border-warm-200 bg-warm-50/30'
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl',
                      ex.type === 'off' ? 'bg-slate-200 text-slate-600' : 'bg-warm-200 text-warm-700'
                    )}
                  >
                    <span className="text-xs font-medium">
                      {new Date(ex.date).getMonth() + 1}月
                    </span>
                    <span className="text-lg font-bold">
                      {new Date(ex.date).getDate()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          ex.type === 'off'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-warm-200 text-warm-700'
                        )}
                      >
                        {ex.type === 'off' ? '请假' : '加班'}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">
                        {ex.date}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {ex.type === 'off'
                        ? '全天不可约'
                        : `${ex.timeSlots?.filter((s) => s.available).length || 0} 个开放时段`}
                    </p>
                    {ex.note && (
                      <p className="mt-1 text-xs text-slate-400">备注：{ex.note}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditException(ex)}
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteException(ex.id)}
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={exceptionModalOpen}
        onClose={handleCloseExceptionModal}
        title={editingException ? '编辑例外日期' : '添加例外日期'}
        confirmText={exceptionSaving ? '保存中...' : '保存'}
        confirmVariant="primary"
        onConfirm={handleSaveException}
        className="max-w-lg"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              日期 <span className="text-crisis-500">*</span>
            </label>
            <input
              type="date"
              value={exceptionDate}
              onChange={(e) => setExceptionDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              类型
            </label>
            <div className="flex gap-3">
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="exceptionType"
                  value="off"
                  checked={exceptionType === 'off'}
                  onChange={(e) => setExceptionType(e.target.value as 'off' | 'extra')}
                  className="sr-only"
                />
                <div
                  className={cn(
                    'rounded-xl border-2 p-4 text-center transition-all',
                    exceptionType === 'off'
                      ? 'border-slate-400 bg-slate-50 shadow-glow'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  )}
                >
                  <p className={cn(
                    'font-semibold text-sm',
                    exceptionType === 'off' ? 'text-slate-700' : 'text-slate-500'
                  )}>
                    请假
                  </p>
                  <p className="mt-1 text-xs text-slate-400">全天不可预约</p>
                </div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="exceptionType"
                  value="extra"
                  checked={exceptionType === 'extra'}
                  onChange={(e) => setExceptionType(e.target.value as 'off' | 'extra')}
                  className="sr-only"
                />
                <div
                  className={cn(
                    'rounded-xl border-2 p-4 text-center transition-all',
                    exceptionType === 'extra'
                      ? 'border-warm-400 bg-warm-50 shadow-glow'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  )}
                >
                  <p className={cn(
                    'font-semibold text-sm',
                    exceptionType === 'extra' ? 'text-warm-700' : 'text-slate-500'
                  )}>
                    加班
                  </p>
                  <p className="mt-1 text-xs text-slate-400">额外开放时段</p>
                </div>
              </label>
            </div>
          </div>

          {exceptionType === 'extra' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                开放时段
              </label>
              <div className="grid grid-cols-3 gap-2">
                {exceptionTimeSlots.map((slot, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleToggleExceptionSlot(i)}
                    className={cn(
                      'rounded-lg px-3 py-2 text-sm font-medium transition-all',
                      slot.available
                        ? 'bg-warm-500 text-white shadow-soft'
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                    )}
                  >
                    {slot.start}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              备注
            </label>
            <textarea
              rows={3}
              value={exceptionNote}
              onChange={(e) => setExceptionNote(e.target.value)}
              placeholder="选填，添加备注说明..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
