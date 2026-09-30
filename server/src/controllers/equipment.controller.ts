import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { EquipmentType } from '../models/EquipmentType.model';
import { createAuditLog } from '../services/audit.service';
import { AuthRequest } from '../middleware/auth.middleware';

const equipmentSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  unit: z.string().min(1),
  description: z.string().optional(),
});

export const getEquipment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const equipment = await EquipmentType.find().sort({ name: 1 });
    return res.json({ success: true, data: equipment });
  } catch (error) {
    next(error);
  }
};

export const createEquipment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = equipmentSchema.parse(req.body);

    const item = await EquipmentType.create(data);

    await createAuditLog({
      userId: req.user.id,
      action: 'EQUIPMENT_CREATED',
      entity: 'EquipmentType',
      entityId: item._id.toString(),
      metadata: data,
      ipAddress: req.ip,
    });

    return res.status(201).json({ success: true, message: 'Equipment type created successfully', data: item });
  } catch (error) {
    next(error);
  }
};
