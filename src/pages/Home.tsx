import { useEffect, useState } from 'react';
import { Search, Sparkles, Shield, Clock, Heart } from 'lucide-react';
import Navbar from '@/components/Navbar';
import SpecialtyFilter from '@/components/SpecialtyFilter';
import CounselorCard from '@/components/CounselorCard';
import { useAuthStore } from '@/store/authStore';
import { useCounselorStore } from '@/store/counselorStore';
import type { CounselorFilters, Specialty } from '@shared/types';
import { SpecialtyLabels } from '@shared/types';

const hotTags: Specialty[] = ['anxiety', 'depression', 'marriage', 'adolescent', 'stress', 'trauma'];

export default function Home() {
  const { init } = useAuthStore();
  const { counselors, loading, fetchCounselors } = useCounselorStore();
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<CounselorFilters>({});

  useEffect(() => {
    init();
    fetchCounselors();
  }, [init, fetchCounselors]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ search: searchText.trim() || undefined });
    fetchCounselors({ search: searchText.trim() || undefined });
  };

  const handleHotTag = (tag: Specialty) => {
    setFilters({ specialties: [tag] });
    fetchCounselors({ specialties: [tag] });
  };

  const handleApplyFilters = (newFilters: CounselorFilters) => {
    setFilters(newFilters);
    fetchCounselors(newFilters);
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <section className="gradient-hero relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-10 top-10 h-64 w-64 rounded-full bg-primary-200 blur-3xl" />
          <div className="absolute right-10 top-20 h-72 w-72 rounded-full bg-warm-200 blur-3xl" />
        </div>

        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center animate-fade-in-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-primary-700 shadow-soft backdrop-blur">
              <Sparkles className="h-4 w-4" />
              <span>专业认证咨询师 · 隐私安全保障</span>
            </div>

            <h1 className="mb-6 font-serif text-4xl font-bold leading-tight text-slate-800 md:text-5xl lg:text-6xl">
              在这里，你的心事被温柔倾听
            </h1>

            <p className="mb-10 text-base leading-relaxed text-slate-600 md:text-lg">
              心语空间连接专业心理咨询师与需要帮助的人，提供文字、语音、视频多种咨询方式。
              <br className="hidden md:block" />
              严格的隐私保护，让你安心说出心里话。
            </p>

            <form onSubmit={handleSearch} className="mx-auto mb-8 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="搜索咨询师姓名、擅长方向..."
                  className="w-full rounded-2xl border-0 bg-white py-4 pl-14 pr-40 text-base shadow-card outline-none transition-all focus:shadow-glow"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-primary-700"
                >
                  搜索
                </button>
              </div>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm text-slate-500">热门：</span>
              {hotTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleHotTag(tag)}
                  className="rounded-full bg-white/80 px-4 py-1.5 text-xs font-medium text-slate-600 shadow-soft transition-all hover:bg-primary-50 hover:text-primary-700"
                >
                  {SpecialtyLabels[tag]}
                </button>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { icon: Shield, title: '隐私保护', desc: '端到端加密，严格保密' },
              { icon: Clock, title: '灵活预约', desc: '7x24小时，随时预约' },
              { icon: Heart, title: '专业认证', desc: '资质审核，经验丰富' },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-2xl bg-white/80 p-5 shadow-soft backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-card"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-100 to-primary-200">
                  <item.icon className="h-6 w-6 text-primary-700" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">{item.title}</h4>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold text-slate-800 md:text-3xl">
              选择适合你的咨询师
            </h2>
            <p className="mt-2 text-slate-500">
              {hasActiveFilters
                ? `筛选结果：${counselors.length} 位咨询师`
                : `共 ${counselors.length} 位专业咨询师在线`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <aside className="lg:col-span-1">
            <SpecialtyFilter onApply={handleApplyFilters} initialFilters={filters} />
          </aside>

          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-2xl bg-white p-6 shadow-card">
                    <div className="flex items-start gap-4">
                      <div className="h-20 w-20 rounded-2xl bg-slate-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 w-24 rounded bg-slate-200" />
                        <div className="h-4 w-32 rounded bg-slate-100" />
                        <div className="h-4 w-20 rounded bg-slate-100" />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="h-3 w-full rounded bg-slate-100" />
                      <div className="h-3 w-3/4 rounded bg-slate-100" />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <div className="h-6 w-16 rounded-full bg-slate-100" />
                      <div className="h-6 w-16 rounded-full bg-slate-100" />
                      <div className="h-6 w-16 rounded-full bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : counselors.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {counselors.map((counselor) => (
                  <CounselorCard key={counselor.id} counselor={counselor} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-16 shadow-card">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="mb-2 font-semibold text-slate-700">暂无匹配的咨询师</h3>
                <p className="text-sm text-slate-500">试试调整筛选条件或搜索关键词</p>
              </div>
            )}
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
