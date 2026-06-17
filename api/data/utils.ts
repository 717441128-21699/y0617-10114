import type { WeeklySchedule, TimeSlot } from '../../shared/types.js';

export const DEFAULT_TIME_SLOTS: Array<{ start: string; end: string }> = [
  { start: '09:00', end: '09:50' },
  { start: '10:00', end: '10:50' },
  { start: '11:00', end: '11:50' },
  { start: '14:00', end: '14:50' },
  { start: '15:00', end: '15:50' },
  { start: '16:00', end: '16:50' },
];

export const WEEKDAY_KEYS: Array<keyof WeeklySchedule> = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export function normalizeWeeklySchedule(schedule: Partial<WeeklySchedule> | undefined | null): WeeklySchedule {
  const result: WeeklySchedule = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  };

  for (const day of WEEKDAY_KEYS) {
    const existingSlots: TimeSlot[] = schedule?.[day] ?? [];
    const slotMap = new Map<string, boolean>();

    for (const slot of existingSlots) {
      if (slot && typeof slot.start === 'string') {
        slotMap.set(slot.start, slot.available === true);
      }
    }

    result[day] = DEFAULT_TIME_SLOTS.map((defaultSlot) => ({
      start: defaultSlot.start,
      end: defaultSlot.end,
      available: slotMap.get(defaultSlot.start) ?? false,
    }));
  }

  return result;
}

export function normalizeCounselorSchedule<T extends { schedule: WeeklySchedule }>(counselor: T): T {
  return {
    ...counselor,
    schedule: normalizeWeeklySchedule(counselor.schedule),
  };
}
