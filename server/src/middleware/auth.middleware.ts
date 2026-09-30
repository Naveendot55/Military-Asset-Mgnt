import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.model';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;

    const user = await User.findById(decoded.id).select('id role baseId');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      baseId: user.baseId ? user.baseId.toString() : null,
    };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  };
};

export const requireBaseAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const targetBaseId = req.params.baseId || req.body.baseId || req.query.baseId;

  if (req.user?.role === 'ADMIN') {
    return next();
  }

  if (targetBaseId && req.user?.baseId !== targetBaseId) {
    return res.status(403).json({ success: false, message: 'Forbidden: Base mismatch' });
  }

  next();
};
