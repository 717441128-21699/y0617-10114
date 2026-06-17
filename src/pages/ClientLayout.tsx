import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Calendar, Package, Star, Home, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const menuItems = [
  { to: '/client/dashboard', label: '我的预约', icon: Calendar },
  { to: '/client/packages', label: '课程包管理', icon: Package },
  { to: '/client/reviews', label: '评价管理', icon: Star },
];

export default function ClientLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-white">
        <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-soft">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-serif text-base font-bold text-slate-800">来访者中心</h1>
            <p className="text-xs text-slate-400">Client Portal</p>
          </div>
        </div>

        <div className="flex h-[calc(100vh-4rem)] flex-col justify-between py-4">
          <nav className="space-y-1 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700 shadow-glow'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    )
                  }
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              );
            })}

            <NavLink
              to="/"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800"
            >
              <Home className="h-5 w-5" />
              返回首页
            </NavLink>
          </nav>

          <div className="space-y-3 px-3">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200 font-bold text-primary-700">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{user?.name || '用户'}</p>
                <p className="truncate text-xs text-slate-400">{user?.phone || user?.email || ''}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-crisis-600"
            >
              <LogOut className="h-5 w-5" />
              退出登录
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
