import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart, User, Mail, Phone, Lock, AlertCircle, ArrowLeft, Check,
  Stethoscope, Upload, GraduationCap, Sparkles, MessageSquare, Video,
  Clock, Coins, FileText
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import type { Specialty, ServiceMode } from '@shared/types';
import { SpecialtyLabels, ServiceModeLabels } from '@shared/types';

export default function RegisterCounselor() {
  const navigate = useNavigate();
  const { registerCounselor, loading, error } = useAuthStore();

  const [basic, setBasic] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [license, setLicense] = useState({ licenseNo: '', uploaded: false });
  const [background, setBackground] = useState({ experienceYears: 0, education: '' });
  const [practice, setPractice] = useState({
    specialties: [] as Specialty[],
    serviceModes: [] as ServiceMode[],
    sessionDuration: 50,
    pricePerSession: 300,
  });
  const [introduction, setIntroduction] = useState('');
  const [agree, setAgree] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const toggleSpecialty = (s: Specialty) => {
    setPractice((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(s)
        ? prev.specialties.filter((x) => x !== s)
        : [...prev.specialties, s],
    }));
  };

  const toggleServiceMode = (m: ServiceMode) => {
    setPractice((prev) => ({
      ...prev,
      serviceModes: prev.serviceModes.includes(m)
        ? prev.serviceModes.filter((x) => x !== m)
        : [...prev.serviceModes, m],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!agree) return setFormError('请阅读并同意用户协议和隐私政策');
    if (basic.password.length < 6) return setFormError('密码长度至少6位');
    if (basic.password !== basic.confirmPassword) return setFormError('两次输入的密码不一致');
    if (!license.licenseNo.trim()) return setFormError('请填写执业证号');
    if (!license.uploaded) return setFormError('请上传执业证书');
    if (background.experienceYears <= 0) return setFormError('请填写从业年限');
    if (!background.education.trim()) return setFormError('请填写教育背景');
    if (practice.specialties.length === 0) return setFormError('请至少选择一个擅长方向');
    if (practice.serviceModes.length === 0) return setFormError('请至少选择一种服务模式');
    if (practice.pricePerSession < 50) return setFormError('单次价格最低50元');
    if (!introduction.trim()) return setFormError('请填写个人介绍');

    const success = await registerCounselor({
      name: basic.name,
      email: basic.email,
      phone: basic.phone || undefined,
      password: basic.password,
      licenseNo: license.licenseNo,
      specialties: practice.specialties,
      serviceModes: practice.serviceModes,
      introduction,
      education: background.education,
      experienceYears: background.experienceYears,
      sessionDuration: practice.sessionDuration,
      pricePerSession: practice.pricePerSession,
    });

    if (success) navigate('/login');
  };

  const sections = [
    {
      title: '基本信息',
      icon: User,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="label-field">姓名 <span className="text-crisis-500">*</span></label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="text" value={basic.name} onChange={(e) => setBasic({ ...basic, name: e.target.value })} placeholder="请输入真实姓名" required className="input-field pl-10" />
              </div>
            </div>
            <div>
              <label className="label-field">手机号 <span className="text-crisis-500">*</span></label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="tel" value={basic.phone} onChange={(e) => setBasic({ ...basic, phone: e.target.value })} placeholder="请输入手机号" required className="input-field pl-10" />
              </div>
            </div>
          </div>
          <div>
            <label className="label-field">邮箱 <span className="text-crisis-500">*</span></label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="email" value={basic.email} onChange={(e) => setBasic({ ...basic, email: e.target.value })} placeholder="请输入邮箱地址" required className="input-field pl-10" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="label-field">密码 <span className="text-crisis-500">*</span></label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="password" value={basic.password} onChange={(e) => setBasic({ ...basic, password: e.target.value })} placeholder="至少6位字符" required className="input-field pl-10" />
              </div>
            </div>
            <div>
              <label className="label-field">确认密码 <span className="text-crisis-500">*</span></label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="password" value={basic.confirmPassword} onChange={(e) => setBasic({ ...basic, confirmPassword: e.target.value })} placeholder="再次输入密码" required className="input-field pl-10" />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '执业资质',
      icon: Stethoscope,
      content: (
        <div className="space-y-5">
          <div>
            <label className="label-field">执业证号 <span className="text-crisis-500">*</span></label>
            <div className="relative">
              <Stethoscope className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="text" value={license.licenseNo} onChange={(e) => setLicense({ ...license, licenseNo: e.target.value })} placeholder="请输入心理咨询师执业证号" className="input-field pl-10" />
            </div>
          </div>
          <div>
            <label className="label-field">执业证书扫描件 <span className="text-crisis-500">*</span></label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setLicense({ ...license, uploaded: !license.uploaded })}
                className={cn(
                  'flex items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 transition-all',
                  license.uploaded
                    ? 'border-safe-400 bg-safe-50'
                    : 'border-slate-200 hover:border-primary-300 hover:bg-primary-50/50'
                )}
              >
                <div className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl transition-colors',
                  license.uploaded ? 'bg-safe-100' : 'bg-slate-100'
                )}>
                  {license.uploaded ? <Check className="h-6 w-6 text-safe-600" /> : <Upload className="h-6 w-6 text-slate-400" />}
                </div>
                <div className="text-left">
                  <div className={cn('text-sm font-semibold', license.uploaded ? 'text-safe-700' : 'text-slate-700')}>
                    {license.uploaded ? '已上传' : '点击上传'}
                  </div>
                  <div className="text-xs text-slate-500">支持 JPG / PNG 格式</div>
                </div>
              </button>
              <div className="rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
                <p className="mb-1 font-medium text-slate-600">上传说明：</p>
                <p>• 请上传清晰的执业证书扫描件或照片</p>
                <p>• 证书信息需与填写的执业证号一致</p>
                <p>• 审核一般在1-3个工作日内完成</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '专业背景',
      icon: GraduationCap,
      content: (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="label-field">从业年限 <span className="text-crisis-500">*</span></label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={background.experienceYears || ''}
                  onChange={(e) => setBackground({ ...background, experienceYears: Number(e.target.value) })}
                  placeholder="年"
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="label-field">教育背景 <span className="text-crisis-500">*</span></label>
            <textarea
              value={background.education}
              onChange={(e) => setBackground({ ...background, education: e.target.value })}
              placeholder="请填写您的学历、毕业院校、专业培训经历等..."
              rows={4}
              className="input-field resize-none"
            />
          </div>
        </div>
      ),
    },
    {
      title: '执业设置',
      icon: Sparkles,
      content: (
        <div className="space-y-6">
          <div>
            <label className="label-field mb-3 block">擅长方向 <span className="text-crisis-500">*</span></label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SpecialtyLabels) as Specialty[]).map((s) => (
                <label key={s} className="cursor-pointer">
                  <input type="checkbox" checked={practice.specialties.includes(s)} onChange={() => toggleSpecialty(s)} className="peer sr-only" />
                  <span className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-medium transition-all',
                    practice.specialties.includes(s)
                      ? 'border-primary-500 bg-primary-500 text-white shadow-soft'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-primary-300 hover:text-primary-700'
                  )}>
                    <Check className={cn('h-3.5 w-3.5 transition-opacity', practice.specialties.includes(s) ? 'opacity-100' : 'opacity-0')} />
                    {SpecialtyLabels[s]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label-field mb-3 block">服务模式 <span className="text-crisis-500">*</span></label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {([
                { key: 'text', label: '文字咨询', Icon: MessageSquare, desc: '即时文字沟通' },
                { key: 'voice', label: '语音咨询', Icon: Phone, desc: '语音通话' },
                { key: 'video', label: '视频咨询', Icon: Video, desc: '视频面对面' },
              ] as const).map((m) => (
                <label key={m.key} className="cursor-pointer">
                  <input type="checkbox" checked={practice.serviceModes.includes(m.key)} onChange={() => toggleServiceMode(m.key)} className="peer sr-only" />
                  <div className={cn(
                    'rounded-xl border-2 p-4 transition-all',
                    practice.serviceModes.includes(m.key)
                      ? 'border-primary-500 bg-primary-50 shadow-soft'
                      : 'border-slate-200 bg-white hover:border-primary-300'
                  )}>
                    <div className="mb-2 flex items-center gap-2">
                      <div className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg',
                        practice.serviceModes.includes(m.key) ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-500'
                      )}>
                        <m.Icon className="h-4.5 w-4.5" />
                      </div>
                      <span className={cn('font-semibold', practice.serviceModes.includes(m.key) ? 'text-primary-700' : 'text-slate-700')}>{m.label}</span>
                    </div>
                    <div className="text-xs text-slate-500">{m.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="label-field">单次时长（分钟）</label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={practice.sessionDuration}
                  onChange={(e) => setPractice({ ...practice, sessionDuration: Number(e.target.value) })}
                  className="input-field pl-10 appearance-none"
                >
                  <option value={30}>30 分钟</option>
                  <option value={45}>45 分钟</option>
                  <option value={50}>50 分钟</option>
                  <option value={60}>60 分钟</option>
                  <option value={90}>90 分钟</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label-field">单次价格（元） <span className="text-crisis-500">*</span></label>
              <div className="relative">
                <Coins className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  min={50}
                  step={10}
                  value={practice.pricePerSession || ''}
                  onChange={(e) => setPractice({ ...practice, pricePerSession: Number(e.target.value) })}
                  placeholder="建议 100-2000"
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '个人介绍',
      icon: FileText,
      content: (
        <div>
          <label className="label-field mb-3 block">个人介绍 <span className="text-crisis-500">*</span></label>
          <textarea
            value={introduction}
            onChange={(e) => setIntroduction(e.target.value)}
            placeholder="介绍您的咨询理念、擅长方向、工作风格等，让来访者更好地了解您..."
            rows={6}
            className="input-field resize-none"
          />
          <div className="mt-2 text-xs text-slate-400 text-right">{introduction.length} 字</div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <section className="relative overflow-hidden py-12 md:py-16">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-1/4 top-10 h-96 w-96 rounded-full bg-warm-200 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-80 w-80 rounded-full bg-primary-200 blur-3xl" />
        </div>

        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <Link to="/register" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700">
              <ArrowLeft className="h-4 w-4" />
              返回选择
            </Link>

            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-warm-400 to-warm-500 shadow-card">
                <Heart className="h-8 w-8 text-white" fill="white" />
              </div>
              <h1 className="font-serif text-3xl font-bold text-slate-800">咨询师注册</h1>
              <p className="mt-2 text-sm text-slate-500">专业资质认证 · 加入温暖的咨询师团队</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {(error || formError) && (
                <div className="flex items-start gap-2 rounded-xl bg-crisis-50 p-4 text-sm text-crisis-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error || formError}</span>
                </div>
              )}

              {sections.map((sec, i) => (
                <div key={i} className="rounded-3xl bg-white p-6 shadow-card md:p-8">
                  <div className="mb-6 flex items-center gap-3 rounded-xl bg-warm-50 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warm-100">
                      <sec.icon className="h-5 w-5 text-warm-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-warm-800">
                        {i + 1}. {sec.title}
                      </div>
                    </div>
                  </div>
                  {sec.content}
                </div>
              ))}

              <div className="rounded-3xl bg-white p-6 shadow-card md:p-8">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-4 transition-colors hover:bg-slate-100">
                  <div className="relative mt-0.5">
                    <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="h-5 w-5 appearance-none rounded-md border-2 border-slate-300 text-primary-600 focus:ring-primary-500 peer" />
                    <Check className={cn('absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100')} strokeWidth={3} />
                    <div className={cn('absolute inset-0 rounded-md pointer-events-none transition-all', agree && 'bg-primary-600 border-primary-600')} />
                  </div>
                  <span className="text-sm leading-relaxed text-slate-600">
                    我已阅读并同意
                    <span className="mx-1 font-medium text-primary-600">《咨询师服务协议》</span>
                    、
                    <span className="mx-1 font-medium text-primary-600">《隐私政策》</span>
                    和
                    <span className="mx-1 font-medium text-primary-600">《执业道德规范》</span>
                    ，承诺所提供的信息真实有效。
                  </span>
                </label>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link to="/login" className="text-center text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 sm:text-left">
                  已有账号？直接登录
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    'w-full rounded-xl py-4 text-sm font-semibold text-white shadow-soft transition-all sm:w-auto sm:px-10',
                    loading ? 'bg-warm-300 cursor-not-allowed' : 'bg-gradient-to-r from-warm-400 to-warm-500 hover:from-warm-500 hover:to-warm-600 hover:-translate-y-0.5 hover:shadow-card active:scale-[0.98]'
                  )}
                >
                  {loading ? '提交中...' : '提 交 注 册'}
                </button>
              </div>
            </form>
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
