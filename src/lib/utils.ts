import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { WeeklySchedule, TimeSlot } from '@shared/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const DAY_KEYS: (keyof WeeklySchedule)[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

const DEFAULT_TIME_SLOTS: Omit<TimeSlot, 'available'>[] = [
  { start: '09:00', end: '09:50' },
  { start: '10:00', end: '10:50' },
  { start: '11:00', end: '11:50' },
  { start: '14:00', end: '14:50' },
  { start: '15:00', end: '15:50' },
  { start: '16:00', end: '16:50' },
];

export function normalizeWeeklySchedule(schedule?: Partial<WeeklySchedule> | null): WeeklySchedule {
  const result = {} as WeeklySchedule;
  for (const day of DAY_KEYS) {
    const existingSlots = schedule?.[day] || [];
    const existingMap = new Map<string, TimeSlot>();
    for (const slot of existingSlots) {
      if (slot && slot.start) {
        existingMap.set(slot.start, slot);
      }
    }
    result[day] = DEFAULT_TIME_SLOTS.map((defaultSlot) => {
      const existing = existingMap.get(defaultSlot.start);
      return {
        ...defaultSlot,
        available: existing?.available ?? false,
      };
    });
  }
  return result;
}
