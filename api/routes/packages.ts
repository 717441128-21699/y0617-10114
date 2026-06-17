import { Router, type Request, type Response } from 'express';
import { db } from '../data/store.js';
import { authRequired, roleRequired } from '../middleware/auth.js';
import type {
  Package,
  PackagePurchase,
  Counselor,
  Client,
  User,
} from '../../shared/types.js';

const router = Router();

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

router.get('/counselor/:counselorId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { counselorId } = req.params;

    const counselor = db.getCounselorById(counselorId);
    if (!counselor) {
      res.status(404).json({ success: false, error: 'Counselor not found' });
      return;
    }

    const packages = db.listPackages(counselorId);
    res.status(200).json({ success: true, data: packages });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.get('/me', authRequired, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as User;
    let purchases: PackagePurchase[];

    if (user.role === 'client') {
      purchases = db.listPackagePurchases({ clientId: user.id });
    } else {
      purchases = db.listPackagePurchases({ counselorId: user.id });
    }

    const enriched = purchases.map((p) => {
      const counselor = db.getCounselorById(p.counselorId);
      return {
        ...p,
        counselorName: counselor?.name || p.counselorName,
      };
    });

    res.status(200).json({ success: true, data: enriched });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

async function handlePurchase(
  req: Request,
  res: Response,
  packageIdFromParam: string,
): Promise<void> {
  try {
    const user = req.user as Client;
    const packageId = packageIdFromParam;

    if (user.role !== 'client') {
      res.status(403).json({ success: false, error: 'Only clients can purchase packages' });
      return;
    }

    const pkg = db.getPackageById(packageId);
    if (!pkg) {
      res.status(404).json({ success: false, error: 'Package not found' });
      return;
    }

    const counselor = db.getCounselorById(pkg.counselorId);
    if (!counselor) {
      res.status(404).json({ success: false, error: 'Counselor not found' });
      return;
    }

    const id = generateId('pp');
    const now = new Date();
    const expireAt = addDays(now, 365);

    const purchase: PackagePurchase = {
      id,
      packageId: pkg.id,
      clientId: user.id,
      counselorId: pkg.counselorId,
      counselorName: counselor.name,
      remainingSessions: pkg.sessionCount,
      totalSessions: pkg.sessionCount,
      purchasedAt: now.toISOString(),
      expireAt: expireAt.toISOString(),
    };

    const created = db.addPackagePurchase(purchase);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
}

router.post('/purchase/:packageId', authRequired, async (req: Request, res: Response): Promise<void> => {
  await handlePurchase(req, res, req.params.packageId);
});

router.post('/:packageId/purchase', authRequired, async (req: Request, res: Response): Promise<void> => {
  await handlePurchase(req, res, req.params.packageId);
});

export default router;
