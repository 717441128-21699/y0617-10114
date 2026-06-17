import { Link } from 'react-router-dom';
import { Heart, UserCog, Stethoscope, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { cn } from '@/lib/utils';

export default function RegisterSelect() {
  const options = [
    {
      role: 'client',
      title: '来访者注册',
      subtitle: '寻求专业心理帮助',
      desc: '与认证咨询师一对一沟通，文字、语音、视频多种方式，隐私安全有保障。',
      Icon: UserCog,
      color: 'primary',
      gradient: 'from-primary-500 to-primary-600',
      bgGradient: 'from-primary-50 to-white',
      border: 'hover:border-primary-300',
      badge: '温暖守护',
    },
    {
      role: 'counselor',
      title: '咨询师注册',
      subtitle: '加入专业服务平台',
      desc: '资质审核认证后，为来访者提供专业咨询服务，灵活设置工作时间。',
      Icon: Stethoscope,
      color: 'warm',
      gradient: 'from-warm-400 to-warm-500',
      bgGradient: 'from-warm-50 to-white',
      border: 'hover:border-warm-300',
      badge: '专业认证',
    },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <section className="relative overflow-hidden py-12 md:py-20">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-1/4 top-10 h-96 w-96 rounded-full bg-primary-200 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-80 w-80 rounded-full bg-warm-200 blur-3xl" />
        </div>

        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-warm-400 shadow-card">
                <Heart className="h-8 w-8 text-white" fill="white" />
              </div>
              <h1 className="font-serif text-3xl font-bold text-slate-800 md:text-4xl">
                加入心语空间
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-base text-slate-500 md:text-lg">
                选择适合您的身份，开启温暖的心灵之旅
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {options.map((opt) => (
                <Link
                  key={opt.role}
                  to={`/register/${opt.role}`}
                  className={cn(
                    'group relative overflow-hidden rounded-3xl bg-gradient-to-br p-8 shadow-card transition-all duration-300',
                    'border-2 border-transparent',
                    opt.bgGradient,
                    opt.border,
                    'hover:-translate-y-1 hover:shadow-xl'
                  )}
                >
                  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10">
                    <div className={cn('h-full w-full rounded-full bg-gradient-to-br', opt.gradient)} />
                  </div>

                  <div className="relative">
                    <div className="mb-6 flex items-start justify-between">
                      <div className={cn(
                        'flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-soft',
                        opt.gradient
                      )}>
                        <opt.Icon className="h-8 w-8 text-white" />
                      </div>
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium',
                        opt.color === 'primary'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-warm-100 text-warm-700'
                      )}>
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {opt.badge}
                      </span>
                    </div>

                    <h2 className="mb-1 font-serif text-2xl font-bold text-slate-800">
                      {opt.title}
                    </h2>
                    <p className={cn(
                      'mb-5 text-sm font-medium',
                      opt.color === 'primary' ? 'text-primary-600' : 'text-warm-600'
                    )}>
                      {opt.subtitle}
                    </p>

                    <p className="mb-6 text-sm leading-relaxed text-slate-600">
                      {opt.desc}
                    </p>

                    <div className={cn(
                      'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-all',
                      'group-hover:-translate-y-0.5 group-hover:shadow-card',
                      'bg-gradient-to-r',
                      opt.gradient
                    )}>
                      立即注册
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-sm text-slate-500">
                已有账号？
                <Link to="/login" className="ml-1 font-semibold text-primary-600 hover:text-primary-700">
                  直接登录
                </Link>
              </p>
            </div>

            <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { icon: ShieldCheck, text: '隐私严格保密' },
                { icon: Sparkles, text: '专业资质认证' },
                { icon: Heart, text: '用心温暖陪伴' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <item.icon className="h-4 w-4 text-primary-500" />
                  {item.text}
                </div>
              ))}
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
