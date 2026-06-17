import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import type { UserRole } from '@shared/types';

interface NavItem {
  to: string;
  label: string;
  roles?: UserRole[];
}

const guestNav: NavItem[] = [
  { to: '/', label: '首页' },
  { to: '/counselors', label: '浏览咨询师' },
];

const authNav: Record<UserRole, NavItem[]> = {
  counselor: [
    { to: '/counselor/dashboard', label: '预约管理', roles: ['counselor'] },
    { to: '/counselor/profile', label: '执业信息', roles: ['counselor'] },
    { to: '/counselor/schedule', label: '时段设置', roles: ['counselor'] },
    { to: '/counselor/records', label: '档案管理', roles: ['counselor'] },
  ],
  client: [
    { to: '/client/dashboard', label: '我的预约', roles: ['client'] },
    { to: '/client/packages', label: '课程包', roles: ['client'] },
    { to: '/client/reviews', label: '评价', roles: ['client'] },
  ],
};

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const currentNav = user ? authNav[user.role] : guestNav;

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-soft">
            <Heart className="h-5 w-5 text-white" fill="white" />
          </div>
          <span className="font-serif text-xl font-bold text-slate-800">心语空间</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {currentNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-all',
                isActive(item.to)
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {!user ? (
            <>
              <Link
                to="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                登录
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-soft transition-colors hover:bg-primary-700"
              >
                注册
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                    {user.name.charAt(0)}
                  </div>
                )}
                <span className="text-sm font-medium text-slate-700">{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
              >
                <LogOut className="h-4 w-4" />
                <span>退出</span>
              </button>
            </div>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-slate-600 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white md:hidden">
          <div className="container mx-auto flex flex-col gap-1 px-4 py-3">
            {currentNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
                  isActive(item.to)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="my-2 border-t border-slate-100" />
            {!user ? (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  登录
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white">
                  注册
                </Link>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 rounded-lg px-4 py-2.5">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm font-medium text-slate-700">{user.name}</span>
                </div>
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>退出</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
