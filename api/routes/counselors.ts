import { Router, type Request, type Response } from 'express';
import { db } from '../data/store.js';
import { authRequired, roleRequired } from '../middleware/auth.js';
import { normalizeWeeklySchedule, normalizeCounselorSchedule } from '../data/utils.js';
import type {
  Counselor,
  Specialty,
  ServiceMode,
  WeeklySchedule,
  Appointment,
  User,
  ScheduleException,
  ScheduleExceptionType,
  TimeSlot,
} from '../../shared/types.js';

const router = Router();

function omitPasswordHashFromCounselor(c: Counselor): Omit<Counselor, 'passwordHash'> {
  const { passwordHash, ...rest } = c;
  return normalizeCounselorSchedule(rest);
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
    const rawSchedule = (req.body.schedule ?? req.body) as WeeklySchedule;
    if (!rawSchedule) {
      res.status(400).json({ success: false, error: 'schedule is required' });
      return;
    }
    const schedule = normalizeWeeklySchedule(rawSchedule);
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

// ============ 咨询师管理：我的例外列表 ============
router.get('/me/exceptions', authRequired, roleRequired(['counselor']), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as Counselor;
    const { startDate, endDate } = req.query;

    const exceptions = db.listScheduleExceptions(
      user.id,
      startDate ? String(startDate) : undefined,
      endDate ? String(endDate) : undefined,
    );
    res.status(200).json({ success: true, data: exceptions });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

// ============ 咨询师管理：新增例外 ============
router.post('/me/exceptions', authRequired, roleRequired(['counselor']), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as Counselor;
    const { date, type, timeSlots, note } = req.body as {
      date: string;
      type: ScheduleExceptionType;
      timeSlots?: TimeSlot[];
      note?: string;
    };

    if (!date || !type) {
      res.status(400).json({ success: false, error: 'date and type are required' });
      return;
    }

    if (type !== 'off' && type !== 'extra') {
      res.status(400).json({ success: false, error: 'type must be off or extra' });
      return;
    }

    const id = `se-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const exception: ScheduleException = {
      id,
      counselorId: user.id,
      date,
      type,
      timeSlots: type === 'extra' ? timeSlots : undefined,
      note,
      createdAt: new Date().toISOString(),
    };

    const created = db.addScheduleException(exception);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

// ============ 咨询师管理：更新例外 ============
router.put('/me/exceptions/:id', authRequired, roleRequired(['counselor']), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as Counselor;
    const { id } = req.params;
    const updates = req.body as Partial<ScheduleException>;

    const existing = db.listScheduleExceptions(user.id).find((e) => e.id === id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Schedule exception not found' });
      return;
    }

    const updated = db.updateScheduleException(id, updates);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Schedule exception not found' });
      return;
    }
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

// ============ 咨询师管理：删除例外 ============
router.delete('/me/exceptions/:id', authRequired, roleRequired(['counselor']), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as Counselor;
    const { id } = req.params;

    const existing = db.listScheduleExceptions(user.id).find((e) => e.id === id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Schedule exception not found' });
      return;
    }

    const deleted = db.deleteScheduleException(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Schedule exception not found' });
      return;
    }
    res.status(200).json({ success: true, message: '删除成功' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

// ============ 公开：例外日期 ============
router.get('/:id/exceptions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const counselor = db.getCounselorById(id);
    if (!counselor) {
      res.status(404).json({ success: false, error: 'Counselor not found' });
      return;
    }

    const exceptions = db.listScheduleExceptions(
      id,
      startDate ? String(startDate) : undefined,
      endDate ? String(endDate) : undefined,
    );
    res.status(200).json({ success: true, data: exceptions });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

// ============ 公开：某天可用时段 ============
router.get('/:id/available-slots', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      res.status(400).json({ success: false, error: 'date is required' });
      return;
    }

    const counselor = db.getCounselorById(id);
    if (!counselor) {
      res.status(404).json({ success: false, error: 'Counselor not found' });
      return;
    }

    const slots = db.getAvailableSlotsForDate(id, String(date));
    res.status(200).json({ success: true, data: slots });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
