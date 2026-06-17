import { Router, type Request, type Response } from 'express';
import { db } from '../data/store.js';
import { authRequired } from '../middleware/auth.js';
import { checkCrisisLevel } from '../data/crisisKeywords.js';
import type {
  ChatMessage,
  User,
  Appointment,
} from '../../shared/types.js';

const router = Router();

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

router.get('/:appointmentId/messages', authRequired, async (req: Request, res: Response): Promise<void> => {
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

    const messages = db.listChatMessages(appointmentId);
    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.post('/:appointmentId/messages', authRequired, async (req: Request, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const { content } = req.body as { content: string };
    const user = req.user as User;

    if (!content || typeof content !== 'string') {
      res.status(400).json({ success: false, error: 'content is required and must be a string' });
      return;
    }

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

    const crisisResult = checkCrisisLevel(content);

    const id = generateId('m');
    const newMessage: ChatMessage = {
      id,
      appointmentId,
      senderId: user.id,
      senderRole: user.role,
      content,
      contentEncrypted: false,
      timestamp: new Date().toISOString(),
      crisisFlags: crisisResult.triggered ? crisisResult.matchedKeywords : undefined,
    };

    const created = db.addChatMessage(newMessage);

    if (crisisResult.triggered) {
      db.updateAppointment(appointmentId, { crisisTriggered: true });
    }

    res.status(201).json({
      success: true,
      data: {
        ...created,
        crisisDetected: crisisResult.triggered,
        crisisInfo: crisisResult.triggered ? {
          matchedKeywords: crisisResult.matchedKeywords,
          severity: crisisResult.severity,
        } : undefined,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
