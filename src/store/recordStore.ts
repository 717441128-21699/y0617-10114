import { create } from 'zustand';
import type { CounselorNote } from '../../shared/types';
import { apiClient } from '../lib/api';

interface CreateNoteData {
  clientId: string;
  appointmentId?: string;
  content: string;
  tags?: string[];
}

interface RecordState {
  notes: CounselorNote[];
  loading: boolean;
  fetchNotesByClient: (clientId: string) => Promise<boolean>;
  createNote: (data: CreateNoteData) => Promise<CounselorNote | null>;
  updateNote: (id: string, content: string) => Promise<boolean>;
}

export const useRecordStore = create<RecordState>((set) => ({
  notes: [],
  loading: false,

  fetchNotesByClient: async (clientId: string) => {
    set({ loading: true });
    const res = await apiClient.get<CounselorNote[]>(`/notes/client/${clientId}`);
    if (res.success && res.data) {
      set({ notes: res.data, loading: false });
      return true;
    }
    set({ loading: false });
    return false;
  },

  createNote: async (data: CreateNoteData) => {
    set({ loading: true });
    const res = await apiClient.post<CounselorNote>('/notes', data);
    if (res.success && res.data) {
      set((state) => ({
        notes: [res.data!, ...state.notes],
        loading: false,
      }));
      return res.data;
    }
    set({ loading: false });
    return null;
  },

  updateNote: async (id: string, content: string) => {
    set({ loading: true });
    const res = await apiClient.put<CounselorNote>(`/notes/${id}`, { content });
    if (res.success && res.data) {
      set((state) => ({
        notes: state.notes.map((n) => n.id === id ? res.data! : n),
        loading: false,
      }));
      return true;
    }
    set({ loading: false });
    return false;
  },
}));
