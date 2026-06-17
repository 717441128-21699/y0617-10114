import { create } from 'zustand';
import type { Counselor, CounselorFilters, WeeklySchedule } from '../../shared/types';
import { apiClient } from '../lib/api';

interface CounselorState {
  counselors: Counselor[];
  currentCounselor: Counselor | null;
  currentUserCounselor: Counselor | null;
  loading: boolean;
  fetchCounselors: (filters?: CounselorFilters) => Promise<boolean>;
  fetchCounselorById: (id: string) => Promise<boolean>;
  fetchCurrentCounselor: () => Promise<boolean>;
  updateCurrentCounselor: (data: Partial<Counselor>) => void;
  updateSchedule: (schedule: WeeklySchedule) => void;
}

export const useCounselorStore = create<CounselorState>((set, get) => ({
  counselors: [],
  currentCounselor: null,
  currentUserCounselor: null,
  loading: false,

  fetchCounselors: async (filters?: CounselorFilters) => {
    set({ loading: true });
    const params = new URLSearchParams();
    if (filters) {
      if (filters.specialties?.length) params.set('specialties', filters.specialties.join(','));
      if (filters.serviceModes?.length) params.set('serviceModes', filters.serviceModes.join(','));
      if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
      if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
      if (filters.search) params.set('search', filters.search);
    }
    const query = params.toString();
    const res = await apiClient.get<Counselor[]>(`/counselors${query ? `?${query}` : ''}`);
    if (res.success && res.data) {
      set({ counselors: res.data, loading: false });
      return true;
    }
    set({ loading: false });
    return false;
  },

  fetchCounselorById: async (id: string) => {
    set({ loading: true });
    const res = await apiClient.get<Counselor>(`/counselors/${id}`);
    if (res.success && res.data) {
      set({ currentCounselor: res.data, loading: false });
      return true;
    }
    set({ loading: false });
    return false;
  },

  fetchCurrentCounselor: async () => {
    set({ loading: true });
    const res = await apiClient.get<Counselor>('/counselors/me/profile');
    if (res.success && res.data) {
      set({ currentUserCounselor: res.data, loading: false });
      return true;
    }
    set({ loading: false });
    return false;
  },

  updateCurrentCounselor: (data: Partial<Counselor>) => {
    const { currentUserCounselor } = get();
    if (currentUserCounselor) {
      set({ currentUserCounselor: { ...currentUserCounselor, ...data } });
    }
  },

  updateSchedule: (schedule: WeeklySchedule) => {
    const { currentUserCounselor } = get();
    if (currentUserCounselor) {
      set({ currentUserCounselor: { ...currentUserCounselor, schedule } });
    }
  },
}));
