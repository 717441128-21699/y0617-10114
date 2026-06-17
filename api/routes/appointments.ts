import { Router, type Request, type Response } from 'express';
import { db } from '../data/store.js';
import { authRequired } from '../middleware/auth.js';
import type {
  Appointment,
  AppointmentStatus,
  AssessmentForm,
  Counselor,
  Client,
  User,
} from '../../shared/types.js';

const router = Router();

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function enrichAppointment(appt: Appointment): Appointment {
  const counselor = db.getCounselorById(appt.counselorId);
  const client = db.getClientById(appt.clientId);
  return {
    ...appt,
    counselorName: counselor?.name || appt.counselorName,
    clientName: client?.name || appt.clientName,
  };
}

router.post('/', authRequired, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as User;
    if (user.role !== 'client') {
      res.status(403).json({ success: false, error: 'Only clients can create appointments' });
      return;
    }

    const {
      counselorId,
      date,
      timeSlot,
      serviceMode,
      packageUsageId,
      assessmentForm,
    } = req.body;

    if (!counselorId || !date || !timeSlot || !serviceMode) {
      res.status(400).json({
        success: false,
        error: 'counselorId, date, timeSlot, serviceMode are required',
      });
      return;
    }

    const counselor = db.getCounselorById(counselorId);
    if (!counselor) {
      res.status(404).json({ success: false, error: 'Counselor not found' });
      return;
    }

    let price = counselor.pricePerSession;
    let usedPackageId: string | undefined;

    if (packageUsageId) {
      const purchase = db.getPackagePurchaseById(packageUsageId);
      if (!purchase) {
        res.status(404).json({ success: false, error: 'Package purchase not found' });
        return;
      }
      if (purchase.clientId !== user.id) {
        res.status(403).json({ success: false, error: 'This package does not belong to you' });
        return;
      }
      if (purchase.counselorId !== counselorId) {
        res.status(400).json({ success: false, error: 'This package is for a different counselor' });
        return;
      }
      if (purchase.remainingSessions <= 0) {
        res.status(400).json({ success: false, error: 'No remaining sessions in this package' });
        return;
      }
      const consumed = db.consumePackageSession(purchase.id);
      if (!consumed) {
        res.status(400).json({ success: false, error: 'Failed to consume package session' });
        return;
      }
      price = 0;
      usedPackageId = purchase.id;
    }

    const client = db.getClientById(user.id);
    const id = generateId('a');

    let appointmentAssessmentForm: AssessmentForm | undefined;
    if (assessmentForm) {
      appointmentAssessmentForm = {
        ...assessmentForm,
        anonymousId: client?.anonymousId || '',
        submittedAt: new Date().toISOString(),
      };
    }

    const appointment: Appointment = {
      id,
      counselorId,
      clientId: user.id,
      counselorName: counselor.name,
      clientName: client?.name,
      date,
      timeSlot,
      serviceMode,
      status: 'pending',
      price,
      packageUsageId: usedPackageId,
      assessmentForm: appointmentAssessmentForm,
      crisisTriggered: false,
      createdAt: new Date().toISOString(),
    };

    const created = db.addAppointment(appointment);
    res.status(201).json({ success: true, data: enrichAppointment(created) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.get('/mine', authRequired, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as User;
    let appointments: Appointment[];

    if (user.role === 'counselor') {
      appointments = db.listAppointments({ counselorId: user.id });
    } else {
      appointments = db.listAppointments({ clientId: user.id });
    }

    const enriched = appointments.map(enrichAppointment).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    res.status(200).json({ success: true, data: enriched });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.get('/:id', authRequired, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user as User;
    const appointment = db.getAppointmentById(id);

    if (!appointment) {
      res.status(404).json({ success: false, error: 'Appointment not found' });
      return;
    }

    if (
      appointment.counselorId !== user.id &&
      appointment.clientId !== user.id
    ) {
      res.status(403).json({ success: false, error: 'You do not have access to this appointment' });
      return;
    }

    res.status(200).json({ success: true, data: enrichAppointment(appointment) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.patch('/:id/status', authRequired, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status: AppointmentStatus };
    const user = req.user as User;

    if (!status) {
      res.status(400).json({ success: false, error: 'status is required' });
      return;
    }

    const validStatuses: AppointmentStatus[] = [
      'pending',
      'confirmed',
      'cancelled',
      'completed',
      'in_progress',
    ];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status' });
      return;
    }

    const appointment = db.getAppointmentById(id);
    if (!appointment) {
      res.status(404).json({ success: false, error: 'Appointment not found' });
      return;
    }

    if (
      appointment.counselorId !== user.id &&
      appointment.clientId !== user.id
    ) {
      res.status(403).json({ success: false, error: 'You do not have access to this appointment' });
      return;
    }

    const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['in_progress', 'cancelled', 'completed'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[appointment.status].includes(status)) {
      res.status(400).json({
        success: false,
        error: `Cannot transition from ${appointment.status} to ${status}`,
      });
      return;
    }

    if (user.role === 'client' && status === 'confirmed') {
      res.status(403).json({
        success: false,
        error: 'Only counselors can confirm appointments',
      });
      return;
    }

    const updated = db.updateAppointment(id, { status });
    if (!updated) {
      res.status(404).json({ success: false, error: 'Appointment not found' });
      return;
    }
    res.status(200).json({ success: true, data: enrichAppointment(updated) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.post('/:id/assessment', authRequired, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user as User;
    const form = req.body as Omit<AssessmentForm, 'submittedAt'>;

    if (user.role !== 'client') {
      res.status(403).json({ success: false, error: 'Only clients can submit assessment forms' });
      return;
    }

    const appointment = db.getAppointmentById(id);
    if (!appointment) {
      res.status(404).json({ success: false, error: 'Appointment not found' });
      return;
    }

    if (appointment.clientId !== user.id) {
      res.status(403).json({ success: false, error: 'This appointment does not belong to you' });
      return;
    }

    if (appointment.assessmentForm) {
      res.status(400).json({ success: false, error: 'Assessment form already submitted' });
      return;
    }

    const client = db.getClientById(user.id);
    const assessmentForm: AssessmentForm = {
      ...form,
      anonymousId: client?.anonymousId || '',
      submittedAt: new Date().toISOString(),
    };

    const updated = db.updateAppointment(id, { assessmentForm });
    if (!updated) {
      res.status(404).json({ success: false, error: 'Appointment not found' });
      return;
    }
    res.status(200).json({ success: true, data: enrichAppointment(updated) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
