import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Package, Star, Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppointmentStore } from '@/store/appointmentStore';
import AppointmentCard from '@/components/AppointmentCard';
import Empty from '@/components/Empty';
import type { AppointmentStatus } from '@shared/types';

type TabKey = 'all' | 'upcoming' | 'history';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'upcoming', label: '即将到来' },
  { key: 'history', label: '历史记录' },
];

const upcomingStatuses: AppointmentStatus[] = ['in_progress', 'confirmed', 'pending'];
const historyStatuses: AppointmentStatus[] = ['completed', 'cancelled'];

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const { appointments, loading, fetchMyAppointments, updateStatus } = useAppointmentStore();

  useEffect(() => {
    fetchMyAppointments();
  }, [fetchMyAppointments]);

  const filteredAppointments = appointments.filter((a) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'upcoming') return upcomingStatuses.includes(a.status);
    if (activeTab === 'history') return historyStatuses.includes(a.status);
    return false;
  });

  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    if (activeTab === 'history') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const handleCancel = async (id: string) => {
    await updateStatus(id, 'cancelled');
  };

  const handleReview = (id: string) => {
    navigate('/client/reviews', { state: { reviewAppointmentId: id } });
  };

  const upcomingCount = appointments.filter((a) => upcomingStatuses.includes(a.status)).length;
  const historyCount = appointments.filter((a) => historyStatuses.includes(a.status)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-800">我的预约</h1>
          <p className="mt-1 text-sm text-slate-500">管理您的心理咨询预约</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          to="/"
          className="group flex items-center gap-3 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 p-4 text-white shadow-soft transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <p className="font-serif text-base font-bold">立即预约</p>
            <p className="text-xs text-white/80">发现合适的咨询师</p>
          </div>
        </Link>

        <Link
          to="/client/packages"
          className="group flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warm-100 text-warm-600">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="font-serif text-base font-bold text-slate-800">我的课程包</p>
            <p className="text-xs text-slate-500">查看已购课程包</p>
          </div>
        </Link>

        <Link
          to="/client/reviews"
          className="group flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <p className="font-serif text-base font-bold text-slate-800">去评价</p>
            <p className="text-xs text-slate-500">分享您的咨询体验</p>
          </div>
        </Link>
      </div>

      <div className="rounded-2xl bg-white p-2 shadow-card">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const count = tab.key === 'all' ? appointments.length : tab.key === 'upcoming' ? upcomingCount : historyCount;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? 'bg-primary-50 text-primary-700 shadow-glow'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold',
                    activeTab === tab.key ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
        </div>
      ) : sortedAppointments.length === 0 ? (
        <Empty
          icon={Calendar}
          title="暂无预约"
          description={activeTab === 'upcoming' ? '还没有即将到来的预约，去预约一位咨询师吧' : activeTab === 'history' ? '还没有历史预约记录' : '点击上方「立即预约」开始您的第一次咨询'}
          action={activeTab !== 'history' ? { label: '立即预约', onClick: () => navigate('/') } : undefined}
        />
      ) : (
        <div className="space-y-4">
          {sortedAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              role="client"
              onCancel={handleCancel}
              onReview={handleReview}
            />
          ))}
        </div>
      )}
    </div>
  );
}
