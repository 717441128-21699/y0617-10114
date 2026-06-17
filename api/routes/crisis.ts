import { Router, type Request, type Response } from 'express';
import { db } from '../data/store.js';
import { authRequired } from '../middleware/auth.js';
import { checkCrisisLevel } from '../data/crisisKeywords.js';
import type { User, Appointment } from '../../shared/types.js';

const router = Router();

router.post('/check', async (req: Request, res: Response): Promise<void> => {
  try {
    const { content } = req.body as { content: string };
    if (!content || typeof content !== 'string') {
      res.status(400).json({ success: false, error: 'content is required and must be a string' });
      return;
    }
    const result = checkCrisisLevel(content);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.post('/intervene/:appointmentId', authRequired, async (req: Request, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const user = req.user as User;

    const appointment = db.getAppointmentById(appointmentId);
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

    const updated = db.updateAppointment(appointmentId, { crisisTriggered: true });
    if (!updated) {
      res.status(404).json({ success: false, error: 'Failed to update appointment' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        intervened: true,
        appointmentId: updated.id,
        crisisTriggered: true,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
