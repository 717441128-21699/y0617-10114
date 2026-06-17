import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Mail, Lock, UserCog, Stethoscope, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import type { UserRole } from '@shared/types';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuthStore();
  const [role, setRole] = useState<UserRole>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      const { user } = useAuthStore.getState();
      if (user?.role === 'client') {
        navigate('/client/dashboard');
      } else if (user?.role === 'counselor') {
        navigate('/counselor/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <section className="relative overflow-hidden py-12 md:py-20">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-1/4 top-10 h-96 w-96 rounded-full bg-primary-200 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-80 w-80 rounded-full bg-warm-200 blur-3xl" />
        </div>

        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-md">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-card">
                <Heart className="h-8 w-8 text-white" fill="white" />
              </div>
              <h1 className="font-serif text-3xl font-bold text-slate-800">欢迎回来</h1>
              <p className="mt-2 text-sm text-slate-500">登录心语空间，开启温暖之旅</p>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-card">
              <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
                <button
                  onClick={() => setRole('client')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all',
                    role === 'client'
                      ? 'bg-white text-primary-700 shadow-soft'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  <UserCog className="h-4 w-4" />
                  来访者
                </button>
                <button
                  onClick={() => setRole('counselor')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all',
                    role === 'counselor'
                      ? 'bg-white text-primary-700 shadow-soft'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  <Stethoscope className="h-4 w-4" />
                  咨询师
                </button>
              </div>

              {error && (
                <div className="mb-5 flex items-start gap-2 rounded-xl bg-crisis-50 p-3 text-sm text-crisis-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label-field">邮箱</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="请输入邮箱地址"
                      required
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="label-field">密码</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="请输入密码"
                      required
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-slate-600">记住我</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    忘记密码？
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    'w-full rounded-xl py-3 text-sm font-semibold text-white shadow-soft transition-all',
                    loading
                      ? 'bg-primary-400 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-700 hover:-translate-y-0.5 hover:shadow-card active:scale-[0.98]'
                  )}
                >
                  {loading ? '登录中...' : `登 录`}
                </button>
              </form>

              <div className="mt-6 border-t border-slate-100 pt-6 text-center">
                <p className="text-sm text-slate-500">
                  还没有账号？
                  <Link
                    to="/register"
                    className="ml-1 font-semibold text-primary-600 hover:text-primary-700"
                  >
                    注册新账号
                  </Link>
                </p>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-slate-400">
              登录即表示您同意《用户服务协议》和《隐私政策》
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-slate-500">
            <p>© 2026 心语空间 · 在这里，你的心事被温柔倾听</p>
            <p className="mt-2">专业心理咨询服务平台 · 隐私安全 · 用心守护</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
