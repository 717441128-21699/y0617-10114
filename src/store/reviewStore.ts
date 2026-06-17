import { create } from 'zustand';
import type { ReviewStats, Review } from '../../shared/types';
import { apiClient } from '../lib/api';

interface ReviewState {
  stats: ReviewStats | null;
  loading: boolean;
  fetchReviewStats: (counselorId: string) => Promise<boolean>;
  submitReview: (apptId: string, rating: number) => Promise<Review | null>;
}

export const useReviewStore = create<ReviewState>((set) => ({
  stats: null,
  loading: false,

  fetchReviewStats: async (counselorId: string) => {
    set({ loading: true });
    const res = await apiClient.get<ReviewStats>(`/reviews/counselor/${counselorId}/stats`);
    if (res.success && res.data) {
      set({ stats: res.data, loading: false });
      return true;
    }
    set({ loading: false });
    return false;
  },

  submitReview: async (apptId: string, rating: number) => {
    set({ loading: true });
    const res = await apiClient.post<Review>('/reviews', { appointmentId: apptId, rating });
    if (res.success && res.data) {
      set({ loading: false });
      return res.data;
    }
    set({ loading: false });
    return null;
  },
}));
