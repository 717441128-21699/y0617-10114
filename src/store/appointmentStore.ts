import { create } from 'zustand';
import type { Appointment, AppointmentStatus, AssessmentForm, RescheduleRequest } from '../../shared/types';
import { apiClient } from '../lib/api';

interface CreateAppointmentData {
  counselorId: string;
  date: string;
  timeSlot: string;
  serviceMode: string;
  price: number;
  packageUsageId?: string;
  assessmentForm?: Partial<AssessmentForm>;
}

interface CheckConflictResult {
  conflict: boolean;
}

interface RescheduleData {
  newDate: string;
  newTimeSlot: string;
  reason?: string;
}

interface AppointmentState {
  appointments: Appointment[];
  currentAppointment: Appointment | null;
  loading: boolean;
  rescheduleRequests: RescheduleRequest[];
  rescheduleLoading: boolean;
  fetchMyAppointments: () => Promise<boolean>;
  createAppointment: (data: CreateAppointmentData) => Promise<Appointment | null>;
  updateStatus: (id: string, status: AppointmentStatus) => Promise<boolean>;
  checkConflict: (counselorId: string, date: string, timeSlot: string) => Promise<boolean>;
  requestReschedule: (appointmentId: string, data: RescheduleData) => Promise<RescheduleRequest | null>;
  fetchRescheduleRequests: (appointmentId: string) => Promise<boolean>;
  approveReschedule: (appointmentId: string, requestId: string) => Promise<boolean>;
  rejectReschedule: (appointmentId: string, requestId: string) => Promise<boolean>;
}

export const useAppointmentStore = create<AppointmentState>((set) => ({
  appointments: [],
  currentAppointment: null,
  loading: false,
  rescheduleRequests: [],
  rescheduleLoading: false,

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

  checkConflict: async (counselorId: string, date: string, timeSlot: string) => {
    const res = await apiClient.get<CheckConflictResult>(
      `/appointments/check-conflict?counselorId=${encodeURIComponent(counselorId)}&date=${encodeURIComponent(date)}&timeSlot=${encodeURIComponent(timeSlot)}`
    );
    if (res.success && res.data) {
      return res.data.conflict;
    }
    return false;
  },

  requestReschedule: async (appointmentId, data) => {
    set({ rescheduleLoading: true });
    const res = await apiClient.post<RescheduleRequest>(`/appointments/${appointmentId}/reschedule`, data);
    if (res.success && res.data) {
      set((state) => ({
        rescheduleRequests: [...state.rescheduleRequests, res.data!],
        rescheduleLoading: false,
      }));
      return res.data;
    }
    set({ rescheduleLoading: false });
    return null;
  },

  fetchRescheduleRequests: async (appointmentId) => {
    set({ rescheduleLoading: true });
    const res = await apiClient.get<RescheduleRequest[]>(`/appointments/${appointmentId}/reschedule`);
    if (res.success && res.data) {
      set({ rescheduleRequests: res.data, rescheduleLoading: false });
      return true;
    }
    set({ rescheduleLoading: false });
    return false;
  },

  approveReschedule: async (appointmentId, requestId) => {
    set({ rescheduleLoading: true });
    const res = await apiClient.put(`/appointments/${appointmentId}/reschedule/${requestId}/approve`);
    if (res.success) {
      set((state) => ({
        rescheduleRequests: state.rescheduleRequests.map((r) =>
          r.id === requestId ? { ...r, status: 'approved' as const } : r
        ),
        rescheduleLoading: false,
      }));
      return true;
    }
    set({ rescheduleLoading: false });
    return false;
  },

  rejectReschedule: async (appointmentId, requestId) => {
    set({ rescheduleLoading: true });
    const res = await apiClient.put(`/appointments/${appointmentId}/reschedule/${requestId}/reject`);
    if (res.success) {
      set((state) => ({
        rescheduleRequests: state.rescheduleRequests.map((r) =>
          r.id === requestId ? { ...r, status: 'rejected' as const } : r
        ),
        rescheduleLoading: false,
      }));
      return true;
    }
    set({ rescheduleLoading: false });
    return false;
  },
}));
