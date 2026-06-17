import { Router, type Request, type Response } from 'express';
import { db } from '../data/store.js';
import { authRequired, roleRequired } from '../middleware/auth.js';
import type {
  Review,
  Client,
  User,
  ReviewStats,
} from '../../shared/types.js';

const router = Router();

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

router.post('/', authRequired, roleRequired(['client']), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as Client;
    const { appointmentId, rating } = req.body as {
      appointmentId: string;
      rating: number;
    };

    if (!appointmentId || rating === undefined) {
      res.status(400).json({ success: false, error: 'appointmentId and rating are required' });
      return;
    }

    const r = Number(rating);
    if (Number.isNaN(r) || r < 1 || r > 5) {
      res.status(400).json({ success: false, error: 'rating must be between 1 and 5' });
      return;
    }

    const appointment = db.getAppointmentById(appointmentId);
    if (!appointment) {
      res.status(404).json({ success: false, error: 'Appointment not found' });
      return;
    }

    if (appointment.clientId !== user.id) {
      res.status(403).json({ success: false, error: 'This appointment does not belong to you' });
      return;
    }

    if (appointment.status !== 'completed') {
      res.status(400).json({ success: false, error: 'Can only review completed appointments' });
      return;
    }

    const existingReviews = db.listReviews({ appointmentId });
    if (existingReviews.length > 0) {
      res.status(400).json({ success: false, error: 'Review already exists for this appointment' });
      return;
    }

    const id = generateId('r');
    const review: Review = {
      id,
      appointmentId,
      counselorId: appointment.counselorId,
      clientId: user.id,
      rating: r,
      createdAt: new Date().toISOString(),
    };

    const created = db.addReview(review);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.get('/counselor/:counselorId/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const { counselorId } = req.params;

    const counselor = db.getCounselorById(counselorId);
    if (!counselor) {
      res.status(404).json({ success: false, error: 'Counselor not found' });
      return;
    }

    const stats = db.getReviewStats(counselorId);
    const result: ReviewStats = stats;

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
