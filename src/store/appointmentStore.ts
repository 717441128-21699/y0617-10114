import { create } from 'zustand';
import type { Appointment, AppointmentStatus } from '../../shared/types';
import { apiClient } from '../lib/api';

interface CreateAppointmentData {
  counselorId: string;
  date: string;
  timeSlot: string;
  serviceMode: string;
  price: number;
  packageUsageId?: string;
  assessmentForm?: unknown;
}

interface AppointmentState {
  appointments: Appointment[];
  currentAppointment: Appointment | null;
  loading: boolean;
  fetchMyAppointments: () => Promise<boolean>;
  createAppointment: (data: CreateAppointmentData) => Promise<Appointment | null>;
  updateStatus: (id: string, status: AppointmentStatus) => Promise<boolean>;
}

export const useAppointmentStore = create<AppointmentState>((set) => ({
  appointments: [],
  currentAppointment: null,
  loading: false,

  fetchMyAppointments: async () => {
    set({ loading: true });
    const res = await apiClient.get<Appointment[]>('/appointments/me');
    if (res.success && res.data) {
      set({ appointments: res.data, loading: false });
      return true;
    }
    set({ loading: false });
    return false;
  },

  createAppointment: async (data: CreateAppointmentData) => {
    set({ loading: true });
    const res = await apiClient.post<Appointment>('/appointments', data);
    if (res.success && res.data) {
      set((state) => ({
        appointments: [res.data!, ...state.appointments],
        currentAppointment: res.data!,
        loading: false,
      }));
      return res.data;
    }
    set({ loading: false });
    return null;
  },

  updateStatus: async (id: string, status: AppointmentStatus) => {
    set({ loading: true });
    const res = await apiClient.patch<Appointment>(`/appointments/${id}/status`, { status });
    if (res.success && res.data) {
      set((state) => ({
        appointments: state.appointments.map((a) => a.id === id ? res.data! : a),
        currentAppointment: state.currentAppointment?.id === id ? res.data! : state.currentAppointment,
        loading: false,
      }));
      return true;
    }
    set({ loading: false });
    return false;
  },
}));
