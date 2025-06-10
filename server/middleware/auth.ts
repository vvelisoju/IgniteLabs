import { Request, Response, NextFunction } from 'express';
import { type User } from '../../shared/schema';

declare module 'express-session' {
  interface Session {
    user?: {
      id: number;
    };
  }
}

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  if (req.session.user) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized' });
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as User;
  if (user && user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: Admin access required' });
};

export const isTrainer = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as User;
  if (user && (user.role === 'trainer' || user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: Trainer access required' });
};

export const isStudent = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as User;
  if (user && user.role === 'student') {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: Student access required' });
};

export const isManager = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as User;
  if (user && (user.role === 'manager' || user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: Manager access required' });
};