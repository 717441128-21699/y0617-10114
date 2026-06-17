import { Router, type Request, type Response } from 'express';
import { db } from '../data/store.js';
import { authRequired, roleRequired } from '../middleware/auth.js';
import type {
  FollowUpTask,
  FollowUpStatus,
  FollowUpSource,
  User,
  Counselor,
} from '../../shared/types.js';

const router = Router();

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function enrichFollowUp(task: FollowUpTask): FollowUpTask & { clientName?: string } {
  const client = db.getClientById(task.clientId);
  return {
    ...task,
    clientName: client?.name,
  };
}

router.get('/mine', authRequired, roleRequired(['counselor']), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as Counselor;
    const { status } = req.query;

    const tasks = db.getFollowUpsByCounselor(
      user.id,
      status ? (String(status) as FollowUpStatus) : undefined,
    );
    const enriched = tasks.map(enrichFollowUp);
    res.status(200).json({ success: true, data: enriched });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.get('/by-client/:clientId', authRequired, roleRequired(['counselor']), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as Counselor;
    const { clientId } = req.params;
    const { status } = req.query;

    const tasks = db.getFollowUpsByClient(
      user.id,
      clientId,
      status ? (String(status) as FollowUpStatus) : undefined,
    );
    const enriched = tasks.map(enrichFollowUp);
    res.status(200).json({ success: true, data: enriched });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.post('/', authRequired, roleRequired(['counselor']), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as Counselor;
    const {
      clientId,
      appointmentId,
      title,
      description,
      dueDate,
      source,
    } = req.body as {
      clientId: string;
      appointmentId?: string;
      title: string;
      description?: string;
      dueDate?: string;
      source?: FollowUpSource;
    };

    if (!clientId || !title) {
      res.status(400).json({ success: false, error: 'clientId and title are required' });
      return;
    }

    const client = db.getClientById(clientId);
    if (!client) {
      res.status(404).json({ success: false, error: 'Client not found' });
      return;
    }

    const id = generateId('fu');
    const task: FollowUpTask = {
      id,
      counselorId: user.id,
      clientId,
      appointmentId,
      title,
      description,
      dueDate,
      status: 'pending',
      source: source || 'manual',
      createdAt: new Date().toISOString(),
    };

    const created = db.createFollowUpTask(task);
    res.status(201).json({ success: true, data: enrichFollowUp(created) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.put('/:id', authRequired, roleRequired(['counselor']), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as Counselor;
    const { id } = req.params;
    const updates = req.body as Partial<FollowUpTask>;

    const tasks = db.getFollowUpsByCounselor(user.id);
    const existing = tasks.find((t) => t.id === id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Follow-up task not found' });
      return;
    }

    const updated = db.updateFollowUp(id, updates);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Follow-up task not found' });
      return;
    }
    res.status(200).json({ success: true, data: enrichFollowUp(updated) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.put('/:id/complete', authRequired, roleRequired(['counselor']), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as Counselor;
    const { id } = req.params;

    const tasks = db.getFollowUpsByCounselor(user.id);
    const existing = tasks.find((t) => t.id === id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Follow-up task not found' });
      return;
    }

    const completed = db.completeFollowUp(id);
    if (!completed) {
      res.status(404).json({ success: false, error: 'Follow-up task not found' });
      return;
    }
    res.status(200).json({ success: true, data: enrichFollowUp(completed) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
