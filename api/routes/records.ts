import { Router, type Request, type Response } from 'express';
import { db } from '../data/store.js';
import { authRequired, roleRequired } from '../middleware/auth.js';
import type {
  CounselorNote,
  Counselor,
  Client,
  User,
} from '../../shared/types.js';

const router = Router();

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

router.post('/', authRequired, roleRequired(['counselor']), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as Counselor;
    const { clientId, appointmentId, content, tags } = req.body as {
      clientId: string;
      appointmentId?: string;
      content: string;
      tags?: string[];
    };

    if (!clientId || !content) {
      res.status(400).json({ success: false, error: 'clientId and content are required' });
      return;
    }

    const client = db.getClientById(clientId);
    if (!client) {
      res.status(404).json({ success: false, error: 'Client not found' });
      return;
    }

    if (appointmentId) {
      const appointment = db.getAppointmentById(appointmentId);
      if (!appointment) {
        res.status(404).json({ success: false, error: 'Appointment not found' });
        return;
      }
      if (appointment.counselorId !== user.id) {
        res.status(403).json({ success: false, error: 'This appointment does not belong to you' });
        return;
      }
    }

    const id = generateId('n');
    const now = new Date().toISOString();
    const note: CounselorNote = {
      id,
      counselorId: user.id,
      clientId,
      clientName: client.name,
      appointmentId,
      content,
      tags: tags || [],
      createdAt: now,
      updatedAt: now,
    };

    const created = db.addCounselorNote(note);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.get('/client/:clientId', authRequired, roleRequired(['counselor']), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as Counselor;
    const { clientId } = req.params;

    const notes = db.listCounselorNotes({
      counselorId: user.id,
      clientId,
    });

    res.status(200).json({ success: true, data: notes });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.get('/appointment/:appointmentId', authRequired, roleRequired(['counselor']), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as Counselor;
    const { appointmentId } = req.params;

    const appointment = db.getAppointmentById(appointmentId);
    if (!appointment) {
      res.status(404).json({ success: false, error: 'Appointment not found' });
      return;
    }

    if (appointment.counselorId !== user.id) {
      res.status(403).json({ success: false, error: 'You do not have access to this appointment' });
      return;
    }

    let notes = db.listCounselorNotes();
    notes = notes.filter((n) => n.appointmentId === appointmentId);
    notes = notes.filter((n) => n.counselorId === user.id);

    res.status(200).json({ success: true, data: notes });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.put('/:id', authRequired, roleRequired(['counselor']), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as Counselor;
    const { id } = req.params;
    const { content, tags } = req.body as {
      content?: string;
      tags?: string[];
    };

    const existing = db.getCounselorNoteById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Note not found' });
      return;
    }

    if (existing.counselorId !== user.id) {
      res.status(403).json({ success: false, error: 'This note does not belong to you' });
      return;
    }

    const updates: Partial<CounselorNote> = {};
    if (content !== undefined) updates.content = content;
    if (tags !== undefined) updates.tags = tags;
    updates.updatedAt = new Date().toISOString();

    const updated = db.updateCounselorNote(id, updates);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Note not found' });
      return;
    }

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
