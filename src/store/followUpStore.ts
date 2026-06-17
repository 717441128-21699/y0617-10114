import { create } from 'zustand';
import type { FollowUpTask, FollowUpStatus, FollowUpSource } from '../../shared/types';
import { apiClient } from '../lib/api';

interface CreateTaskData {
  clientId: string;
  appointmentId?: string;
  title: string;
  description?: string;
  dueDate?: string;
  source?: FollowUpSource;
}

interface FollowUpState {
  tasks: FollowUpTask[];
  loading: boolean;
  fetchMyFollowUps: (status?: FollowUpStatus) => Promise<boolean>;
  fetchByClient: (clientId: string, status?: FollowUpStatus) => Promise<boolean>;
  createTask: (data: CreateTaskData) => Promise<FollowUpTask | null>;
  updateTask: (id: string, updates: Partial<FollowUpTask>) => Promise<FollowUpTask | null>;
  completeTask: (id: string) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
}

export const useFollowUpStore = create<FollowUpState>((set, get) => ({
  tasks: [],
  loading: false,

  fetchMyFollowUps: async (status) => {
    set({ loading: true });
    const query = status ? `?status=${status}` : '';
    const res = await apiClient.get<FollowUpTask[]>(`/follow-ups/mine${query}`);
    if (res.success && res.data) {
      const sorted = [...res.data].sort((a, b) => {
        if (a.status === b.status) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return a.status === 'pending' ? -1 : 1;
      });
      set({ tasks: sorted, loading: false });
      return true;
    }
    set({ loading: false });
    return false;
  },

  fetchByClient: async (clientId, status) => {
    set({ loading: true });
    const query = status ? `?status=${status}` : '';
    const res = await apiClient.get<FollowUpTask[]>(`/follow-ups/by-client/${clientId}${query}`);
    if (res.success && res.data) {
      const sorted = [...res.data].sort((a, b) => {
        if (a.status === b.status) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return a.status === 'pending' ? -1 : 1;
      });
      set({ tasks: sorted, loading: false });
      return true;
    }
    set({ loading: false });
    return false;
  },

  createTask: async (data) => {
    set({ loading: true });
    const res = await apiClient.post<FollowUpTask>('/follow-ups', data);
    if (res.success && res.data) {
      const { tasks } = get();
      const updated = [res.data, ...tasks].sort((a, b) => {
        if (a.status === b.status) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return a.status === 'pending' ? -1 : 1;
      });
      set({ tasks: updated, loading: false });
      return res.data;
    }
    set({ loading: false });
    return null;
  },

  updateTask: async (id, updates) => {
    set({ loading: true });
    const res = await apiClient.put<FollowUpTask>(`/follow-ups/${id}`, updates);
    if (res.success && res.data) {
      const { tasks } = get();
      const updated = tasks.map((t) => t.id === id ? res.data! : t).sort((a, b) => {
        if (a.status === b.status) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return a.status === 'pending' ? -1 : 1;
      });
      set({ tasks: updated, loading: false });
      return res.data;
    }
    set({ loading: false });
    return null;
  },

  completeTask: async (id) => {
    set({ loading: true });
    const res = await apiClient.put<FollowUpTask>(`/follow-ups/${id}/complete`);
    if (res.success) {
      const { tasks } = get();
      const updated = tasks.map((t) =>
        t.id === id ? { ...t, status: 'completed' as const } : t
      ).sort((a, b) => {
        if (a.status === b.status) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return a.status === 'pending' ? -1 : 1;
      });
      set({ tasks: updated, loading: false });
      return true;
    }
    set({ loading: false });
    return false;
  },

  deleteTask: async (id) => {
    set({ loading: true });
    const res = await apiClient.delete(`/follow-ups/${id}`);
    if (res.success) {
      const { tasks } = get();
      const updated = tasks.filter((t) => t.id !== id);
      set({ tasks: updated, loading: false });
      return true;
    }
    set({ loading: false });
    return false;
  },
}));
