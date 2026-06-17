import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SpecialtyLabels, ServiceModeLabels } from '@shared/types';
import type { CounselorFilters, Specialty, ServiceMode } from '@shared/types';

interface SpecialtyFilterProps {
  onApply: (filters: CounselorFilters) => void;
  initialFilters?: CounselorFilters;
  priceRange?: [number, number];
}

export default function SpecialtyFilter({
  onApply,
  initialFilters = {},
  priceRange = [100, 2000],
}: SpecialtyFilterProps) {
  const [search, setSearch] = useState(initialFilters.search || '');
  const [selectedSpecialties, setSelectedSpecialties] = useState<Specialty[]>(
    initialFilters.specialties || []
  );
  const [selectedModes, setSelectedModes] = useState<ServiceMode[]>(
    initialFilters.serviceModes || []
  );
  const [minPrice, setMinPrice] = useState(initialFilters.minPrice || priceRange[0]);
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice || priceRange[1]);

  const toggleSpecialty = (s: Specialty) => {
    setSelectedSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const toggleMode = (m: ServiceMode) => {
    setSelectedModes((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const handleApply = () => {
    onApply({
      search: search.trim() || undefined,
      specialties: selectedSpecialties.length ? selectedSpecialties : undefined,
      serviceModes: selectedModes.length ? selectedModes : undefined,
      minPrice: minPrice > priceRange[0] ? minPrice : undefined,
      maxPrice: maxPrice < priceRange[1] ? maxPrice : undefined,
    });
  };

  const handleReset = () => {
    setSearch('');
    setSelectedSpecialties([]);
    setSelectedModes([]);
    setMinPrice(priceRange[0]);
    setMaxPrice(priceRange[1]);
    onApply({});
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-card">
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索咨询师姓名、擅长方向..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-10 text-sm outline-none transition-all focus:border-primary-400 focus:bg-white focus:shadow-glow"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="mb-5">
        <h4 className="mb-3 text-sm font-semibold text-slate-700">擅长方向</h4>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(SpecialtyLabels) as Specialty[]).map((s) => (
            <button
              key={s}
              onClick={() => toggleSpecialty(s)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all',
                selectedSpecialties.includes(s)
                  ? 'border-primary-500 bg-primary-500 text-white shadow-soft'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-primary-300 hover:text-primary-600'
              )}
            >
              {SpecialtyLabels[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <h4 className="mb-3 text-sm font-semibold text-slate-700">服务模式</h4>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ServiceModeLabels) as ServiceMode[]).map((m) => (
            <button
              key={m}
              onClick={() => toggleMode(m)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all',
                selectedModes.includes(m)
                  ? 'border-primary-500 bg-primary-500 text-white shadow-soft'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-primary-300 hover:text-primary-600'
              )}
            >
              {ServiceModeLabels[m]}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="mb-3 text-sm font-semibold text-slate-700">
          价格区间 <span className="ml-2 font-normal text-slate-500">¥{minPrice} - ¥{maxPrice}</span>
        </h4>
        <div className="space-y-3 px-1">
          <input
            type="range"
            min={priceRange[0]}
            max={priceRange[1]}
            step={50}
            value={minPrice}
            onChange={(e) => {
              const val = Number(e.target.value);
              setMinPrice(Math.min(val, maxPrice - 50));
            }}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-primary-500"
          />
          <input
            type="range"
            min={priceRange[0]}
            max={priceRange[1]}
            step={50}
            value={maxPrice}
            onChange={(e) => {
              const val = Number(e.target.value);
              setMaxPrice(Math.max(val, minPrice + 50));
            }}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-primary-500"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleReset}
          className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          重置
        </button>
        <button
          onClick={handleApply}
          className="flex-1 rounded-xl bg-primary-600 py-2.5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-primary-700"
        >
          应用筛选
        </button>
      </div>
    </div>
  );
}
