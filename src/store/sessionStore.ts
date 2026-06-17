import { create } from 'zustand';
import type { ChatMessage } from '../../shared/types';
import { apiClient } from '../lib/api';
import { getCurrentUser } from '../lib/auth';

interface SessionState {
  messages: ChatMessage[];
  crisisActive: boolean;
  matchedKeywords: string[];
  _pollTimer: ReturnType<typeof setInterval> | null;
  fetchMessages: (apptId: string) => Promise<boolean>;
  sendMessage: (apptId: string, content: string) => Promise<boolean>;
  pollMessages: (apptId: string, interval?: number) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  messages: [],
  crisisActive: false,
  matchedKeywords: [],
  _pollTimer: null,

  fetchMessages: async (apptId: string) => {
    const res = await apiClient.get<ChatMessage[]>(`/sessions/${apptId}/messages`);
    if (res.success && res.data) {
      const keywords = new Set<string>();
      let crisis = false;
      for (const msg of res.data) {
        if (msg.crisisFlags?.length) {
          crisis = true;
          msg.crisisFlags.forEach((k) => keywords.add(k));
        }
      }
      set({
        messages: res.data,
        crisisActive: crisis,
        matchedKeywords: Array.from(keywords),
      });
      return true;
    }
    return false;
  },

  sendMessage: async (apptId: string, content: string) => {
    const currentUser = getCurrentUser();
    const tempId = `temp-${Date.now()}`;

    const optimisticMsg: ChatMessage = {
      id: tempId,
      appointmentId: apptId,
      senderId: currentUser?.id || '',
      senderRole: currentUser?.role || 'client',
      content,
      contentEncrypted: false,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, optimisticMsg],
    }));

    const res = await apiClient.post<ChatMessage & { crisisDetected?: boolean; crisisInfo?: string }>(
      `/sessions/${apptId}/messages`,
      { content }
    );

    if (res.success && res.data) {
      const msg = res.data;
      set((state) => {
        const newKeywords = new Set(state.matchedKeywords);
        let crisis = state.crisisActive;
        if (msg.crisisFlags?.length) {
          crisis = true;
          msg.crisisFlags.forEach((k) => newKeywords.add(k));
        }
        if (msg.crisisDetected) {
          crisis = true;
        }
        return {
          messages: state.messages.map((m) => (m.id === tempId ? msg : m)),
          crisisActive: crisis,
          matchedKeywords: Array.from(newKeywords),
        };
      });
      return true;
    }

    set((state) => ({
      messages: state.messages.filter((m) => m.id !== tempId),
    }));
    return false;
  },

  pollMessages: (apptId: string, interval = 2000) => {
    const current = get()._pollTimer;
    if (current) clearInterval(current);

    const timer = setInterval(async () => {
      const res = await apiClient.get<ChatMessage[]>(`/sessions/${apptId}/messages`);
      if (res.success && res.data) {
        const incoming = res.data;
        const state = get();
        const existingIds = new Set(state.messages.map((m) => m.id));
        const newMsgs = incoming.filter((m) => !existingIds.has(m.id));

        if (newMsgs.length > 0) {
          const keywords = new Set(state.matchedKeywords);
          let crisis = state.crisisActive;
          for (const msg of newMsgs) {
            if (msg.crisisFlags?.length) {
              crisis = true;
              msg.crisisFlags.forEach((k) => keywords.add(k));
            }
          }
          set({
            messages: [...state.messages, ...newMsgs],
            crisisActive: crisis,
            matchedKeywords: Array.from(keywords),
          });
        }
      }
    }, interval);

    set({ _pollTimer: timer });
  },

  clearSession: () => {
    const timer = get()._pollTimer;
    if (timer) clearInterval(timer);
    set({
      messages: [],
      crisisActive: false,
      matchedKeywords: [],
      _pollTimer: null,
    });
  },
}));
