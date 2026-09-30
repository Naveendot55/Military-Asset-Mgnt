import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Base } from '../models/Base.model';
import { createAuditLog } from '../services/audit.service';
import { AuthRequest } from '../middleware/auth.middleware';

const baseSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(10),
  location: z.string().min(2),
});

export const getBases = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bases = await Base.find().sort({ name: 1 });
    return res.json({ success: true, data: bases });
  } catch (error) {
    next(error);
  }
};

export const createBase = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = baseSchema.parse(req.body);

    const existing = await Base.findOne({ code: data.code });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Base code already exists' });
    }

    const base = await Base.create(data);

    await createAuditLog({
      userId: req.user.id,
      action: 'BASE_CREATED',
      entity: 'Base',
      entityId: base._id.toString(),
      baseId: base._id.toString(),
      metadata: data,
      ipAddress: req.ip,
    });

    return res.status(201).json({ success: true, message: 'Base created successfully', data: base });
  } catch (error) {
    next(error);
  }
};
