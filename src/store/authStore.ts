import { create } from 'zustand';
import type { User, AuthResult } from '../../shared/types';
import { apiClient } from '../lib/api';
import { getToken, setToken, setCurrentUser, getCurrentUser, clearAuth } from '../lib/auth';

interface RegisterClientData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

interface RegisterCounselorData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  licenseNo: string;
  specialties: string[];
  serviceModes: string[];
  introduction: string;
  education: string;
  experienceYears: number;
  sessionDuration: number;
  pricePerSession: number;
}

interface AuthState {
  user: Omit<User, 'passwordHash'> | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  registerClient: (data: RegisterClientData) => Promise<boolean>;
  registerCounselor: (data: RegisterCounselorData) => Promise<boolean>;
  logout: () => void;
  init: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    const res = await apiClient.post<AuthResult>('/auth/login', { email, password });
    if (res.success && res.data) {
      const { token, user } = res.data;
      setToken(token);
      setCurrentUser(user);
      set({ user, token, loading: false });
      return true;
    }
    set({ loading: false, error: res.error || '登录失败' });
    return false;
  },

  registerClient: async (data: RegisterClientData) => {
    set({ loading: true, error: null });
    const res = await apiClient.post<AuthResult>('/auth/register/client', data);
    if (res.success && res.data) {
      const { token, user } = res.data;
      setToken(token);
      setCurrentUser(user);
      set({ user, token, loading: false });
      return true;
    }
    set({ loading: false, error: res.error || '注册失败' });
    return false;
  },

  registerCounselor: async (data: RegisterCounselorData) => {
    set({ loading: true, error: null });
    const res = await apiClient.post<AuthResult>('/auth/register/counselor', data);
    if (res.success && res.data) {
      const { token, user } = res.data;
      setToken(token);
      setCurrentUser(user);
      set({ user, token, loading: false });
      return true;
    }
    set({ loading: false, error: res.error || '注册失败' });
    return false;
  },

  logout: () => {
    clearAuth();
    set({ user: null, token: null, error: null });
  },

  init: () => {
    const token = getToken();
    const user = getCurrentUser();
    if (token && user) {
      set({ token, user });
    }
  },
}));

export { useAuthStore };
export const authStore = useAuthStore;
