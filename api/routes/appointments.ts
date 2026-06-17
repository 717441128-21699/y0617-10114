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
  RescheduleRequest,
  RescheduleStatus,
} from '../../shared/types.js';

const router = Router();

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

router.get('/check-conflict', async (req: Request, res: Response): Promise<void> => {
  try {
    const { counselorId, date, timeSlot } = req.query;

    if (!counselorId || !date || !timeSlot) {
      res.status(400).json({
        success: false,
        error: 'counselorId, date, timeSlot are required',
      });
      return;
    }

    const appointments = db.listAppointments({ counselorId: String(counselorId) });
    const conflictingAppointment = appointments.find(
      (a) =>
        a.date === String(date) &&
        a.timeSlot === String(timeSlot) &&
        a.status !== 'cancelled',
    );

    if (conflictingAppointment) {
      res.status(200).json({
        success: true,
        data: {
          conflict: true,
          message: '该时段已被预约',
          conflictingAppointmentId: conflictingAppointment.id,
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        conflict: false,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

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

    const availableSlots = db.getAvailableSlotsForDate(counselorId, date);
    const slotAvailable = availableSlots.some(
      (s) => `${s.start}-${s.end}` === timeSlot && s.available,
    );
    if (!slotAvailable) {
      res.status(400).json({
        success: false,
        error: '该时段不在咨询师的可用时段内，请重新选择',
      });
      return;
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
    if (!created) {
      res.status(409).json({
        success: false,
        message: '该时段刚刚被其他来访者预约，请重新选择时段',
      });
      return;
    }
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
      confirmed: ['in_progress', 'cancelled', 'completed', 'rescheduled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
      rescheduled: [],
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

// ============ 咨询师：待处理改期申请 ============
router.get('/mine/reschedule/pending', authRequired, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as User;
    if (user.role !== 'counselor') {
      res.status(403).json({ success: false, error: 'Only counselors can view pending reschedule requests' });
      return;
    }

    const requests = db.getRescheduleRequestsForCounselor(user.id).filter(
      (r) => r.status === 'pending',
    );
    const enriched = requests.map((r) => {
      const appt = db.getAppointmentById(r.appointmentId);
      return {
        ...r,
        appointment: appt ? enrichAppointment(appt) : undefined,
      };
    });
    res.status(200).json({ success: true, data: enriched });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

// ============ 发起改期申请 ============
router.post('/:id/reschedule', authRequired, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user as User;
    const { newDate, newTimeSlot, reason } = req.body as {
      newDate: string;
      newTimeSlot: string;
      reason?: string;
    };

    if (user.role !== 'client') {
      res.status(403).json({ success: false, error: 'Only clients can request reschedule' });
      return;
    }

    if (!newDate || !newTimeSlot) {
      res.status(400).json({ success: false, error: 'newDate and newTimeSlot are required' });
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

    if (appointment.status === 'cancelled' || appointment.status === 'completed' || appointment.status === 'rescheduled') {
      res.status(400).json({ success: false, error: 'Cannot reschedule this appointment' });
      return;
    }

    const availableSlots = db.getAvailableSlotsForDate(appointment.counselorId, newDate);
    const slotAvailable = availableSlots.some(
      (s) => `${s.start}-${s.end}` === newTimeSlot && s.available,
    );
    if (!slotAvailable) {
      res.status(400).json({
        success: false,
        error: '新时段不在咨询师的可用时段内，请重新选择',
      });
      return;
    }

    const requestId = generateId('rr');
    const request: RescheduleRequest = {
      id: requestId,
      appointmentId: id,
      requesterId: user.id,
      requesterRole: user.role,
      newDate,
      newTimeSlot,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const created = db.createRescheduleRequest(request);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

// ============ 获取某预约的改期记录 ============
router.get('/:id/reschedule', authRequired, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user as User;

    const appointment = db.getAppointmentById(id);
    if (!appointment) {
      res.status(404).json({ success: false, error: 'Appointment not found' });
      return;
    }

    if (appointment.counselorId !== user.id && appointment.clientId !== user.id) {
      res.status(403).json({ success: false, error: 'You do not have access to this appointment' });
      return;
    }

    const requests = db.getRescheduleRequestsForAppointment(id);
    res.status(200).json({ success: true, data: requests });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

// ============ 咨询师同意改期 ============
router.put('/:id/reschedule/:requestId/approve', authRequired, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, requestId } = req.params;
    const user = req.user as User;

    if (user.role !== 'counselor') {
      res.status(403).json({ success: false, error: 'Only counselors can approve reschedule requests' });
      return;
    }

    const appointment = db.getAppointmentById(id);
    if (!appointment) {
      res.status(404).json({ success: false, error: 'Appointment not found' });
      return;
    }

    if (appointment.counselorId !== user.id) {
      res.status(403).json({ success: false, error: 'This appointment does not belong to you' });
      return;
    }

    const request = db.getRescheduleRequestsForAppointment(id).find((r) => r.id === requestId);
    if (!request) {
      res.status(404).json({ success: false, error: 'Reschedule request not found' });
      return;
    }

    if (request.status !== 'pending') {
      res.status(400).json({ success: false, error: 'This request has already been processed' });
      return;
    }

    const result = db.approveReschedule(requestId);
    if (!result) {
      res.status(409).json({
        success: false,
        error: '新时段已被预约，改期失败',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        oldAppointment: enrichAppointment(result.oldAppointment),
        newAppointment: enrichAppointment(result.newAppointment),
        request: result.request,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

// ============ 咨询师拒绝改期 ============
router.put('/:id/reschedule/:requestId/reject', authRequired, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, requestId } = req.params;
    const user = req.user as User;
    const { responseNote } = req.body as { responseNote?: string };

    if (user.role !== 'counselor') {
      res.status(403).json({ success: false, error: 'Only counselors can reject reschedule requests' });
      return;
    }

    const appointment = db.getAppointmentById(id);
    if (!appointment) {
      res.status(404).json({ success: false, error: 'Appointment not found' });
      return;
    }

    if (appointment.counselorId !== user.id) {
      res.status(403).json({ success: false, error: 'This appointment does not belong to you' });
      return;
    }

    const request = db.getRescheduleRequestsForAppointment(id).find((r) => r.id === requestId);
    if (!request) {
      res.status(404).json({ success: false, error: 'Reschedule request not found' });
      return;
    }

    if (request.status !== 'pending') {
      res.status(400).json({ success: false, error: 'This request has already been processed' });
      return;
    }

    const updated = db.updateRescheduleRequest(requestId, {
      status: 'rejected',
      decidedAt: new Date().toISOString(),
      decidedById: user.id,
      responseNote,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
