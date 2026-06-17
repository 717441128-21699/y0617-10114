import { useEffect, useState, useMemo } from 'react';
import { Calendar, Users, Star, Clock, TrendingUp, RefreshCw, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppointmentStore } from '@/store/appointmentStore';
import AppointmentCard from '@/components/AppointmentCard';
import Empty from '@/components/Empty';
import Modal from '@/components/Modal';
import type { AppointmentStatus, RescheduleRequest, Appointment } from '@shared/types';
import { RescheduleStatusLabels } from '@shared/types';

type TabKey = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'pending', label: '待确认' },
  { key: 'confirmed', label: '已确认' },
  { key: 'in_progress', label: '进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
];

interface StatCardProps {
  icon: typeof Calendar;
  label: string;
  value: string | number;
  hint?: string;
  color: 'primary' | 'warm' | 'safe' | 'amber';
}

function StatCard({ icon: Icon, label, value, hint, color }: StatCardProps) {
  const colorMap = {
    primary: { bg: 'bg-primary-100', text: 'text-primary-600', border: 'from-primary-50 to-white' },
    warm: { bg: 'bg-warm-100', text: 'text-warm-600', border: 'from-warm-50 to-white' },
    safe: { bg: 'bg-safe-100', text: 'text-safe-600', border: 'from-safe-50 to-white' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'from-amber-50 to-white' },
  };
  const c = colorMap[color];

  return (
    <div className={cn('rounded-2xl bg-gradient-to-br p-5 shadow-card', c.border)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 font-serif text-3xl font-bold text-slate-800">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', c.bg)}>
          <Icon className={cn('h-5 w-5', c.text)} />
        </div>
      </div>
    </div>
  );
}

export default function CounselorDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const { appointments, loading, fetchMyAppointments, updateStatus, rescheduleRequests, fetchRescheduleRequests, approveReschedule, rejectReschedule, rescheduleLoading } = useAppointmentStore();

  const [rescheduleDetailOpen, setRescheduleDetailOpen] = useState(false);
  const [selectedRescheduleAppointment, setSelectedRescheduleAppointment] = useState<Appointment | null>(null);
  const [selectedRescheduleRequest, setSelectedRescheduleRequest] = useState<RescheduleRequest | null>(null);

  useEffect(() => {
    fetchMyAppointments();
  }, [fetchMyAppointments]);

  const pendingRescheduleMap = useMemo(() => {
    const map = new Map<string, RescheduleRequest[]>();
    for (const req of rescheduleRequests) {
      if (req.status === 'pending') {
        if (!map.has(req.appointmentId)) {
          map.set(req.appointmentId, []);
        }
        map.get(req.appointmentId)!.push(req);
      }
    }
    return map;
  }, [rescheduleRequests]);

  const today = new Date().toISOString().slice(0, 10);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().slice(0, 10);

  const todayCount = appointments.filter((a) => a.date === today && a.status !== 'cancelled').length;
  const weekCount = appointments.filter((a) => a.date >= weekStartStr && a.status !== 'cancelled').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  const tabCounts: Record<TabKey, number> = {
    pending: appointments.filter((a) => a.status === 'pending').length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    in_progress: appointments.filter((a) => a.status === 'in_progress').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
    cancelled: appointments.filter((a) => a.status === 'cancelled').length,
  };

  const filteredAppointments = appointments.filter((a) => a.status === activeTab);

  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const handleConfirm = async (id: string) => {
    await updateStatus(id, 'confirmed');
  };

  const handleCancel = async (id: string) => {
    await updateStatus(id, 'cancelled');
  };

  const handleReject = async (id: string) => {
    await updateStatus(id, 'cancelled');
  };

  const handleNote = (_id: string) => {
  };

  const handleOpenRescheduleDetail = async (appointmentId: string) => {
    const appt = appointments.find((a) => a.id === appointmentId);
    if (appt) {
      setSelectedRescheduleAppointment(appt);
      await fetchRescheduleRequests(appointmentId);
      const pending = pendingRescheduleMap.get(appointmentId);
      if (pending && pending.length > 0) {
        setSelectedRescheduleRequest(pending[0]);
      }
      setRescheduleDetailOpen(true);
    }
  };

  const handleCloseRescheduleDetail = () => {
    setRescheduleDetailOpen(false);
    setSelectedRescheduleAppointment(null);
    setSelectedRescheduleRequest(null);
  };

  const handleApproveReschedule = async () => {
    if (!selectedRescheduleAppointment || !selectedRescheduleRequest) return;
    const success = await approveReschedule(selectedRescheduleAppointment.id, selectedRescheduleRequest.id);
    if (success) {
      handleCloseRescheduleDetail();
      fetchMyAppointments();
    }
  };

  const handleRejectReschedule = async () => {
    if (!selectedRescheduleAppointment || !selectedRescheduleRequest) return;
    const success = await rejectReschedule(selectedRescheduleAppointment.id, selectedRescheduleRequest.id);
    if (success) {
      handleCloseRescheduleDetail();
      fetchMyAppointments();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-slate-800">预约管理</h1>
        <p className="mt-1 text-sm text-slate-500">查看和管理您的咨询预约</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Calendar}
          label="今日预约"
          value={todayCount}
          hint="位来访者"
          color="primary"
        />
        <StatCard
          icon={TrendingUp}
          label="本周预约"
          value={weekCount}
          hint="累计预约"
          color="warm"
        />
        <StatCard
          icon={Users}
          label="总咨询人次"
          value={completedCount}
          hint="已完成咨询"
          color="safe"
        />
        <StatCard
          icon={Star}
          label="平均评分"
          value="4.8"
          hint="综合评价"
          color="amber"
        />
      </div>

      <div className="rounded-2xl bg-white p-2 shadow-card">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'shrink-0 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? tab.key === 'pending'
                    ? 'bg-amber-50 text-amber-700 shadow-glow'
                    : tab.key === 'confirmed'
                    ? 'bg-safe-50 text-safe-700 shadow-glow'
                    : tab.key === 'in_progress'
                    ? 'bg-primary-50 text-primary-700 shadow-glow'
                    : 'bg-slate-50 text-slate-700 shadow-glow'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              )}
            >
              {tab.label}
              {tabCounts[tab.key] > 0 && (
                <span
                  className={cn(
                    'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold',
                    activeTab === tab.key
                      ? tab.key === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : tab.key === 'confirmed'
                        ? 'bg-safe-100 text-safe-700'
                        : tab.key === 'in_progress'
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-slate-100 text-slate-600'
                      : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {tabCounts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
        </div>
      ) : sortedAppointments.length === 0 ? (
        <Empty
          icon={Clock}
          title={`暂无${tabs.find((t) => t.key === activeTab)?.label}预约`}
          description={activeTab === 'pending' ? '暂时没有等待确认的预约' : '相关预约记录将显示在这里'}
        />
      ) : (
        <div className="space-y-4">
          {sortedAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              role="counselor"
              onConfirm={handleConfirm}
              onCancel={activeTab === 'pending' ? handleReject : handleCancel}
              onNote={handleNote}
              onReschedule={handleOpenRescheduleDetail}
              hasPendingReschedule={pendingRescheduleMap.has(appointment.id)}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={rescheduleDetailOpen}
        onClose={handleCloseRescheduleDetail}
        title="改期申请详情"
        hideFooter={true}
        className="max-w-lg"
      >
        {selectedRescheduleAppointment && selectedRescheduleRequest ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">原预约</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {selectedRescheduleAppointment.date}
                </p>
                <p className="text-sm text-slate-500">
                  {selectedRescheduleAppointment.timeSlot}
                </p>
              </div>
              <div className="rounded-xl bg-warm-50 p-4 border border-warm-200">
                <p className="text-xs font-medium text-warm-600">拟改至</p>
                <p className="mt-1 text-sm font-semibold text-warm-700">
                  {selectedRescheduleRequest.newDate}
                </p>
                <p className="text-sm text-warm-600">
                  {selectedRescheduleRequest.newTimeSlot}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">申请人</p>
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  selectedRescheduleRequest.status === 'pending'
                    ? 'bg-amber-100 text-amber-700'
                    : selectedRescheduleRequest.status === 'approved'
                      ? 'bg-safe-100 text-safe-700'
                      : 'bg-slate-100 text-slate-600'
                )}>
                  {RescheduleStatusLabels[selectedRescheduleRequest.status]}
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {selectedRescheduleAppointment.clientName || '来访者'}
              </p>
              <p className="text-xs text-slate-400">
                申请时间：{new Date(selectedRescheduleRequest.createdAt).toLocaleString()}
              </p>
            </div>

            {selectedRescheduleRequest.reason && (
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">改期原因</p>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    {selectedRescheduleRequest.reason}
                  </p>
                </div>
              </div>
            )}

            {selectedRescheduleRequest.status === 'pending' && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleRejectReschedule}
                  disabled={rescheduleLoading}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-colors',
                    'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                    rescheduleLoading && 'opacity-70 cursor-not-allowed'
                  )}
                >
                  <X className="h-4 w-4" />
                  拒绝
                </button>
                <button
                  onClick={handleApproveReschedule}
                  disabled={rescheduleLoading}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-soft transition-colors',
                    'bg-safe-600 hover:bg-safe-700',
                    rescheduleLoading && 'opacity-70 cursor-not-allowed'
                  )}
                >
                  <Check className="h-4 w-4" />
                  同意改期
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-slate-500">加载中...</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
