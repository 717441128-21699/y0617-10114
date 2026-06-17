import { Router, type Request, type Response } from 'express';
import { db } from '../data/store.js';
import { authRequired, roleRequired } from '../middleware/auth.js';
import type {
  Counselor,
  Specialty,
  ServiceMode,
  WeeklySchedule,
  Appointment,
  User,
} from '../../shared/types.js';

const router = Router();

function omitPasswordHashFromCounselor(c: Counselor): Omit<Counselor, 'passwordHash'> {
  const { passwordHash, ...rest } = c;
  return rest;
}

function getWeekdayName(date: Date): keyof WeeklySchedule {
  const days: (keyof WeeklySchedule)[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return days[date.getDay()];
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { specialties, serviceModes, minPrice, maxPrice, search } = req.query;

    let counselors = db.listCounselors();

    if (specialties && typeof specialties === 'string') {
      const specialtyList = specialties.split(',').filter(Boolean) as Specialty[];
      if (specialtyList.length > 0) {
        counselors = counselors.filter((c) =>
          c.specialties.some((s) => specialtyList.includes(s)),
        );
      }
    }

    if (serviceModes && typeof serviceModes === 'string') {
      const modeList = serviceModes.split(',').filter(Boolean) as ServiceMode[];
      if (modeList.length > 0) {
        counselors = counselors.filter((c) =>
          c.serviceModes.some((m) => modeList.includes(m)),
        );
      }
    }

    if (minPrice !== undefined) {
      const min = Number(minPrice);
      if (!Number.isNaN(min)) {
        counselors = counselors.filter((c) => c.pricePerSession >= min);
      }
    }

    if (maxPrice !== undefined) {
      const max = Number(maxPrice);
      if (!Number.isNaN(max)) {
        counselors = counselors.filter((c) => c.pricePerSession <= max);
      }
    }

    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      counselors = counselors.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.introduction.toLowerCase().includes(searchLower) ||
          c.education.toLowerCase().includes(searchLower),
      );
    }

    const result = counselors.map(omitPasswordHashFromCounselor);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.get('/me/profile', authRequired, roleRequired(['counselor']), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as Counselor;
    const counselor = db.getCounselorById(user.id);
    if (!counselor) {
      res.status(404).json({ success: false, error: 'Counselor not found' });
      return;
    }
    res.status(200).json({ success: true, data: omitPasswordHashFromCounselor(counselor) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.put('/me/profile', authRequired, roleRequired(['counselor']), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as Counselor;
    const {
      specialties,
      serviceModes,
      introduction,
      education,
      sessionDuration,
      pricePerSession,
    } = req.body;

    const updates: Partial<Counselor> = {};
    if (specialties !== undefined) updates.specialties = specialties as Specialty[];
    if (serviceModes !== undefined) updates.serviceModes = serviceModes as ServiceMode[];
    if (introduction !== undefined) updates.introduction = introduction;
    if (education !== undefined) updates.education = education;
    if (sessionDuration !== undefined) updates.sessionDuration = Number(sessionDuration);
    if (pricePerSession !== undefined) updates.pricePerSession = Number(pricePerSession);

    const updated = db.updateCounselor(user.id, updates);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Counselor not found' });
      return;
    }
    res.status(200).json({ success: true, data: omitPasswordHashFromCounselor(updated), message: '保存成功' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.put('/me/schedule', authRequired, roleRequired(['counselor']), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as Counselor;
    const schedule = (req.body.schedule ?? req.body) as WeeklySchedule;
    if (!schedule) {
      res.status(400).json({ success: false, error: 'schedule is required' });
      return;
    }
    const updated = db.updateCounselor(user.id, { schedule });
    if (!updated) {
      res.status(404).json({ success: false, error: 'Counselor not found' });
      return;
    }
    res.status(200).json({ success: true, data: updated.schedule, message: '保存成功' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const counselor = db.getCounselorById(id);
    if (!counselor) {
      res.status(404).json({ success: false, error: 'Counselor not found' });
      return;
    }
    res.status(200).json({ success: true, data: omitPasswordHashFromCounselor(counselor) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.get('/:id/schedule', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const counselor = db.getCounselorById(id);
    if (!counselor) {
      res.status(404).json({ success: false, error: 'Counselor not found' });
      return;
    }

    const today = new Date();
    const next7Days: {
      date: string;
      weekday: keyof WeeklySchedule;
      slots: { start: string; end: string; available: boolean }[];
    }[] = [];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      const dateStr = formatDate(currentDate);
      const weekday = getWeekdayName(currentDate);
      const daySchedule = counselor.schedule[weekday] || [];

      const appointments = db.listAppointments({ counselorId: id });
      const appointmentsForDate = appointments.filter(
        (a: Appointment) =>
          a.date === dateStr &&
          (a.status === 'pending' || a.status === 'confirmed' || a.status === 'in_progress'),
      );

      const slotsWithAvailability = daySchedule.map((slot) => {
        const isBooked = appointmentsForDate.some(
          (a: Appointment) =>
            a.timeSlot.startsWith(slot.start) ||
            a.timeSlot === `${slot.start}-${slot.end}`,
        );
        return {
          start: slot.start,
          end: slot.end,
          available: slot.available && !isBooked,
        };
      });

      next7Days.push({
        date: dateStr,
        weekday,
        slots: slotsWithAvailability,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        schedule: counselor.schedule,
        next7Days,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
