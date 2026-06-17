import { create } from 'zustand';
import type { Counselor, CounselorFilters, WeeklySchedule, ScheduleException, TimeSlot } from '../../shared/types';
import { apiClient } from '../lib/api';

interface CounselorState {
  counselors: Counselor[];
  currentCounselor: Counselor | null;
  currentUserCounselor: Counselor | null;
  loading: boolean;
  exceptions: ScheduleException[];
  exceptionsLoading: boolean;
  availableSlots: TimeSlot[];
  availableSlotsLoading: boolean;
  fetchCounselors: (filters?: CounselorFilters) => Promise<boolean>;
  fetchCounselorById: (id: string) => Promise<boolean>;
  fetchCurrentCounselor: () => Promise<boolean>;
  updateCurrentCounselor: (data: Partial<Counselor>) => void;
  updateSchedule: (schedule: WeeklySchedule) => void;
  fetchMyExceptions: () => Promise<boolean>;
  createException: (data: Omit<ScheduleException, 'id' | 'counselorId' | 'createdAt'>) => Promise<ScheduleException | null>;
  updateException: (id: string, data: Partial<ScheduleException>) => Promise<ScheduleException | null>;
  deleteException: (id: string) => Promise<boolean>;
  fetchCounselorExceptions: (counselorId: string) => Promise<boolean>;
  fetchAvailableSlots: (counselorId: string, date: string) => Promise<boolean>;
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

  exceptions: [],
  exceptionsLoading: false,
  availableSlots: [],
  availableSlotsLoading: false,

  fetchMyExceptions: async () => {
    set({ exceptionsLoading: true });
    const res = await apiClient.get<ScheduleException[]>('/counselors/me/exceptions');
    if (res.success && res.data) {
      const sorted = [...res.data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      set({ exceptions: sorted, exceptionsLoading: false });
      return true;
    }
    set({ exceptionsLoading: false });
    return false;
  },

  createException: async (data) => {
    set({ exceptionsLoading: true });
    const res = await apiClient.post<ScheduleException>('/counselors/me/exceptions', data);
    if (res.success && res.data) {
      const { exceptions } = get();
      const updated = [...exceptions, res.data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      set({ exceptions: updated, exceptionsLoading: false });
      return res.data;
    }
    set({ exceptionsLoading: false });
    return null;
  },

  updateException: async (id, data) => {
    set({ exceptionsLoading: true });
    const res = await apiClient.put<ScheduleException>(`/counselors/me/exceptions/${id}`, data);
    if (res.success && res.data) {
      const { exceptions } = get();
      const updated = exceptions.map((e) => e.id === id ? res.data! : e).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      set({ exceptions: updated, exceptionsLoading: false });
      return res.data;
    }
    set({ exceptionsLoading: false });
    return null;
  },

  deleteException: async (id) => {
    set({ exceptionsLoading: true });
    const res = await apiClient.delete(`/counselors/me/exceptions/${id}`);
    if (res.success) {
      const { exceptions } = get();
      const updated = exceptions.filter((e) => e.id !== id);
      set({ exceptions: updated, exceptionsLoading: false });
      return true;
    }
    set({ exceptionsLoading: false });
    return false;
  },

  fetchCounselorExceptions: async (counselorId) => {
    set({ exceptionsLoading: true });
    const res = await apiClient.get<ScheduleException[]>(`/counselors/${counselorId}/exceptions`);
    if (res.success && res.data) {
      const sorted = [...res.data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      set({ exceptions: sorted, exceptionsLoading: false });
      return true;
    }
    set({ exceptionsLoading: false });
    return false;
  },

  fetchAvailableSlots: async (counselorId, date) => {
    set({ availableSlotsLoading: true });
    const res = await apiClient.get<TimeSlot[]>(`/counselors/${counselorId}/available-slots?date=${encodeURIComponent(date)}`);
    if (res.success && res.data) {
      set({ availableSlots: res.data, availableSlotsLoading: false });
      return true;
    }
    set({ availableSlotsLoading: false });
    return false;
  },
}));
