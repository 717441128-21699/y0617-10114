import type { Request, Response, NextFunction } from 'express';
import { db } from '../data/store.js';
import type { User, UserRole } from '../../shared/types.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
  }
}

export function authRequired(req: Request, res: Response, next: NextFunction): void {
  try {
    const userId = req.header('x-user-id');
    const userRole = req.header('x-user-role') as UserRole | undefined;

    if (!userId || !userRole) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: missing x-user-id or x-user-role header',
      });
      return;
    }

    const user = db.getUserById(userId);
    if (!user || user.role !== userRole) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: invalid user credentials',
      });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
}

export function roleRequired(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized: user not authenticated',
        });
        return;
      }
      if (!roles.includes(user.role)) {
        res.status(403).json({
          success: false,
          error: `Forbidden: requires role ${roles.join(' or ')}`,
        });
        return;
      }
      next();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  };
}
