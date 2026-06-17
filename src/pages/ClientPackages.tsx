import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Clock, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePackageStore } from '@/store/packageStore';
import Empty from '@/components/Empty';
import type { PackagePurchase } from '@shared/types';

interface PackageCardItemProps {
  pkg: PackagePurchase;
  onRepurchase: (pkg: PackagePurchase) => void;
}

function PackageCardItem({ pkg, onRepurchase }: PackageCardItemProps) {
  const isUsedUp = pkg.remainingSessions === 0;
  const progress = (pkg.remainingSessions / pkg.totalSessions) * 100;

  return (
    <div
      className={cn(
        'rounded-2xl bg-white p-6 shadow-card transition-all hover:shadow-xl',
        isUsedUp && 'opacity-60 grayscale'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-warm-100 to-warm-200 text-2xl font-bold text-warm-600">
            {pkg.counselorName?.charAt(0) || '?'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-serif text-base font-bold text-slate-800">{pkg.counselorName || '咨询师'}</h4>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">咨询师</p>
          </div>
        </div>
        {isUsedUp && (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
            已用完
          </span>
        )}
      </div>

      <div className="mt-5">
        <h3 className="font-serif text-lg font-bold text-slate-800">课程包</h3>
      </div>

      <div className="mt-3">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-warm-500">{pkg.remainingSessions}</span>
            <span className="text-sm text-slate-400">/ {pkg.totalSessions} 次剩余</span>
          </div>
          <span className="text-sm font-semibold text-slate-600">{Math.round(progress)}%</span>
        </div>

        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isUsedUp ? 'bg-slate-300' : progress <= 20 ? 'bg-crisis-500' : 'bg-gradient-to-r from-warm-400 to-warm-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          购买于 {pkg.purchasedAt?.slice(0, 10)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          有效期至 {pkg.expireAt?.slice(0, 10)}
        </span>
      </div>

      <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3">
        <p className="text-xs text-slate-500">
          每次咨询消耗 <span className="font-semibold text-slate-700">1 次</span> 服务次数，按预约确认时扣除
        </p>
      </div>

      {isUsedUp && (
        <button
          onClick={() => onRepurchase(pkg)}
          className="mt-5 w-full rounded-xl bg-warm-500 py-3 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-warm-600"
        >
          重新购买
        </button>
      )}
    </div>
  );
}

export default function ClientPackages() {
  const navigate = useNavigate();
  const { myPackages, loading, fetchMyPackages } = usePackageStore();

  useEffect(() => {
    fetchMyPackages();
  }, [fetchMyPackages]);

  const handleRepurchase = (_pkg: PackagePurchase) => {
    navigate('/');
  };

  const activePackages = myPackages.filter((p) => p.remainingSessions > 0);
  const usedPackages = myPackages.filter((p) => p.remainingSessions === 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-800">我的课程包</h1>
          <p className="mt-1 text-sm text-slate-500">查看和管理您购买的咨询课程包</p>
        </div>
      </div>

      <Link
        to="/"
        className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary-50 to-teal-50 border border-primary-100 p-5 transition-all hover:shadow-soft"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
          <Compass className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="font-serif text-base font-bold text-slate-800">发现更多咨询师</p>
          <p className="text-sm text-slate-500">浏览平台认证咨询师，找到适合您的专业帮助</p>
        </div>
        <User className="h-5 w-5 text-primary-500" />
      </Link>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
        </div>
      ) : myPackages.length === 0 ? (
        <Empty
          title="还没有购买课程包"
          description="购买课程包可以享受更优惠的单次咨询价格，建议选择合适的咨询师开启长期咨询"
          action={{ label: '发现咨询师', onClick: () => navigate('/') }}
        />
      ) : (
        <div className="space-y-6">
          {activePackages.length > 0 && (
            <div>
              <h2 className="mb-4 font-serif text-lg font-bold text-slate-700">进行中 ({activePackages.length})</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {activePackages.map((pkg) => (
                  <PackageCardItem key={pkg.id} pkg={pkg} onRepurchase={handleRepurchase} />
                ))}
              </div>
            </div>
          )}

          {usedPackages.length > 0 && (
            <div>
              <h2 className="mb-4 font-serif text-lg font-bold text-slate-500">已用完 ({usedPackages.length})</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {usedPackages.map((pkg) => (
                  <PackageCardItem key={pkg.id} pkg={pkg} onRepurchase={handleRepurchase} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
