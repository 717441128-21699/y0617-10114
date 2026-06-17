import { useState, useEffect } from 'react';
import { Camera, CheckCircle2, XCircle, Save, User, Award, BookOpen, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useCounselorStore } from '@/store/counselorStore';
import { apiClient } from '@/lib/api';
import { SpecialtyLabels, ServiceModeLabels } from '@shared/types';
import type { Specialty, ServiceMode, Counselor } from '@shared/types';

const allSpecialties: Specialty[] = ['anxiety', 'depression', 'marriage', 'adolescent', 'trauma', 'stress', 'family', 'other'];
const allServiceModes: ServiceMode[] = ['text', 'voice', 'video'];

interface SectionCardProps {
  icon: typeof User;
  title: string;
  children: React.ReactNode;
}

function SectionCard({ icon: Icon, title, children }: SectionCardProps) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-card">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warm-100 text-warm-600">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="font-serif text-lg font-bold text-slate-800">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function CounselorProfile() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const { currentUserCounselor, fetchCurrentCounselor, updateCurrentCounselor } = useCounselorStore();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const [form, setForm] = useState({
    licenseNo: '',
    licenseVerified: false,
    specialties: [] as Specialty[],
    serviceModes: [] as ServiceMode[],
    experienceYears: 0,
    education: '',
    sessionDuration: 50,
    pricePerSession: 0,
    introduction: '',
  });

  useEffect(() => {
    fetchCurrentCounselor();
  }, [fetchCurrentCounselor]);

  useEffect(() => {
    if (currentUserCounselor) {
      setForm({
        licenseNo: currentUserCounselor.licenseNo || '',
        licenseVerified: currentUserCounselor.licenseVerified || false,
        specialties: currentUserCounselor.specialties || [],
        serviceModes: currentUserCounselor.serviceModes || [],
        experienceYears: currentUserCounselor.experienceYears || 0,
        education: currentUserCounselor.education || '',
        sessionDuration: currentUserCounselor.sessionDuration || 50,
        pricePerSession: currentUserCounselor.pricePerSession || 0,
        introduction: currentUserCounselor.introduction || '',
      });
    }
  }, [currentUserCounselor]);

  const toggleSpecialty = (s: Specialty) => {
    setForm((f) => ({
      ...f,
      specialties: f.specialties.includes(s) ? f.specialties.filter((x) => x !== s) : [...f.specialties, s],
    }));
  };

  const toggleServiceMode = (m: ServiceMode) => {
    setForm((f) => ({
      ...f,
      serviceModes: f.serviceModes.includes(m) ? f.serviceModes.filter((x) => x !== m) : [...f.serviceModes, m],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await apiClient.put<Counselor>('/counselors/me/profile', form);
    setSaving(false);
    if (res.success && res.data) {
      setSaved(true);
      setToastVisible(true);
      updateCurrentCounselor(res.data);
      updateUser({
        name: res.data.name,
        avatar: res.data.avatar,
      });
      setTimeout(() => {
        setSaved(false);
        setToastVisible(false);
      }, 3000);
    }
  };

  return (
    <div className="space-y-6 relative">
      {toastVisible && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="flex items-center gap-2 rounded-xl bg-safe-600 px-6 py-3 text-white shadow-lg">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">保存成功！您的执业信息已更新</span>
          </div>
        </div>
      )}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-800">执业信息</h1>
          <p className="mt-1 text-sm text-slate-500">完善您的个人资料，让来访者更好地了解您</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-soft transition-all',
            saved ? 'bg-safe-600 hover:bg-safe-700' : 'bg-warm-500 hover:bg-warm-600',
            saving && 'opacity-70 cursor-not-allowed'
          )}
        >
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? '保存中...' : saved ? '✓ 保存成功' : '保存修改'}
        </button>
      </div>

      <SectionCard icon={User} title="基本信息">
        <div className="flex items-start gap-6">
          <div className="flex flex-col items-center gap-3">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-warm-100 to-warm-200 text-3xl font-bold text-warm-600 shadow-card">
              {user?.name?.charAt(0) || 'U'}
              <button className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-warm-500 text-white shadow-soft transition-colors hover:bg-warm-600">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">点击更换头像</p>
          </div>

          <div className="flex-1 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">姓名</label>
              <div className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
                {user?.name || '未设置'}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">手机号</label>
              <div className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
                {user?.phone || '未绑定'}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={Award} title="执业资质">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">执业证号</label>
            <div className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-mono text-slate-700">
              {form.licenseNo}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">审核状态</label>
            <div className="flex items-center gap-2 rounded-xl bg-safe-50 px-4 py-2.5">
              {form.licenseVerified ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-safe-600" />
                  <span className="text-sm font-medium text-safe-700">已通过平台认证</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-crisis-600" />
                  <span className="text-sm font-medium text-crisis-700">审核中</span>
                </>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={Award} title="擅长领域">
        <div className="flex flex-wrap gap-2">
          {allSpecialties.map((s) => {
            const selected = form.specialties.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleSpecialty(s)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all',
                  selected
                    ? 'bg-warm-500 text-white shadow-soft'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {SpecialtyLabels[s]}
                {selected && <CheckCircle2 className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard icon={BookOpen} title="服务形式">
        <div className="flex flex-wrap gap-3">
          {allServiceModes.map((m) => {
            const selected = form.serviceModes.includes(m);
            return (
              <button
                key={m}
                onClick={() => toggleServiceMode(m)}
                className={cn(
                  'flex-1 min-w-[120px] rounded-xl border-2 p-4 text-center transition-all',
                  selected
                    ? 'border-warm-400 bg-warm-50 text-warm-700 shadow-soft'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                )}
              >
                <p className="font-serif text-base font-bold">{ServiceModeLabels[m]}</p>
                {selected && (
                  <p className="mt-1 text-xs text-warm-600">已启用</p>
                )}
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard icon={BookOpen} title="专业背景">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">从业年限（年）</label>
            <input
              type="number"
              min={0}
              max={50}
              value={form.experienceYears}
              onChange={(e) => setForm({ ...form, experienceYears: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-warm-400 focus:ring-2 focus:ring-warm-100"
            />
          </div>
          <div />
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-slate-500">教育背景 & 资质认证</label>
            <textarea
              rows={3}
              value={form.education}
              onChange={(e) => setForm({ ...form, education: e.target.value })}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-warm-400 focus:ring-2 focus:ring-warm-100"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={Award} title="执业设置">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">单次咨询时长（分钟）</label>
            <input
              type="number"
              min={20}
              max={180}
              step={10}
              value={form.sessionDuration}
              onChange={(e) => setForm({ ...form, sessionDuration: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-warm-400 focus:ring-2 focus:ring-warm-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">单次咨询价格（元）</label>
            <input
              type="number"
              min={0}
              step={50}
              value={form.pricePerSession}
              onChange={(e) => setForm({ ...form, pricePerSession: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-warm-400 focus:ring-2 focus:ring-warm-100"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={User} title="个人介绍">
        <textarea
          rows={5}
          value={form.introduction}
          onChange={(e) => setForm({ ...form, introduction: e.target.value })}
          placeholder="向来访者介绍您的咨询风格、擅长方法和咨询理念..."
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 outline-none transition-colors focus:border-warm-400 focus:ring-2 focus:ring-warm-100"
        />
        <p className="mt-2 text-xs text-slate-400">
          建议 100-500 字，真实真诚的介绍更能获得来访者信任。当前 {form.introduction.length} 字
        </p>
      </SectionCard>
    </div>
  );
}
