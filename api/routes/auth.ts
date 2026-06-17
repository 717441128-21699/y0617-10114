import { Router, type Request, type Response } from 'express';
import { db } from '../data/store.js';
import type {
  User,
  Client,
  Counselor,
  LoginCredentials,
  AuthResult,
  Specialty,
  ServiceMode,
  WeeklySchedule,
  TimeSlot,
} from '../../shared/types.js';

const router = Router();

function omitPasswordHash<T extends User>(user: T): Omit<T, 'passwordHash'> {
  const { passwordHash, ...rest } = user;
  return rest as Omit<T, 'passwordHash'>;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateAnonymousId(): string {
  return `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function simpleHash(password: string): string {
  return `hashed_${password}_demo`;
}

function generateDailySlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let h = 9; h < 12; h++) {
    slots.push({ start: `${String(h).padStart(2, '0')}:00`, end: `${String(h).padStart(2, '0')}:50`, available: true });
  }
  for (let h = 14; h < 17; h++) {
    slots.push({ start: `${String(h).padStart(2, '0')}:00`, end: `${String(h).padStart(2, '0')}:50`, available: true });
  }
  return slots;
}

function generateDefaultSchedule(): WeeklySchedule {
  return {
    monday: generateDailySlots(),
    tuesday: generateDailySlots(),
    wednesday: generateDailySlots(),
    thursday: generateDailySlots(),
    friday: generateDailySlots(),
    saturday: generateDailySlots(),
    sunday: generateDailySlots(),
  };
}

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginCredentials = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'email and password are required' });
      return;
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    if (user.passwordHash !== simpleHash(password) && !user.passwordHash.startsWith('hashed_')) {
      if (user.passwordHash !== password) {
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
      }
    }

    const token = `demo-${user.id}`;
    const userWithoutPassword = omitPasswordHash(user);

    const result: AuthResult = { token, user: userWithoutPassword };
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.post('/register/client', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ success: false, error: 'name, email and password are required' });
      return;
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      res.status(400).json({ success: false, error: 'Email already registered' });
      return;
    }

    const id = generateId('u');
    const client: Client = {
      id,
      role: 'client',
      name,
      email,
      phone,
      avatar: '',
      passwordHash: simpleHash(password),
      anonymousId: generateAnonymousId(),
      createdAt: new Date().toISOString(),
    };

    db.addUser(client);
    const token = `demo-${client.id}`;
    const userWithoutPassword = omitPasswordHash(client);

    const result: AuthResult = { token, user: userWithoutPassword };
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.post('/register/counselor', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      password,
      licenseNo,
      introduction,
      education,
      specialties,
      serviceModes,
      experienceYears,
      sessionDuration,
      pricePerSession,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !licenseNo ||
      !introduction ||
      !education ||
      !specialties ||
      !serviceModes ||
      experienceYears === undefined ||
      !sessionDuration ||
      !pricePerSession
    ) {
      res.status(400).json({ success: false, error: 'All fields are required for counselor registration' });
      return;
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      res.status(400).json({ success: false, error: 'Email already registered' });
      return;
    }

    const id = generateId('c');
    const counselor: Counselor = {
      id,
      role: 'counselor',
      name,
      email,
      avatar: '',
      passwordHash: simpleHash(password),
      licenseNo,
      licenseVerified: true,
      specialties: specialties as Specialty[],
      serviceModes: serviceModes as ServiceMode[],
      introduction,
      education,
      experienceYears: Number(experienceYears),
      sessionDuration: Number(sessionDuration),
      pricePerSession: Number(pricePerSession),
      avgRating: 0,
      reviewCount: 0,
      totalSessions: 0,
      schedule: generateDefaultSchedule(),
      createdAt: new Date().toISOString(),
    };

    db.addUser(counselor);
    const token = `demo-${counselor.id}`;
    const userWithoutPassword = omitPasswordHash(counselor);

    const result: AuthResult = { token, user: userWithoutPassword };
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
