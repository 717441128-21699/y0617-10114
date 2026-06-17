import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, User, Mail, Phone, Lock, AlertCircle, ArrowLeft, Check } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

export default function RegisterClient() {
  const navigate = useNavigate();
  const { registerClient, loading, error } = useAuthStore();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [agree, setAgree] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (formError) setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!agree) {
      setFormError('请阅读并同意用户协议和隐私政策');
      return;
    }
    if (form.password.length < 6) {
      setFormError('密码长度至少6位');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setFormError('两次输入的密码不一致');
      return;
    }

    const success = await registerClient({
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      password: form.password,
    });

    if (success) {
      navigate('/login');
    }
  };

  const inputFields = [
    { key: 'name', label: '姓名', type: 'text', Icon: User, placeholder: '请输入真实姓名', required: true },
    { key: 'email', label: '邮箱', type: 'email', Icon: Mail, placeholder: '请输入邮箱地址', required: true },
    { key: 'phone', label: '手机号', type: 'tel', Icon: Phone, placeholder: '选填，用于接收通知', required: false },
    { key: 'password', label: '密码', type: 'password', Icon: Lock, placeholder: '至少6位字符', required: true },
    { key: 'confirmPassword', label: '确认密码', type: 'password', Icon: Lock, placeholder: '再次输入密码', required: true },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <section className="relative overflow-hidden py-12 md:py-16">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-1/4 top-10 h-96 w-96 rounded-full bg-primary-200 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-80 w-80 rounded-full bg-warm-200 blur-3xl" />
        </div>

        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-xl">
            <Link
              to="/register"
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              返回选择
            </Link>

            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-card">
                <Heart className="h-8 w-8 text-white" fill="white" />
              </div>
              <h1 className="font-serif text-3xl font-bold text-slate-800">来访者注册</h1>
              <p className="mt-2 text-sm text-slate-500">填写基本信息，开启温暖心灵之旅</p>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-card">
              <div className="mb-6 flex items-center gap-3 rounded-xl bg-primary-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100">
                  <User className="h-5 w-5 text-primary-700" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-primary-800">个人信息</div>
                  <div className="text-xs text-primary-600">您的信息将被严格保密</div>
                </div>
              </div>

              {(error || formError) && (
                <div className="mb-5 flex items-start gap-2 rounded-xl bg-crisis-50 p-3 text-sm text-crisis-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error || formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {inputFields.map((field) => (
                  <div key={field.key}>
                    <label className="label-field">
                      {field.label}
                      {field.required && <span className="ml-1 text-crisis-500">*</span>}
                    </label>
                    <div className="relative">
                      <field.Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type={field.type}
                        value={(form as any)[field.key]}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        className="input-field pl-10"
                      />
                    </div>
                  </div>
                ))}

                <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-4 transition-colors hover:bg-slate-100">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={(e) => setAgree(e.target.checked)}
                      className="h-5 w-5 appearance-none rounded-md border-2 border-slate-300 text-primary-600 focus:ring-primary-500 peer"
                    />
                    <Check
                      className={cn(
                        'absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100'
                      )}
                      strokeWidth={3}
                    />
                    <div className={cn(
                      'absolute inset-0 rounded-md pointer-events-none transition-all',
                      agree && 'bg-primary-600 border-primary-600'
                    )} />
                  </div>
                  <span className="text-sm leading-relaxed text-slate-600">
                    我已阅读并同意
                    <span className="mx-1 font-medium text-primary-600">《用户服务协议》</span>
                    和
                    <span className="mx-1 font-medium text-primary-600">《隐私政策》</span>
                    ，了解我的个人信息将被严格保密。
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    'w-full rounded-xl py-3.5 text-sm font-semibold text-white shadow-soft transition-all',
                    loading
                      ? 'bg-primary-400 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-700 hover:-translate-y-0.5 hover:shadow-card active:scale-[0.98]'
                  )}
                >
                  {loading ? '注册中...' : '注 册 账 号'}
                </button>
              </form>

              <div className="mt-6 border-t border-slate-100 pt-6 text-center">
                <p className="text-sm text-slate-500">
                  已有账号？
                  <Link to="/login" className="ml-1 font-semibold text-primary-600 hover:text-primary-700">
                    直接登录
                  </Link>
                </p>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-slate-400">
              心语空间承诺对您的所有信息严格保密
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
